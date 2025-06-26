
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
        
        // Process and normalize device data
        const device: Device = {
          ComputerName: deviceData.ComputerName || '',
          Manufacturer: deviceData.Manufacturer || '',
          Model: deviceData.Model || '',
          OSName: deviceData.OSName || '',
          WindowsVersion: deviceData.WindowsVersion || '',
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
          canUpgradeToWin11: Boolean(deviceData.canUpgradeToWin11),
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
  
  // Try to extract from computer name or IP if there's a pattern
  const computerName = deviceData.ComputerName || '';
  const ip = deviceData.InternalIP || '';
  
  // Common patterns for location extraction
  if (computerName.includes('-')) {
    const parts = computerName.split('-');
    if (parts.length > 1) {
      // Often the first or second part contains location info
      const possibleLocation = parts[0].length <= 6 ? parts[0] : parts[1];
      if (possibleLocation && possibleLocation.length <= 6) {
        return possibleLocation.toUpperCase();
      }
    }
  }
  
  // Extract from IP subnet if pattern exists
  if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
    const parts = ip.split('.');
    if (parts.length >= 3) {
      return `Subnet-${parts[2]}`;
    }
  }
  
  return 'Unknown';
};
