'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getBookingRecordByToken } from '@/lib/booking'
import { buildBookingSessionCookie } from '@/lib/booking-session'

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]/g, '')
}

export interface VerifyBookingResult {
  success: boolean
  error?: string
}

const GENERIC_ERROR = "We couldn't find a booking matching that email or mobile number."

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
