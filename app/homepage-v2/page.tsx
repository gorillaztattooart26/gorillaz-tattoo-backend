import type { Metadata } from 'next'
import { Hero } from '@/components/homepage-v2/Hero'
import { PortfolioGallery } from '@/components/homepage-v2/PortfolioGallery'
import { ArtistsPreview } from '@/components/homepage-v2/ArtistsPreview'
import { About } from '@/components/homepage-v2/About'
import { Process } from '@/components/homepage-v2/Process'
import { Inquire } from '@/components/homepage-v2/Inquire'
import { Divider } from '@/components/homepage-v2/Divider'
import { FAQ } from '@/components/homepage-v2/FAQ'
import { BookingCta } from '@/components/homepage-v2/BookingCta'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { getArtists } from '@/lib/artists'

/**
 * Unlisted draft — not registered in lib/routes.ts's ROUTES (so it's
 * automatically excluded from app/sitemap.ts, which maps over
 * Object.values(ROUTES)), plus an explicit noindex here as a second guard
 * since nothing stops it from being linked to directly.
 */
export const metadata: Metadata = {
  ...buildMetadata({
    title: `Homepage v2 draft — ${siteConfig.name}`,
    description: siteConfig.description,
    path: '/homepage-v2',
  }),
  robots: { index: false, follow: false },
}

export default async function HomepageV2Page() {
  const artists = await getArtists()

  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <Hero />
      <PortfolioGallery />
      <ArtistsPreview artists={artists} />
      <About />
      <Process />
      <Inquire />
      <Divider />
      <FAQ />
      <BookingCta />
    </div>
  )
}
