-- Tracked equivalent of supabase-add-bookings-staff-write-access.sql. Lets
-- staff cancel, reschedule, or mark bookings completed from the dashboard.
--
-- `bookings` previously only had an INSERT policy for `anon` (how the
-- Create Booking form writes new rows) and a SELECT policy for
-- `authenticated` (how the Bookings/Payments/Dashboard tabs read it) — no
-- UPDATE policy existed, so cancel/reschedule/complete actions would fail
-- without this. Matches the existing convention used for
-- homepage_hero/homepage_portfolio_images/homepage_about: RLS just gates
-- anon vs. staff, and per-artist permission is enforced in application
-- code (lib/staff/bookings.ts, app/staff/(protected)/bookings/actions.ts).
--
-- CORRECTION (found while auditing anon INSERT policies for security
-- hardening, before this migration was ever applied to the live project —
-- verified via `supabase migration list --linked`, still pending): the
-- earlier 20260805025944_restrict_bookings_payments_table_grants.sql
-- REVOKEd UPDATE on `bookings` from `authenticated` (it only needed SELECT
-- at the time). An RLS policy has no effect without the matching base
-- GRANT — Postgres checks table-level privileges before RLS ever
-- evaluates — so the UPDATE policy below would have been silently inert
-- and every cancel/reschedule/complete action would have failed with a
-- permission error the moment this migration was applied. Restoring the
-- grant here, in the same migration that first needs it.
grant update on public.bookings to authenticated;

drop policy if exists "Staff can update bookings" on bookings;
create policy "Staff can update bookings" on bookings
  for update to authenticated using (true) with check (true);
