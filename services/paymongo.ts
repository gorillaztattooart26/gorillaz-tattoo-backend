import crypto from 'node:crypto'

/**
 * PayMongo integration — server-only. `PAYMONGO_SECRET_KEY` must never be
 * sent to the client, so every export here is only ever called from Server
 * Actions or route handlers (components/booking/payment-actions.ts,
 * app/api/paymongo/webhook/route.ts).
 */

const PAYMONGO_API_BASE = 'https://api.paymongo.com/v1'

function paymongoAuthHeader(): string {
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing PAYMONGO_SECRET_KEY environment variable.')
  }
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`
}

export interface CreateCheckoutSessionParams {
  bookingToken: string
  bookingId: string
  /** Whole currency units (e.g. PHP), not centavos — converted internally. */
  amount: number
  currency: string
  description: string
  customer: { name: string; email: string; mobile: string }
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSession {
  id: string
  checkoutUrl: string
}

/**
 * Creates a PayMongo Checkout Session and returns the hosted page URL to
 * redirect the customer to. `metadata.booking_token` is what the webhook
 * uses to reconcile an incoming `payment.paid`/`payment.failed` event back
 * to the booking that triggered it.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSession> {
  const response = await fetch(`${PAYMONGO_API_BASE}/checkout_sessions`, {
    method: 'POST',
    headers: {
      Authorization: paymongoAuthHeader(),
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
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  webhookSecret: string,
): boolean {
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
