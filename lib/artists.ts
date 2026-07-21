import { supabase } from '@/lib/supabase'
import type { ArtistRow } from '@/types/supabase'
import type { Artist } from '@/types/artist'

function mapArtist(row: ArtistRow): Artist {
  return {
    slug: row.slug,
    src: row.image_path,
    name: row.name,
    specialty: row.specialty,
    years: row.years,
    bio: row.bio,
    instagram: row.instagram_url ?? '',
    facebook: row.facebook_url ?? '',
    alt: `${row.name} — ${row.specialty} tattoo artist at gorillaz tattoo art studio philippines`,
  }
}

export async function getArtists(): Promise<Artist[]> {
  const { data, error } = await supabase.from('artists').select('*').order('display_order')

  if (error) {
    console.error('[artists] fetch failed:', error)
    return []
  }

  return data.map(mapArtist)
}
