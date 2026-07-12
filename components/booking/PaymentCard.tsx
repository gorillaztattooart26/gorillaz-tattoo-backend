'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCheckoutSessionAction } from '@/components/booking/payment-actions'
import type { Booking } from '@/types/booking-portal'

const PAYMENT_METHODS = ['GCash', 'Maya', 'Visa', 'Mastercard']

interface PaymentCardProps {
  booking: Pick<Booking, 'token' | 'bookingId'>
  disabled: boolean
}

export function PaymentCard({ booking, disabled }: PaymentCardProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  async function handlePayment() {
    setPayError(null)
    setIsRedirecting(true)

    const result = await createCheckoutSessionAction(booking.token)

    if (!result.checkoutUrl) {
      setPayError(result.error ?? 'Something went wrong. Please try again.')
      setIsRedirecting(false)
      return
    }

    window.location.href = result.checkoutUrl
  }

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
          disabled={disabled || isRedirecting}
          onClick={handlePayment}
          className="h-auto w-full rounded-full bg-[#fabb42] py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
        >
          {isRedirecting ? 'Redirecting…' : 'Pay Down Payment'}
        </Button>

        {payError && <p className="text-center text-xs text-red-400">{payError}</p>}

        {disabled && !payError && (
          <p className="text-center text-xs text-white/40">
            Please agree to both waiver items above to continue.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
