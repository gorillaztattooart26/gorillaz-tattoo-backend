import type { Metadata } from 'next'
import { Readex_Pro } from 'next/font/google'
import { siteConfig } from '@/lib/site-config'
import { buildLocalBusinessJsonLd } from '@/lib/seo'
import '@/styles/globals.css'

const readexPro = Readex_Pro({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    type: 'website',
    siteName: siteConfig.name,
    locale: siteConfig.locale,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
  },
  manifest: '/manifest.webmanifest',
}

/**
 * True app root — fonts, global CSS, and site-wide JSON-LD only. Public
 * chrome (Navbar/Footer) lives in app/(marketing)/layout.tsx so the
 * private booking portal (app/booking/[token]) can opt out of it.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildLocalBusinessJsonLd()

  return (
    <html lang="en" className={readexPro.className}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
