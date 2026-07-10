import type { Metadata } from 'next'
import { siteConfig } from '@/lib/site-config'

interface BuildMetadataOptions {
  title: string
  description: string
  path: string
  keywords?: string[]
  ogImage?: string
}

/**
 * Shared metadata builder used by every route (home, stub pages, and any
 * future blog/portfolio detail pages) so title/description/OG/canonical
 * wiring stays consistent without copy-pasting the same object shape.
 */
export function buildMetadata({
  title,
  description,
  path,
  keywords,
  ogImage = '/logo/gorillaz-logo-white.svg',
}: BuildMetadataOptions): Metadata {
  const url = new URL(path, siteConfig.url).toString()

  return {
    title,
    description,
    keywords: keywords ?? [...siteConfig.keywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: ogImage }],
      locale: siteConfig.locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

/**
 * LocalBusiness structured data. Fields we don't have real data for yet
 * (address/phone/hours) are intentionally omitted rather than fabricated —
 * fill them in via siteConfig once the studio confirms them.
 */
export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'TattooParlor',
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    email: siteConfig.email,
    image: new URL('/logo/gorillaz-logo-white.svg', siteConfig.url).toString(),
    areaServed: 'Philippines',
    sameAs: [siteConfig.social.facebook, siteConfig.social.instagram],
    ...(siteConfig.address ? { address: siteConfig.address } : {}),
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    ...(siteConfig.openingHours
      ? { openingHoursSpecification: siteConfig.openingHours }
      : {}),
  }
}

export interface BreadcrumbEntry {
  name: string
  path: string
}

export function buildBreadcrumbJsonLd(entries: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: new URL(entry.path, siteConfig.url).toString(),
    })),
  }
}
