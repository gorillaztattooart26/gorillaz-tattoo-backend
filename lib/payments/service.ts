import type { PaymentProvider, PaymentProviderName } from '@/types/payment'
import { PayMongoProvider } from '@/services/providers/paymongo'
import { XenditProvider } from '@/services/providers/xendit'
import { getActivePaymentProviderName } from '@/lib/payments/config'

const providers: Record<PaymentProviderName, PaymentProvider> = {
  paymongo: new PayMongoProvider(),
  xendit: new XenditProvider(),
}

/**
 * Returns the `PaymentProvider` selected by `PAYMENT_PROVIDER` (see
 * `lib/payments/config.ts`). Business logic (booking flow, webhook
 * reconciliation) should depend on this — never import a provider adapter
 * directly.
 */
export function getActivePaymentProvider(): PaymentProvider {
  return providers[getActivePaymentProviderName()]
}
