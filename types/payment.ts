/**
 * Provider-agnostic payment types. Every payment provider adapter
 * (services/providers/*) implements `PaymentProvider` against these shapes
 * so business logic (booking flow, webhook reconciliation, emails) never
 * has to know which provider is active.
 */

export type PaymentProviderName = 'paymongo' | 'xendit'

export interface CreateCheckoutSessionParams {
  bookingToken: string
  bookingId: string
  /**
   * Server-generated UUID identifying this specific payment attempt —
   * distinct from `bookingToken`, which is shared by every attempt on the
   * same booking (retries, abandoned checkouts, double-clicks). Providers
   * must embed this in the checkout session's metadata so the resulting
   * webhook event can echo it back, letting reconciliation match the exact
   * attempt instead of guessing among a booking's pending payments. Also
   * used as that attempt's `payments.id` primary key (see
   * components/booking/payment-actions.ts).
   */
  paymentAttemptId: string
  /** Whole currency units (e.g. PHP), not the provider's minor unit. */
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

/** The subset of webhook event types business logic actually reacts to. */
export type NormalizedPaymentEventType = 'payment.paid' | 'payment.failed' | 'unhandled'

/**
 * A provider's raw webhook payload, reduced to exactly what the
 * reconciliation logic needs. `bookingToken` is the reconciliation key set
 * on the checkout session at creation time.
 */
export interface NormalizedPaymentEvent {
  type: NormalizedPaymentEventType
  bookingToken: string | null
  /** Echoes `CreateCheckoutSessionParams.paymentAttemptId` back from the provider's metadata — null only for attempts started before this field existed. See lib/payments/reconcile.ts for how reconciliation uses it. */
  paymentAttemptId: string | null
  paymentMethod: string | null
  providerEventId?: string | null
}

export interface PaymentProvider {
  readonly name: PaymentProviderName

  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSession>

  verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string,
    webhookSecret: string,
  ): boolean

  /** Throws if `rawBody` isn't valid JSON for this provider's event shape. */
  parseWebhookEvent(rawBody: string): NormalizedPaymentEvent
}
