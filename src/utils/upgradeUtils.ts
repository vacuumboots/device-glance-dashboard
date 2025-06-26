
import { Device } from '@/types/device';

export const getUpgradeRecommendations = (device: Device): string[] => {
  const recommendations: string[] = [];
  
  if (device.canUpgradeToWin11) {
    recommendations.push('This device meets all Windows 11 requirements and is ready for upgrade.');
    return recommendations;
  }
  
  // Check specific issues and provide recommendations
  if (!device.TPMVersion || device.TPMVersion === 'None') {
    recommendations.push('Enable TPM 2.0 in BIOS/UEFI settings or install a TPM module if supported.');
  } else if (device.TPMVersion === '1.2') {
    recommendations.push('Upgrade TPM from version 1.2 to 2.0 (may require hardware replacement).');
  }
  
  if (!device.SecureBootEnabled) {
    recommendations.push('Enable Secure Boot in BIOS/UEFI settings.');
  }
  
  if (device.TotalRAMGB < 4) {
    recommendations.push(`Upgrade RAM from ${device.TotalRAMGB}GB to at least 4GB (recommended: 8GB or more).`);
  }
  
  if (device.FreeStorageGB < 64) {
    recommendations.push(`Free up storage space or add more storage. Need at least 64GB free (currently: ${device.FreeStorageGB.toFixed(1)}GB).`);
  }
  
  if (device.HardDriveType === 'HDD') {
    recommendations.push('Consider upgrading to an SSD for better Windows 11 performance.');
  }
  
  // CPU recommendations (if we have CPU info)
  const windowsVersion = device.WindowsVersion || '';
  if (windowsVersion.includes('Windows 7') || windowsVersion.includes('Windows 8')) {
    recommendations.push('Current OS is very old. Consider upgrading to Windows 10 first, then Windows 11.');
  }
  
  // BIOS/UEFI recommendations
  if (device.issues.some(issue => issue.toLowerCase().includes('bios'))) {
    recommendations.push('Update BIOS/UEFI to the latest version from the manufacturer.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Review the specific issues listed to determine upgrade path.');
  }
  
  return recommendations;
};
