import { createHmac, timingSafeEqual } from 'crypto'

const COOKIE_NAME = 'booking_session'
const SESSION_MAX_AGE_SECONDS = 30 * 60

function getSecret(): string {
  const secret = process.env.BOOKING_SESSION_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!secret) {
    throw new Error(
      'Missing BOOKING_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) — required to sign booking sessions.',
    )
  }
  return secret
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export const BOOKING_SESSION_COOKIE_NAME = COOKIE_NAME
export const BOOKING_SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_SECONDS

export interface BookingSessionCookie {
  name: string
  value: string
  maxAge: number
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: string
}

/**
 * Builds a signed, per-token session cookie value: `${token}.${expiresAt}.${hmac}`.
 * The HMAC binds the cookie to this exact token and expiry, so it can't be
 * replayed against a different booking or edited to extend its lifetime.
 */
export function buildBookingSessionCookie(token: string): BookingSessionCookie {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000
  const payload = `${token}.${expiresAt}`
  const signature = sign(payload)

  return {
    name: COOKIE_NAME,
    value: `${payload}.${signature}`,
    maxAge: SESSION_MAX_AGE_SECONDS,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/booking',
  }
}

export function isBookingSessionValid(token: string, cookieValue: string | undefined): boolean {
  if (!cookieValue) return false

  const parts = cookieValue.split('.')
  if (parts.length !== 3) return false

  const [cookieToken, expiresAtRaw, signature] = parts
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false
  if (cookieToken !== token) return false

  const expectedSignature = sign(`${cookieToken}.${expiresAtRaw}`)
  const expectedBuf = Buffer.from(expectedSignature, 'hex')
  const actualBuf = Buffer.from(signature, 'hex')
  if (expectedBuf.length !== actualBuf.length) return false

  return timingSafeEqual(expectedBuf, actualBuf)
}
