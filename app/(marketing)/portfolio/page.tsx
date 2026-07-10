import type { Metadata } from 'next'
import { ComingSoonSection } from '@/components/common/ComingSoonSection'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Portfolio',
  description:
    'The complete gorillaz tattoo art gallery — blackwork, fine line, script, realism, and more. Coming soon.',
  path: ROUTES.portfolio,
})

export default function PortfolioPage() {
  return (
    <ComingSoonSection
      eyebrow="tattoo portfolio"
      title="the full gallery is coming soon"
      description="We're building a complete, filterable gallery of past work. See a curated preview on the homepage in the meantime."
      breadcrumbs={[
        { name: 'Home', path: ROUTES.home },
        { name: 'Portfolio', path: ROUTES.portfolio },
      ]}
    />
  )
}
