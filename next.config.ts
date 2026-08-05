import type { NextConfig } from 'next'

// Staff-uploaded gallery photos are served from Supabase Storage's public
// URL (existing gallery photos stay as local /public files and don't need
// this — only new uploads through the dashboard do).
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      // The old standalone gallery page was superseded by the richer,
      // filterable /portfolio page (same underlying gallery_items data).
      { source: '/gallery', destination: '/portfolio', permanent: true },
    ]
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
          // Customer inquiry reference photos live in a private bucket,
          // so the staff dashboard displays them via signed URLs instead
          // (see lib/staff/inquiries.ts) — a different Storage path shape
          // than the public one above.
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/sign/**',
          },
        ]
      : [],
  },
}

export default nextConfig
