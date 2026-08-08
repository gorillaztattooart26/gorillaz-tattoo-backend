import type { NormalizedPaymentEvent } from '@/types/payment'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getBaseUrl } from '@/lib/url'
import { sendPaymentReceiptEmail, sendStaffPaymentReceivedNotification } from '@/lib/emails'

export interface ReconcileResult {
  status: number
  body: Record<string, unknown>
}

/**
 * Applies a normalized `payment.paid` / `payment.failed` event to the DB —
 * updating `payments`/`bookings` status and firing the payment emails on
 * success. Provider-agnostic: every provider's webhook route parses its own
 * payload into a `NormalizedPaymentEvent` (via `PaymentProvider.parseWebhookEvent`)
 * and hands it here, so this reconciliation logic (and the emails/booking
 * status transitions it drives) never changes when a provider is added.
 *
 * Always resolves to `{received: true}` unless a genuine internal DB error
 * occurs, to avoid provider retry storms on payloads that can't be
 * reconciled (e.g. no matching booking/pending payment row).
 */
export async function reconcilePaymentEvent(event: NormalizedPaymentEvent): Promise<ReconcileResult> {
  if (event.type === 'unhandled') {
    return { status: 200, body: { received: true } }
  }

  if (!event.bookingToken) {
    console.error(
      '[payments] no booking_token in payment metadata; provider event id:',
      event.providerEventId,
      'type:',
      event.type,
    )
    return { status: 200, body: { received: true } }
  }

  const supabaseAdmin = getSupabaseAdmin()

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, token, booking_id, customer_name, customer_email, artists(name)')
    .eq('token', event.bookingToken)
    .maybeSingle()

  if (bookingError || !booking) {
    console.error('[payments] booking not found for token:', event.bookingToken, bookingError)
    return { status: 200, body: { received: true } }
  }

  const artistName = (booking.artists as unknown as { name: string } | null)?.name ?? 'Unknown artist'

  const { data: pendingPayment, error: paymentLookupError } = await supabaseAdmin
    .from('payments')
    .select('id, amount, currency')
    .eq('booking_id', booking.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (paymentLookupError || !pendingPayment) {
    console.error(
      '[payments] no pending payment row for booking:',
      booking.id,
      paymentLookupError,
    )
    return { status: 200, body: { received: true } }
  }

  if (event.type === 'payment.paid') {
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'paid', method: event.paymentMethod, paid_at: new Date().toISOString() })
      .eq('id', pendingPayment.id)

    const { error: updateBookingError } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'appointment_confirmed' })
      .eq('id', booking.id)

    if (updatePaymentError || updateBookingError) {
      console.error(
        '[payments] failed to update payment/booking:',
        updatePaymentError,
        updateBookingError,
      )
      return { status: 500, body: { error: 'Failed to record payment.' } }
    }

    const baseUrl = await getBaseUrl()
    await sendPaymentReceiptEmail({
      to: booking.customer_email,
      customerName: booking.customer_name,
      bookingId: booking.booking_id,
      amount: pendingPayment.amount,
      currency: pendingPayment.currency,
      bookingUrl: `${baseUrl}/booking/${booking.token}`,
    })
    await sendStaffPaymentReceivedNotification({
      bookingId: booking.booking_id,
      customerName: booking.customer_name,
      artistName,
      amount: pendingPayment.amount,
      currency: pendingPayment.currency,
    })
  } else {
    const { error: updatePaymentError } = await supabaseAdmin
      .from('payments')
      .update({ status: 'failed' })
      .eq('id', pendingPayment.id)

    if (updatePaymentError) {
      console.error('[payments] failed to record failed payment:', updatePaymentError)
      return { status: 500, body: { error: 'Failed to record payment.' } }
    }
  }

  return { status: 200, body: { received: true } }
}
