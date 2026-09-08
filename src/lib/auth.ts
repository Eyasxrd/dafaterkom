import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const SESSION_COOKIE_NAME = 'dafaterkom_session'
const SECRET_KEY = process.env.SESSION_SECRET || 'dafaterkom-secret-super-secure-key-2026'

export interface SessionPayload {
  userId: string
  tenantId: string
  name: string
  email: string
  role: string
  exp: number
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return Buffer.from(base64, 'base64').toString('utf8')
}

export function signSessionToken(payload: Omit<SessionPayload, 'exp'>, expiresInDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60
  const fullPayload: SessionPayload = { ...payload, exp }

  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload))

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifySessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null

  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [encodedHeader, encodedPayload, signature] = parts

    const expectedSignature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    if (signature !== expectedSignature) {
      return null
    }

    const payload: SessionPayload = JSON.parse(base64UrlDecode(encodedPayload))

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}

export function getAuthenticatedUser(request: NextRequest): SessionPayload | null {
  // 1. Check HTTP cookie
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (cookie) {
    const session = verifySessionToken(cookie)
    if (session) return session
  }

  // 2. Check Authorization Bearer header (useful for mobile / external terminals)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim()
    return verifySessionToken(token)
  }

  return null
}
