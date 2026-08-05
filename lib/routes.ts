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
  aftercare: '/aftercare',
} as const

export type RouteKey = keyof typeof ROUTES

/** In-page anchor sections on the homepage (single scrolling page). */
export const HOME_SECTIONS = {
  hero: '#hero',
  work: '#work',
  artists: '#artists',
  about: '#about',
  process: '#process',
  inquire: '#inquire',
  faq: '#faq',
} as const
