import { createClient } from '@/lib/supabase/server'
import type { ArtistAvailabilityBlockRow } from '@/types/supabase'

export interface StaffAvailabilityBlock {
  id: string
  artistId: string
  artistName: string
  startsAt: string
  endsAt: string
  reason: string
  createdAt: string
}

/**
 * Raw shape of `artist_availability_blocks` joined with `artists` via the
 * FK relationship declared in types/supabase.ts — same manual-typing
 * approach as BookingWithArtistRow in lib/staff/bookings.ts, for the same
 * reason (the hand-written Database type doesn't reliably infer nested-
 * select shapes). `created_by` is deliberately not selected at all — it's
 * an internal audit field (protected by Stage 1's immutability trigger),
 * not something this read-only staff view needs to show. `created_at` is
 * selected for potential future use (e.g. "added N days ago") even though
 * the Stage 2A table doesn't render it yet.
 */
interface AvailabilityBlockWithArtistRow
  extends Pick<ArtistAvailabilityBlockRow, 'id' | 'artist_id' | 'starts_at' | 'ends_at' | 'reason' | 'created_at'> {
  artists: { name: string } | null
}

function mapAvailabilityBlock(row: AvailabilityBlockWithArtistRow): StaffAvailabilityBlock {
  return {
    id: row.id,
    artistId: row.artist_id,
    artistName: row.artists?.name ?? 'Unknown',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    reason: row.reason,
    createdAt: row.created_at,
  }
}

/**
 * Availability blocks visible on the staff dashboard's Availability tab,
 * scoped by who's logged in — mirrors getBookingsForStaffArtist exactly:
 * the owner sees every artist's blocks (each row's Artist column says
 * whose), every other artist only sees their own. `null` (no artist
 * linked to this login) sees nothing, same as every other staff list.
 *
 * The explicit `.eq('artist_id', artist.id)` for non-owners duplicates
 * what Stage 1's RLS SELECT policy already enforces at the database level
 * (`is_current_user_owner() OR artist_id = current_staff_artist_id()`) —
 * kept anyway for the same reason getBookingsForStaffArtist keeps its
 * equivalent filter: explicit, readable intent in the query itself, not
 * an invisible database-level-only guarantee. RLS remains the actual
 * security boundary regardless of this filter.
 */
export async function getAvailabilityBlocksForStaffArtist(
  artist: { id: string; is_owner: boolean } | null,
): Promise<StaffAvailabilityBlock[]> {
  if (!artist) return []

  const supabase = await createClient()
  let query = supabase
    .from('artist_availability_blocks')
    .select(
      'id, artist_id, starts_at, ends_at, reason, created_at, artists!artist_availability_blocks_artist_id_fkey(name)',
    )
    .order('starts_at', { ascending: true })

  if (!artist.is_owner) {
    query = query.eq('artist_id', artist.id)
  }

  const { data, error } = await query

  if (error) {
    console.error('[staff/availability] getAvailabilityBlocksForStaffArtist failed:', error)
    return []
  }
  return (data as unknown as AvailabilityBlockWithArtistRow[]).map(mapAvailabilityBlock)
}
