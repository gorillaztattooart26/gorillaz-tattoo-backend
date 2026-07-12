import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Thank You',
    description: 'Your tattoo inquiry has been received.',
    path: '/thank-you',
  }),
  // A confirmation page has nothing worth surfacing in search results,
  // and shouldn't be indexed as a landing page on its own.
  robots: { index: false, follow: false },
}

export default function ThankYouPage() {
  return (
    <section className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-black px-6 pt-24 text-center md:pt-32">
      <p className="text-xs uppercase tracking-widest text-white/50 md:text-sm">
        inquiry received
      </p>
      <h1 className="hero-title text-[13vw] font-medium text-white md:text-[5.5vw]">
        thank you
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-white/60">
        We&apos;ve got your tattoo idea and reference images. We read every
        request and reply within 48 hours with artist availability and a
        quote.
      </p>
      <Link
        href={ROUTES.home}
        className="mt-2 rounded-full bg-[#fabb42] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
      >
        back to home
      </Link>
    </section>
  )
}
