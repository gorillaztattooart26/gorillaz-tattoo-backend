import { BookingForm } from '@/components/booking/BookingForm'
import { ArrowIcon } from '@/components/common/icons'

/**
 * Booking/contact section. The heading, layout, and notice panel are
 * static — only the form itself (BookingForm) needs to be a Client
 * Component, so this shell stays server-rendered.
 */
export function Booking() {
  return (
    <section
      id="booking"
      role="region"
      aria-label="Book a tattoo session at Gorillaz Tattoo Art"
      className="relative w-full bg-black px-6 md:px-10 py-24 md:py-32"
    >
      <div className="reveal flex items-end gap-4 mb-12 md:mb-16">
        <h2 className="hero-title uppercase text-white font-medium text-[13vw] md:text-[4.2vw] leading-[0.95]">
          ready to
          <br />
          get tattooed?
        </h2>
        <ArrowIcon className="mb-1 md:mb-2 h-[13vw] w-[13vw] md:h-[4.2vw] md:w-[4.2vw] shrink-0 text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
        <BookingForm />

        <div className="reveal flex flex-col items-start gap-4 rounded-2xl border border-[#fabb42]/30 bg-[#fabb42]/5 p-8">
          <p className="text-[#fabb42] text-sm font-semibold uppercase tracking-wide">heads up</p>
          <p className="text-sm leading-relaxed text-white/60">
            We currently only take inquiries submitted through this form —
            no walk-ins or phone bookings. Send us your idea and we&apos;ll
            reply within 48 hours with availability and a quote.
          </p>
        </div>
      </div>
    </section>
  )
}
