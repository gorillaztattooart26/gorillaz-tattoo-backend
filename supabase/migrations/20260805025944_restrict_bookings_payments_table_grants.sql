-- `bookings` and `payments` currently GRANT the full privilege set
-- (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES) to both
-- `anon` and `authenticated` — inherited from the project's default
-- privileges (ALTER DEFAULT PRIVILEGES ... GRANT ... ON TABLES) rather
-- than deliberately scoped per table.
--
-- The app never uses more than: `anon` INSERT (public booking creation,
-- public pending-payment creation) and `authenticated` SELECT (staff
-- dashboard reads) on these two tables — confirmed by tracing every call
-- site in the codebase. All writes beyond that (status updates) go
-- through the service_role client in the PayMongo webhook, which is
-- unaffected by this migration.
--
-- RLS policies already restrict `anon` to INSERT-only and `authenticated`
-- to SELECT-only in practice (no UPDATE/DELETE policy exists for either
-- role on either table), so this migration does not change any currently
-- reachable behavior through the app or PostgREST. It closes two gaps
-- RLS *can't* cover on its own: TRUNCATE bypasses row-level security
-- entirely in Postgres (no policy can filter it), and the unused grants
-- are a defense-in-depth gap — if a table's RLS were ever accidentally
-- disabled or a future migration created a table without RLS enabled by
-- default, these broad grants would immediately become fully exploitable
-- with no backstop.

REVOKE SELECT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.bookings FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.bookings FROM authenticated;

REVOKE SELECT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.payments FROM anon;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.payments FROM authenticated;

-- `anon` keeps INSERT, `authenticated` keeps SELECT (not revoked above)
-- on both tables — matching exactly what the app uses. `service_role`
-- and the `postgres` table owner are untouched.
