import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { verifyWebhookSignature } from '@/services/paymongo'

/**
 * PayMongo webhook — the source of truth for whether a booking's down
 * payment actually succeeded (the customer landing back on /booking/[token]
 * after checkout is not proof of payment on its own).
 *
 * Reconciliation is via `metadata.booking_token`, set on the checkout
 * session at creation time (components/booking/payment-actions.ts) —
 * PayMongo's webhook event for a Checkout-Session-originated payment
 * carries the underlying Payment resource (a `pay_...` id, distinct from
 * the `cs_...` checkout session id `payments.checkout_session_id` was
 * seeded with), not the checkout session itself, so matching on the
 * session id directly isn't possible here. This is the one piece of the
 * payload shape I couldn't fully confirm against PayMongo's docs before
 * building this (their reference pages were 404ing) — the full raw event
 * is logged below so the assumption can be checked/adjusted against a
 * real delivery once the webhook endpoint is registered post-deploy.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[paymongo webhook] PAYMONGO_WEBHOOK_SECRET is not set.')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('Paymongo-Signature')

  if (!signatureHeader || !verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)) {
    console.error('[paymongo webhook] signature verification failed.')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const eventType: string | undefined = event?.data?.attributes?.type
  const payment = event?.data?.attributes?.data

  if (eventType !== 'payment.paid' && eventType !== 'payment.failed') {
    // Not an event we act on (e.g. refund.*, dispute.*) — acknowledge and skip.
    return NextResponse.json({ received: true })
  }

  const bookingToken: string | undefined = payment?.attributes?.metadata?.booking_token
  const paymentMethod: string | null = payment?.attributes?.source?.type ?? null

  if (!bookingToken) {
    console.error('[paymongo webhook] no booking_token in payment metadata; full event:', event)
    // Nothing to reconcile against — acknowledge so PayMongo doesn't retry
    // indefinitely for a payload shape we can't act on.
    return NextResponse.json({ received: true })
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id')
    .eq('token', bookingToken)
    .maybeSingle()

  if (bookingError || !booking) {
    console.error('[paymongo webhook] booking not found for token:', bookingToken, bookingError)
    return NextResponse.json({ received: true })
  }

  const { data: pendingPayment, error: paymentLookupError } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('booking_id', booking.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (paymentLookupError || !pendingPayment) {
    console.error(
      '[paymongo webhook] no pending payment row for booking:',
      booking.id,
      paymentLookupError,
    )
    return NextResponse.json({ received: true })
  }

  if (eventType === 'payment.paid') {
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'paid', method: paymentMethod, paid_at: new Date().toISOString() })
      .eq('id', pendingPayment.id)

    const { error: updateBookingError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'appointment_confirmed' })
      .eq('id', booking.id)

    if (updatePaymentError || updateBookingError) {
      console.error(
        '[paymongo webhook] failed to update payment/booking:',
        updatePaymentError,
        updateBookingError,
      )
      return NextResponse.json({ error: 'Failed to record payment.' }, { status: 500 })
    }
  } else {
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', pendingPayment.id)

    if (updatePaymentError) {
      console.error('[paymongo webhook] failed to record failed payment:', updatePaymentError)
      return NextResponse.json({ error: 'Failed to record payment.' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
