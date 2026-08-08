import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { bookingTokenExists, getBookingByToken, getBookingRecordByToken, getLatestPaymentAttempt } from '@/lib/booking'
import { BOOKING_SESSION_COOKIE_NAME, isBookingSessionValid } from '@/lib/booking-session'
import { VerifyGate } from '@/components/booking/VerifyGate'
import { BookingStatus } from '@/components/booking/BookingStatus'
import { RetryPaymentButton } from '@/components/booking/RetryPaymentButton'
import { EmergencyContact } from '@/components/booking/EmergencyContact'
import { BookingFooter } from '@/components/booking/BookingFooter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { siteConfig } from '@/lib/site-config'

export const metadata: Metadata = {
  title: { absolute: 'Payment Failed | Gorillaz Tattoo Art' },
  description: 'Your down payment did not go through. Your booking is still reserved — retry payment or contact the studio.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

const FAILURE_REASONS = [
  'Your card was declined by your bank or card issuer.',
  'Insufficient funds available on the card or account used.',
  'Card details (number, expiry, or CVV) were entered incorrectly.',
  'The payment session timed out or was closed before finishing.',
  'A temporary network issue interrupted the connection to PayMongo.',
]

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PaymentFailedPage({ params }: PageProps) {
  const { token } = await params

  // Same private-link gate as the main booking page — a customer landing
  // here (e.g. from a stale link or a different browser) must still prove
  // who they are before anything about the booking or its payment history
  // is fetched or rendered.
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(BOOKING_SESSION_COOKIE_NAME)?.value
  const verified = isBookingSessionValid(token, sessionCookie)

  if (!verified) {
    const exists = await bookingTokenExists(token)
    if (!exists) {
      notFound()
    }
    return <VerifyGate token={token} />
  }

  const [booking, record] = await Promise.all([getBookingByToken(token), getBookingRecordByToken(token)])

  if (!booking || !record) {
    notFound()
  }

  const latestAttempt = await getLatestPaymentAttempt(record.id)

  const isStillAwaitingPayment = booking.status === 'awaiting_down_payment'
  const alreadySucceeded = booking.status === 'appointment_confirmed' || booking.status === 'completed'
  const isCancelled = booking.status === 'cancelled'

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16 md:py-24">
      <div className="text-center">
        {alreadySucceeded ? (
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" aria-hidden="true" />
        ) : (
          <XCircle className="mx-auto h-12 w-12 text-red-400" aria-hidden="true" />
        )}

        <h1 className="hero-title mt-6 text-[11vw] font-medium text-[var(--foreground)] md:text-[3.5vw]">
          {alreadySucceeded
            ? 'Your Payment Actually Went Through'
            : isCancelled
              ? 'Booking Cancelled'
              : 'Payment Didn’t Go Through'}
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[var(--foreground)]/60 md:text-base">
          {alreadySucceeded
            ? 'Good news — this booking is already confirmed. The payment page you were on may have just been slow to update.'
            : isCancelled
              ? 'This booking has been cancelled by the studio, so there is nothing left to pay. Contact the studio if you believe this is a mistake.'
              : "Your down payment didn't complete, but your booking hasn't gone anywhere — nothing has been charged, and your slot is still on hold while you retry."}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full border border-[var(--foreground)]/15 bg-[var(--foreground)]/5 px-4 py-2 text-xs text-[var(--foreground)]/70 md:text-sm">
            Booking ID <span className="font-semibold text-[var(--foreground)]">{booking.bookingId}</span>
          </span>
          <BookingStatus status={booking.status} />
        </div>
      </div>

      {!alreadySucceeded && !isCancelled && (
        <Card className="p-6">
          <CardHeader className="px-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-[var(--foreground)]">
              <AlertTriangle className="h-5 w-5 text-[var(--primary)]" aria-hidden="true" />
              Why This Might Have Happened
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <ul className="flex flex-col gap-2 text-sm leading-relaxed text-[var(--foreground)]/70">
              {FAILURE_REASONS.map((reason) => (
                <li key={reason} className="flex gap-2">
                  <span aria-hidden="true" className="text-[var(--primary)]">
                    •
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
            {latestAttempt?.method && (
              <p className="mt-4 text-xs text-[var(--foreground)]/40">
                Last attempted with: <span className="capitalize">{latestAttempt.method}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/5 p-6">
        <CardHeader className="px-0 pb-2">
          <CardTitle className="text-lg text-[var(--foreground)]">Your Booking Status</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
            {alreadySucceeded
              ? 'Your down payment has been received and your appointment slot is reserved.'
              : isCancelled
                ? 'This booking is cancelled and no payment is required.'
                : 'Your booking details, appointment request, and reference photos are all still on file — none of that is affected by a payment that didn’t complete. Only the down payment is outstanding.'}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        {isStillAwaitingPayment && <RetryPaymentButton token={token} />}
        {alreadySucceeded ? (
          <Link
            href={`/booking/${token}`}
            className="flex h-auto w-full items-center justify-center rounded-full border border-[var(--foreground)]/20 px-8 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]/40 sm:w-auto"
          >
            View My Booking
          </Link>
        ) : (
          <a
            href={`mailto:${siteConfig.email}`}
            className="flex h-auto w-full items-center justify-center rounded-full border border-[var(--foreground)]/20 px-8 py-3.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--foreground)]/40 sm:w-auto"
          >
            Contact Studio
          </a>
        )}
      </div>

      <EmergencyContact />
      <BookingFooter />
    </div>
  )
}
