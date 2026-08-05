import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { CtaPill } from '@/components/common/CtaPill'
import { ROUTES } from '@/lib/routes'
import type { BreadcrumbEntry } from '@/lib/seo'

interface ComingSoonSectionProps {
  eyebrow: string
  title: string
  description: string
  breadcrumbs: BreadcrumbEntry[]
}

/** Shared "coming soon" layout for stub routes (about/artists/contact) ahead of their full builds. */
export function ComingSoonSection({ eyebrow, title, description, breadcrumbs }: ComingSoonSectionProps) {
  return (
    <section className="relative min-h-screen w-full px-6 md:px-10 pt-32 pb-24 md:pt-40 md:pb-32">
      <Breadcrumbs entries={breadcrumbs} />
      <p className="mt-8 mb-3 font-mono text-xs uppercase tracking-[0.12em] text-[var(--gz-copper-300)] md:text-sm">
        {eyebrow}
      </p>
      <h1 className="hero-title first-letter:uppercase max-w-3xl text-[12vw] font-normal uppercase text-[var(--gz-paper-050)] [font-family:var(--font-gz-display)] md:text-[6vw]">
        {title}
      </h1>
      <p className="mt-6 max-w-lg text-[15px] leading-relaxed text-[var(--gz-ink-300)]">{description}</p>
      <CtaPill as="link" href={ROUTES.home} className="mt-10">
        Back to home
      </CtaPill>
    </section>
  )
}
