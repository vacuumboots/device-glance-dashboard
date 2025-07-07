
export interface Device {
  ComputerName: string;
  Manufacturer: string;
  Model: string;
  OSName: string;
  WindowsVersion: string;
  WindowsEdition: string;
  TotalRAMGB: number;
  TotalStorageGB: number;
  FreeStorageGB: number;
  HardDriveType: string;
  TPMVersion: string;
  SecureBootEnabled: boolean;
  JoinType: string;
  InternalIP: string;
  LastBootUpTime: string;
  HardwareHash: string;
  SerialNumber?: string;
  canUpgradeToWin11: boolean;
  issues: string[];
  location?: string;
  
  // Raw properties for details view
  [key: string]: any;
}

export interface FilterState {
  windows11Ready: 'all' | 'ready' | 'not-ready';
  tpmPresent: 'all' | 'present' | 'missing';
  secureBootEnabled: 'all' | 'enabled' | 'disabled';
  lowStorage: 'all' | 'low' | 'sufficient';
  joinType: 'all' | 'Hybrid' | 'AzureAD' | 'OnPremAD' | 'None';
  location: string[];
}

export interface ChartData {
  name: string;
  value: number;
  percentage: number;
  color?: string;
}
