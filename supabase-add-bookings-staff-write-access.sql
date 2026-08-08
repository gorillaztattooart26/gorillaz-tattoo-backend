-- Run this once in the Supabase SQL Editor to let staff cancel,
-- reschedule, or mark bookings completed from the dashboard.
--
-- `bookings` currently only has an INSERT policy for `anon` (how the
-- Create Booking form writes new rows) and a SELECT policy for
-- `authenticated` (how the Bookings/Payments/Dashboard tabs already read
-- it) — there is no UPDATE policy yet, so the new cancel/reschedule/
-- complete actions will fail until this is applied. Matches the existing
-- convention used for `homepage_hero`/`homepage_portfolio_images`/
-- `homepage_about` (see supabase-setup-homepage-media.sql): RLS just
-- gates anon vs. staff, and per-artist permission is enforced in
-- application code (lib/staff/bookings.ts, app/staff/(protected)/
-- bookings/actions.ts) — same pattern already used for who can see what.

create policy "Staff can update bookings" on bookings
  for update to authenticated using (true) with check (true);
