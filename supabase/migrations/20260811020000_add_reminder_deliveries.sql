-- Reminder deliveries — Stage 3C database foundation for the payment/
-- appointment reminder feature (see Stage 3A/3B investigation reports).
-- Purely additive: no existing table, RLS policy, function, RPC, or
-- booking/payment code path is touched by this migration. The reminder
-- scheduler itself (Stage 3D) does not exist yet — this migration only
-- delivers the data model + RLS foundation it will write to.
--
-- One row represents one attempt to deliver one specific reminder for one
-- specific booking. The business object a reminder belongs to is the
-- booking, not an individual payment attempt (a booking may have several
-- `payments` rows — retries, abandoned checkouts — but "remind this
-- customer to pay" is a booking-level fact, not a per-attempt one).
--
-- `UNIQUE (booking_id, reminder_type)` is the idempotency key. Stage 3D's
-- scheduler will claim a reminder atomically via
-- `INSERT ... ON CONFLICT (booking_id, reminder_type) DO NOTHING RETURNING id`
-- *before* sending the email — the row existing at all (regardless of its
-- `status`) is what stops two concurrent/duplicate scheduler invocations
-- from ever sending the same reminder twice. `status` then distinguishes a
-- claimed-but-not-yet-confirmed attempt from a confirmed send or a
-- confirmed failure, which is why a bare `sent_at` timestamp isn't enough
-- on its own (a null `sent_at` is ambiguous between "never attempted" and
-- "attempted, but the send/record step failed or crashed").
create table public.reminder_deliveries (
  id           uuid        primary key default gen_random_uuid(),
  booking_id   uuid        not null references public.bookings(id) on delete cascade,
  reminder_type text       not null,
  status       text        not null default 'pending',
  attempted_at timestamptz,
  sent_at      timestamptz,
  error        text,
  created_at   timestamptz not null default now(),
  constraint reminder_deliveries_reminder_type_check
    check (reminder_type = any (array['payment_due'::text, 'appointment_24h'::text, 'appointment_2h'::text])),
  constraint reminder_deliveries_status_check
    check (status = any (array['pending'::text, 'sent'::text, 'failed'::text])),
  constraint reminder_deliveries_booking_id_reminder_type_key
    unique (booking_id, reminder_type)
);

-- Serves the scheduler's eligibility query ("which bookings already have a
-- reminder row for this type") and the staff SELECT policy's join back to
-- bookings — same shape and rationale as the artist_id/starts_at index on
-- artist_availability_blocks (20260811000000).
create index reminder_deliveries_booking_id_idx
  on public.reminder_deliveries (booking_id);

alter table public.reminder_deliveries enable row level security;

-- Table-level default privileges (see 20260805013917_remote_schema.sql:
-- `ALTER DEFAULT PRIVILEGES ... GRANT DELETE, INSERT, SELECT, UPDATE ON
-- TABLES TO anon/authenticated`) auto-grant anon/authenticated full
-- DML on every new table. RLS with no anon policy below already blocks
-- all anon access; this explicit revoke is the same defense-in-depth
-- already applied to rate_limit_counters and artist_availability_blocks —
-- no path to this table for anon even via a future policy added in error.
-- `authenticated` keeps its default table-level grants: RLS enabled with
-- only a SELECT policy (no INSERT/UPDATE/DELETE policy at all, below)
-- already makes every write denied-by-default for `authenticated`, the
-- same pattern `payments` already uses (no authenticated write policy —
-- only the service-role webhook writes to it). Stage 3D's scheduler route
-- will use the existing narrow getSupabaseAdmin() service-role client
-- (which bypasses RLS entirely, same as it already does for the PayMongo
-- webhook) to claim and update reminder rows — no RPC, no SECURITY
-- DEFINER function, and no authenticated/anon write policy is introduced
-- here or planned for this table.
revoke all on public.reminder_deliveries from anon;

-- SELECT: owner sees every booking's reminder rows; a non-owner artist
-- only sees reminder rows for bookings assigned to them — identical
-- predicate and rationale to the bookings/artist_availability_blocks
-- SELECT policies (20260810140000, 20260811000000), reusing the same
-- is_current_user_owner()/current_staff_artist_id() helpers rather than
-- re-deriving ownership with a new subquery.
create policy "Staff can read reminder deliveries" on public.reminder_deliveries
  for select to authenticated
  using (
    public.is_current_user_owner()
    or exists (
      select 1 from public.bookings
      where bookings.id = reminder_deliveries.booking_id
        and bookings.artist_id = public.current_staff_artist_id()
    )
  );

-- No INSERT/UPDATE/DELETE policy for authenticated or anon is created —
-- intentional. Every write to this table is the service-role scheduler's
-- job (Stage 3D), not a staff-facing action; there is no legitimate
-- authenticated write path to gate here, unlike bookings/payments.
