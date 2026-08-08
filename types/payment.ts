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
