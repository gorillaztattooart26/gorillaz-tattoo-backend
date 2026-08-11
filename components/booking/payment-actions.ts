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

  // `isArchived` comes from the server-side record re-derived above by
  // token, never from client input. An archived booking must never start
  // (or resume) checkout — see lib/payments/reconcile.ts for the matching
  // webhook-side guard that protects a checkout already in flight when the
  // archive happens. Deliberately the same generic wording as the status
  // check above: nothing here reveals that "archived" is the reason.
  if (booking.isArchived) {
    return { error: 'This booking is not available for payment.' }
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

  // Generated up front (not left to the DB default) so it can be embedded
  // in the checkout session's metadata below — the provider echoes it back
  // on the resulting webhook event, letting reconciliation match this exact
  // attempt instead of guessing among a booking's pending payments if more
  // than one exists (retries, abandoned checkouts, double-clicks). See
  // lib/payments/reconcile.ts.
  const paymentAttemptId = crypto.randomUUID()

  let session
  try {
    session = await provider.createCheckoutSession({
      bookingToken: token,
      bookingId: booking.bookingId,
      paymentAttemptId,
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
    id: paymentAttemptId,
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
