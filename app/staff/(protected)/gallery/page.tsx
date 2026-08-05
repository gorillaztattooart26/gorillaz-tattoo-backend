import type { Metadata } from 'next'
import { Image as ImageIcon } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { GalleryManager } from '@/components/staff/GalleryManager'
import { HeroVideoManager } from '@/components/staff/HeroVideoManager'
import { PortfolioImagesManager } from '@/components/staff/PortfolioImagesManager'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { getStaffGalleryItems } from '@/lib/staff/gallery'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { getExistingSiteImages, getStaffHomepageHero, getStaffPortfolioSlots } from '@/lib/staff/homepage-media'

export const metadata: Metadata = {
  title: 'Portfolio | Staff',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default async function StaffGalleryPage() {
  const artist = await getCurrentStaffArtist()
  const [hero, portfolioSlots, existingImages] = await Promise.all([
    getStaffHomepageHero(),
    getStaffPortfolioSlots(),
    getExistingSiteImages(),
  ])

  if (!artist) {
    return (
      <div>
        <StaffPageHeader title="Portfolio" description="Homepage media managed here is shared studio-wide" />
        <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
          <HeroVideoManager hero={hero} />
          <PortfolioImagesManager slots={portfolioSlots} existingImages={existingImages} />
          <PlaceholderSection
            title="Your gallery"
            description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can manage your own gallery pieces."
            icon={ImageIcon}
          />
        </div>
      </div>
    )
  }

  const items = await getStaffGalleryItems(artist.name)

  return (
    <div>
      <StaffPageHeader
        title="Portfolio"
        description={`${artist.name}'s gallery — ${items.length} pieces live on the public site`}
      />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
        <HeroVideoManager hero={hero} />
        <PortfolioImagesManager slots={portfolioSlots} existingImages={existingImages} />
        <GalleryManager items={items} />
      </div>
    </div>
  )
}
