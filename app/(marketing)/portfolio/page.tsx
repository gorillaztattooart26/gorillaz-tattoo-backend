import { Suspense } from 'react'
import type { Metadata } from 'next'
import { PortfolioGallery } from '@/components/portfolio/PortfolioGallery'
import { getGalleryItems } from '@/lib/gallery'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'
import { ROUTES } from '@/lib/routes'

export const metadata: Metadata = buildMetadata({
  title: 'Portfolio',
  description: siteConfig.description,
  path: ROUTES.portfolio,
})

export default async function PortfolioPage() {
  const items = await getGalleryItems()

  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <Suspense>
        <PortfolioGallery items={items} />
      </Suspense>
    </div>
  )
}
