import { createClient } from '@/lib/supabase/server'
import { PORTFOLIO_SLOT_DEFAULTS } from '@/lib/homepage-media'
import type { Database } from '@/types/supabase'

export type HomepageHeroRow = Database['public']['Tables']['homepage_hero']['Row']
export type HomepagePortfolioImageRow = Database['public']['Tables']['homepage_portfolio_images']['Row']

export interface StaffPortfolioSlot {
  slot: number
  ratio: number
  grayscale?: boolean
  imageUrl: string
  alt: string
  isCustom: boolean
}

export interface ExistingSiteImage {
  url: string
  alt: string
  label: string
}

/** Session-aware read for the staff dashboard's "Homepage Hero Video" card. */
export async function getStaffHomepageHero(): Promise<HomepageHeroRow | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('homepage_hero').select('*').eq('id', 'hero').maybeSingle()

  if (error) {
    console.warn('[staff/homepage-media] getStaffHomepageHero failed:', error)
    return null
  }
  return data
}

/** Session-aware read for the staff dashboard's "Homepage Studio Portfolio" section — all 8 slots, populated or not. */
export async function getStaffPortfolioSlots(): Promise<StaffPortfolioSlot[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('homepage_portfolio_images').select('*')

  if (error) {
    console.warn('[staff/homepage-media] getStaffPortfolioSlots failed:', error)
  }

  const bySlot = new Map((data ?? []).map((row) => [row.slot, row]))

  return PORTFOLIO_SLOT_DEFAULTS.map((defaults) => {
    const row = bySlot.get(defaults.slot)
    return {
      slot: defaults.slot,
      ratio: defaults.ratio,
      grayscale: defaults.grayscale,
      imageUrl: row?.image_url ?? defaults.defaultImageUrl,
      alt: row?.alt ?? defaults.defaultAlt,
      isCustom: Boolean(row),
    }
  })
}

/**
 * Every photo already live on the site (every artist's gallery pieces) —
 * powers the "choose existing" picker for the Studio Portfolio slots, so
 * staff can reuse a photo instead of uploading a duplicate. Storage isn't
 * touched — assigning one of these just points a slot at the same URL.
 */
export async function getExistingSiteImages(): Promise<ExistingSiteImage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('piece, artist_name, alt, images')
    .order('display_order')

  if (error) {
    console.warn('[staff/homepage-media] getExistingSiteImages failed:', error)
    return []
  }

  return data.flatMap((item) =>
    item.images.map((url) => ({
      url,
      alt: item.alt,
      label: `${item.piece} — ${item.artist_name}`,
    })),
  )
}
