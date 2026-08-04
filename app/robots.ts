import type { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Defense-in-depth for the unlisted v2 drafts — each already sets its
      // own `robots: { index: false, follow: false }` meta tag and is
      // omitted from lib/routes.ts (so sitemap.ts never lists it); this
      // stops a crawler that ignores meta robots from indexing them too.
      disallow: ['/homepage-v2', '/aftercare-v2', '/portfolio-v2'],
    },
    sitemap: new URL('/sitemap.xml', siteConfig.url).toString(),
  }
}
