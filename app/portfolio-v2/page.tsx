import type { Metadata } from 'next'
import { PortfolioGallery } from '@/components/portfolio-v2/PortfolioGallery'
import { getGalleryItems } from '@/lib/gallery'
import { buildMetadata } from '@/lib/seo'
import { siteConfig } from '@/lib/site-config'

/**
 * Unlisted draft — not registered in lib/routes.ts's ROUTES (so it's
 * automatically excluded from app/sitemap.ts), plus an explicit noindex
 * here as a second guard, mirroring app/aftercare-v2/page.tsx.
 */
export const metadata: Metadata = {
  ...buildMetadata({
    title: `Portfolio v2 draft — ${siteConfig.name}`,
    description: siteConfig.description,
    path: '/portfolio-v2',
  }),
  robots: { index: false, follow: false },
}

export default async function PortfolioV2Page() {
  const items = await getGalleryItems()

  return (
    <div className="relative bg-[var(--gz-ink-950)]">
      <PortfolioGallery items={items} />
    </div>
  )
}
