/**
 * In-page anchor sections for the /homepage-v2 draft, local to this route
 * only. Deliberately NOT added to lib/routes.ts's HOME_SECTIONS — that
 * registry still drives the real homepage's Navbar/Footer, and this route
 * is an isolated, unlisted preview that shouldn't affect it.
 *
 * Anchors are prefixed with the /homepage-v2 path (not bare `#hero`) so
 * these work correctly from Navbar/Footer/MobileNav — shared with
 * /aftercare-v2 — regardless of which v2 route renders them: a browser
 * treats a same-pathname hash link as an in-page scroll with no reload,
 * so this is a no-op change in behaviour on /homepage-v2 itself, while
 * making the links actually land on the right section when clicked from
 * /aftercare-v2 instead of being a no-op fragment on the wrong page.
 */
export const V2_SECTIONS = {
  hero: '/homepage-v2#hero',
  // Points at the standalone /portfolio-v2 page (not the in-page teaser
  // section on /homepage-v2, which still exists at id="work" but is no
  // longer linked to directly) — every "Portfolio" nav/footer link and the
  // Hero's "View the portfolio" CTA should land on the full gallery now
  // that it exists as its own route.
  work: '/portfolio-v2',
  artists: '/homepage-v2#artists',
  about: '/homepage-v2#about',
  process: '/homepage-v2#process',
  inquire: '/homepage-v2#inquire',
  faq: '/homepage-v2#faq',
  aftercare: '/aftercare-v2',
} as const
