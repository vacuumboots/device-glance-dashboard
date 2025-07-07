
import { Device, FilterState } from '@/types/device';

export const parseInventoryFiles = async (files: FileList): Promise<Device[]> => {
  const devices: Device[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const content = await file.text();
    
    try {
      const data = JSON.parse(content);
      const fileDevices = Array.isArray(data) ? data : [data];
      
      fileDevices.forEach(deviceData => {
        // Handle nested TPM info
        const tpmInfo = deviceData.TPMInfo || {};
        const tpmVersion = tpmInfo.TPMVersion || deviceData.TPMVersion || '';
        
        // Handle nested SecureBoot info
        const secureBootStatus = deviceData.SecureBootStatus || {};
        const secureBootEnabled = secureBootStatus.SecureBootEnabled !== undefined 
          ? secureBootStatus.SecureBootEnabled 
          : Boolean(deviceData.SecureBootEnabled);
        
        // Handle collection date
        const collectionDate = deviceData.CollectionDate || {};
        const lastBootUpTime = deviceData.LastBootUpTime || collectionDate.DateTime || '';
        
        // Check if device is already running Windows 11
        const osName = deviceData.OSName || '';
        const windowsVersion = deviceData.WindowsVersion || '';
        const isWindows11 = osName.toLowerCase().includes('windows 11') || 
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
          ...deviceData // Include all original properties
        };
        
        devices.push(device);
      });
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      throw new Error(`Invalid JSON format in file: ${file.name}`);
    }
  }
  
  return devices;
};

export const filterDevices = (devices: Device[], filters: FilterState): Device[] => {
  return devices.filter(device => {
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
    
    // Location filter
    if (filters.location !== 'all' && device.location !== filters.location) {
      return false;
    }
    
    return true;
  });
};

const determineLocation = (deviceData: any): string => {
  // Try to extract location from various possible fields
  if (deviceData.location) return deviceData.location;
  if (deviceData.Location) return deviceData.Location;
  if (deviceData.Site) return deviceData.Site;
  if (deviceData.Office) return deviceData.Office;
  
  const ip = deviceData.InternalIP || '';
  
  // Location mapping based on IP ranges
  const locationMappings = [
    { name: "Red Deer Lake", range: "10.53." },
    { name: "Heritage Heights", range: "10.51." },
    { name: "Big Rock", range: "10.52." },
    { name: "Westmount", range: "10.54." },
    { name: "Okotoks Junior", range: "10.55." },
    { name: "Percy Pegler", range: "10.56." },
    { name: "Dr. Morris Gibson", range: "10.57." },
    { name: "Millarville", range: "10.58." },
    { name: "Longview", range: "10.141." },
    { name: "Foothills Composite", range: "10.140." },
    { name: "Spitzee", range: "10.142." },
    { name: "Highwood", range: "10.143." },
    { name: "Turner Valley", range: "10.145." },
    { name: "Joe Clark", range: "10.146." },
    { name: "Senator Reily", range: "10.147." },
    { name: "Cayley", range: "10.148." },
    { name: "Blackie", range: "10.149." },
    { name: "C. Ian McLaren", range: "10.150." },
    { name: "Oilfields", range: "10.151." },
    { name: "Meadow Ridge", range: "10.60." }
  ];
  
  // Check IP against location ranges
  if (ip) {
    for (const location of locationMappings) {
      if (ip.startsWith(location.range)) {
        return location.name;
      }
    }
  }
  
  // Try to extract from computer name if no IP match
  const computerName = deviceData.ComputerName || '';
  if (computerName.includes('-')) {
    const parts = computerName.split('-');
    if (parts.length > 1) {
      const possibleLocation = parts[0].length <= 6 ? parts[0] : parts[1];
      if (possibleLocation && possibleLocation.length <= 6) {
        return possibleLocation.toUpperCase();
      }
    }
  }
  
  return 'Unknown';
};
