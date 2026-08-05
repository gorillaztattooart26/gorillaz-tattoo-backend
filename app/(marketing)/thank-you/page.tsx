import type { Metadata } from 'next'
import { CtaPill } from '@/components/common/CtaPill'
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
    <section className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-6 pt-24 text-center md:pt-32">
      <p className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)] md:text-sm">
        Inquiry received
      </p>
      <h1 className="hero-title text-[13vw] font-normal uppercase text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)] md:text-[5.5vw]">
        Thank you
      </h1>
      <p className="max-w-md text-sm leading-relaxed text-[var(--gz-ink-300)]">
        We&apos;ve got your tattoo idea and reference images. We read every
        request and reply within 48 hours with artist availability and a
        quote.
      </p>
      <CtaPill as="link" href={ROUTES.home} className="mt-2">
        Back to home
      </CtaPill>
    </section>
  )
}
