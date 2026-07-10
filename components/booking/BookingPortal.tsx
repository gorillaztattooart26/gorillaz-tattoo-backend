'use client'

import { useState } from 'react'
import { VerifyGate } from '@/components/booking/VerifyGate'
import type { Booking } from '@/types/booking-portal'

interface BookingPortalProps {
  booking: Pick<Booking, 'customer'>
  children: React.ReactNode
}

/**
 * Owns only the verified/gated reveal state. `children` is rendered by
 * the server (app/booking/[token]/page.tsx) and passed through here — a
 * Client Component boundary doesn't force its server-rendered children
 * into the client bundle, so the detail sections stay server-rendered
 * even though the gate itself is interactive.
 */
export function BookingPortal({ booking, children }: BookingPortalProps) {
  const [verified, setVerified] = useState(false)

  if (!verified) {
    return <VerifyGate customer={booking.customer} onVerified={() => setVerified(true)} />
  }

  return <>{children}</>
}
