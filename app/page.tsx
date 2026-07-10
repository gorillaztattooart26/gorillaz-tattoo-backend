import type { Metadata } from 'next'
import { Hero } from '@/components/sections/Hero'
import { Marquee } from '@/components/sections/Marquee'
import { PortfolioPreview } from '@/components/sections/PortfolioPreview'
import { ArtistsPreview } from '@/components/sections/ArtistsPreview'
import { Studio } from '@/components/sections/Studio'
import { Booking } from '@/components/sections/Booking'
import { FAQ } from '@/components/sections/FAQ'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: ROUTES.home,
})

export default function HomePage() {
  return (
    <>
      <Hero />
      <Marquee />
      <PortfolioPreview />
      <ArtistsPreview />
      <Studio />
      <Booking />
      <FAQ />
    </>
  )
}
