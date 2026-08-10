-- Ties every waiver acceptance to the exact waiver copy that was in
-- effect when it was accepted, cryptographically — not just the version
-- label. `waiver_version` alone only proves *which label* the app used
-- at the time; if the wording under a version were ever edited without
-- bumping the label (human error, hotfix, etc.), the version tag alone
-- couldn't prove what text the customer actually saw. `waiver_hash` is
-- the SHA-256 of WAIVER_TEXT (lib/policy.ts) at acceptance time — content
-- that never changes retroactively, so the hash is permanent proof
-- regardless of what the version label says.

alter table public.bookings
  add column if not exists waiver_hash text;

-- Safe backfill for existing rows, so tightening the CHECK constraint
-- below never fails or drops data:
--
-- Every waiver accepted so far (if any) was accepted under waiver_version
-- 'v1.0', and WAIVER_TEXT for 'v1.0' has not changed since this feature
-- shipped (see 20260810120000_add_waiver_acceptance.sql — the same
-- migration set that introduced waiver_accepted). Computing the hash for
-- those rows now therefore produces exactly the value the app would have
-- written had this column existed at acceptance time. Uses the built-in
-- pg_catalog `sha256(bytea)` function (core Postgres since v11, no
-- extension required) directly in SQL rather than a hand-copied hex
-- string, so the backfilled value is verifiably correct, not transcribed.
--
-- If a future version's wording ever needs a similar backfill, add a
-- parallel `and waiver_version = 'vX.Y'` branch with that version's own
-- literal text — never reuse this branch for a different version.
update public.bookings
set waiver_hash = encode(
  sha256(
    E'I confirm that I have reviewed my tattoo details and agree to the Terms & Conditions.\nI understand that tattoos are permanent and I voluntarily consent to this booking.'::bytea
  ),
  'hex'
)
where waiver_accepted = true
  and waiver_version = 'v1.0'
  and waiver_hash is null;

-- Tighten the acceptance-consistency constraint from
-- 20260810120000_add_waiver_acceptance.sql to also require waiver_hash.
-- Safe to apply now that the backfill above guarantees no accepted row
-- is left with a null hash.
alter table public.bookings
  drop constraint if exists bookings_waiver_accepted_consistency;

alter table public.bookings
  add constraint bookings_waiver_accepted_consistency
  check (
    not waiver_accepted
    or (
      waiver_accepted_at is not null
      and waiver_version is not null
      and waiver_hash is not null
    )
  );
