/**
 * Analytics configuration — reads from env vars only, no IDs hardcoded.
 * Both are optional and independent; leaving both unset (the current
 * state) means <Analytics /> in app/layout.tsx renders nothing and the
 * site's behavior is unchanged.
 *
 * To turn one on:
 * - Google Analytics 4: create a GA4 property at https://analytics.google.com,
 *   copy its Measurement ID (starts with "G-"), and set
 *   NEXT_PUBLIC_GA_MEASUREMENT_ID in Vercel's Environment Variables (and
 *   .env.local for local testing).
 * - Plausible: create a site at https://plausible.io (or your self-hosted
 *   instance) for this domain, then set NEXT_PUBLIC_PLAUSIBLE_DOMAIN to
 *   the exact domain you registered there (e.g. "gorillaztattooart.com").
 *   Set NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL too if self-hosting instead of
 *   Plausible's own cloud (defaults to https://plausible.io/js/script.js).
 *
 * Both can be set at once if you want to compare them; each renders its
 * own independent <Script> tag in components/analytics/Analytics.tsx.
 * NEXT_PUBLIC_-prefixed vars are safe to expose client-side (required —
 * these scripts only run in the browser) and take effect on next deploy,
 * no code changes needed.
 */
export const analyticsConfig = {
  gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null,
  plausibleDomain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || null,
  plausibleScriptUrl: process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL || 'https://plausible.io/js/script.js',
} as const
