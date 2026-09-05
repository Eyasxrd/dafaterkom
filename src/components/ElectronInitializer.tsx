'use client';

import { useEffect } from 'react';
import { initializeElectronDatabase } from '@/lib/db';

export default function ElectronInitializer() {
  useEffect(() => {
    const initElectron = async () => {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electron) {
        try {
          console.log('Initializing Electron database...');
          await initializeElectronDatabase();
          console.log('Electron database initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Electron database:', error);
        }
      }
    };

    initElectron();
  }, []);

  return null; // This component doesn't render anything
}