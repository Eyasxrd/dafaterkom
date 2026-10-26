import crypto from 'crypto'
import QRCode from 'qrcode'

// Standard RFC 4648 Base32 alphabet
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/**
 * Encodes a buffer to a Base32 string (without padding)
 */
export function base32Encode(buffer: Buffer): string {
  let bits = 0
  let value = 0
  let output = ''

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  }

  return output
}

/**
 * Decodes a Base32 string to a Buffer
 */
export function base32Decode(base32: string): Buffer {
  const cleanBase32 = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '')
  const length = cleanBase32.length
  const buffer = Buffer.alloc(Math.floor((length * 5) / 8))

  let bits = 0
  let value = 0
  let index = 0

  for (let i = 0; i < length; i++) {
    const val = BASE32_ALPHABET.indexOf(cleanBase32[i])
    if (val === -1) continue // Skip invalid characters

    value = (value << 5) | val
    bits += 5

    if (bits >= 8) {
      buffer[index++] = (value >>> (bits - 8)) & 255
      bits -= 8
    }
  }

  return buffer.subarray(0, index)
}

/**
 * Generates a cryptographically secure Base32 secret for Google Authenticator
 */
export function generateTotpSecret(bytes = 20): string {
  const randomBytes = crypto.randomBytes(bytes)
  return base32Encode(randomBytes)
}

/**
 * Generates the standard TOTP URI for QR code scanning
 * Format: otpauth://totp/{issuer}:{accountName}?secret={secret}&issuer={issuer}&algorithm=SHA1&digits=6&period=30
 */
export function generateOtpAuthUri({
  secret,
  accountName,
  issuer = 'Dafaterkom Cloud POS'
}: {
  secret: string
  accountName: string
  issuer?: string
}): string {
  const cleanSecret = secret.toUpperCase().replace(/\s+/g, '')
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedAccount = encodeURIComponent(accountName)
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

/**
 * Generates a high-quality QR Code Data URL from the TOTP URI
 */
export async function generateTotpQrCode(otpAuthUri: string): Promise<string> {
  return await QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    color: {
      dark: '#0f172a',
      light: '#ffffff'
    }
  })
}

/**
 * Computes a 6-digit TOTP token for a given secret and counter (RFC 4226 / RFC 6238)
 */
export function generateTotpTokenForCounter(secret: string, counter: number, digits = 6): string {
  const key = base32Decode(secret)
  const counterBuffer = Buffer.alloc(8)
  
  // Write 64-bit integer (big-endian)
  counterBuffer.writeBigInt64BE(BigInt(counter), 0)

  const hmac = crypto.createHmac('sha1', key)
  hmac.update(counterBuffer)
  const digest = hmac.digest()

  // Dynamic truncation
  const offset = digest[digest.length - 1] & 0x0f
  const code = (
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff)
  ) % Math.pow(10, digits)

  return code.toString().padStart(digits, '0')
}

/**
 * Generates the current active TOTP token for a secret
 */
export function generateTotpToken(secret: string, time = Date.now(), period = 30): string {
  const counter = Math.floor(time / 1000 / period)
  return generateTotpTokenForCounter(secret, counter)
}

/**
 * Verifies a dynamic 6-digit TOTP token against Google Authenticator
 * Includes window tolerance (default: +/- 1 step = 30s before and after)
 */
export function verifyTotpToken({
  secret,
  token,
  window = 1,
  time = Date.now(),
  period = 30
}: {
  secret: string
  token: string
  window?: number
  time?: number
  period?: number
}): boolean {
  if (!secret || !token) return false

  const cleanToken = token.trim().replace(/\s+/g, '')
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false
  }

  const currentCounter = Math.floor(time / 1000 / period)

  // Check current step and adjacent steps in the window
  for (let i = -window; i <= window; i++) {
    const expectedToken = generateTotpTokenForCounter(secret, currentCounter + i)
    if (expectedToken === cleanToken) {
      return true
    }
  }

  return false
}

/**
 * Calculates remaining seconds in the current 30-second TOTP window
 */
export function getTotpRemainingSeconds(period = 30): number {
  const currentSecond = Math.floor(Date.now() / 1000) % period
  return period - currentSecond
}
