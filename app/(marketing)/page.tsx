import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { PortfolioGallery } from '@/components/sections/PortfolioGallery'
import { ArtistsPreview } from '@/components/sections/ArtistsPreview'
import { About } from '@/components/sections/About'
import { Process } from '@/components/sections/Process'
import { Inquire } from '@/components/sections/Inquire'
import { Divider } from '@/components/sections/Divider'
import { FAQ } from '@/components/sections/FAQ'
import { BookingCta } from '@/components/sections/BookingCta'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { ROUTES } from '@/lib/routes'
import { getArtists } from '@/lib/artists'
import { getHomepageHeroVideoUrl, getHomepagePortfolioTiles } from '@/lib/homepage-media'

export const metadata: Metadata = buildMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: ROUTES.home,
})

export default async function HomePage() {
  const [artists, heroVideoUrl, portfolioTiles] = await Promise.all([
    getArtists(),
    getHomepageHeroVideoUrl(),
    getHomepagePortfolioTiles(),
  ])

  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <Hero videoUrl={heroVideoUrl} />
      <PortfolioGallery tiles={portfolioTiles} />
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
