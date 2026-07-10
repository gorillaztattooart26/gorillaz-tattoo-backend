import Link from 'next/link'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { ROUTES } from '@/lib/routes'
import type { BreadcrumbEntry } from '@/lib/seo'

interface ComingSoonSectionProps {
  eyebrow: string
  title: string
  description: string
  breadcrumbs: BreadcrumbEntry[]
}

/** Shared "coming soon" layout for stub routes (about/artists/portfolio/booking/contact) ahead of their full builds. */
export function ComingSoonSection({ eyebrow, title, description, breadcrumbs }: ComingSoonSectionProps) {
  return (
    <section className="relative min-h-screen w-full bg-black px-6 md:px-10 pt-32 pb-24 md:pt-40 md:pb-32">
      <Breadcrumbs entries={breadcrumbs} />
      <p className="mt-8 mb-3 text-xs md:text-sm text-white/70">{eyebrow}</p>
      <h1 className="hero-title first-letter:uppercase max-w-3xl text-[12vw] font-medium text-white md:text-[6vw]">
        {title}
      </h1>
      <p className="mt-6 max-w-lg text-[15px] leading-snug text-white/70">{description}</p>
      <Link
        href={ROUTES.home}
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#fabb42] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] hover:shadow-[0_0_24px_rgba(250,187,66,0.7)]"
      >
        back to home
      </Link>
    </section>
  )
}
