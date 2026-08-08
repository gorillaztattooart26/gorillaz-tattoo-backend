-- Security hardening: `bookings` and `booking_reference_images` both had
-- an INSERT policy scoped to `anon`, but auditing every call site that
-- actually performs those inserts (app/staff/create-booking/actions.ts)
-- shows there is exactly one INSERT path for each table, and it only runs
-- inside a Server Action behind /staff/create-booking — a route middleware
-- already gates to logged-in staff. There is no public, unauthenticated
-- flow that creates a booking or a booking_reference_images row; the
-- customer-facing booking portal (app/booking/[token]) only ever reads an
-- existing booking by token, it never inserts one. The anon INSERT
-- policies here were therefore broader than what the app needs — the
-- create-booking Server Action used the anon-key client for these two
-- inserts even though it only ever runs in an authenticated context (see
-- the paired code change in app/staff/create-booking/actions.ts, which
-- switches both inserts to the session-aware client).
--
-- This does NOT touch `payments` or `inquiries`/`inquiry_images`, whose
-- anon INSERT policies are genuinely used by real anonymous visitors (the
-- PayMongo checkout flow and the public inquiry form) and must stay anon —
-- those are hardened separately, in place, without changing who can call
-- them.

drop policy if exists "Staff can create bookings" on bookings;
create policy "Staff can create bookings" on bookings
  for insert to authenticated
  -- Matches the only status the app ever inserts a booking with — every
  -- other status is reached exclusively via UPDATE (payment webhook,
  -- staff cancel/complete/reschedule), never at creation time.
  with check (status = 'awaiting_down_payment');

revoke insert on public.bookings from anon;
grant insert on public.bookings to authenticated;

drop policy if exists "Staff can attach reference images" on booking_reference_images;
create policy "Staff can attach reference images" on booking_reference_images
  for insert to authenticated
  with check (true);

-- `booking_reference_images` inherited the project's broad default
-- privileges (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES for
-- both anon and authenticated) and was never scoped down the way
-- 20260805025944 did for bookings/payments. `anon` needs nothing on this
-- table now (its only policy, INSERT, just moved to authenticated);
-- `authenticated` needs SELECT (existing "Staff can read booking reference
-- images" policy) and INSERT (above) only.
revoke select, insert, update, delete, truncate, trigger, references
  on public.booking_reference_images from anon;

revoke update, delete, truncate, trigger, references
  on public.booking_reference_images from authenticated;

grant insert on public.booking_reference_images to authenticated;
