'use client';

import { useEffect } from 'react';

export default function ElectronInitializer() {
  useEffect(() => {
    const initElectron = async () => {
      if (typeof window !== 'undefined' && (window as any).electron) {
        try {
          await fetch('/api/init-electron', { method: 'POST' });
        } catch (error) {
          console.error('Failed to notify Electron database status:', error);
        }
      }
    };

    initElectron();
  }, []);

  return null;
}