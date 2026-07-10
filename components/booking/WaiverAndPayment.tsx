'use client'

import { useState } from 'react'
import { WaiverCard, type WaiverValue } from '@/components/booking/WaiverCard'
import { PaymentCard } from '@/components/booking/PaymentCard'
import type { Booking } from '@/types/booking-portal'

const INITIAL_WAIVER: WaiverValue = { agreedToTerms: false, consentToTattoo: false }

interface WaiverAndPaymentProps {
  booking: Pick<Booking, 'token' | 'bookingId' | 'invoice'>
}

/** Owns the waiver checkbox state so PaymentCard's button can be disabled until both are checked. */
export function WaiverAndPayment({ booking }: WaiverAndPaymentProps) {
  const [waiver, setWaiver] = useState<WaiverValue>(INITIAL_WAIVER)
  const canPay = waiver.agreedToTerms && waiver.consentToTattoo

  return (
    <div className="flex flex-col gap-6">
      <WaiverCard value={waiver} onChange={setWaiver} />
      <PaymentCard booking={booking} invoice={booking.invoice} disabled={!canPay} />
    </div>
  )
}
