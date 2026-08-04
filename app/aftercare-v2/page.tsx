import type { Metadata } from 'next'
import { Hero } from '@/components/aftercare-v2/Hero'
import { CareSteps } from '@/components/aftercare-v2/CareSteps'
import { BalmFeature } from '@/components/aftercare-v2/BalmFeature'
import { HealingFAQ } from '@/components/aftercare-v2/HealingFAQ'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

/**
 * Unlisted draft — not registered in lib/routes.ts's ROUTES (so it's
 * automatically excluded from app/sitemap.ts), plus an explicit noindex
 * here as a second guard, mirroring app/homepage-v2/page.tsx.
 */
export const metadata: Metadata = {
  ...buildMetadata({
    title: `Aftercare v2 draft — ${siteConfig.name}`,
    description: siteConfig.description,
    path: '/aftercare-v2',
  }),
  robots: { index: false, follow: false },
}

export default function AftercareV2Page() {
  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <Hero />
      <CareSteps />
      <BalmFeature />
      <HealingFAQ />
    </div>
  )
}
