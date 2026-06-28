import { contextBridge, ipcRenderer } from 'electron';

const UPDATE_CHANNELS = [
  'desktop-update-available',
  'desktop-update-progress',
  'desktop-update-downloaded',
  'desktop-update-error',
];

contextBridge.exposeInMainWorld('orcaDesktop', {
  platform: process.platform,
  isDesktop: true,
  onUpdateEvent: (channel, callback) => {
    if (!UPDATE_CHANNELS.includes(channel)) {
      return () => {};
    }

    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
  downloadUpdate: () => ipcRenderer.invoke('desktop:download-update'),
  installUpdate: () => ipcRenderer.invoke('desktop:install-update'),
  checkForUpdates: () => ipcRenderer.invoke('desktop:check-for-updates'),
  getAppVersion: () => ipcRenderer.invoke('desktop:get-app-version'),
});
