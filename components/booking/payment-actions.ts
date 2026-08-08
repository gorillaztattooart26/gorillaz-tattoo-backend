'use server'

import { supabase } from '@/lib/supabase'
import { getBookingRecordByToken } from '@/lib/booking'
import { getBaseUrl } from '@/lib/url'
import { getActivePaymentProvider } from '@/lib/payments/service'

export interface CreateCheckoutSessionActionResult {
  checkoutUrl?: string
  error?: string
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
  const provider = getActivePaymentProvider()

  let session
  try {
    session = await provider.createCheckoutSession({
      bookingToken: token,
      bookingId: booking.bookingId,
      amount: booking.downPaymentAmount,
      currency: booking.currency,
      description: `Down payment for booking ${booking.bookingId}`,
      customer: booking.customer,
      successUrl: `${baseUrl}/booking/${token}`,
      // Routing target only — everything about how/whether the payment
      // itself succeeds is still entirely the provider + its webhook's
      // call. Sends the customer to the dedicated Payment Failed page
      // instead of back to the same booking page when they cancel or bail
      // out of checkout, so they land somewhere that explains what
      // happened and offers a retry rather than just re-showing the same
      // pay button.
      cancelUrl: `${baseUrl}/booking/${token}/payment-failed`,
    })
  } catch (error) {
    console.error('[payments] createCheckoutSession failed:', error)
    return { error: 'Something went wrong starting your payment. Please try again.' }
  }

  const { error: insertError } = await supabase.from('payments').insert({
    booking_id: booking.id,
    checkout_session_id: session.id,
    provider: provider.name,
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
