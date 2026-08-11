'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { manilaDateTimeToUtcIso } from '@/lib/staff/timezone'
import { createAvailabilityBlockSchema, type CreateAvailabilityBlockValues } from './schema'

export interface AvailabilityBlockActionResult {
  error?: string
  id?: string
}

export interface DeleteAvailabilityBlockActionResult {
  error?: string
}

const blockIdSchema = z.string().uuid()

/**
 * Creates one `artist_availability_blocks` row.
 *
 * Authorization: an owner may target any artist — `values.artistId` is
 * validated against the `artists` table below before use, never trusted
 * as-is. A non-owner's `artistId` is never read from client input at
 * all — regardless of what a crafted request might contain, their own
 * linked artist (`getCurrentStaffArtist()`) is the only possible target.
 * This mirrors Stage 1's RLS INSERT policy
 * (`created_by = auth.uid() AND (is_current_user_owner() OR artist_id =
 * current_staff_artist_id())`), which independently enforces the same
 * boundary at the database level — this app-level check exists for a
 * clean error message, not as the only guard.
 *
 * `created_by` is always the caller's own `auth.uid()`, read server-side
 * from the session — it is never accepted as part of `values` (the type
 * doesn't even have the field) and never trusted from the client.
 *
 * No conflict/overlap checking against other bookings or other
 * availability blocks happens here — that's Stage 2E, deliberately out
 * of scope for this action.
 */
export async function createAvailabilityBlockAction(
  values: CreateAvailabilityBlockValues,
): Promise<AvailabilityBlockActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to do this.' }
  }

  const staffArtist = await getCurrentStaffArtist()
  if (!staffArtist) {
    return { error: "Your account isn't linked to an artist yet." }
  }

  const parsed = createAvailabilityBlockSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }
  }

  let targetArtistId: string
  if (staffArtist.is_owner) {
    if (!parsed.data.artistId) {
      return { error: 'Select an artist.' }
    }

    const { data: targetArtist, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('id', parsed.data.artistId)
      .maybeSingle()

    if (artistError || !targetArtist) {
      return { error: 'Unknown artist.' }
    }
    targetArtistId = targetArtist.id
  } else {
    targetArtistId = staffArtist.id
  }

  const startsAt = manilaDateTimeToUtcIso(parsed.data.date, parsed.data.startTime)
  const endsAt = manilaDateTimeToUtcIso(parsed.data.date, parsed.data.endTime)

  if (new Date(startsAt).getTime() >= new Date(endsAt).getTime()) {
    return { error: 'Start time must be before end time.' }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('artist_availability_blocks')
    .insert({
      artist_id: targetArtistId,
      starts_at: startsAt,
      ends_at: endsAt,
      reason: parsed.data.reason,
      created_by: user.id,
    })
    .select('id')
    .maybeSingle()

  if (insertError) {
    console.error('[staff/availability] createAvailabilityBlockAction failed:', insertError)
    return { error: 'Something went wrong creating this availability block. Please try again.' }
  }

  revalidatePath('/staff/availability')
  return { id: inserted?.id }
}

/**
 * Deletes one `artist_availability_blocks` row by id.
 *
 * Authorization is intentionally NOT duplicated here — Stage 1's RLS
 * DELETE policy (`is_current_user_owner() OR artist_id =
 * current_staff_artist_id()`) is the sole authorization boundary. This
 * action does not fetch the row first to check ownership (that would be
 * a second, redundant authority alongside RLS, and — per the Stage 2C
 * investigation — the gallery delete action's equivalent pre-check is
 * actually *stricter* than its own RLS policy and would incorrectly
 * block the owner from deleting another artist's row if copied here).
 *
 * `.delete().eq('id', blockId).select('id').maybeSingle()` is a single
 * statement: RLS filters which row (if any) the delete is allowed to
 * touch, and chaining `.select('id')` lets us tell "deleted" apart from
 * "matched nothing" without a separate SELECT. A non-owner's attempt on
 * another artist's block and a genuinely nonexistent id are
 * indistinguishable at this point — both come back as `data: null`, no
 * error — and that ambiguity is preserved deliberately: resolving it
 * would require an unscoped existence lookup that could leak whether a
 * given id belongs to another artist.
 */
export async function deleteAvailabilityBlockAction(blockId: string): Promise<DeleteAvailabilityBlockActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be signed in to do this.' }
  }

  const parsedId = blockIdSchema.safeParse(blockId)
  if (!parsedId.success) {
    return { error: 'That availability block could not be found.' }
  }

  const { data, error } = await supabase
    .from('artist_availability_blocks')
    .delete()
    .eq('id', parsedId.data)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('[staff/availability] deleteAvailabilityBlockAction failed:', error)
    return { error: 'Something went wrong deleting this availability block. Please try again.' }
  }

  if (!data) {
    return { error: 'That availability block could not be found.' }
  }

  revalidatePath('/staff/availability')
  return {}
}
