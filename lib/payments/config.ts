import type { PaymentProviderName } from '@/types/payment'

/**
 * The single switch controlling which payment provider is active.
 * Defaults to `paymongo` — unset or unrecognized values never fall through
 * to Xendit, so the app keeps working with no env changes required.
 */
export function getActivePaymentProviderName(): PaymentProviderName {
  const raw = process.env.PAYMENT_PROVIDER?.trim().toLowerCase()
  return raw === 'xendit' ? 'xendit' : 'paymongo'
}
