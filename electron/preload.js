"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        sendMessage: (channel, data) => {
            electron_1.ipcRenderer.send(channel, data);
        },
        on: (channel, func) => {
            electron_1.ipcRenderer.on(channel, (event, ...args) => func(...args));
        },
        once: (channel, func) => {
            electron_1.ipcRenderer.once(channel, (event, ...args) => func(...args));
        },
        invoke: (channel, ...args) => {
            return electron_1.ipcRenderer.invoke(channel, ...args);
        },
    },
    platform: process.platform,
    appVersion: process.versions.app,
    nodeVersion: process.versions.node,
    chromeVersion: process.versions.chrome,
    getAppPath: () => electron_1.ipcRenderer.invoke('get-app-path'),
    ensureDataDir: () => electron_1.ipcRenderer.invoke('ensure-data-dir'),
    // Auto-initialize database path for renderer
    getDatabasePath: async () => {
        const dataDir = await electron_1.ipcRenderer.invoke('ensure-data-dir');
        return `file:${dataDir}/dafaterkom.db`;
    },
});
