-- Grants + RLS for the new Archive/Restore/Delete feature on Bookings,
-- Inquiries, Payments. Follows the exact convention already established by
-- 20260808005300_add_bookings_staff_write_access.sql: RLS here just gates
-- anon vs. staff (`authenticated`); per-record permission (owner-only for
-- archive/delete, per-artist for what a non-owner can see) is enforced in
-- application code (lib/staff/permissions.ts's requireOwner(), used by
-- every Server Action below), the same split already used for
-- `bookings`' existing UPDATE policy.
--
-- `bookings` already has `grant update` (20260808005300) — `inquiries` and
-- `payments` do not, and none of the five tables involved
-- (bookings, inquiries, payments, booking_reference_images, inquiry_images)
-- have ever had DELETE granted to `authenticated` (20260805025944 and
-- 20260808150200 both revoked it). Restoring exactly what this feature
-- needs, nothing broader.

grant update on public.inquiries to authenticated;
grant update on public.payments to authenticated;

grant delete on public.bookings to authenticated;
grant delete on public.inquiries to authenticated;
grant delete on public.payments to authenticated;
grant delete on public.booking_reference_images to authenticated;
grant delete on public.inquiry_images to authenticated;

drop policy if exists "Staff can update inquiries" on inquiries;
create policy "Staff can update inquiries" on inquiries
  for update to authenticated using (true) with check (true);

drop policy if exists "Staff can delete inquiries" on inquiries;
create policy "Staff can delete inquiries" on inquiries
  for delete to authenticated using (true);

drop policy if exists "Staff can update payments" on payments;
create policy "Staff can update payments" on payments
  for update to authenticated using (true) with check (true);

drop policy if exists "Staff can delete payments" on payments;
create policy "Staff can delete payments" on payments
  for delete to authenticated using (true);

drop policy if exists "Staff can delete bookings" on bookings;
create policy "Staff can delete bookings" on bookings
  for delete to authenticated using (true);

drop policy if exists "Staff can delete booking reference images" on booking_reference_images;
create policy "Staff can delete booking reference images" on booking_reference_images
  for delete to authenticated using (true);

drop policy if exists "Staff can delete inquiry images" on inquiry_images;
create policy "Staff can delete inquiry images" on inquiry_images
  for delete to authenticated using (true);

-- Deleting a booking/inquiry permanently also needs to remove its
-- reference photos from the private `references` Storage bucket
-- (20260805030200 only ever granted `authenticated` SELECT on
-- storage.objects for this bucket). Same anon-vs-staff split as everywhere
-- else: staff-only, owner-only enforced in app code.
drop policy if exists "Staff can delete reference images" on storage.objects;
create policy "Staff can delete reference images" on storage.objects
  for delete to authenticated using (bucket_id = 'references');
