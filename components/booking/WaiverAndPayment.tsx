'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WaiverCard, type WaiverValue } from '@/components/booking/WaiverCard'
import { PaymentCard } from '@/components/booking/PaymentCard'
import { RESERVATION_POLICY_TERMS } from '@/lib/policy'
import type { Booking } from '@/types/booking-portal'

const INITIAL_WAIVER: WaiverValue = { agreedToTerms: false, consentToTattoo: false }

interface WaiverAndPaymentProps {
  booking: Pick<Booking, 'token' | 'bookingId' | 'invoice' | 'status'>
}

/** Owns the waiver checkbox state so PaymentCard's button can be disabled until both are checked. */
export function WaiverAndPayment({ booking }: WaiverAndPaymentProps) {
  const [waiver, setWaiver] = useState<WaiverValue>(INITIAL_WAIVER)
  const canPay = waiver.agreedToTerms && waiver.consentToTattoo

  if (booking.status !== 'awaiting_down_payment') {
    return (
      <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-[var(--foreground)]">
            {booking.status === 'cancelled' ? 'Booking Cancelled' : 'Down Payment Received'}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
            {booking.status === 'cancelled'
              ? `This booking has been cancelled. ${RESERVATION_POLICY_TERMS[0]} Per studio policy, your reservation payment has been forfeited. Contact the studio if you believe this is a mistake.`
              : 'Your down payment has been received and your appointment slot is reserved. See the timeline below for what happens next.'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <WaiverCard value={waiver} onChange={setWaiver} />
      <PaymentCard booking={booking} disabled={!canPay} />
    </div>
  )
}
