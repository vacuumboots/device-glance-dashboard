import { Device, FilterState } from '@/types/device';
import { DeviceSchema } from '@/types/device.schema';
import { LocationMapping } from '@/types/electron';
import deviceCategoryMap from '@/config/device-category.json';
import ipRangeGeneric from '@/config/ip-range-generic.json';

/**
 * Parse classic .NET serialized date strings of the form /Date(1712345678900)/.
 * Falls back to the original input if the pattern does not match.
 */
const parseMsDate = (msDateString: string): string => {
  if (!msDateString) return '';
  // Normalize potential stray nulls or control chars from encoding issues
  const normalized = msDateString
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/\uFEFF/g, '')
    .trim();
  // Accept /Date(<digits>)/ optionally followed by timezone offsets e.g. /Date(1712345678900+0000)/
  const match = normalized.match(/\/??Date\((\d+)(?:[+-]\d{4})?\)\/??/);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toLocaleString();
    }
  }
  return msDateString;
};

/**
 * Attempt to decode an inventory file buffer by detecting common encodings.
 * Priority:
 *  1. BOM detection (UTF-8, UTF-16 LE/BE)
 *  2. Heuristic for UTF-16 LE (many zero high bytes)
 *  3. Fallback to UTF-8
 */
// Safe decoders that avoid relying solely on global TextDecoder (which tests may mock)
const safeDecode = (buffer: ArrayBuffer, encoding: 'utf-8' | 'utf-16le' | 'utf-16be'): string => {
  try {
    // Prefer native TextDecoder when available and working
    // eslint-disable-next-line no-undef
    const td = new TextDecoder(encoding);
    return td.decode(buffer);
  } catch {
    // Fallback manual decoding for test environments
    const bytes = new Uint8Array(buffer);
    if (encoding === 'utf-8') {
      // Minimal UTF-8 decoder (sufficient for ASCII JSON used in tests)
      let out = '';
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte < 0x80) {
          out += String.fromCharCode(byte);
        } else if ((byte & 0xe0) === 0xc0 && i + 1 < bytes.length) {
          const byte2 = bytes[++i] & 0x3f;
          const codePoint = ((byte & 0x1f) << 6) | byte2;
          out += String.fromCharCode(codePoint);
        } else if ((byte & 0xf0) === 0xe0 && i + 2 < bytes.length) {
          const byte2 = bytes[++i] & 0x3f;
          const byte3 = bytes[++i] & 0x3f;
          const codePoint = ((byte & 0x0f) << 12) | (byte2 << 6) | byte3;
          out += String.fromCharCode(codePoint);
        } else if ((byte & 0xf8) === 0xf0 && i + 3 < bytes.length) {
          const byte2 = bytes[++i] & 0x3f;
          const byte3 = bytes[++i] & 0x3f;
          const byte4 = bytes[++i] & 0x3f;
          const codePoint =
            ((byte & 0x07) << 18) | (byte2 << 12) | (byte3 << 6) | byte4;
          // Convert to surrogate pair
          const high = ((codePoint - 0x10000) >> 10) + 0xd800;
          const low = ((codePoint - 0x10000) & 0x3ff) + 0xdc00;
          out += String.fromCharCode(high, low);
        }
      }
      return out;
    }
    if (encoding === 'utf-16le') {
      let out = '';
      for (let i = 0; i + 1 < bytes.length; i += 2) {
        out += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8));
      }
      return out;
    }
    // utf-16be
    let out = '';
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return out;
  }
};

const decodeInventoryBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
    return safeDecode(buffer, 'utf-8');
  }
  if (bytes.length >= 2) {
    if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
      return safeDecode(buffer, 'utf-16le');
    }
    if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
      return safeDecode(buffer, 'utf-16be');
    }
  }
  // Heuristic: many zero bytes on the high-order position suggests UTF-16LE text
  let zeroHighBytes = 0;
  const sampleLimit = Math.min(bytes.length, 400);
  for (let i = 1; i < sampleLimit; i += 2) {
    if (bytes[i] === 0) zeroHighBytes++;
  }
  if (zeroHighBytes > 40) {
    return safeDecode(buffer, 'utf-16le');
  }
  // Default to UTF-8 which is the most common for JSON
  return safeDecode(buffer, 'utf-8');
};

// deviceCategoryMap now externalized to JSON (Record<string,string>)

const determineDeviceCategory = (model: string): string => {
  return deviceCategoryMap[model] || 'Other';
};

export const parseInventoryFiles = async (
  files: FileList | File[],
  locationMapping?: LocationMapping | null
): Promise<Device[]> => {
  const devices: Device[] = [];

  const fileArray: File[] = Array.from(files as any);

  for (const file of fileArray) {
    let content: string = '';
    // Multi-strategy read to survive minimal JSDOM mocks
    try {
      if (typeof (file as any).text === 'function') {
        content = await (file as any).text();
      } else if (typeof (file as any).arrayBuffer === 'function') {
        const buffer = await (file as any).arrayBuffer();
        content = decodeInventoryBuffer(buffer);
      } else if (file instanceof Blob) {
        content = await new Response(file).text();
      } else {
        throw new Error('Unsupported File implementation');
      }
    } catch (readErr) {
      // Last-resort: attempt arrayBuffer then decode
      try {
        const buffer = await (file as any).arrayBuffer();
        content = decodeInventoryBuffer(buffer);
      } catch {
        throw new Error(
          `Unable to read file contents for ${file.name}: ${readErr instanceof Error ? readErr.message : String(readErr)}`
        );
      }
    }

    try {
      let data: unknown;
      try {
        data = JSON.parse(content);
      } catch (primaryErr) {
        // Fallback: re-decode using buffer-based encoding detection and retry parse
        const fbBuffer = await file.arrayBuffer();
        const fbContent = decodeInventoryBuffer(fbBuffer);
        data = JSON.parse(fbContent);
      }
  const fileDevices = Array.isArray(data) ? data : [data];

      fileDevices.forEach((deviceData) => {
        // Handle nested TPM info
        const tpmInfo = deviceData.TPMInfo || {};
        const tpmVersion = tpmInfo.TPMVersion || deviceData.TPMVersion || '';

        // Handle nested SecureBoot info
        const secureBootStatus = deviceData.SecureBootStatus || {};
        const secureBootEnabled =
          secureBootStatus.SecureBootEnabled !== undefined
            ? secureBootStatus.SecureBootEnabled
            : Boolean(deviceData.SecureBootEnabled);

        // Handle collection date - try multiple possible field names and structures
        let collectionDateString = '';

        // Try different possible field names and structures
        const possibleDateFields = [
          deviceData.CollectionDate?.DateTime,
          deviceData.CollectionDate?.Date,
          deviceData.CollectionDate,
          deviceData.collectionDate,
          deviceData.LogDate,
          deviceData.CreationDate,
          deviceData.DateTime,
          deviceData.Date,
          deviceData.Timestamp,
          deviceData.RunDate,
          deviceData.GeneratedDate,
        ];

        // Find the first valid date
        for (const dateField of possibleDateFields) {
          if (dateField && typeof dateField === 'string' && dateField.trim() !== '') {
            collectionDateString = parseMsDate(dateField);
            break;
          }
        }

        // Debug logging for first few devices to understand data structure
        // if (deviceData.ComputerName && Math.random() < 0.01) {
        //   console.log('Debug - Device:', deviceData.ComputerName, 'CollectionDate fields:', {
        //     CollectionDate: deviceData.CollectionDate,
        //     collectionDate: deviceData.collectionDate,
        //     LogDate: deviceData.LogDate,
        //     CreationDate: deviceData.CreationDate,
        //     DateTime: deviceData.DateTime,
        //     Date: deviceData.Date,
        //     Timestamp: deviceData.Timestamp,
        //     RunDate: deviceData.RunDate,
        //     GeneratedDate: deviceData.GeneratedDate,
        //     Selected: collectionDateString,
        //   });
        // }

        const lastBootUpTime = parseMsDate(deviceData.LastBootUpTime) || collectionDateString || '';

        // Check if device is already running Windows 11
        const osName = deviceData.OSName || '';
        const windowsVersion = deviceData.WindowsVersion || '';
        const isWindows11 =
          osName.toLowerCase().includes('windows 11') ||
          windowsVersion.toLowerCase().includes('windows 11');

        // Process and normalize device data
        const device: Device = {
          ComputerName: deviceData.ComputerName || '',
          Manufacturer: deviceData.Manufacturer || '',
          Model: deviceData.Model || '',
          OSName: osName,
          WindowsVersion: windowsVersion,
          WindowsEdition: deviceData.WindowsEdition || '',
          TotalRAMGB: parseFloat(deviceData.TotalRAMGB) || 0,
          TotalStorageGB: parseFloat(deviceData.TotalStorageGB) || 0,
          FreeStorageGB: parseFloat(deviceData.FreeStorageGB) || 0,
          HardDriveType: deviceData.HardDriveType || '',
          TPMVersion: tpmVersion,
          SecureBootEnabled: secureBootEnabled,
          JoinType: deviceData.JoinType || 'None',
          InternalIP: deviceData.InternalIP || '',
          LastBootUpTime: lastBootUpTime,
          HardwareHash: deviceData.HardwareHash || '',
          SerialNumber: deviceData.SerialNumber || '',
          canUpgradeToWin11: isWindows11 || Boolean(deviceData.canUpgradeToWin11),
          issues: Array.isArray(deviceData.issues) ? deviceData.issues : [],
          location: determineLocation(deviceData, locationMapping),
          CollectionDate: collectionDateString,
          category: determineDeviceCategory(deviceData.Model || ''),
          ...deviceData, // Include all original properties
        };

  // Validate and normalize with Zod (coerce numbers/booleans, set defaults)
  const normalized = DeviceSchema.parse(device) as Device;
  devices.push(normalized);
      });
    } catch (error) {
      throw new Error(
        `Invalid JSON format in file: ${file.name}. Original error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return devices;
};

export const filterDevices = (devices: Device[], filters: FilterState): Device[] => {
  return devices.filter((device) => {
    // Windows 11 Ready filter
    if (filters.windows11Ready !== 'all') {
      const isReady = device.canUpgradeToWin11;
      if (filters.windows11Ready === 'ready' && !isReady) return false;
      if (filters.windows11Ready === 'not-ready' && isReady) return false;
    }

    // TPM filter
    if (filters.tpmPresent !== 'all') {
      const hasTPM = device.TPMVersion && device.TPMVersion !== 'None';
      if (filters.tpmPresent === 'present' && !hasTPM) return false;
      if (filters.tpmPresent === 'missing' && hasTPM) return false;
    }

    // Secure Boot filter
    if (filters.secureBootEnabled !== 'all') {
      if (filters.secureBootEnabled === 'enabled' && !device.SecureBootEnabled) return false;
      if (filters.secureBootEnabled === 'disabled' && device.SecureBootEnabled) return false;
    }

    // Storage filter
    if (filters.lowStorage !== 'all') {
      const hasLowStorage = device.FreeStorageGB < 30;
      if (filters.lowStorage === 'low' && !hasLowStorage) return false;
      if (filters.lowStorage === 'sufficient' && hasLowStorage) return false;
    }

    // Join Type filter
    if (filters.joinType !== 'all' && device.JoinType !== filters.joinType) {
      return false;
    }

    // Device Category filter
    if (filters.deviceCategory !== 'all' && device.category !== filters.deviceCategory) {
      return false;
    }

    // Hash Present filter
    if (filters.hashPresent !== 'all') {
      const hasHash = device.HardwareHash && device.HardwareHash.trim() !== '';
      if (filters.hashPresent === 'present' && !hasHash) return false;
      if (filters.hashPresent === 'missing' && hasHash) return false;
    }

    // Device Model filter
    if (filters.deviceModel !== 'all' && device.Model !== filters.deviceModel) {
      return false;
    }

    // Location filter
    if (filters.location.length > 0 && !filters.location.includes(device.location || '')) {
      return false;
    }

    // Search term filter (searches ComputerName and SerialNumber)
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      const computerName = (device.ComputerName || '').toLowerCase();
      const serialNumber = (device.SerialNumber || '').toLowerCase();

      if (!computerName.includes(searchTerm) && !serialNumber.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
};

const determineLocation = (
  deviceData: Partial<Device> & Record<string, unknown>,
  locationMapping?: LocationMapping | null
): string => {
  // Collect possible location fields (may be unknown types)
  const candidates = [
    deviceData.location,
    (deviceData as any).Location,
    (deviceData as any).Site,
    (deviceData as any).Office,
  ];
  const firstString = candidates.find((c) => typeof c === 'string' && c.trim() !== '') as
    | string
    | undefined;

  if (firstString && locationMapping?.genericToReal) {
    const realLocation = locationMapping.genericToReal[firstString];
    if (realLocation) return realLocation;
    return firstString;
  }
  if (firstString) return firstString;

  const ip = deviceData.InternalIP || '';

  // If external mapping is provided and has IP range mappings, use those
  if (locationMapping?.ipRangeMapping && ip) {
    for (const [range, realLocation] of Object.entries(locationMapping.ipRangeMapping)) {
      if (ip.startsWith(range)) {
        return realLocation;
      }
    }
  }

  // Location mapping based on IP ranges - uses generic names for privacy; now externalized
  const locationMappings = ipRangeGeneric as { name: string; range: string }[];

  // Check IP against location ranges (fallback to generic names)
  if (ip) {
    for (const location of locationMappings) {
      if (ip.startsWith(location.range)) {
        return location.name;
      }
    }
  }

  return 'Unknown';
};
