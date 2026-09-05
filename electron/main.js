"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const child_process_1 = require("child_process");
const isDev = process.env.NODE_ENV === 'development';
let nextProcess = null;
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1024,
        minHeight: 768,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        // icon: path.join(__dirname, '../public/icon.svg'), // Will add proper icon later
        title: 'Dafaterkom - Cafe Point of Sale System',
    });
    // Load the app
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
        mainWindow.webContents.openDevTools();
    }
    else {
        // For production, load from the running Next.js server
        mainWindow.loadURL('http://localhost:3000');
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    // Create application menu
    createMenu();
}
function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        electron_1.app.quit();
                    },
                },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
                { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
                { type: 'separator' },
                { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
                { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
                { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
                { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', role: 'toggleDevTools' },
                { type: 'separator' },
                { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
                { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
                { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
                { type: 'separator' },
                { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: () => {
                        electron_1.shell.openExternal('https://dafaterkom.com');
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
electron_1.app.on('ready', async () => {
    // Start Next.js server for production builds
    if (!isDev) {
        const appPath = path.join(__dirname, '..');
        nextProcess = (0, child_process_1.spawn)('node', ['node_modules/.bin/next', 'start'], {
            cwd: appPath,
            stdio: 'inherit',
            shell: true
        });
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    createWindow();
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    if (nextProcess) {
        nextProcess.kill();
    }
});
electron_1.app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
// Handle external links
electron_1.app.on('web-contents-created', (_, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (parsedUrl.origin !== 'http://localhost:3000' && !isDev) {
            event.preventDefault();
            electron_1.shell.openExternal(navigationUrl);
        }
    });
});
// IPC handlers for database path
electron_1.ipcMain.handle('get-app-path', () => {
    return electron_1.app.getPath('userData');
});
electron_1.ipcMain.handle('ensure-data-dir', async () => {
    const dataPath = path.join(electron_1.app.getPath('userData'), 'data');
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }
    // Also copy the initial database if it doesn't exist
    const dbPath = path.join(dataPath, 'dafaterkom.db');
    const legacyDbPath = path.join(dataPath, 'cashir.db');
    if (fs.existsSync(legacyDbPath) && !fs.existsSync(dbPath)) {
        try {
            fs.renameSync(legacyDbPath, dbPath);
        }
        catch (e) {
            console.warn('Could not rename legacy cashir.db:', e);
        }
    }
    if (!fs.existsSync(dbPath)) {
        const sourceDbPath = path.join(__dirname, '../prisma/dev.db');
        if (fs.existsSync(sourceDbPath)) {
            fs.copyFileSync(sourceDbPath, dbPath);
            console.log('Copied initial database to:', dbPath);
        }
    }
    return dataPath;
});
