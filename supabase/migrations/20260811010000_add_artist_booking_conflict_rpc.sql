-- Stage 2E: unified booking-conflict RPC.
--
-- Problem this closes (see the Stage 2E-A investigation): `bookings` and
-- `artist_availability_blocks` both scope SELECT to
-- `is_current_user_owner() OR artist_id = current_staff_artist_id()`, but
-- booking CREATION is intentionally unrestricted — any linked staff
-- account may create a booking for any artist (the shared front-desk
-- flow, see `20260810140000_scope_staff_rls_policies_by_ownership.sql`'s
-- own comment on the bookings INSERT policy). That mismatch means a
-- non-owner staff member creating/rescheduling a booking for a
-- *different* artist runs the existing `checkBookingConflict` under a
-- session that RLS silently blocks from seeing that artist's rows —
-- reproduced empirically in the Stage 2E-A investigation: the check
-- reports "no conflict" regardless of the target artist's real schedule.
--
-- The fix is NOT to weaken the `bookings`/`artist_availability_blocks`
-- SELECT policies (that would expose full rows/reasons/`created_by` to
-- every authenticated staff account for browsing, not just for this one
-- narrow question) and NOT to route the check through the service-role
-- client (broader, less-audited than a fixed-signature function — see
-- lib/supabase-admin.ts's own restriction to callers with no client input
-- in their trust path, which this doesn't satisfy: artist/time here come
-- directly from the staff member's request).
--
-- Instead: one narrow SECURITY DEFINER function that answers exactly one
-- question — "does this artist have a conflicting booking or
-- availability block during this interval?" — and returns nothing more
-- than a boolean + a type tag. It deliberately does NOT become a
-- general-purpose read path: no booking/availability row, id, or
-- `reason` ever leaves it.

create or replace function public.check_artist_booking_conflict(
  p_artist_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_exclude_booking_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_hour int;
  v_minute int;
  v_existing_start timestamptz;
  v_existing_end timestamptz;
  v_verified_exclude_id uuid;
begin
  -- Caller must be a linked staff account (owner or non-owner artist) —
  -- same identity check getCurrentStaffArtist() does in the application,
  -- not a new model. Deliberately NOT restricted to
  -- `p_artist_id = current_staff_artist_id()`: booking creation itself
  -- has no such restriction (see comment above), so gating this check
  -- more tightly than the operation it supports would just reintroduce
  -- the same mismatch this function exists to close.
  if not exists (select 1 from public.artists where user_id = auth.uid()) then
    raise exception 'Not authorized.';
  end if;

  -- Same generic message as the auth check above — deliberately not
  -- distinguishable, so this can't be used to probe which artist_ids
  -- exist.
  if not exists (select 1 from public.artists where id = p_artist_id) then
    raise exception 'Not authorized.';
  end if;

  if p_starts_at >= p_ends_at then
    raise exception 'Invalid interval.';
  end if;

  -- A booking may only be excluded from conflict detection when (a) it
  -- actually belongs to the artist whose schedule is being checked, AND
  -- (b) the caller is themselves authorized to modify bookings for that
  -- artist — the same predicate the bookings UPDATE RLS policy already
  -- uses (is_current_user_owner() OR artist_id = current_staff_artist_id()).
  -- (a) alone is NOT sufficient: in the original exploit, the excluded
  -- booking genuinely belongs to p_artist_id (that's the whole point —
  -- it's the real conflicting booking for the artist being checked) —
  -- the actual gap is that the caller has no legitimate authorization
  -- tie to that specific booking, only (a) checks the booking's own
  -- artist_id, not who's asking. Only someone who could legitimately be
  -- rescheduling this exact booking (its own assigned artist, or the
  -- owner) may exclude it. Legitimate callers (rescheduleBookingAction,
  -- via authorizeBookingAction's identical guard) always satisfy both
  -- conditions already, so this changes nothing for them. An invalid,
  -- nonexistent, wrong-artist, or not-my-booking id is treated exactly
  -- like NULL (ignored), not as an error, so this can't be used to
  -- distinguish any of those cases from each other.
  if p_exclude_booking_id is not null
    and exists (
      select 1 from public.bookings
      where id = p_exclude_booking_id
        and artist_id = p_artist_id
    )
    and (
      public.is_current_user_owner()
      or public.current_staff_artist_id() = p_artist_id
    )
  then
    v_verified_exclude_id := p_exclude_booking_id;
  else
    v_verified_exclude_id := null;
  end if;

  -- Booking-vs-booking: mirrors lib/staff/booking-availability.ts's
  -- checkBookingConflict exactly — same active-status filter
  -- ('awaiting_down_payment', 'appointment_confirmed'), same
  -- parseTimeToMinutes dual-format support (24h "HH:MM" and legacy
  -- "H:MM am/pm"; unparseable rows are skipped, never treated as a
  -- conflict, same as the TS version), same half-open overlap test.
  -- `appointment_date`/`appointment_time` have no timezone of their own
  -- (see the Stage 1 migration's own comment on this) — read as Asia/
  -- Manila local wall-clock time, the only interpretation consistent
  -- with a single-location Philippine studio, then converted to a UTC
  -- instant via `AT TIME ZONE` for comparison against the caller's
  -- already-UTC p_starts_at/p_ends_at.
  --
  -- The `appointment_date` window below is a performance narrowing only
  -- (limits the loop to rows that could possibly overlap), not a
  -- correctness boundary — the real overlap test is the timestamptz
  -- comparison after conversion, same as manilaDateTimeToUtcInterval's
  -- approach in lib/staff/timezone.ts.
  for v_row in
    select b.appointment_date, b.appointment_time, b.estimated_session_hours
    from public.bookings b
    where b.artist_id = p_artist_id
      and b.status in ('awaiting_down_payment', 'appointment_confirmed')
      and (v_verified_exclude_id is null or b.id <> v_verified_exclude_id)
      and b.appointment_date between
        ((p_starts_at at time zone 'Asia/Manila')::date - 1)
        and ((p_ends_at at time zone 'Asia/Manila')::date + 1)
  loop
    v_hour := null;

    if v_row.appointment_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' then
      v_hour := split_part(v_row.appointment_time, ':', 1)::int;
      v_minute := split_part(v_row.appointment_time, ':', 2)::int;
    elsif v_row.appointment_time ~* '^[0-9]{1,2}(:[0-5][0-9])?\s*(am|pm)$' then
      v_hour := (regexp_match(v_row.appointment_time, '^([0-9]{1,2})'))[1]::int % 12;
      v_minute := coalesce((regexp_match(v_row.appointment_time, ':([0-5][0-9])'))[1]::int, 0);
      if v_row.appointment_time ~* 'pm$' then
        v_hour := v_hour + 12;
      end if;
    else
      continue;
    end if;

    v_existing_start := (v_row.appointment_date + make_time(v_hour, v_minute, 0)) at time zone 'Asia/Manila';
    v_existing_end := v_existing_start + (v_row.estimated_session_hours * interval '1 hour');

    if p_starts_at < v_existing_end and v_existing_start < p_ends_at then
      return jsonb_build_object('conflict', true, 'conflict_type', 'booking');
    end if;
  end loop;

  -- Booking-vs-availability-block: artist_availability_blocks already
  -- stores absolute UTC instants (timestamptz), so this is a direct
  -- range comparison with no conversion needed. EXISTS, not a row fetch
  -- — no id/reason/created_by is ever read here, only whether a match
  -- exists. Uses artist_availability_blocks_artist_id_starts_at_idx
  -- (existing index, unchanged) for the artist_id/starts_at predicates.
  if exists (
    select 1
    from public.artist_availability_blocks ab
    where ab.artist_id = p_artist_id
      and ab.starts_at < p_ends_at
      and ab.ends_at > p_starts_at
  ) then
    return jsonb_build_object('conflict', true, 'conflict_type', 'availability_block');
  end if;

  return jsonb_build_object('conflict', false);
end;
$$;

-- Default privileges (20260805013917_remote_schema.sql) auto-grant
-- EXECUTE on every new function to anon/authenticated/service_role;
-- `revoke ... from public` alone does not undo that (same gotcha
-- 20260810170000_add_rate_limit_counters.sql and
-- 20260811000000_add_artist_availability_blocks.sql both already
-- document) — anon needs its own explicit revoke. This function
-- authenticates the caller itself (auth.uid()), so it's meant to be
-- called with the caller's own session, not service-role — authenticated
-- is the only role that should ever hold EXECUTE.
revoke all on function public.check_artist_booking_conflict(uuid, timestamptz, timestamptz, uuid) from public;
revoke execute on function public.check_artist_booking_conflict(uuid, timestamptz, timestamptz, uuid) from anon;
grant execute on function public.check_artist_booking_conflict(uuid, timestamptz, timestamptz, uuid) to authenticated;
