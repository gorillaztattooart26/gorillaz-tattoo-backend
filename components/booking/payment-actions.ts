'use server'

import { supabase } from '@/lib/supabase'
import { getBookingRecordByToken, recordWaiverAcceptance } from '@/lib/booking'
import { getBaseUrl, getRequestMeta } from '@/lib/url'
import { getActivePaymentProvider } from '@/lib/payments/service'
import type { WaiverValue } from '@/components/booking/WaiverCard'

export interface CreateCheckoutSessionActionResult {
  checkoutUrl?: string
  error?: string
}

/**
 * Server Action behind the "Pay Down Payment" button. Re-derives the
 * booking and its down payment amount from the DB by token rather than
 * trusting anything passed from the client — a tampered client-supplied
 * amount should never be able to influence what's actually charged.
 *
 * `waiver` gets the same treatment: it's only ever read when the booking
 * hasn't already recorded acceptance, and even then both booleans must
 * independently be `true` or the request is rejected — before any waiver
 * record or PayMongo checkout session is created. A client that disables
 * the Pay button but still calls this action directly with
 * `agreedToTerms: false` (or omits `waiver` entirely) cannot proceed.
 */
export async function createCheckoutSessionAction(
  token: string,
  waiver?: WaiverValue,
): Promise<CreateCheckoutSessionActionResult> {
  const booking = await getBookingRecordByToken(token)

  if (!booking) {
    return { error: 'This booking could not be found.' }
  }

  if (booking.status !== 'awaiting_down_payment') {
    return { error: 'This booking is not awaiting a down payment.' }
  }

  if (!booking.waiverAccepted) {
    if (waiver?.agreedToTerms !== true || waiver?.consentToTattoo !== true) {
      return { error: 'Please agree to both waiver items before continuing.' }
    }

    const recorded = await recordWaiverAcceptance(booking.id, await getRequestMeta())
    if (!recorded) {
      return { error: 'Something went wrong recording your waiver. Please try again.' }
    }
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
