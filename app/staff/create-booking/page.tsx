import type { Metadata } from 'next'
import { CreateBookingForm } from '@/components/staff/CreateBookingForm'
import { getArtists } from '@/lib/artists'

export const metadata: Metadata = {
  title: 'Create Booking | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function CreateBookingPage() {
  const artists = await getArtists()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:py-24">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 md:text-sm">
          internal tool
        </p>
        <h1 className="hero-title mt-4 text-[10vw] font-medium text-white md:text-[3.5vw]">
          Create a Booking
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60">
          Fill this out after a consultation is approved. Submitting
          generates the customer&apos;s private booking link automatically.
        </p>
      </div>

      <CreateBookingForm artists={artists} />
    </div>
  )
}
