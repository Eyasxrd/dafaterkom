import { NextResponse } from 'next/server';
import { initializeElectronDatabase } from '@/lib/db';

export async function POST() {
  try {
    await initializeElectronDatabase();
    return NextResponse.json({ success: true, message: 'Electron database initialized' });
  } catch (error) {
    console.error('Failed to initialize Electron database:', error);
    return NextResponse.json({ success: false, error: 'Failed to initialize database' }, { status: 500 });
  }
}