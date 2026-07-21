import { supabase } from '@/lib/supabase'
import type { GalleryItem } from '@/types/gallery'
import type { Database } from '@/types/supabase'

type GalleryItemRow = Database['public']['Tables']['gallery_items']['Row']

function mapGalleryItem(row: GalleryItemRow): GalleryItem {
  return {
    images: row.images,
    alt: row.alt,
    piece: row.piece,
    category: row.category,
    artistName: row.artist_name,
  }
}

/** Public gallery feed — anon-readable, used by the homepage preview and the full gallery page. */
export async function getGalleryItems(): Promise<GalleryItem[]> {
  const { data, error } = await supabase
    .from('gallery_items')
    .select('*')
    .order('display_order')

  if (error) {
    console.error('[gallery] getGalleryItems failed:', error)
    return []
  }

  return data.map(mapGalleryItem)
}
