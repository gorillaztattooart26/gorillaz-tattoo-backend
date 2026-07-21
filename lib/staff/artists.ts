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
