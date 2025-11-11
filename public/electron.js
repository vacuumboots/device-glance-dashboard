import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { SyncService } from '../dist/electron-services/services/syncService.js';
import { CredentialsService } from '../dist/electron-services/services/credentialsService.js';
import mainLogger from './main-logger.js';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple development check without external dependency
const isDev = process.env.NODE_ENV === 'development' || /[\\/]electron-prebuilt[\\/]/.test(process.execPath);

// Initialize services
const syncService = new SyncService();
const credentialsService = new CredentialsService();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, 'favicon.ico'),
  });

  // Load the app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainLogger.info('App path:', app.getAppPath());
    mainLogger.info('Loading file:', indexPath);
    mainWindow.loadFile(indexPath);
  }

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

// Set up IPC handlers
function setupIPC() {
  ipcMain.handle('sync-start', async () => {
    try {
      await syncService.startSync();
      return { success: true };
    } catch (error) {
      mainLogger.error('sync-start failed', error && error.message ? error.message : error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('sync-stop', () => {
    syncService.stopSync();
    return { success: true };
  });

  ipcMain.handle('sync-status', () => {
    return { isRunning: syncService.getIsRunning() };
  });

  ipcMain.handle('save-azure-credentials', async (event, credentials) => {
    try {
      await credentialsService.saveCredentials(credentials);
      return { success: true };
    } catch (error) {
      mainLogger.error('save-azure-credentials failed', error && error.message ? error.message : error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-azure-credentials', async () => {
    try {
      const credentials = await credentialsService.getCredentials();
      return credentials;
    } catch (error) {
      mainLogger.error('get-azure-credentials failed', error && error.message ? error.message : error);
      return null;
    }
  });

  ipcMain.handle('load-synced-files', async () => {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      const uniqueBaseDir = path.default.join(app.getPath('userData'), 'data', 'unique');
      const indexFile = path.default.join(uniqueBaseDir, 'index.json');

      // Check if index file exists
      try {
        await fs.access(indexFile);
      } catch {
        return { success: false, error: 'No synced files found. Please run sync first.' };
      }

      // Read the latest folder from index
      const indexData = JSON.parse(await fs.readFile(indexFile, 'utf8'));
      if (!indexData || indexData.length === 0) {
        return { success: false, error: 'No synced data folders found.' };
      }

      const latestFolder = indexData[0]; // First item is the latest
      const latestFolderPath = path.default.join(uniqueBaseDir, latestFolder);

      // Read all JSON files from the latest folder
      const files = await fs.readdir(latestFolderPath);
      const jsonFiles = files.filter(file => path.default.extname(file) === '.json');

      if (jsonFiles.length === 0) {
        return { success: false, error: 'No JSON files found in synced data.' };
      }

      // Read all JSON files and return their contents
      const fileContents = [];
      for (const fileName of jsonFiles) {
        const filePath = path.default.join(latestFolderPath, fileName);
        const content = await fs.readFile(filePath, 'utf8');
        fileContents.push({
          name: fileName,
          content: content
        });
      }

      return { success: true, files: fileContents };
    } catch (error) {
      mainLogger.error('load-synced-files failed', error && error.message ? error.message : error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('load-location-mapping', async () => {
    try {
      const fs = await import('node:fs/promises');
      const path = await import('node:path');

      // Try to load from user data directory first
      const userDataPath = path.default.join(app.getPath('userData'), 'location-mapping.json');

      try {
        const content = await fs.readFile(userDataPath, 'utf8');
        const data = JSON.parse(content);
        return { success: true, mapping: data.locationMapping };
      } catch (error) {
        // File doesn't exist in user data directory, return null (will use generic names)
        mainLogger.warn('location-mapping not found in user data; using generic names');
        return { success: true, mapping: null };
      }
    } catch (error) {
      mainLogger.error('load-location-mapping failed', error && error.message ? error.message : error);
      return { success: false, error: error.message };
    }
  });

  // Forward sync progress events to renderer
  syncService.on('progress', (progress) => {
    const allWindows = BrowserWindow.getAllWindows();
    allWindows.forEach(window => {
      window.webContents.send('sync-progress', progress);
    });
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  mainLogger.info('App starting', { version: app.getVersion(), node: process.versions.node, chrome: process.versions.chrome, electron: process.versions.electron });
  setupIPC();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    mainLogger.info('All windows closed; quitting');
    app.quit();
  }
});