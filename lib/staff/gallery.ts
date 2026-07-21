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
