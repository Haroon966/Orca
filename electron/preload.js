import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('orcaDesktop', {
  platform: process.platform,
});
