-- Follow-up to 20260810140000: closes the last confirmed gap flagged by
-- the RLS pre-production review — booking_reference_images SELECT/INSERT
-- were left `USING (true)`/`WITH CHECK (true)` for any authenticated
-- staff, so Artist A could read or attach images on Artist B's booking
-- directly via Supabase/PostgREST.
--
-- Investigation confirmed this table has NO customer/public access at
-- all (anon has had zero grants on it since 20260808150000 — the
-- customer-facing app/booking/[token] portal never touches it), so this
-- is purely a staff-to-staff boundary, not a customer-flow concern.
--
-- The one remaining wrinkle: app/staff/create-booking/actions.ts lets any
-- linked staff account create a booking (and its reference images) for
-- ANY artist, not just themselves — a documented, working "front desk"
-- flow, not a bug. Scoping this INSERT policy to the caller's own artist
-- would have silently dropped reference images whenever that flow is
-- used for a different artist. Rather than leave the DB wide open to
-- compensate, that one INSERT was moved (see the paired code change in
-- app/staff/create-booking/actions.ts) to run through the service-role
-- client, narrowly scoped to only the single booking row that same
-- Server Action invocation just created — so this policy can now be
-- tightened to match ordinary direct-API callers without breaking that
-- flow.

drop policy if exists "Staff can read booking reference images" on public.booking_reference_images;
create policy "Staff can read booking reference images" on public.booking_reference_images
  for select to authenticated
  using (
    public.is_current_user_owner()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_reference_images.booking_id
        and b.artist_id = public.current_staff_artist_id()
    )
  );

drop policy if exists "Staff can attach reference images" on public.booking_reference_images;
create policy "Staff can attach reference images" on public.booking_reference_images
  for insert to authenticated
  with check (
    public.is_current_user_owner()
    or exists (
      select 1 from public.bookings b
      where b.id = booking_reference_images.booking_id
        and b.artist_id = public.current_staff_artist_id()
    )
  );

-- DELETE is intentionally untouched here — 20260810140000 already scoped
-- "Staff can delete booking reference images" to owner-only, which
-- remains correct (the only call site, deleteBookingAction /
-- bulkDeleteBookingsAction, is itself requireOwner()-gated).
