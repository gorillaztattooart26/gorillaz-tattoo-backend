'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCheckoutSession } from '@/services/paymongo'
import type { Booking, Invoice } from '@/types/booking-portal'

const PAYMENT_METHODS = ['GCash', 'Maya', 'Visa', 'Mastercard']

interface PaymentCardProps {
  booking: Pick<Booking, 'token' | 'bookingId'>
  invoice: Invoice
  disabled: boolean
}

/**
 * Placeholder for the real payment flow — calls the services/paymongo.ts
 * seam (createCheckoutSession) so the button is fully wired, but that
 * function intentionally throws until the PayMongo integration is built.
 */
function handlePayment(booking: PaymentCardProps['booking'], invoice: Invoice) {
  createCheckoutSession({
    booking,
    amount: invoice.downPaymentAmount,
    currency: invoice.currency,
    description: `Down payment for booking ${booking.bookingId}`,
  }).catch((error) => {
    console.info('[booking] handlePayment() placeholder — PayMongo not connected yet.', error)
  })
}

export function PaymentCard({ booking, invoice, disabled }: PaymentCardProps) {
  return (
    <Card className="border-[#fabb42]/30 bg-[#fabb42]/5 p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Reserve Your Appointment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-0">
        <p className="text-sm leading-relaxed text-white/70">
          Complete your required down payment securely using PayMongo.
        </p>

        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
            >
              {method}
            </span>
          ))}
        </div>

        <Button
          type="button"
          disabled={disabled}
          onClick={() => handlePayment(booking, invoice)}
          className="h-auto w-full rounded-full bg-[#fabb42] py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
        >
          Pay Down Payment
        </Button>

        {disabled && (
          <p className="text-center text-xs text-white/40">
            Please agree to both waiver items above to continue.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
