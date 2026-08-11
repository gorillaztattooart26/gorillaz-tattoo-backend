import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

export type StaffArtist = Database['public']['Tables']['artists']['Row']

/**
 * The artist record linked to the currently logged-in staff account
 * (via artists.user_id), if any. Each artist has their own login — this
 * is how the Gallery tab knows whose uploads to show/attribute without
 * asking them to pick themselves from a list every time.
 */
export async function getCurrentStaffArtist(): Promise<StaffArtist | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('artists')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('[staff/artists] getCurrentStaffArtist failed:', error)
    return null
  }
  return data
}

export interface StaffArtistOption {
  id: string
  name: string
}

/**
 * Every artist, id+name only — powers the owner's artist selector when
 * creating an availability block on someone else's behalf (Stage 2B).
 * `artists` SELECT is already open to any authenticated staff account
 * (`"Staff can read artists" ... USING (true)`, base schema), so this
 * grants no new access — it's just the id-bearing shape the picker
 * needs, which the public site's lib/artists.ts:getArtists() doesn't
 * return (that one is shaped for the anon marketing page and has no
 * `id`, only `slug`).
 */
export async function getAllArtistsForStaff(): Promise<StaffArtistOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('artists').select('id, name').order('display_order')

  if (error) {
    console.error('[staff/artists] getAllArtistsForStaff failed:', error)
    return []
  }
  return data
}
