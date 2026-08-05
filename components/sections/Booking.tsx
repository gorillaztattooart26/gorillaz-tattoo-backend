import { BookingForm } from '@/components/booking/BookingForm'

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
      className="relative w-full px-6 md:px-10 py-24 md:py-32"
    >
      <div className="reveal flex items-end gap-4 mb-12 md:mb-16">
        <h2 className="hero-title uppercase text-[var(--gz-paper-050)] font-normal text-[13vw] leading-[0.95] [font-family:var(--font-gz-display)] md:text-[4.2vw]">
          ready to
          <br />
          get tattooed?
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12 items-start">
        <BookingForm />

        <div className="reveal flex flex-col gap-3 rounded-xl border border-[var(--gz-copper-500)] bg-gradient-to-b from-[rgba(196,98,43,0.09)] to-[rgba(196,98,43,0.02)] p-5 md:p-7">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#e0a32b]">
            Heads up
          </span>
          <p className="m-0 text-[15px] leading-relaxed text-[var(--gz-ink-200)]">
            We currently only take inquiries submitted through this form —
            no walk-ins or phone bookings. Send us your idea and we&apos;ll
            reply within 48 hours with availability and a quote.
          </p>
        </div>
      </div>
    </section>
  )
}
