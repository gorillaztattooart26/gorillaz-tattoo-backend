import type { Booking, PaymentStatus } from '@/types/booking-portal'

/**
 * PayMongo integration seam. No API requests are made yet — these are
 * typed stubs describing the future architecture so PaymentCard and the
 * booking portal can be wired up now and swapped to real calls later
 * without changing any calling code.
 */

export interface CreateCheckoutSessionParams {
  booking: Pick<Booking, 'token' | 'bookingId'>
  amount: number
  currency: string
  description: string
}

export interface CheckoutSession {
  id: string
  checkoutUrl: string
  status: 'pending' | 'expired' | 'paid'
}

/**
 * TODO: POST to PayMongo's Checkout Sessions API (via a server action or
 * /api/paymongo/checkout route, never directly from the client — the
 * secret key must stay server-side) and return the resulting checkout URL
 * to redirect the customer to.
 */
export async function createCheckoutSession(
  params: CreateCheckoutSessionParams,
): Promise<CheckoutSession> {
  console.info('[paymongo] createCheckoutSession() called with', params)
  throw new Error('createCheckoutSession() is not implemented yet — PayMongo integration pending.')
}

export interface VerifyPaymentParams {
  checkoutSessionId: string
}

export interface VerifyPaymentResult {
  status: PaymentStatus
  paidAt: string | null
}

/**
 * TODO: query PayMongo for the checkout session / payment intent status
 * (server-side) and reconcile it against the booking record in Supabase.
 */
export async function verifyPayment(
  params: VerifyPaymentParams,
): Promise<VerifyPaymentResult> {
  console.info('[paymongo] verifyPayment() called with', params)
  throw new Error('verifyPayment() is not implemented yet — PayMongo integration pending.')
}

export interface PaymongoWebhookEvent {
  type: string
  data: unknown
}

/**
 * TODO: this is the shape of the future POST /api/paymongo/webhook route
 * handler — verify the PayMongo signature header, then update the
 * booking's payment status in Supabase based on the event type
 * (e.g. `payment.paid`, `payment.failed`).
 */
export async function handleWebhook(event: PaymongoWebhookEvent): Promise<void> {
  console.info('[paymongo] handleWebhook() called with', event)
  throw new Error('handleWebhook() is not implemented yet — PayMongo integration pending.')
}
