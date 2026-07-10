import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBookingByToken } from '@/lib/mock/bookings'
import { BookingPortal } from '@/components/booking/BookingPortal'
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

  // TODO: replace with a Supabase query — validate the token, check
  // expiry/revocation, and fetch the booking row server-side. Any
  // invalid/expired/unknown token must fall through to notFound() so no
  // information about real bookings leaks via response differences.
  const booking = getBookingByToken(token)

  if (!booking) {
    notFound()
  }

  return (
    <BookingPortal booking={booking}>
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
    </BookingPortal>
  )
}
