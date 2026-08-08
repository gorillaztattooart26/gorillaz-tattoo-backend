import type {
  CheckoutSession,
  CreateCheckoutSessionParams,
  NormalizedPaymentEvent,
  PaymentProvider,
} from '@/types/payment'

/**
 * Xendit integration — foundation only. Xendit is pending business
 * approval; nothing here calls the Xendit API, and none of this is wired
 * into the active payment flow (see `lib/payments/config.ts` —
 * `PAYMENT_PROVIDER` defaults to `paymongo`). Every method throws until the
 * account is approved and the real integration is implemented.
 */
export class XenditProvider implements PaymentProvider {
  readonly name = 'xendit' as const

  async createCheckoutSession(_params: CreateCheckoutSessionParams): Promise<CheckoutSession> {
    throw new Error('XenditProvider.createCheckoutSession is not implemented yet.')
  }

  verifyWebhookSignature(
    _rawBody: string,
    _signatureHeader: string,
    _webhookSecret: string,
  ): boolean {
    throw new Error('XenditProvider.verifyWebhookSignature is not implemented yet.')
  }

  parseWebhookEvent(_rawBody: string): NormalizedPaymentEvent {
    throw new Error('XenditProvider.parseWebhookEvent is not implemented yet.')
  }
}
