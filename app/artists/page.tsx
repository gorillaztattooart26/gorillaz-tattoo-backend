import type { Metadata } from 'next'
import { ComingSoonSection } from '@/components/common/ComingSoonSection'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Resident Artists',
  description:
    'Meet the full gorillaz tattoo art roster — specialties, portfolios, and booking availability. Coming soon.',
  path: ROUTES.artists,
})

export default function ArtistsPage() {
  return (
    <ComingSoonSection
      eyebrow="the crew"
      title="the full artist roster is coming soon"
      description="A dedicated page for every resident artist — full portfolios, specialties, and availability — is in the works. Preview the crew on the homepage for now."
      breadcrumbs={[
        { name: 'Home', path: ROUTES.home },
        { name: 'Artists', path: ROUTES.artists },
      ]}
    />
  )
}
