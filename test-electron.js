import pkg from 'electron';
const { app, BrowserWindow } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev') || /[\\/]electron-prebuilt[\\/]/.test(process.execPath);

console.log('=== Electron Test ===');
console.log('Development mode:', isDev);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('__dirname:', __dirname);

function createTestWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Test loading logic
  if (isDev) {
    console.log('Loading development server...');
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load dev server:', err.message);
    });
  } else {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    console.log('Loading production build from:', indexPath);
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load production build:', err.message);
    });
  }

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
    
    // Test if the page has content
    mainWindow.webContents.executeJavaScript(`
      document.title && document.body.children.length > 0
    `).then(hasContent => {
      console.log('Page has content:', hasContent);
      if (hasContent) {
        console.log('✅ UI loaded successfully');
      } else {
        console.log('❌ UI appears blank');
      }
      
      // Close after 3 seconds
      setTimeout(() => app.quit(), 3000);
    });
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('❌ Failed to load page:', errorCode, errorDescription);
    setTimeout(() => app.quit(), 1000);
  });
}

app.whenReady().then(() => {
  createTestWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});