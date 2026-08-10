import crypto from 'node:crypto'
import type {
  CheckoutSession,
  CreateCheckoutSessionParams,
  NormalizedPaymentEvent,
  PaymentProvider,
} from '@/types/payment'

/**
 * PayMongo integration — server-only. `PAYMONGO_SECRET_KEY` must never be
 * sent to the client, so this class is only ever used from Server Actions
 * or route handlers (components/booking/payment-actions.ts,
 * app/api/paymongo/webhook/route.ts), via `getActivePaymentProvider()`.
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'

interface PaymongoWebhookEvent {
  data?: {
    id?: string
    attributes?: {
      type?: string
      data?: {
        attributes?: {
          metadata?: { booking_token?: string; payment_attempt_id?: string }
          source?: { type?: string } | null
        }
      }
    }
  }
}

export class PayMongoProvider implements PaymentProvider {
  readonly name = 'paymongo' as const

  private authHeader(): string {
    const secretKey = process.env.PAYMONGO_SECRET_KEY
    if (!secretKey) {
      throw new Error('Missing PAYMONGO_SECRET_KEY environment variable.')
    }
    return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
  }

  /**
   * Creates a PayMongo Checkout Session and returns the hosted page URL to
   * redirect the customer to. `metadata.booking_token` is what the webhook
   * uses to reconcile an incoming `payment.paid`/`payment.failed` event
   * back to the booking that triggered it.
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                name: params.description,
                amount: Math.round(params.amount * 100),
                currency: params.currency,
                quantity: 1,
              },
            ],
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            description: params.description,
            reference_number: params.bookingId,
            send_email_receipt: false,
            billing: {
              name: params.customer.name,
              email: params.customer.email,
              phone: params.customer.mobile,
            },
            metadata: {
              booking_token: params.bookingToken,
              payment_attempt_id: params.paymentAttemptId,
            },
          },
        },
      }),
    })

    const body = await response.json()

    if (!response.ok) {
      console.error('[paymongo] createCheckoutSession failed:', body)
      throw new Error('Failed to create PayMongo checkout session.')
    }

    return {
      id: body.data.id,
      checkoutUrl: body.data.attributes.checkout_url,
    }
  }

  /**
   * Verifies a `Paymongo-Signature` header against the raw request body.
   * Algorithm confirmed against the official `paymongo-node` SDK's
   * `Webhook.js#constructEvent` (PayMongo's own docs pages for this were
   * incomplete/404ing): the header is 3 comma-separated `key=value` parts —
   * timestamp, test-mode signature, live-mode signature, in that fixed
   * order. The expected signature is `HMAC-SHA256(webhookSecret,
   * "${timestamp}.${rawBody}")`, compared against whichever of the
   * test/live parts is non-empty (live takes precedence, matching the SDK).
   *
   * Uses a timing-safe comparison rather than the SDK's plain `!=` — the
   * algorithm is otherwise identical, this just closes a timing side-channel
   * the reference implementation doesn't bother with.
   */
  verifyWebhookSignature(rawBody: string, signatureHeader: string, webhookSecret: string): boolean {
    const parts = signatureHeader.split(',')
    if (parts.length < 3) {
      return false
    }

    const timestamp = parts[0]?.split('=')[1]
    const testModeSignature = parts[1]?.split('=')[1]
    const liveModeSignature = parts[2]?.split('=')[1]

    if (!timestamp) {
      return false
    }

    const comparisonSignature = liveModeSignature || testModeSignature
    if (!comparisonSignature) {
      return false
    }

    const expectedHex = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest('hex')

    const expected = Buffer.from(expectedHex, 'hex')
    const provided = Buffer.from(comparisonSignature, 'hex')

    if (expected.length !== provided.length) {
      return false
    }

    return crypto.timingSafeEqual(expected, provided)
  }

  /**
   * Reduces PayMongo's webhook payload to the normalized shape reconciliation
   * logic needs. `metadata.booking_token` identifies which booking the event
   * belongs to — PayMongo's webhook event for a Checkout-Session-originated
   * payment carries the underlying Payment resource (a `pay_...` id,
   * distinct from the `cs_...` checkout session id
   * `payments.checkout_session_id` was seeded with), not the checkout
   * session itself, so matching on the session id directly isn't possible.
   *
   * `metadata.payment_attempt_id` identifies which *attempt* on that
   * booking: PayMongo copies a checkout session's metadata onto the
   * resulting Payment resource unchanged, so the id createCheckoutSession
   * embedded (params.paymentAttemptId) round-trips back here exactly,
   * letting reconciliation match the one payment row that generated this
   * event instead of guessing among a booking's pending payments.
   */
  parseWebhookEvent(rawBody: string): NormalizedPaymentEvent {
    const event: PaymongoWebhookEvent = JSON.parse(rawBody)

    const rawEventType = event?.data?.attributes?.type
    const payment = event?.data?.attributes?.data

    const type = rawEventType === 'payment.paid' || rawEventType === 'payment.failed'
      ? rawEventType
      : 'unhandled'

    return {
      type,
      bookingToken: payment?.attributes?.metadata?.booking_token ?? null,
      paymentAttemptId: payment?.attributes?.metadata?.payment_attempt_id ?? null,
      paymentMethod: payment?.attributes?.source?.type ?? null,
      providerEventId: event?.data?.id ?? null,
    }
  }
}
