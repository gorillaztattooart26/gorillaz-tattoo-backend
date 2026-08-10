-- Defense-in-depth RLS hardening.
--
-- Prior migrations (20260808005300, 20260808200100, plus the original
-- 20260805013917 base schema) intentionally left every *authenticated*
-- staff policy on bookings/payments/inquiries/inquiry_images/
-- booking_reference_images/gallery_items/homepage_* as
-- `USING (true)`/`WITH CHECK (true)`, documenting that per-artist and
-- owner-only scoping was enforced exclusively in application code
-- (requireOwner(), getCurrentStaffArtist(), and the artist_id filters in
-- lib/staff/bookings.ts and lib/staff/payments.ts).
--
-- That means any authenticated artist account, calling Supabase directly
-- (bypassing the Next.js Server Actions), could read or write another
-- artist's bookings/payments/gallery, or perform owner-only operations
-- (archive/delete, homepage CMS writes). This migration makes the
-- database enforce the same boundaries the application already assumes,
-- without changing what any legitimate app flow currently does.
--
-- Two small SECURITY DEFINER helpers avoid repeating the ownership/
-- identity subquery in every policy, and — following the same pattern as
-- assert_caller_is_owner() in 20260808200200 — avoid any RLS recursion
-- risk when a policy needs to look up the caller's own artists row.

create or replace function public.is_current_user_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artists
    where user_id = auth.uid() and is_owner = true
  );
$$;

revoke all on function public.is_current_user_owner() from public;
grant execute on function public.is_current_user_owner() to authenticated;

create or replace function public.current_staff_artist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.artists where user_id = auth.uid();
$$;

revoke all on function public.current_staff_artist_id() from public;
grant execute on function public.current_staff_artist_id() to authenticated;

-- ---------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------
-- SELECT: owner sees every booking; a non-owner artist only sees bookings
-- assigned to them (mirrors lib/staff/bookings.ts's getBookingsForStaffArtist).
drop policy if exists "Staff can read bookings" on public.bookings;
create policy "Staff can read bookings" on public.bookings
  for select to authenticated
  using (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  );

-- INSERT is intentionally left as-is: app.staff/create-booking/actions.ts
-- lets any linked staff account create a booking assigned to ANY artist
-- (a shared front-desk-style flow, not self-service), so restricting
-- artist_id here would break a legitimate, existing feature. The
-- `status = 'awaiting_down_payment'` check (added in 20260808150000)
-- already bounds what an INSERT can do.

-- UPDATE: owner can update any booking; a non-owner artist can only
-- update bookings assigned to them (cancel/complete/reschedule, per
-- authorizeBookingAction in app/staff/(protected)/bookings/actions.ts),
-- and the WITH CHECK stops a non-owner from reassigning artist_id to
-- someone else's row.
drop policy if exists "Staff can update bookings" on public.bookings;
create policy "Staff can update bookings" on public.bookings
  for update to authenticated
  using (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  )
  with check (
    public.is_current_user_owner()
    or artist_id = public.current_staff_artist_id()
  );

-- DELETE: owner-only in application code (requireOwner() in every
-- delete/bulk-delete action) — restrict the same way at the DB level.
drop policy if exists "Staff can delete bookings" on public.bookings;
create policy "Staff can delete bookings" on public.bookings
  for delete to authenticated
  using (public.is_current_user_owner());

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
-- SELECT: owner sees every payment; a non-owner artist only sees payments
-- whose booking is assigned to them (mirrors getPaymentsForStaffArtist's
-- `bookings!inner(...).eq('bookings.artist_id', artist.id)` join filter).
drop policy if exists "Staff can read payments" on public.payments;
create policy "Staff can read payments" on public.payments
  for select to authenticated
  using (
    public.is_current_user_owner()
    or exists (
      select 1 from public.bookings b
      where b.id = payments.booking_id
        and b.artist_id = public.current_staff_artist_id()
    )
  );

-- UPDATE/DELETE: every payments mutation in
-- app/staff/(protected)/payments/actions.ts is requireOwner()-gated with
-- no non-owner write path at all — restrict to owner only.
drop policy if exists "Staff can update payments" on public.payments;
create policy "Staff can update payments" on public.payments
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete payments" on public.payments;
create policy "Staff can delete payments" on public.payments
  for delete to authenticated
  using (public.is_current_user_owner());

-- ---------------------------------------------------------------------
-- inquiries
-- ---------------------------------------------------------------------
-- SELECT stays studio-wide for all staff (unchanged) — inquiries have no
-- artist_id FK; `preferred_artist` is free text, and the dashboard's own
-- comment documents every artist seeing every lead as the intended
-- behavior.

-- UPDATE/DELETE: archive/restore/delete in
-- app/staff/(protected)/inquiries/actions.ts is requireOwner()-gated only
-- — restrict to owner at the DB level too.
drop policy if exists "Staff can update inquiries" on public.inquiries;
create policy "Staff can update inquiries" on public.inquiries
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete inquiries" on public.inquiries;
create policy "Staff can delete inquiries" on public.inquiries
  for delete to authenticated
  using (public.is_current_user_owner());

-- ---------------------------------------------------------------------
-- inquiry_images
-- ---------------------------------------------------------------------
-- SELECT stays studio-wide (mirrors inquiries SELECT). DELETE: no direct
-- app code deletes these rows outside of the inquiry's own cascade delete
-- (which is already owner-gated via inquiries DELETE above) — restrict
-- the standalone DELETE policy to owner as well, closing the gap where
-- any staff could otherwise delete another artist's lead photos directly.
drop policy if exists "Staff can delete inquiry images" on public.inquiry_images;
create policy "Staff can delete inquiry images" on public.inquiry_images
  for delete to authenticated
  using (public.is_current_user_owner());

-- ---------------------------------------------------------------------
-- booking_reference_images
-- ---------------------------------------------------------------------
-- SELECT/INSERT are intentionally left as-is: reference images are
-- attached while creating a booking (app/staff/create-booking/actions.ts),
-- which — like bookings INSERT above — is a shared any-staff-any-artist
-- flow, so scoping INSERT to the caller's own artist_id would break it.
--
-- DELETE only ever runs from the owner-gated delete/bulk-delete booking
-- actions (getBookingReferenceImagePaths + deleteReferenceImages, called
-- exclusively from requireOwner()-gated code) — restrict to owner.
drop policy if exists "Staff can delete booking reference images" on public.booking_reference_images;
create policy "Staff can delete booking reference images" on public.booking_reference_images
  for delete to authenticated
  using (public.is_current_user_owner());

-- ---------------------------------------------------------------------
-- gallery_items
-- ---------------------------------------------------------------------
-- Public SELECT is unchanged. gallery_items has no artist_id FK — the
-- app scopes ownership by matching `artist_name` against the caller's own
-- `artists.name` (see deleteGalleryItemAction's explicit `item.artist_name
-- !== artist.name` check, and createGalleryItemAction always inserting
-- `artist_name: artist.name`). Reuse that same column, matching existing
-- application behavior without inventing a new relationship.
drop policy if exists "Staff can insert gallery items" on public.gallery_items;
create policy "Staff can insert gallery items" on public.gallery_items
  for insert to authenticated
  with check (
    public.is_current_user_owner()
    or artist_name = (select name from public.artists where user_id = auth.uid())
  );

drop policy if exists "Staff can update gallery items" on public.gallery_items;
create policy "Staff can update gallery items" on public.gallery_items
  for update to authenticated
  using (
    public.is_current_user_owner()
    or artist_name = (select name from public.artists where user_id = auth.uid())
  )
  with check (
    public.is_current_user_owner()
    or artist_name = (select name from public.artists where user_id = auth.uid())
  );

drop policy if exists "Staff can delete gallery items" on public.gallery_items;
create policy "Staff can delete gallery items" on public.gallery_items
  for delete to authenticated
  using (
    public.is_current_user_owner()
    or artist_name = (select name from public.artists where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- homepage_* (hero, about, portfolio_images, slideshow_images)
-- ---------------------------------------------------------------------
-- Public SELECT (and, for slideshow_images, the "read all" staff SELECT)
-- is unchanged — this is public marketing-site content. Every write in
-- app/staff/(protected)/gallery/homepage-actions.ts is requireOwner()-
-- gated with no non-owner path at all — restrict all INSERT/UPDATE/DELETE
-- to owner at the DB level too.

drop policy if exists "Staff can upsert homepage hero" on public.homepage_hero;
create policy "Staff can upsert homepage hero" on public.homepage_hero
  for insert to authenticated
  with check (public.is_current_user_owner());

drop policy if exists "Staff can update homepage hero" on public.homepage_hero;
create policy "Staff can update homepage hero" on public.homepage_hero
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete homepage hero" on public.homepage_hero;
create policy "Staff can delete homepage hero" on public.homepage_hero
  for delete to authenticated
  using (public.is_current_user_owner());

drop policy if exists "Staff can insert homepage about image" on public.homepage_about;
create policy "Staff can insert homepage about image" on public.homepage_about
  for insert to authenticated
  with check (public.is_current_user_owner());

drop policy if exists "Staff can update homepage about image" on public.homepage_about;
create policy "Staff can update homepage about image" on public.homepage_about
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete homepage about image" on public.homepage_about;
create policy "Staff can delete homepage about image" on public.homepage_about
  for delete to authenticated
  using (public.is_current_user_owner());

drop policy if exists "Staff can insert homepage portfolio images" on public.homepage_portfolio_images;
create policy "Staff can insert homepage portfolio images" on public.homepage_portfolio_images
  for insert to authenticated
  with check (public.is_current_user_owner());

drop policy if exists "Staff can update homepage portfolio images" on public.homepage_portfolio_images;
create policy "Staff can update homepage portfolio images" on public.homepage_portfolio_images
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete homepage portfolio images" on public.homepage_portfolio_images;
create policy "Staff can delete homepage portfolio images" on public.homepage_portfolio_images
  for delete to authenticated
  using (public.is_current_user_owner());

drop policy if exists "Staff can insert homepage slideshow images" on public.homepage_slideshow_images;
create policy "Staff can insert homepage slideshow images" on public.homepage_slideshow_images
  for insert to authenticated
  with check (public.is_current_user_owner());

drop policy if exists "Staff can update homepage slideshow images" on public.homepage_slideshow_images;
create policy "Staff can update homepage slideshow images" on public.homepage_slideshow_images
  for update to authenticated
  using (public.is_current_user_owner())
  with check (public.is_current_user_owner());

drop policy if exists "Staff can delete homepage slideshow images" on public.homepage_slideshow_images;
create policy "Staff can delete homepage slideshow images" on public.homepage_slideshow_images
  for delete to authenticated
  using (public.is_current_user_owner());
