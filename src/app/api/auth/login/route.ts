import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signSessionToken, setSessionCookie, clearSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password, joinCode } = await request.json();

    let staff = null;

    if (joinCode && joinCode.trim()) {
      // Login via 6-digit staff join code
      staff = await prisma.staff.findFirst({
        where: { joinCode: joinCode.trim(), isActive: true }
      });

      if (!staff) {
        return NextResponse.json({ error: 'Invalid join code or account inactive' }, { status: 401 });
      }
    } else if (email) {
      staff = await prisma.staff.findUnique({
        where: { email }
      });

      if (!staff) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password || '', staff.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      if (!staff.isActive) {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Email/password or Join Code required' }, { status: 400 });
    }

    const user = {
      id: staff.id,
      tenantId: staff.tenantId,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      isActive: staff.isActive
    };

    const token = signSessionToken({
      userId: staff.id,
      tenantId: staff.tenantId,
      name: staff.name,
      email: staff.email,
      role: staff.role
    });

    const response = NextResponse.json({
      user,
      ...user,
      token,
      success: true
    });

    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  clearSessionCookie(response);
  return response;
}

