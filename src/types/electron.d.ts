export interface SyncProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'complete' | 'error' | 'cancelled';
  message: string;
  percentage?: number;
}

export interface AzureCredentials {
  accountName: string;
  containerName: string;
  accessKey: string;
}

export interface SyncedFile {
  name: string;
  content: string;
}

export interface LocationMapping {
  genericToReal: Record<string, string>;
  ipRangeMapping: Record<string, string>;
}

export interface ElectronAPI {
  startSync: () => Promise<{ success: boolean; error?: string }>;
  stopSync: () => Promise<{ success: boolean }>;
  getSyncStatus: () => Promise<{ isRunning: boolean }>;
  onSyncProgress: (callback: (event: unknown, progress: SyncProgress) => void) => void;
  removeAllListeners: (channel: string) => void;
  saveAzureCredentials: (credentials: AzureCredentials) => Promise<void>;
  getAzureCredentials: () => Promise<AzureCredentials | null>;
  loadSyncedFiles: () => Promise<{ success: boolean; files?: SyncedFile[]; error?: string }>;
  loadLocationMapping: () => Promise<{
    success: boolean;
    mapping?: LocationMapping | null;
    error?: string;
  }>;
  openLogsFolder: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
