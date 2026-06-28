import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version: appVersion } = require('../package.json');

const CHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

let mainWindow = null;
let checkInterval = null;
let handlersRegistered = false;
let eventsRegistered = false;
let updaterInitialized = false;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function isUpdaterEnabled() {
  return app.isPackaged && !process.env.ELECTRON_DEV_URL;
}

function wireAutoUpdaterEvents() {
  if (eventsRegistered) {
    return;
  }

  eventsRegistered = true;
  autoUpdater.autoDownload = false;
  autoUpdater.allowPrerelease = false;

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('desktop-update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes ?? '',
      releaseDate: info.releaseDate ?? null,
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('desktop-update-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('desktop-update-downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (error) => {
    sendToRenderer('desktop-update-error', {
      message: error?.message || 'Update failed',
    });
  });
}

function registerIpcHandlers() {
  if (handlersRegistered) {
    return;
  }

  handlersRegistered = true;

  ipcMain.handle('desktop:check-for-updates', async () => {
    if (!isUpdaterEnabled()) {
      return { ok: false, reason: 'inactive' };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      return { ok: true, updateInfo: result?.updateInfo ?? null };
    } catch (error) {
      return { ok: false, message: error?.message || 'Update check failed' };
    }
  });

  ipcMain.handle('desktop:download-update', async () => {
    if (!isUpdaterEnabled()) {
      return { ok: false, reason: 'inactive' };
    }

    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result?.updateInfo) {
        return { ok: false, message: 'No update available' };
      }

      await autoUpdater.downloadUpdate();
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || 'Download failed' };
    }
  });

  ipcMain.handle('desktop:install-update', () => {
    if (!isUpdaterEnabled()) {
      return { ok: false, reason: 'inactive' };
    }

    autoUpdater.quitAndInstall();
    return { ok: true };
  });

  ipcMain.handle('desktop:get-app-version', () => appVersion);
}

export function initUpdater(window) {
  mainWindow = window;
  registerIpcHandlers();

  if (!isUpdaterEnabled()) {
    return;
  }

  wireAutoUpdaterEvents();

  if (updaterInitialized) {
    return;
  }

  updaterInitialized = true;

  void autoUpdater.checkForUpdates().catch((error) => {
    console.error('[orca-updater] Initial update check failed:', error);
  });

  checkInterval = setInterval(() => {
    void autoUpdater.checkForUpdates().catch((error) => {
      console.error('[orca-updater] Scheduled update check failed:', error);
    });
  }, CHECK_INTERVAL_MS);
}

export function stopUpdater() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}
