import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findAvailablePort,
  startServer,
  stopServer,
  waitForServer,
} from './server-lifecycle.js';
import { initUpdater, stopUpdater } from './updater.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEV_URL = process.env.ELECTRON_DEV_URL;

let serverProcess = null;
let serverBaseUrl = null;
let mainWindow = null;

function createWindow(loadUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    title: 'Orca',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  if (DEV_URL) {
    void mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  void mainWindow.loadURL(loadUrl);

  mainWindow.webContents.once('did-finish-load', () => {
    initUpdater(mainWindow);
  });
}

async function ensureServerRunning() {
  if (serverBaseUrl) {
    return serverBaseUrl;
  }

  const port = await findAvailablePort();
  serverProcess = startServer(port);
  await waitForServer(port);
  serverBaseUrl = `http://127.0.0.1:${port}`;
  return serverBaseUrl;
}

async function launchDesktop() {
  const loadUrl = DEV_URL || await ensureServerRunning();
  createWindow(loadUrl);
}

app.whenReady().then(() => {
  void launchDesktop().catch((error) => {
    console.error('[orca-desktop] Failed to start:', error);
    app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void launchDesktop().catch((error) => {
        console.error('[orca-desktop] Failed to reopen:', error);
        app.quit();
      });
    }
  });
});

app.on('before-quit', () => {
  stopUpdater();
  stopServer(serverProcess);
  serverProcess = null;
  serverBaseUrl = null;
  mainWindow = null;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
