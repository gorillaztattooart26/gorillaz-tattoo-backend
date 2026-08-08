import { getCurrentStaffArtist } from '@/lib/staff/artists'

export const NOT_OWNER_ERROR = 'Only the studio owner can do this.'

/**
 * Shared owner guard for every Server Action in the data-management
 * feature (Archive/Restore/Delete on Bookings/Inquiries/Payments, the
 * Database Maintenance + Clear Test Data tools on /staff/system). Same
 * shape and convention as the `requireOwner()` that already existed
 * locally in app/staff/(protected)/gallery/homepage-actions.ts — pulled
 * out here so it can be reused instead of copy-pasted across the new
 * inquiries/payments/system action files.
 */
export async function requireOwner(errorMessage: string = NOT_OWNER_ERROR): Promise<{ ok: true } | { ok: false; error: string }> {
  const artist = await getCurrentStaffArtist()
  if (!artist || !artist.is_owner) {
    return { ok: false, error: errorMessage }
  }
  return { ok: true }
}
