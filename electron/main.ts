import { app, BrowserWindow, Menu, shell, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

import * as http from 'http';

process.on('uncaughtException', (err) => {
  console.error('Main process error:', err);
});

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let nextProcess: any = null;
let mainWindow: BrowserWindow | null = null;

function isServerReady(url = 'http://localhost:3000'): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(res.statusCode !== undefined);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    title: 'Dafaterkom - Cafe Point of Sale System',
  });

  let retries = 0;
  const maxRetries = 60;

  const loadApp = async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;

    const ready = await isServerReady('http://localhost:3000');
    if (ready) {
      mainWindow.loadURL('http://localhost:3000');
    } else {
      if (retries < maxRetries) {
        retries++;
        setTimeout(loadApp, 1000);
      } else {
        mainWindow.loadURL('http://localhost:3000').catch(() => {});
      }
    }
  };

  loadApp();

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createMenu();
}

function createMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
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
            shell.openExternal('https://dafaterkom.com');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', async () => {
  const ready = await isServerReady('http://localhost:3000');
  if (!ready && !app.isPackaged) {
    try {
      const appPath = path.join(__dirname, '..');
      nextProcess = spawn('npx', ['next', 'start'], {
        cwd: appPath,
        stdio: 'ignore',
        shell: true,
      });
      nextProcess.on('error', (e: any) => console.warn('Next spawn warning:', e));
    } catch (err) {
      console.warn('Could not spawn next process:', err);
    }
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (nextProcess) {
    nextProcess.kill();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle external links
app.on('web-contents-created', (_, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    
    if (parsedUrl.origin !== 'http://localhost:3000' && !isDev) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });
});

// IPC handlers for database path
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('ensure-data-dir', async () => {
  const dataPath = path.join(app.getPath('userData'), 'data');
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
  
  // Also copy the initial database if it doesn't exist
  const dbPath = path.join(dataPath, 'dafaterkom.db');
  const legacyDbPath = path.join(dataPath, 'cashir.db');
  if (fs.existsSync(legacyDbPath) && !fs.existsSync(dbPath)) {
    try {
      fs.renameSync(legacyDbPath, dbPath);
    } catch (e) {
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