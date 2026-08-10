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
  console.log('[paymongo webhook] received')

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
  console.log('[paymongo webhook] signature verified')

  let event
  try {
    event = paymongoProvider.parseWebhookEvent(rawBody)
  } catch (parseError) {
    console.error('[paymongo webhook] failed to parse request body as JSON:', parseError)
    return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 })
  }
  console.log(
    '[paymongo webhook] parsed event',
    event.type,
    'attempt:',
    event.paymentAttemptId,
    'token:',
    event.bookingToken,
  )

  // Everything past this point (Supabase admin client construction, DB
  // reads/writes, email sends) previously ran with no error boundary here —
  // any exception (e.g. a missing/misconfigured env var throwing inside
  // getSupabaseAdmin()) became an unhandled rejection: Next.js returns a
  // bare 500 with no application-level log line, so the failure is
  // invisible in normal logging and looks identical to "nothing happened".
  // Catching it here guarantees the failure is always logged with a stack
  // trace and the request still gets a well-formed JSON response.
  try {
    const result = await reconcilePaymentEvent(event)
    console.log('[paymongo webhook] finished, status:', result.status)
    return NextResponse.json(result.body, { status: result.status })
  } catch (reconcileError) {
    console.error('[paymongo webhook] reconcilePaymentEvent threw:', reconcileError)
    return NextResponse.json({ error: 'Internal error reconciling payment.' }, { status: 500 })
  }
}
