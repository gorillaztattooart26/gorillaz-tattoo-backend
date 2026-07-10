import type { Metadata } from 'next'
import { GalleryGrid } from '@/components/gallery/GalleryGrid'
import { GALLERY_ITEMS } from '@/components/gallery/data'
import { Breadcrumbs } from '@/components/common/Breadcrumbs'
import { SectionHeading } from '@/components/common/SectionHeading'
import { buildMetadata } from '@/lib/seo'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Gallery',
  description:
    'Browse every tattoo in the gorillaz tattoo art gallery — filter by style and see which artist tattooed each piece.',
  path: ROUTES.gallery,
})

export default function GalleryPage() {
  return (
    <section className="relative min-h-screen w-full bg-black px-6 md:px-10 pt-28 pb-24 md:pt-32 md:pb-32">
      <Breadcrumbs
        entries={[
          { name: 'Home', path: ROUTES.home },
          { name: 'Gallery', path: ROUTES.gallery },
        ]}
      />

      <SectionHeading
        eyebrow="tattoo gallery"
        className="reveal mt-8 mb-10 md:mb-12"
        headingClassName="first-letter:uppercase text-[12vw] md:text-[6vw]"
      >
        every piece, every artist
      </SectionHeading>

      <GalleryGrid items={GALLERY_ITEMS} />
    </section>
  )
}
