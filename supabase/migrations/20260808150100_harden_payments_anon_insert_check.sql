-- Security hardening: `payments` genuinely needs an anon INSERT policy —
-- components/booking/payment-actions.ts's createCheckoutSessionAction runs
-- for real, unauthenticated customers on the public /booking/[token]
-- portal (identity there is a signed booking-session cookie, never a
-- Supabase Auth session), so this cannot be moved to `authenticated`
-- without breaking the "no customer login" requirement.
--
-- What it didn't need was `WITH CHECK (true)` — that let anyone with just
-- the anon key POST directly to PostgREST and insert a payments row with
-- status='paid' (or 'failed'/'refunded'), fabricating a payment record
-- with no real PayMongo transaction behind it. The app itself only ever
-- inserts a fresh payment as `status: 'pending'` with no `paid_at`
-- (components/booking/payment-actions.ts:59-66) — every other status
-- transition happens exclusively via the PayMongo webhook
-- (lib/payments/reconcile.ts), which runs on the service_role client and
-- is entirely unaffected by this anon-scoped policy. Restricting the
-- CHECK to exactly what the app inserts closes that gap without changing
-- anything the checkout flow actually does.

drop policy if exists "Public can create a pending payment" on payments;
create policy "Public can create a pending payment" on payments
  for insert to anon
  with check (status = 'pending' and paid_at is null);
