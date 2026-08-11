'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WaiverCard, type WaiverValue } from '@/components/booking/WaiverCard'
import { PaymentCard } from '@/components/booking/PaymentCard'
import { RESERVATION_POLICY_TERMS } from '@/lib/policy'
import type { Booking } from '@/types/booking-portal'

const INITIAL_WAIVER: WaiverValue = { agreedToTerms: false, consentToTattoo: false }

function formatAcceptedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

interface WaiverAndPaymentProps {
  booking: Pick<Booking, 'token' | 'bookingId' | 'invoice' | 'status' | 'waiver' | 'isArchived'>
}

/** Owns the waiver checkbox state so PaymentCard's button can be disabled until both are checked. */
export function WaiverAndPayment({ booking }: WaiverAndPaymentProps) {
  const [waiver, setWaiver] = useState<WaiverValue>(INITIAL_WAIVER)
  const canPay = waiver.agreedToTerms && waiver.consentToTattoo

  // Archived takes priority over the awaiting-down-payment payment UI below
  // — an archived booking must never present an active "Pay" action, even
  // though its status is still `awaiting_down_payment`. Deliberately a
  // neutral message with no mention of "archived" (an internal staff
  // concept) and no other booking detail. Every other status branch below
  // is unchanged.
  if (booking.status === 'awaiting_down_payment' && booking.isArchived) {
    return (
      <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-[var(--foreground)]">Payment Unavailable</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
            This booking is no longer available for payment. Contact the studio if you believe this is a mistake.
          </p>
        </CardContent>
      </Card>
    )
  }

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

          {booking.waiver.accepted && (
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t border-[var(--foreground)]/10 pt-4 text-xs text-[var(--foreground)]/50">
              <dt>Accepted Waiver</dt>
              <dd className="text-right">Yes</dd>
              {booking.waiver.version && (
                <>
                  <dt>Version</dt>
                  <dd className="text-right">{booking.waiver.version}</dd>
                </>
              )}
              {booking.waiver.acceptedAt && (
                <>
                  <dt>Acceptance Date</dt>
                  <dd className="text-right">{formatAcceptedAt(booking.waiver.acceptedAt)}</dd>
                </>
              )}
            </dl>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <WaiverCard value={waiver} onChange={setWaiver} />
      <PaymentCard booking={booking} waiver={waiver} disabled={!canPay} />
    </div>
  )
}
