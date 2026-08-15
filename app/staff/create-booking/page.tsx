import type { Metadata } from 'next'
import { CreateBookingForm } from '@/components/staff/CreateBookingForm'
import { getArtists } from '@/lib/artists'
import { getInquiryById } from '@/lib/staff/inquiries'
import { buildBookingPrefillFromInquiry } from '@/lib/staff/inquiry-to-booking'

export const metadata: Metadata = {
  title: 'Create Booking | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function CreateBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ fromInquiry?: string }>
}) {
  const { fromInquiry } = await searchParams
  const [artists, inquiry] = await Promise.all([
    getArtists(),
    fromInquiry ? getInquiryById(fromInquiry) : Promise.resolve(null),
  ])

  const prefill = inquiry ? buildBookingPrefillFromInquiry(inquiry, artists) : undefined

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16 md:py-24">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground)]/40 md:text-sm">
          internal tool
        </p>
        <h1 className="hero-title mt-4 text-[10vw] font-medium text-[var(--foreground)] md:text-[3.5vw]">
          Create a Booking
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[var(--foreground)]/60">
          {inquiry
            ? `Prefilled from ${inquiry.full_name}'s inquiry — review the details below, then submit to generate their private booking link.`
            : "Fill this out after a consultation is approved. Submitting generates the customer's private booking link automatically."}
        </p>
      </div>

      <CreateBookingForm artists={artists} prefill={prefill} />
    </div>
  )
}
