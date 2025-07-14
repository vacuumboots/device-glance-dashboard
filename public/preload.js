const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  startSync: () => ipcRenderer.invoke('sync-start'),
  stopSync: () => ipcRenderer.invoke('sync-stop'),
  getSyncStatus: () => ipcRenderer.invoke('sync-status'),
  onSyncProgress: (callback) => ipcRenderer.on('sync-progress', callback),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  saveAzureCredentials: (credentials) => ipcRenderer.invoke('save-azure-credentials', credentials),
  getAzureCredentials: () => ipcRenderer.invoke('get-azure-credentials'),
});