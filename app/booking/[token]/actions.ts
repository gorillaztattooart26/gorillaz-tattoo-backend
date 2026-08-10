'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBookingRecordByToken } from '@/lib/booking'
import { buildBookingSessionCookie } from '@/lib/booking-session'
import { checkRateLimit, buildBookingVerifyTokenKey } from '@/lib/rate-limit'

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]/g, '')
}

export interface VerifyBookingResult {
  success: boolean
  error?: string
}

const GENERIC_ERROR = "We couldn't find a booking matching that email or mobile number."

const VERIFY_TOKEN_WINDOW_SECONDS = 15 * 60
const VERIFY_TOKEN_MAX_ATTEMPTS = 5

/**
 * Server-side identity check for a private booking link. Only ever returns
 * a success flag and a generic error message to the caller — the customer
 * record fetched here to perform the comparison is discarded, never
 * serialized back to the client.
 */
export async function verifyBookingIdentity(
  token: string,
  identifier: string,
): Promise<VerifyBookingResult> {
  // Keyed by the booking token itself, not the caller's IP: a legitimate
  // customer may switch networks (mobile data to Wi-Fi) mid-session and
  // shouldn't lose their attempt budget for it, while an attacker who has
  // (or is guessing) a leaked token can't get more attempts by rotating
  // IPs — the token is the scarce secret either way. Same generic error on
  // block as a failed identity match, so a rate-limit hit is never
  // distinguishable from a wrong email/mobile guess.
  const rateLimitCheck = await checkRateLimit({
    key: buildBookingVerifyTokenKey(token),
    windowSeconds: VERIFY_TOKEN_WINDOW_SECONDS,
    maxAttempts: VERIFY_TOKEN_MAX_ATTEMPTS,
  })

  if (!rateLimitCheck.allowed) {
    return { success: false, error: GENERIC_ERROR }
  }

  const record = await getBookingRecordByToken(token)

  if (!record) {
    return { success: false, error: GENERIC_ERROR }
  }

  const normalizedInput = normalize(identifier)
  const matches =
    normalizedInput === normalize(record.customer.email) ||
    normalizedInput === normalize(record.customer.mobile)

  if (!matches) {
    return { success: false, error: GENERIC_ERROR }
  }

  const cookie = buildBookingSessionCookie(token)
  const cookieStore = await cookies()
  cookieStore.set(cookie.name, cookie.value, {
    httpOnly: cookie.httpOnly,
    secure: cookie.secure,
    sameSite: cookie.sameSite,
    path: cookie.path,
    maxAge: cookie.maxAge,
  })

  redirect(`/booking/${token}`)
}
