import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { bookingTokenExists, getBookingByToken } from '@/lib/booking'
import { BOOKING_SESSION_COOKIE_NAME, isBookingSessionValid } from '@/lib/booking-session'
import { VerifyGate } from '@/components/booking/VerifyGate'
import { BookingHeader } from '@/components/booking/BookingHeader'
import { CustomerCard } from '@/components/booking/CustomerCard'
import { ArtistCard } from '@/components/booking/ArtistCard'
import { TattooDetails } from '@/components/booking/TattooDetails'
import { AppointmentCard } from '@/components/booking/AppointmentCard'
import { InvoiceCard } from '@/components/booking/InvoiceCard'
import { TermsCard } from '@/components/booking/TermsCard'
import { WaiverAndPayment } from '@/components/booking/WaiverAndPayment'
import { Timeline } from '@/components/booking/Timeline'
import { BookingFaq } from '@/components/booking/BookingFaq'
import { EmergencyContact } from '@/components/booking/EmergencyContact'
import { BookingFooter } from '@/components/booking/BookingFooter'

export const metadata: Metadata = {
  // `absolute` bypasses the root layout's title template (`%s — gorillaz
  // tattoo art`) so this renders exactly as specified, with no duplicate
  // site-name suffix.
  title: { absolute: 'Booking Confirmation | Gorillaz Tattoo Art' },
  description: 'Review your tattoo booking and securely reserve your appointment online.',
  // Private, per-customer pages must never be indexed or crawled.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PrivateBookingPage({ params }: PageProps) {
  const { token } = await params

  // Gate first: check only whether a verified session exists for this
  // exact token. No booking data is fetched or rendered until this passes.
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(BOOKING_SESSION_COOKIE_NAME)?.value
  const verified = isBookingSessionValid(token, sessionCookie)

  if (!verified) {
    // Confirm the link itself is real (for the 404 case) without ever
    // handing booking data to a component that could render/serialize it.
    const exists = await bookingTokenExists(token)
    if (!exists) {
      notFound()
    }
    return <VerifyGate token={token} />
  }

  const booking = await getBookingByToken(token)

  if (!booking) {
    notFound()
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:py-24">
      <BookingHeader booking={booking} />
      <CustomerCard customer={booking.customer} />
      <ArtistCard artist={booking.artist} />
      <TattooDetails tattoo={booking.tattoo} />
      <AppointmentCard appointment={booking.appointment} />
      <InvoiceCard invoice={booking.invoice} />
      <TermsCard />
      <WaiverAndPayment booking={booking} />
      <Timeline steps={booking.timeline} />
      <BookingFaq />
      <EmergencyContact />
      <BookingFooter />
    </div>
  )
}
