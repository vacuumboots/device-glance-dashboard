export interface SyncProgress {
  stage: 'starting' | 'downloading' | 'processing' | 'complete' | 'error';
  message: string;
  percentage?: number;
}

export interface ElectronAPI {
  startSync: () => Promise<{ success: boolean; error?: string }>;
  stopSync: () => Promise<{ success: boolean }>;
  getSyncStatus: () => Promise<{ isRunning: boolean }>;
  onSyncProgress: (callback: (event: any, progress: SyncProgress) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}