import type { SupabaseClient } from '@supabase/supabase-js'
import type { NormalizedPaymentEvent } from '@/types/payment'
import type { Database } from '@/types/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getBaseUrl } from '@/lib/url'
import { sendPaymentReceiptEmail, sendStaffPaymentReceivedNotification } from '@/lib/emails'

export interface ReconcileResult {
  status: number
  body: Record<string, unknown>
}

interface PendingPayment {
  id: string
  amount: number
  currency: string
}

/**
 * Resolves the exact `payments` row a webhook event belongs to.
 *
 * Previous behavior: always picked whichever pending payment for the
 * booking had the newest `created_at` (`ORDER BY created_at DESC LIMIT 1`).
 * That's only correct when a booking has at most one pending payment at a
 * time — false the moment a customer double-clicks Pay, abandons a
 * checkout and retries from the Payment Failed page, or otherwise ends up
 * with two payment attempts pending at once. In that case the webhook for
 * attempt A could be reconciled against attempt B's row, marking the wrong
 * attempt paid (or failed).
 *
 * New behavior: every checkout session is created with a server-generated
 * `paymentAttemptId` embedded in the provider's metadata (see
 * components/booking/payment-actions.ts) and used as that attempt's
 * `payments.id` primary key. The webhook event for that attempt carries
 * the same id back (`event.paymentAttemptId`), so this matches on an exact
 * primary key instead of guessing — the row is the one the provider is
 * literally telling us it's reconciling, not the one we assume is "most
 * recent". `.eq('status', 'pending')` is also kept as an idempotency guard
 * against duplicate webhook deliveries: once a row leaves `pending`, a
 * replayed event for it no longer matches and becomes a no-op.
 *
 * Falls back to the old lookup only for attempts started before
 * `paymentAttemptId` existed (in-flight checkout sessions at deploy time),
 * and only when it's genuinely unambiguous — exactly one pending payment
 * for the booking. If more than one pending payment exists and the event
 * carries no attempt id, this refuses to guess and logs for manual
 * reconciliation instead of risking a wrong match.
 */
async function findPendingPayment(
  supabaseAdmin: SupabaseClient<Database>,
  bookingId: string,
  paymentAttemptId: string | null,
): Promise<PendingPayment | null> {
  if (paymentAttemptId) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('id, amount, currency')
      .eq('id', paymentAttemptId)
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .maybeSingle()

    if (error) {
      console.error(
        '[payments] pending payment lookup by attempt id failed:',
        bookingId,
        paymentAttemptId,
        error,
      )
      return null
    }
    if (!data) {
      console.error(
        '[payments] no pending payment row for attempt id:',
        paymentAttemptId,
        'booking:',
        bookingId,
      )
      return null
    }
    return data
  }

  // Legacy fallback: event predates paymentAttemptId (e.g. a checkout
  // session created before this field was added). Only safe to proceed
  // when there is exactly one pending payment to attribute the event to.
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('id, amount, currency')
    .eq('booking_id', bookingId)
    .eq('status', 'pending')

  if (error) {
    console.error('[payments] pending payments lookup failed:', bookingId, error)
    return null
  }
  if (!data || data.length === 0) {
    console.error('[payments] no pending payment row for booking:', bookingId)
    return null
  }
  if (data.length > 1) {
    console.error(
      '[payments] multiple pending payments for booking and event carries no attempt id; refusing to guess:',
      bookingId,
      data.map((row) => row.id),
    )
    return null
  }
  return data[0]
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

  console.log('[payments] metadata found, booking_token:', event.bookingToken)

  const supabaseAdmin = getSupabaseAdmin()

  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select('id, token, booking_id, customer_name, customer_email, artists!bookings_artist_id_fkey(name)')
    .eq('token', event.bookingToken)
    .maybeSingle()

  if (bookingError || !booking) {
    console.error('[payments] booking not found for token:', event.bookingToken, bookingError)
    return { status: 200, body: { received: true } }
  }
  console.log('[payments] booking lookup success:', booking.id)

  const artistName = (booking.artists as unknown as { name: string } | null)?.name ?? 'Unknown artist'

  const pendingPayment = await findPendingPayment(supabaseAdmin, booking.id, event.paymentAttemptId)

  if (!pendingPayment) {
    return { status: 200, body: { received: true } }
  }
  console.log('[payments] payment lookup success:', pendingPayment.id)

  if (event.type === 'payment.paid') {
    console.log('[payments] updating payment:', pendingPayment.id)
    const { error: updatePaymentError, data: updatedPayments } = await supabaseAdmin
      .from('payments')
      .update({ status: 'paid', method: event.paymentMethod, paid_at: new Date().toISOString() })
      .eq('id', pendingPayment.id)
      .select('id')

    // Stage 6C: the booking must never be confirmed unless the payment row
    // was actually, verifiably marked `paid` first — checked and returned
    // on immediately below, before the booking UPDATE is even reached, so
    // that UPDATE is physically unreachable after either failure mode.
    if (updatePaymentError) {
      console.error('[payments] failed to update payment:', updatePaymentError)
      return { status: 500, body: { error: 'Failed to record payment.' } }
    }
    if (!updatedPayments?.length) {
      console.error(
        '[payments] payment update affected zero rows — paymentId:',
        pendingPayment.id,
        'bookingId:',
        booking.id,
      )
      return { status: 500, body: { error: 'Failed to record payment.' } }
    }

    // Only a booking still `awaiting_down_payment` AND not archived may be
    // confirmed by a paid webhook — this is a conditional update (not a
    // plain `.eq('id', ...)`), so a booking that has since moved to
    // `cancelled`/`completed`, or been archived by staff (Stage 6A — an
    // archived booking must never be resurrected into
    // `appointment_confirmed`, regardless of when in the checkout/webhook
    // sequence the archive happened), is left untouched here: a
    // late/replayed webhook can never confirm it. This single atomic UPDATE
    // is the actual race guard — Postgres evaluates the WHERE clause
    // against the row's current committed state at execution time, so it's
    // correct regardless of whether the archive happened before this
    // checkout was created, after it, or concurrently with this exact
    // webhook. The payment row is now already confirmed `paid` above
    // (Stage 6C) — only the booking-side transition and its emails are
    // guarded from here on.
    console.log('[payments] updating booking:', booking.id)
    const { error: updateBookingError, data: updatedBookings } = await supabaseAdmin
      .from('bookings')
      .update({ status: 'appointment_confirmed' })
      .eq('id', booking.id)
      .eq('status', 'awaiting_down_payment')
      .is('archived_at', null)
      .select('id')

    if (updateBookingError) {
      console.error('[payments] failed to update booking:', updateBookingError)
      return { status: 500, body: { error: 'Failed to record payment.' } }
    }

    if (!updatedBookings?.length) {
      // Not an error: the booking was not `awaiting_down_payment` (e.g. it
      // was cancelled after this payment attempt started), so the guard
      // correctly refused to confirm it. Skip the confirmation emails —
      // they must only fire when this reconciliation actually moved the
      // booking into `appointment_confirmed`.
      console.log(
        '[payments] booking not in awaiting_down_payment status; skipping confirmation and emails:',
        booking.id,
      )
      return { status: 200, body: { received: true } }
    }

    console.log('[payments] sending email to:', booking.customer_email)
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
    console.log('[payments] finished, booking confirmed:', booking.id)
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
