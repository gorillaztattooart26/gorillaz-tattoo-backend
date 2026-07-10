import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'
import { ROUTES } from '@/lib/routes'

export default function sitemap(): MetadataRoute.Sitemap {
  const routeEntries = Object.values(ROUTES)

  return routeEntries.map((path) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified: new Date(),
    changeFrequency: path === ROUTES.home ? 'weekly' : 'monthly',
    priority: path === ROUTES.home ? 1 : 0.7,
  }))
}
