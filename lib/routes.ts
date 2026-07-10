/**
 * Central route registry. Adding a page here automatically extends the
 * sitemap and gives Navbar/Footer/Breadcrumbs a single source of truth.
 */
export const ROUTES = {
  home: '/',
  about: '/about',
  artists: '/artists',
  portfolio: '/portfolio',
  booking: '/booking',
  contact: '/contact',
} as const

export type RouteKey = keyof typeof ROUTES

/** In-page anchor sections on the homepage (single scrolling page). */
export const HOME_SECTIONS = {
  hero: '#hero',
  portfolio: '#portfolio',
  artists: '#artists',
  studio: '#studio',
  booking: '#booking',
  faq: '#faq',
} as const
