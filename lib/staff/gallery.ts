import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type StaffGalleryItem = Database['public']['Tables']['gallery_items']['Row']

/**
 * Session-aware read for the staff Gallery tab, scoped to the currently
 * logged-in artist's own pieces only — each artist has a separate
 * account, and shouldn't see or manage another artist's uploads.
 * Includes `id`, which the public-facing GalleryItem type doesn't carry,
 * needed here for delete.
 */
export async function getStaffGalleryItems(artistName: string): Promise<StaffGalleryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('artist_name', artistName)
    .order('display_order')

  if (error) {
    console.error('[staff/gallery] getStaffGalleryItems failed:', error)
    return []
  }
  return data
}

/**
 * Every gallery item across every artist, in the current canonical global
 * order — powers the Owner-only drag-and-drop reorder manager (Task 7).
 * Deliberately not scoped by artist_name, unlike getStaffGalleryItems():
 * the whole point is to see every artist's pieces interleaved in one list
 * so the Owner can rearrange the single global `display_order` sequence.
 *
 * Not gated on `is_owner` here — the underlying `gallery_items` SELECT RLS
 * policy is already `USING (true)` for `anon, authenticated` (this data is
 * fully public on /portfolio already, so there's nothing more sensitive
 * exposed by an unfiltered read here than the public site already shows).
 * The actual authorization boundary for *this feature* is enforced where
 * it matters: the page only renders the reorder UI inside the
 * `artist.is_owner` branch, and reorderGalleryItemsAction independently
 * re-checks requireOwner() before writing anything — same split already
 * used throughout this file and its Server Actions.
 */
export async function getAllGalleryItemsForOwner(): Promise<StaffGalleryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('gallery_items').select('*').order('display_order')

  if (error) {
    console.error('[staff/gallery] getAllGalleryItemsForOwner failed:', error)
    return []
  }
  return data
}
