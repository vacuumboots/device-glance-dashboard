import { Device, FilterState } from '@/types/device';

const parseMsDate = (msDateString: string): string => {
  if (!msDateString) return '';
  const match = msDateString.match(/\/Date\((\d+)\)\\/);
  if (match) {
    const timestamp = parseInt(match[1], 10);
    return new Date(timestamp).toLocaleString(); // Or format as needed
  }
  return msDateString; // Return original if format doesn't match
};

const deviceCategoryMap: Record<string, string> = {
  'OptiPlex 7070': 'Desktop',
  'Latitude 5400': 'Laptop',
  'Latitude 5420': 'Laptop',
  'OptiPlex Micro 7010': 'Desktop',
  'Latitude 5440': 'Laptop',
  'Latitude 5450': 'Laptop',
  'Latitude 5430': 'Laptop',
  'OptiPlex 5040': 'Desktop',
  'OptiPlex 5060': 'Desktop',
  'Precision 3660': 'Desktop',
  'Dell Pro 14 Plus PB14250': 'Laptop',
  'Latitude 7430': 'Laptop',
  'Precision 3450': 'Desktop',
  'Latitude 5480': 'Laptop',
  'OptiPlex 5070': 'Desktop',
  'Precision 3460': 'Desktop',
  'OptiPlex 7050': 'Desktop',
  'Precision 3440': 'Desktop',
  'Latitude 5455': 'Laptop',
  'Precision 3260': 'Desktop',
  'OptiPlex 5080': 'Desktop',
  'System Product Name': 'Other',
  'XPS 13 7390': 'Laptop',
  'Precision 5820 Tower X-Series': 'Desktop',
  'OptiPlex 7060': 'Desktop',
  'Precision Tower 3431': 'Desktop',
  '0': 'Other',
  'OptiPlex 7020': 'Desktop',
  'Precision Tower 3420': 'Desktop',
  'OptiPlex 5050': 'Desktop',
  'Precision Tower 3430': 'Desktop',
  'XPS 15 9570': 'Laptop',
  'Precision 3630 Tower': 'Laptop',
  'OptiPlex 7040': 'Desktop',
  'Latitude 5430 Rugged': 'Laptop',
  'MS-7B86': 'Desktop',
  'VMware7,1': 'Other',
  'Latitude 5414': 'Laptop',
};

const determineDeviceCategory = (model: string): string => {
  return deviceCategoryMap[model] || 'Other';
};

export const parseInventoryFiles = async (files: FileList): Promise<Device[]> => {
  const devices: Device[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder('utf-16le'); // Assuming UTF-16 Little Endian
    const content = decoder.decode(buffer);

    try {
      const data = JSON.parse(content);
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
          location: determineLocation(deviceData),
          CollectionDate: collectionDateString,
          category: determineDeviceCategory(deviceData.Model || ''),
          ...deviceData, // Include all original properties
        };

        devices.push(device);
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

const determineLocation = (deviceData: Device): string => {
  // Try to extract location from various possible fields
  if (deviceData.location) return deviceData.location;
  if (deviceData.Location) return deviceData.Location;
  if (deviceData.Site) return deviceData.Site;
  if (deviceData.Office) return deviceData.Office;

  const ip = deviceData.InternalIP || '';

  // Location mapping based on IP ranges - uses generic names for privacy
  const locationMappings = [
    { name: 'Site 2B', range: '10.53.' },
    { name: 'Site 2A', range: '10.51.' },
    { name: 'Site 1A', range: '10.52.' },
    { name: 'Site 1G', range: '10.54.' },
    { name: 'Site 1C', range: '10.55.' },
    { name: 'Site 1D', range: '10.56.' },
    { name: 'Site 1B', range: '10.57.' },
    { name: 'Location A3', range: '10.58.' },
    { name: 'Location A2', range: '10.141.' },
    { name: 'Site 1E', range: '10.140.' },
    { name: 'Location B4', range: '10.142.' },
    { name: 'Location B3', range: '10.143.' },
    { name: 'Location A5', range: '10.145.' },
    { name: 'Location B1', range: '10.146.' },
    { name: 'Location B2', range: '10.147.' },
    { name: 'Location C2', range: '10.148.' },
    { name: 'Location C1', range: '10.149.' },
    { name: 'Location A1', range: '10.150.' },
    { name: 'Location A4', range: '10.151.' },
    { name: 'Site 1F', range: '10.60.' },
  ];

  // Check IP against location ranges
  if (ip) {
    for (const location of locationMappings) {
      if (ip.startsWith(location.range)) {
        return location.name;
      }
    }
  }

  return 'Unknown';
};
