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
    <div className="relative bg-black">
      {/* Ambient glow behind the page — sits in the black space between
          sections, since the sections above it stay transparent (Marquee excepted). */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-[105vh] h-[40rem] w-[40rem] rounded-full bg-[#fabb42] opacity-[0.08] blur-[130px]" />
        <div className="absolute -right-32 top-[230vh] h-[36rem] w-[36rem] rounded-full bg-[#fabb42] opacity-[0.07] blur-[130px]" />
        <div className="absolute -left-20 top-[340vh] h-[38rem] w-[38rem] rounded-full bg-[#fabb42] opacity-[0.08] blur-[130px]" />
      </div>

      <Hero />
      <Marquee />
      <PortfolioPreview />
      <ArtistsPreview />
      <Studio />
      <Booking />
      <FAQ />
    </div>
  )
}
