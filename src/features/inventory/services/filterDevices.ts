import type { Device, FilterState } from '@features/inventory/model/device';

export function filterDevices(devices: Device[], filters: FilterState): Device[] {
  return devices.filter((device) => {
    if (filters.windows11Ready !== 'all') {
      const isReady = device.canUpgradeToWin11;
      if (filters.windows11Ready === 'ready' && !isReady) return false;
      if (filters.windows11Ready === 'not-ready' && isReady) return false;
    }
    if (filters.tpmPresent !== 'all') {
      const hasTPM = device.TPMVersion && device.TPMVersion !== 'None';
      if (filters.tpmPresent === 'present' && !hasTPM) return false;
      if (filters.tpmPresent === 'missing' && hasTPM) return false;
    }
    if (filters.secureBootEnabled !== 'all') {
      if (filters.secureBootEnabled === 'enabled' && !device.SecureBootEnabled) return false;
      if (filters.secureBootEnabled === 'disabled' && device.SecureBootEnabled) return false;
    }
    if (filters.lowStorage !== 'all') {
      const hasLowStorage = device.FreeStorageGB < 30;
      if (filters.lowStorage === 'low' && !hasLowStorage) return false;
      if (filters.lowStorage === 'sufficient' && hasLowStorage) return false;
    }
    if (filters.joinType !== 'all' && device.JoinType !== filters.joinType) return false;
    if (filters.deviceCategory !== 'all' && device.category !== filters.deviceCategory) return false;
    if (filters.hashPresent !== 'all') {
      const hasHash = device.HardwareHash && device.HardwareHash.trim() !== '';
      if (filters.hashPresent === 'present' && !hasHash) return false;
      if (filters.hashPresent === 'missing' && hasHash) return false;
    }
    if (filters.deviceModel !== 'all' && device.Model !== filters.deviceModel) return false;
    if (filters.location.length > 0 && !filters.location.includes(device.location || '')) return false;
    if (filters.searchTerm && filters.searchTerm.trim() !== '') {
      const searchTerm = filters.searchTerm.toLowerCase().trim();
      const computerName = (device.ComputerName || '').toLowerCase();
      const serialNumber = (device.SerialNumber || '').toLowerCase();
      if (!computerName.includes(searchTerm) && !serialNumber.includes(searchTerm)) return false;
    }
    return true;
  });
}