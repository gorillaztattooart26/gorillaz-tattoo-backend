'use server'

import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { getBookingRecordByToken } from '@/lib/booking'
import { createCheckoutSession } from '@/services/paymongo'

export interface CreateCheckoutSessionActionResult {
  checkoutUrl?: string
  error?: string
}

async function getBaseUrl(): Promise<string> {
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

/**
 * Server Action behind the "Pay Down Payment" button. Re-derives the
 * booking and its down payment amount from the DB by token rather than
 * trusting anything passed from the client — a tampered client-supplied
 * amount should never be able to influence what's actually charged.
 */
export async function createCheckoutSessionAction(
  token: string,
): Promise<CreateCheckoutSessionActionResult> {
  const booking = await getBookingRecordByToken(token)

  if (!booking) {
    return { error: 'This booking could not be found.' }
  }

  if (booking.status !== 'awaiting_down_payment') {
    return { error: 'This booking is not awaiting a down payment.' }
  }

  const baseUrl = await getBaseUrl()

  let session
  try {
    session = await createCheckoutSession({
      bookingToken: token,
      bookingId: booking.bookingId,
      amount: booking.downPaymentAmount,
      currency: booking.currency,
      description: `Down payment for booking ${booking.bookingId}`,
      customer: booking.customer,
      successUrl: `${baseUrl}/booking/${token}`,
      cancelUrl: `${baseUrl}/booking/${token}`,
    })
  } catch (error) {
    console.error('[payments] createCheckoutSession failed:', error)
    return { error: 'Something went wrong starting your payment. Please try again.' }
  }

  const { error: insertError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    checkout_session_id: session.id,
    provider: 'paymongo',
    status: 'pending',
    amount: booking.downPaymentAmount,
    currency: booking.currency,
  })

  if (insertError) {
    console.error('[payments] insert failed:', insertError)
    return { error: 'Something went wrong starting your payment. Please try again.' }
  }

  return { checkoutUrl: session.checkoutUrl }
}
