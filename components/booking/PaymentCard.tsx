'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createCheckoutSessionAction } from '@/components/booking/payment-actions'
import { RESERVATION_POLICY_SHORT } from '@/lib/policy'
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
    <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-[var(--foreground)]">Reserve Your Appointment</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5 px-0">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
          Complete your required down payment securely using PayMongo.
        </p>

        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => (
            <span
              key={method}
              className="rounded-full border border-[var(--foreground)]/20 px-3 py-1 text-xs text-[var(--foreground)]/70"
            >
              {method}
            </span>
          ))}
        </div>

        <Button
          type="button"
          disabled={disabled || isRedirecting}
          onClick={handlePayment}
          className="h-auto w-full rounded-full bg-[var(--primary)] py-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-[0_0_24px_rgba(196,98,43,0.5)] disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
        >
          {isRedirecting ? 'Redirecting…' : 'Pay Down Payment'}
        </Button>

        {payError && <p className="text-center text-xs text-red-400">{payError}</p>}

        {disabled && !payError && (
          <p className="text-center text-xs text-[var(--foreground)]/40">
            Please agree to both waiver items above to continue.
          </p>
        )}

        <p className="text-center text-xs text-[var(--foreground)]/40">{RESERVATION_POLICY_SHORT}</p>
      </CardContent>
    </Card>
  )
}
