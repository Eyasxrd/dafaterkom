interface Window {
  electron?: {
    ipcRenderer: {
      sendMessage: (channel: string, data: any) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      once: (channel: string, func: (...args: any[]) => void) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
    platform: string;
    appVersion: string;
    nodeVersion: string;
    chromeVersion: string;
    getAppPath: () => Promise<string>;
    ensureDataDir: () => Promise<string>;
    getDatabasePath: () => Promise<string>;
  };
}

declare global {
  interface Window extends Window {}
}

export {};