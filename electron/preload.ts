import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
    on: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    once: (channel: string, func: (...args: any[]) => void) => {
      ipcRenderer.once(channel, (event, ...args) => func(...args));
    },
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
  },
  platform: process.platform,
  appVersion: process.versions.app,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  ensureDataDir: () => ipcRenderer.invoke('ensure-data-dir'),
  // Auto-initialize database path for renderer
  getDatabasePath: async () => {
    const dataDir = await ipcRenderer.invoke('ensure-data-dir');
    return `file:${dataDir}/dafaterkom.db`;
  },
});