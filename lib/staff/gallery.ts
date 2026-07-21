import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type StaffGalleryItem = Database['public']['Tables']['gallery_items']['Row']

/** Session-aware read for the staff Gallery tab — includes `id`, which the public-facing GalleryItem type doesn't carry, needed here for edit/delete. */
export async function getStaffGalleryItems(): Promise<StaffGalleryItem[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('gallery_items').select('*').order('display_order')

  if (error) {
    console.error('[staff/gallery] getStaffGalleryItems failed:', error)
    return []
  }
  return data
}
