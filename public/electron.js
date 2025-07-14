import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { SyncService } from '../dist/electron-services/services/syncService.js';

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple development check without external dependency
const isDev = process.env.NODE_ENV === 'development' || /[\\/]electron-prebuilt[\\/]/.test(process.execPath);

// Initialize sync service
const syncService = new SyncService();

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
    console.log('App path:', app.getAppPath());
    console.log('Loading file:', indexPath);
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
    app.quit();
  }
});
