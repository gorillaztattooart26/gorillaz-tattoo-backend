import type { NavLink } from '@/types/nav'
import { HOME_SECTIONS, ROUTES } from '@/lib/routes'

export const siteConfig = {
  name: 'gorillaz tattoo art',
  title: 'gorillaz tattoo art — custom ink design & tattoo portfolio',
  description:
    'gorillaz tattoo art — custom ink design studio. fine lines, bold blackwork, and permanent self-expression. book a tattoo session with our award-winning artists.',
  keywords: [
    'tattoo portfolio',
    'custom ink design',
    'gorillaz tattoo art studio',
    'blackwork tattoo',
    'fine line tattoo',
    'custom tattoo design',
  ],
  url: 'https://gorillaztattooart.com',
  email: 'bookings@gorillaztattooart.com',
  locale: 'en_US',
  themeColor: '#fabb42',
  social: {
    facebook: 'https://www.facebook.com/GorillazTattooArt',
    instagram: 'https://www.instagram.com/gorillaztattooart/?hl=en',
  },
  // TODO: no confirmed studio address, phone number, or opening hours exist
  // yet — fill these in for the LocalBusiness JSON-LD once available.
  address: null,
  phone: null,
  openingHours: null,
} as const

/**
 * Homepage section links use `/#section` (not bare `#section`) so they
 * resolve correctly from the shared layout regardless of which route the
 * visitor is currently on — Next.js scrolls to the anchor after navigating
 * home.
 */
export const NAV_LINKS: NavLink[] = [
  { label: 'portfolio', href: `${ROUTES.home}${HOME_SECTIONS.portfolio}` },
  { label: 'artists', href: `${ROUTES.home}${HOME_SECTIONS.artists}` },
  { label: 'studio', href: `${ROUTES.home}${HOME_SECTIONS.studio}` },
  { label: 'aftercare', href: ROUTES.aftercare },
  { label: 'gallery', href: ROUTES.gallery },
]
