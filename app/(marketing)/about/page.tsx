import type { Metadata } from 'next'
import { ComingSoonSection } from '@/components/common/ComingSoonSection'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'About the Studio',
  description:
    'The full story of gorillaz tattoo art — our studio, our approach to custom ink design, and the artists behind it. Coming soon.',
  path: ROUTES.about,
})

export default function AboutPage() {
  return (
    <ComingSoonSection
      eyebrow="about"
      title="the full story is coming soon"
      description="We're building out a dedicated home for the studio's story. In the meantime, get a taste of who we are on the homepage."
      breadcrumbs={[
        { name: 'Home', path: ROUTES.home },
        { name: 'About', path: ROUTES.about },
      ]}
    />
  )
}
