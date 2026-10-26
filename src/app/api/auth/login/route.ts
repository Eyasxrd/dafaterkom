import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signSessionToken, setSessionCookie, clearSessionCookie } from '@/lib/auth';
import { verifyTotpToken } from '@/lib/totp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      email, 
      employeeNumber, 
      identifier, 
      username, 
      password, 
      totpCode, 
      joinCode,
      authMethod // 'password' | 'authenticator' | 'pin'
    } = body;

    const userInput = String(employeeNumber || identifier || username || email || joinCode || '').trim();

    let staff = null;

    // Case 1: Authenticator OTP Login (totpCode provided or authMethod === 'authenticator')
    if (authMethod === 'authenticator' || (totpCode && String(totpCode).trim())) {
      if (!userInput) {
        return NextResponse.json({ error: 'Employee Number or Email is required for Authenticator login' }, { status: 400 });
      }

      if (!totpCode || String(totpCode).trim().length !== 6) {
        return NextResponse.json({ error: 'A 6-digit Google Authenticator code is required' }, { status: 400 });
      }

      staff = await prisma.staff.findFirst({
        where: {
          OR: [
            { email: userInput.toLowerCase() },
            { joinCode: userInput },
            { nationalId: userInput },
            { id: userInput }
          ]
        }
      });

      if (!staff) {
        return NextResponse.json({ error: 'Employee not found with the provided identifier' }, { status: 404 });
      }

      if (!staff.isActive) {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
      }

      if (!staff.canLogin) {
        return NextResponse.json({ error: 'This account does not have login permissions' }, { status: 403 });
      }

      if (!staff.totpEnabled || !staff.totpSecret) {
        return NextResponse.json({ 
          error: 'Google Authenticator is not enabled for this employee. Please sign in with your Employee Number and Password.' 
        }, { status: 400 });
      }

      const isValid = verifyTotpToken({
        secret: staff.totpSecret,
        token: String(totpCode).trim()
      });

      if (!isValid) {
        return NextResponse.json({ 
          error: 'Invalid or expired 6-digit Authenticator code. Please check your authenticator app.' 
        }, { status: 401 });
      }
    } 
    // Case 2: JoinCode / Employee Code alone without password (Fast PIN login)
    else if (joinCode && !password && !email && !employeeNumber && !identifier) {
      staff = await prisma.staff.findFirst({
        where: { joinCode: joinCode.trim(), isActive: true }
      });

      if (!staff) {
        return NextResponse.json({ error: 'Invalid employee number/PIN or account inactive' }, { status: 401 });
      }
    } 
    // Case 3: Employee Number / Email + Password
    else if (userInput) {
      staff = await prisma.staff.findFirst({
        where: {
          OR: [
            { email: userInput.toLowerCase() },
            { joinCode: userInput },
            { nationalId: userInput },
            { id: userInput }
          ]
        }
      });

      if (!staff) {
        return NextResponse.json({ error: 'Invalid employee number or password' }, { status: 401 });
      }

      if (!staff.canLogin) {
        return NextResponse.json({ error: 'This account does not have login permissions' }, { status: 403 });
      }

      if (!staff.isActive) {
        return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
      }

      if (!staff.password) {
        return NextResponse.json({ error: 'No password set for this account. Please sign in with Authenticator or contact administrator.' }, { status: 401 });
      }

      const isPasswordValid = await bcrypt.compare(password || '', staff.password);
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Invalid employee number or password' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Employee Number and Password or Authenticator code is required' }, { status: 400 });
    }

    if (staff && !staff.canLogin) {
      return NextResponse.json({ error: 'This account does not have login permissions' }, { status: 403 });
    }

    const user = {
      id: staff.id,
      tenantId: staff.tenantId,
      name: staff.name,
      email: staff.email || '',
      phone: staff.phone || null,
      role: staff.role,
      department: staff.department,
      jobTitle: staff.jobTitle,
      totpEnabled: staff.totpEnabled,
      isActive: staff.isActive
    };

    const token = signSessionToken({
      userId: staff.id,
      tenantId: staff.tenantId,
      name: staff.name,
      email: staff.email || '',
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
