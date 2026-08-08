import { NextResponse } from 'next/server'
import { PayMongoProvider } from '@/services/providers/paymongo'
import { reconcilePaymentEvent } from '@/lib/payments/reconcile'

/**
 * PayMongo webhook — the source of truth for whether a booking's down
 * payment actually succeeded (the customer landing back on /booking/[token]
 * after checkout is not proof of payment on its own).
 *
 * This route is intentionally tied to the `PayMongoProvider` directly
 * rather than `getActivePaymentProvider()` — the URL path itself
 * (`/api/paymongo/webhook`) is PayMongo-specific, so it must keep verifying
 * and parsing PayMongo payloads regardless of which provider `PAYMENT_PROVIDER`
 * currently selects for new checkouts. Reconciliation (DB updates, emails)
 * is provider-agnostic — see `lib/payments/reconcile.ts`.
 */
const paymongoProvider = new PayMongoProvider()

export async function POST(request: Request): Promise<NextResponse> {
  const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[paymongo webhook] PAYMONGO_WEBHOOK_SECRET is not set.')
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signatureHeader = request.headers.get('Paymongo-Signature')

  if (
    !signatureHeader ||
    !paymongoProvider.verifyWebhookSignature(rawBody, signatureHeader, webhookSecret)
  ) {
    console.error('[paymongo webhook] signature verification failed.')
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let event
  try {
    event = paymongoProvider.parseWebhookEvent(rawBody)
  } catch (parseError) {
    console.error('[paymongo webhook] failed to parse request body as JSON:', parseError)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const result = await reconcilePaymentEvent(event)
  return NextResponse.json(result.body, { status: result.status })
}
