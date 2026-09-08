import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ success: true, message: 'Database connected successfully' });
  } catch (error) {
    console.error('Database connection check failed:', error);
    return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
  }
}