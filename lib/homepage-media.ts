import { supabase } from '@/lib/supabase'

/** Static fallbacks — the original Homepage V2 assets, used until staff upload replacements through the dashboard. */
const DEFAULT_HERO_VIDEO_URL = '/videos/homepage-v2/hero-video.mp4'

export interface PortfolioSlotDefaults {
  slot: number
  ratio: number
  grayscale?: boolean
  defaultImageUrl: string
  defaultAlt: string
}

/**
 * Fixed visual roles for the homepage "Studio Portfolio" scroll-jack
 * section — row 1 (0-2), row 2 (3-5), the anchor tile (6), and the
 * full-bleed reveal tile (7). Ratio/grayscale are part of the approved
 * layout and stay in code; only the photo + alt text are admin-managed.
 */
export const PORTFOLIO_SLOT_DEFAULTS: PortfolioSlotDefaults[] = [
  {
    slot: 0,
    ratio: 0.78,
    defaultImageUrl: '/images/portfolio/portfolio-79.jpg',
    defaultAlt: 'Japanese dragon leg sleeve tattoo — Gorillaz Tattoo Art',
  },
  {
    slot: 1,
    ratio: 1.62,
    grayscale: true,
    defaultImageUrl: '/images/portfolio/portfolio-19.jpg',
    defaultAlt: 'Black and grey back piece tattoo of three faces — Gorillaz Tattoo Art',
  },
  {
    slot: 2,
    ratio: 0.66,
    defaultImageUrl: '/images/portfolio/portfolio-100.jpg',
    defaultAlt: 'Fine line phoenix tattoo — Gorillaz Tattoo Art',
  },
  {
    slot: 3,
    ratio: 1.44,
    grayscale: true,
    defaultImageUrl: '/images/portfolio/portfolio-105.jpg',
    defaultAlt: 'Neo-traditional tiger and snake forearm tattoo — Gorillaz Tattoo Art',
  },
  {
    slot: 4,
    ratio: 1.3,
    defaultImageUrl: '/images/portfolio/portfolio-75.jpg',
    defaultAlt: 'Realism portrait tattoo of a bearded king with a trident — Gorillaz Tattoo Art',
  },
  {
    slot: 5,
    ratio: 0.74,
    grayscale: true,
    defaultImageUrl: '/images/portfolio/portfolio-14.jpg',
    defaultAlt: 'Custom hand tattoo — Gorillaz Tattoo Art',
  },
  {
    slot: 6,
    ratio: 1.34,
    defaultImageUrl: '/images/portfolio/portfolio-140.jpg',
    defaultAlt: 'Black and grey dragon and mandala eye full sleeve tattoo — Gorillaz Tattoo Art',
  },
  {
    slot: 7,
    ratio: 1.68,
    defaultImageUrl: '/images/homepage-v2/hanya-mask-forearm.png',
    defaultAlt: 'Hannya mask black and grey forearm and hand tattoo — Gorillaz Tattoo Art',
  },
]

export interface PortfolioTile {
  slot: number
  ratio: number
  grayscale?: boolean
  src: string
  alt: string
}

/** Public read for the homepage hero video — anon-readable, falls back to the static file if nothing's been uploaded yet. */
export async function getHomepageHeroVideoUrl(): Promise<string> {
  const { data, error } = await supabase.from('homepage_hero').select('video_url').eq('id', 'hero').maybeSingle()

  if (error) {
    console.warn('[homepage-media] getHomepageHeroVideoUrl failed:', error)
    return DEFAULT_HERO_VIDEO_URL
  }

  return data?.video_url ?? DEFAULT_HERO_VIDEO_URL
}

/** Public read for the homepage "Studio Portfolio" tiles — anon-readable, missing/unreplaced slots fall back to the original static photos. */
export async function getHomepagePortfolioTiles(): Promise<PortfolioTile[]> {
  const { data, error } = await supabase.from('homepage_portfolio_images').select('slot, image_url, alt')

  if (error) {
    console.warn('[homepage-media] getHomepagePortfolioTiles failed:', error)
  }

  const bySlot = new Map((data ?? []).map((row) => [row.slot, row]))

  return PORTFOLIO_SLOT_DEFAULTS.map((defaults) => {
    const row = bySlot.get(defaults.slot)
    return {
      slot: defaults.slot,
      ratio: defaults.ratio,
      grayscale: defaults.grayscale,
      src: row?.image_url ?? defaults.defaultImageUrl,
      alt: row?.alt ?? defaults.defaultAlt,
    }
  })
}
