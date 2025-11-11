import { Device } from '@/types/device';
import { DeviceSchema } from '@/types/device.schema';
import { LocationMapping } from '@/types/electron';
import deviceCategoryMap from '@/config/device-category.json';
import ipRangeGeneric from '@/config/ip-range-generic.json';

export const parseMsDate = (msDateString: string): string => {
  if (!msDateString) return '';
  const normalized = msDateString
    .replace(/[\u0000-\u001F]/g, '')
    .replace(/\uFEFF/g, '')
    .trim();
  const match = normalized.match(/\/??Date\((\d+)(?:[+-]\d{4})?\)\/??/);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    if (!Number.isNaN(timestamp)) {
      return new Date(timestamp).toLocaleString();
    }
  }
  return msDateString;
};

export const safeDecode = (
  buffer: ArrayBuffer,
  encoding: 'utf-8' | 'utf-16le' | 'utf-16be'
): string => {
  try {
    const td = new TextDecoder(encoding);
    return td.decode(buffer);
  } catch {
    const bytes = new Uint8Array(buffer);
    if (encoding === 'utf-8') {
      let out = '';
      for (let i = 0; i < bytes.length; i++) {
        const byte = bytes[i];
        if (byte < 0x80) {
          out += String.fromCharCode(byte);
        } else if ((byte & 0xe0) === 0xc0 && i + 1 < bytes.length) {
          const byte2 = bytes[++i] & 0x3f;
          const cp = ((byte & 0x1f) << 6) | byte2;
          out += String.fromCharCode(cp);
        } else if ((byte & 0xf0) === 0xe0 && i + 2 < bytes.length) {
          const b2 = bytes[++i] & 0x3f;
          const b3 = bytes[++i] & 0x3f;
          const cp = ((byte & 0x0f) << 12) | (b2 << 6) | b3;
          out += String.fromCharCode(cp);
        } else if ((byte & 0xf8) === 0xf0 && i + 3 < bytes.length) {
          const b2 = bytes[++i] & 0x3f;
          const b3 = bytes[++i] & 0x3f;
          const b4 = bytes[++i] & 0x3f;
          const cp = ((byte & 0x07) << 18) | (b2 << 12) | (b3 << 6) | b4;
          const high = ((cp - 0x10000) >> 10) + 0xd800;
          const low = ((cp - 0x10000) & 0x3ff) + 0xdc00;
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
    let out = '';
    for (let i = 0; i + 1 < bytes.length; i += 2) {
      out += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return out;
  }
};

export const decodeInventoryBuffer = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return safeDecode(buffer, 'utf-8');
  }
  if (bytes.length >= 2) {
    if (bytes[0] === 0xff && bytes[1] === 0xfe) {
      return safeDecode(buffer, 'utf-16le');
    }
    if (bytes[0] === 0xfe && bytes[1] === 0xff) {
      return safeDecode(buffer, 'utf-16be');
    }
  }
  let zeroHighBytes = 0;
  const sampleLimit = Math.min(bytes.length, 400);
  for (let i = 1; i < sampleLimit; i += 2) {
    if (bytes[i] === 0) zeroHighBytes++;
  }
  if (zeroHighBytes > 40) {
    return safeDecode(buffer, 'utf-16le');
  }
  return safeDecode(buffer, 'utf-8');
};

const determineDeviceCategory = (model: string): string => {
  return (deviceCategoryMap as Record<string, string>)[model] || 'Other';
};

const determineLocation = (
  deviceData: Partial<Device> & Record<string, unknown>,
  locationMapping?: LocationMapping | null
): string => {
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

  const ip = (deviceData.InternalIP as string) || '';

  if (locationMapping?.ipRangeMapping && ip) {
    for (const [range, realLocation] of Object.entries(locationMapping.ipRangeMapping)) {
      if (ip.startsWith(range)) {
        return realLocation;
      }
    }
  }

  const locationMappings = ipRangeGeneric as { name: string; range: string }[];
  if (ip) {
    for (const location of locationMappings) {
      if (ip.startsWith(location.range)) {
        return location.name;
      }
    }
  }
  return 'Unknown';
};

export function parseContentsToDevices(
  contents: Array<{ name: string; content: string }>,
  locationMapping?: LocationMapping | null
): Device[] {
  const devices: Device[] = [];
  for (const { name, content } of contents) {
    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (e) {
      throw new Error(`Invalid JSON format in file: ${name}. Original error: ${e instanceof Error ? e.message : String(e)}`);
    }
    const fileDevices = Array.isArray(data) ? data : [data];
    fileDevices.forEach((deviceData: any) => {
      const tpmInfo = deviceData.TPMInfo || {};
      const tpmVersion = tpmInfo.TPMVersion || deviceData.TPMVersion || '';

      const secureBootStatus = deviceData.SecureBootStatus || {};
      const secureBootEnabled =
        secureBootStatus.SecureBootEnabled !== undefined
          ? secureBootStatus.SecureBootEnabled
          : Boolean(deviceData.SecureBootEnabled);

      let collectionDateString = '';
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
      for (const dateField of possibleDateFields) {
        if (dateField && typeof dateField === 'string' && dateField.trim() !== '') {
          collectionDateString = parseMsDate(dateField);
          break;
        }
      }

      const osName = deviceData.OSName || '';
      const windowsVersion = deviceData.WindowsVersion || '';
      const isWindows11 =
        osName.toLowerCase().includes('windows 11') || windowsVersion.toLowerCase().includes('windows 11');

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
        LastBootUpTime: parseMsDate(deviceData.LastBootUpTime) || collectionDateString || '',
        HardwareHash: deviceData.HardwareHash || '',
        SerialNumber: deviceData.SerialNumber || '',
        canUpgradeToWin11: isWindows11 || Boolean(deviceData.canUpgradeToWin11),
        issues: Array.isArray(deviceData.issues) ? deviceData.issues : [],
        location: determineLocation(deviceData, locationMapping),
        CollectionDate: collectionDateString,
        category: determineDeviceCategory(deviceData.Model || ''),
        ...deviceData,
      };

      const normalized = DeviceSchema.parse(device) as Device;
      devices.push(normalized);
    });
  }
  return devices;
}
