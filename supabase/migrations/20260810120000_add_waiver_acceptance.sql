-- Persist proof of waiver acceptance on the booking itself, captured
-- server-side at the moment the customer starts their down payment — not
-- inferred afterwards from "they paid". Before this, the waiver checkbox
-- state lived only in client React state (components/booking/WaiverCard.tsx)
-- and was never sent to the server or stored anywhere: a completed payment
-- proved money moved, not that the customer ever saw or agreed to the
-- waiver, which is insufficient for legal protection.
--
-- `waiver_accepted` + `waiver_accepted_at` are the acceptance record.
-- `waiver_version` ties that record to the exact wording in effect at
-- acceptance time (see WAIVER_VERSION in lib/policy.ts), so a future wording
-- change never retroactively changes what a past customer agreed to.
-- `waiver_ip` / `waiver_user_agent` are best-effort corroborating evidence
-- (nullable — some environments/proxies won't yield a usable value) and are
-- deliberately never exposed on the public booking-confirmation page (see
-- lib/booking.ts's getBookingByToken, which maps `Booking.waiver` without
-- them); only staff can see them, via the same `authenticated`-only RLS
-- SELECT policy already on `bookings`.

alter table public.bookings
  add column if not exists waiver_accepted boolean not null default false,
  add column if not exists waiver_accepted_at timestamptz,
  add column if not exists waiver_version text,
  add column if not exists waiver_ip text,
  add column if not exists waiver_user_agent text;

-- Belt-and-suspenders at the data layer: an accepted waiver must always
-- carry the timestamp and version it was accepted under. Mirrors the
-- server-side validation in createCheckoutSessionAction (which is the only
-- code path allowed to set waiver_accepted = true) rather than replacing it.
alter table public.bookings
  add constraint bookings_waiver_accepted_consistency
  check (not waiver_accepted or (waiver_accepted_at is not null and waiver_version is not null));
