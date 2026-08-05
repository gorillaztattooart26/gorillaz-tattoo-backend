import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { Hero } from '@/components/aftercare/Hero'
import { CareSteps } from '@/components/aftercare/CareSteps'
import { BalmFeature } from '@/components/aftercare/BalmFeature'
import { HealingFAQ } from '@/components/aftercare/HealingFAQ'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Tattoo Aftercare',
  description:
    'Step-by-step tattoo aftercare instructions from gorillaz tattoo art — how to clean, moisturize, and heal your new tattoo, plus our in-studio healing salve.',
  path: ROUTES.aftercare,
})

export default function AftercarePage() {
  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <div className="sr-only">
        <Breadcrumbs
          entries={[
            { name: 'Home', path: ROUTES.home },
            { name: 'Aftercare', path: ROUTES.aftercare },
          ]}
        />
      </div>

      <Hero />
      <CareSteps />
      <BalmFeature />
      <HealingFAQ />
    </div>
  )
}
