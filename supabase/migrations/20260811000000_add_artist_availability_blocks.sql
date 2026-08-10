-- Artist availability blocks — Stage 1 of the artist-availability feature
-- (see investigation report). Staff-defined periods when an artist is
-- unavailable (vacation, day off, studio closure, etc). Purely additive:
-- no existing table, RLS policy, function, or booking/payment code path is
-- touched by this migration.
--
-- Deliberately NOT wired into anything yet — `checkBookingConflict`
-- (lib/staff/booking-availability.ts), booking creation, and rescheduling
-- are untouched. This migration only delivers the data model + RLS
-- foundation; a later stage will teach the booking flow to check this
-- table.
--
-- `bookings.appointment_date` (date) / `appointment_time` (text) stay
-- exactly as they are — naive, timezone-less, out of scope here. This new
-- table instead uses `timestamptz` for `starts_at`/`ends_at`, storing the
-- absolute UTC instant Postgres always uses for that type. The studio's
-- Asia/Manila business timezone is an application-layer display/input
-- concern (conversion happens where staff read/write these values), not
-- something stored per row — storing "Asia/Manila" as a literal on every
-- row would be redundant with what `timestamptz` already guarantees.
--
-- No overlap/exclusion constraint yet — multiple blocks for the same
-- artist may overlap (e.g. a one-day personal block inside a week-long
-- vacation range) without being rejected. That's redundant but harmless;
-- whether overlapping blocks should someday be normalized/rejected is an
-- open product question for a later stage, not decided here.

create table public.artist_availability_blocks (
  id         uuid        primary key default gen_random_uuid(),
  artist_id  uuid        not null references public.artists(id),
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  reason     text        not null,
  created_at timestamptz not null default now(),
  created_by uuid        not null references auth.users(id),
  constraint artist_availability_blocks_starts_before_ends
    check (starts_at < ends_at),
  constraint artist_availability_blocks_reason_not_blank
    check (char_length(trim(reason)) > 0),
  constraint artist_availability_blocks_reason_max_length
    check (char_length(reason) <= 500)
);

-- Serves the future availability check ("find this artist's blocks"),
-- same shape and rationale as bookings_artist_id_appointment_date_idx
-- (20260810120100_add_scalability_indexes.sql), which was added for the
-- equivalent booking-conflict lookup.
create index artist_availability_blocks_artist_id_starts_at_idx
  on public.artist_availability_blocks (artist_id, starts_at);

-- created_by is the audit-trail record of who originally created a block
-- and must never change after INSERT — for owner and non-owner alike. RLS
-- WITH CHECK can't express this: an UPDATE policy's WITH CHECK only ever
-- sees the new row, never the old one, so a same-column comparison like
-- `created_by = created_by` is a tautology and enforces nothing (confirmed
-- empirically while building this migration). A BEFORE UPDATE trigger is
-- the only place both OLD and NEW are simultaneously available, so
-- immutability is enforced here instead, deliberately outside RLS. Plain
-- SECURITY INVOKER (no privilege elevation needed — this only reads the
-- row already being updated) and no search_path pin (no unqualified
-- table/function references inside it to hijack), same shape as
-- public.set_updated_at() above. IS DISTINCT FROM (not <>) keeps the
-- comparison NULL-safe even though created_by is NOT NULL today, per the
-- standard defensive-SQL convention for this kind of guard.
create function public.enforce_artist_availability_blocks_created_by_immutable()
  returns trigger
  language plpgsql
  as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'artist_availability_blocks.created_by is immutable and cannot be changed after creation (was %, attempted %)',
      old.created_by, new.created_by;
  end if;
  return new;
end;
$$;

-- Not meant to be called directly (it relies on OLD/NEW, which only exist
-- when Postgres invokes it as a trigger — a direct `select` call errors
-- with "trigger functions can only be called as triggers" regardless of
-- grants), but this project's default privileges (20260805013917_remote_
-- schema.sql: `ALTER DEFAULT PRIVILEGES ... GRANT ALL ON ROUTINES TO
-- anon/authenticated/service_role`) auto-grant EXECUTE to anon and
-- authenticated on every new function — `revoke ... from public` alone
-- does NOT undo that (same gotcha check_and_increment_rate_limit's own
-- migration documents), so anon/authenticated need their own explicit
-- revoke. Firing the trigger itself needs no EXECUTE grant on the
-- function — that's gated by UPDATE privilege on the table (RLS + the
-- anon revoke below), not by who can call the function directly, so
-- revoking here closes the direct-call surface without affecting trigger
-- firing. service_role keeps EXECUTE (already granted, and it bypasses
-- RLS/this trigger's concerns entirely regardless).
revoke all on function public.enforce_artist_availability_blocks_created_by_immutable() from public;
revoke execute on function public.enforce_artist_availability_blocks_created_by_immutable() from anon;
revoke execute on function public.enforce_artist_availability_blocks_created_by_immutable() from authenticated;

create trigger artist_availability_blocks_enforce_created_by_immutable
  before update on public.artist_availability_blocks
  for each row
  execute function public.enforce_artist_availability_blocks_created_by_immutable();

alter table public.artist_availability_blocks enable row level security;

-- Staff-only table with no customer/public access at all. Default
-- privileges (see 20260805013917_remote_schema.sql) auto-grant anon
-- table-level DELETE/INSERT/SELECT/UPDATE on every new table; RLS with no
-- anon policy below already blocks all of that, but this explicit revoke
-- is the same defense-in-depth already applied to rate_limit_counters
-- (20260810170000_add_rate_limit_counters.sql) — no path to this table
-- for anon even via a future policy added in error.
revoke all on public.artist_availability_blocks from anon;

-- SELECT: owner sees every artist's blocks; a non-owner artist only sees
-- their own — identical predicate to the bookings SELECT policy in
-- 20260810140000_scope_staff_rls_policies_by_ownership.sql.
create policy "Staff can read artist availability blocks" on public.artist_availability_blocks
  for select to authenticated
  using (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  );

-- INSERT: owner can create a block for any artist; a non-owner artist can
-- only create one for themselves. `created_by` must equal the caller's own
-- auth.uid() — never a client-supplied arbitrary user id — enforced here
-- rather than trusted from the client, same spirit as artist_id scoping.
create policy "Staff can create artist availability blocks" on public.artist_availability_blocks
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_current_user_owner()
      or artist_id = public.current_staff_artist_id()
    )
  );

-- UPDATE: owner can modify any block; a non-owner artist can only modify
-- their own. WITH CHECK mirrors USING so a non-owner can't reassign a
-- block to a different artist_id — same shape as the bookings UPDATE
-- policy in 20260810140000. created_by immutability is intentionally NOT
-- enforced here — RLS's WITH CHECK only ever sees the new row, so it
-- structurally cannot compare against the old value; that guard lives in
-- the enforce_artist_availability_blocks_created_by_immutable() trigger
-- above instead.
create policy "Staff can update artist availability blocks" on public.artist_availability_blocks
  for update to authenticated
  using (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  )
  with check (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  );

-- DELETE: owner can delete any block; a non-owner artist can only delete
-- their own.
create policy "Staff can delete artist availability blocks" on public.artist_availability_blocks
  for delete to authenticated
  using (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  );
