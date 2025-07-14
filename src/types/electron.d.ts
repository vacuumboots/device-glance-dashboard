export interface SyncProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'complete' | 'error';
  message: string;
  percentage?: number;
}

export interface AzureCredentials {
  accountName: string;
  containerName: string;
  accessKey: string;
}

export interface ElectronAPI {
  startSync: () => Promise<{ success: boolean; error?: string }>;
  stopSync: () => Promise<{ success: boolean }>;
  getSyncStatus: () => Promise<{ isRunning: boolean }>;
  onSyncProgress: (callback: (event: unknown, progress: SyncProgress) => void) => void;
  removeAllListeners: (channel: string) => void;
  saveAzureCredentials: (credentials: AzureCredentials) => Promise<void>;
  getAzureCredentials: () => Promise<AzureCredentials | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
