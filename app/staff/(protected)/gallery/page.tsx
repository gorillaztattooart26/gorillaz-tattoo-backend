import type { Metadata } from 'next'
import { Image as ImageIcon } from 'lucide-react'
import { StaffPageHeader } from '@/components/staff/StaffPageHeader'
import { GalleryManager } from '@/components/staff/GalleryManager'
import { HeroVideoManager } from '@/components/staff/HeroVideoManager'
import { AboutImageManager } from '@/components/staff/AboutImageManager'
import { PortfolioImagesManager } from '@/components/staff/PortfolioImagesManager'
import { SlideshowManager } from '@/components/staff/SlideshowManager'
import { GalleryOrderManager } from '@/components/staff/GalleryOrderManager'
import { PlaceholderSection } from '@/components/staff/PlaceholderSection'
import { getStaffGalleryItems, getAllGalleryItemsForOwner } from '@/lib/staff/gallery'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import {
  getExistingSiteImages,
  getStaffHomepageAbout,
  getStaffHomepageHero,
  getStaffPortfolioSlots,
  getStaffSlideshowImages,
} from '@/lib/staff/homepage-media'

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
  const [hero, about, portfolioSlots, existingImages, slideshowImages] = await Promise.all([
    getStaffHomepageHero(),
    getStaffHomepageAbout(),
    getStaffPortfolioSlots(),
    getExistingSiteImages(),
    getStaffSlideshowImages(),
  ])

  if (!artist) {
    return (
      <div>
        <StaffPageHeader title="Portfolio" description="Homepage media is managed by the studio owner" />
        <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
          <HomepageMediaOwnerNotice />
          <PlaceholderSection
            title="Your gallery"
            description="Your account isn't linked to an artist yet — ask the studio owner to link it before you can manage your own gallery pieces."
            icon={ImageIcon}
          />
        </div>
      </div>
    )
  }

  const [items, allItemsForOrdering] = await Promise.all([
    getStaffGalleryItems(artist.name),
    artist.is_owner ? getAllGalleryItemsForOwner() : Promise.resolve([]),
  ])

  return (
    <div>
      <StaffPageHeader
        title="Portfolio"
        description={`${artist.name}'s gallery — ${items.length} pieces live on the public site`}
      />
      <div className="flex flex-col gap-8 px-4 py-6 md:px-8">
        {artist.is_owner ? (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <HeroVideoManager hero={hero} />
              <AboutImageManager about={about} />
            </div>
            <PortfolioImagesManager slots={portfolioSlots} existingImages={existingImages} />
            <SlideshowManager slides={slideshowImages} />
            <GalleryOrderManager items={allItemsForOrdering} />
          </>
        ) : (
          <HomepageMediaOwnerNotice />
        )}
        <GalleryManager items={items} />
      </div>
    </div>
  )
}

/**
 * Hero video, About photo, and Studio Portfolio slideshow are shared,
 * site-wide homepage content — only the studio owner can change them
 * (enforced server-side in homepage-actions.ts; this is just the matching
 * UI so non-owner artists aren't shown controls that would just error).
 */
function HomepageMediaOwnerNotice() {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 px-6 py-10 text-center md:rounded-2xl">
      <p className="text-sm font-medium text-[var(--foreground)]">Homepage media is owner-managed</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--foreground)]/50">
        The hero video, homepage about photo, and studio portfolio slideshow are shared across the whole site —
        only the studio owner can change them.
      </p>
    </div>
  )
}
