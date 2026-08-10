-- Postgres-backed rate limiter for the two public, unauthenticated flows
-- that currently have no throttling: the homepage/booking-page inquiry
-- form (components/booking/actions.ts) and booking identity verification
-- (app/booking/[token]/actions.ts). Staff login is intentionally NOT
-- covered here — Production Supabase Auth already rate-limits sign-in at
-- 30 requests / 5 min / IP.
--
-- Design: one shared counter table, one row per unique rate-limit key
-- (e.g. "inquiry:ip:203.0.113.5", "verify:token:<uuid>"), updated in place
-- rather than one row per attempt. This keeps storage O(unique keys), not
-- O(requests), and keeps every check down to a single indexed upsert.
--
-- Deliberately NOT Upstash/Redis and NOT an in-memory counter: Vercel
-- serverless functions don't share process memory across invocations/
-- instances, so an in-memory Map would silently fail to limit anything in
-- production. Postgres is already this project's only piece of durable,
-- request-shared state, and reusing it avoids a new external service.

create table public.rate_limit_counters (
  key           text                     primary key,
  window_start  timestamptz              not null default now(),
  count         integer                  not null default 1 check (count > 0)
);

-- Serves the periodic cleanup query (delete rows whose window is long
-- expired) — the primary key already serves the per-request lookup/upsert
-- path, so this is the only other access pattern that needs an index.
create index idx_rate_limit_counters_window_start
  on public.rate_limit_counters (window_start);

-- RLS enabled with no policies for anon/authenticated: even though this
-- project's default privileges (see supabase/migrations/
-- 20260805013917_remote_schema.sql) auto-grant table-level DELETE/INSERT/
-- SELECT/UPDATE to anon and authenticated on every new table, RLS with no
-- matching policy blocks all row access for those roles regardless. This
-- table is meant to be reachable only through the SECURITY DEFINER RPC
-- below, called by the service-role client from trusted server code — the
-- same shape of restriction already applied to other sensitive tables in
-- this project (e.g. 20260805025944_restrict_bookings_payments_table_grants.sql).
alter table public.rate_limit_counters enable row level security;

-- Defense in depth beyond RLS: explicitly revoke the auto-granted default
-- table privileges from anon/authenticated too, so there is no path to
-- this table for either role even via a future RLS policy added in error.
revoke all on public.rate_limit_counters from anon;
revoke all on public.rate_limit_counters from authenticated;

-- service_role already has table privileges via the same default-privilege
-- grant (and bypasses RLS entirely) — no explicit grant needed for it.

-- Atomically checks and increments the counter for `p_key` inside a fixed
-- `p_window_seconds` window, returning whether the caller is still within
-- `p_max_attempts`. The entire decision happens in a single
-- `INSERT ... ON CONFLICT (key) DO UPDATE` statement, which Postgres
-- serializes per-key via the row's own lock — this is what makes it safe
-- under concurrency. A naive "SELECT count(...) then INSERT/UPDATE" was
-- deliberately rejected: two concurrent transactions under READ COMMITTED
-- can both read the same pre-increment count before either commits its
-- write, letting both through even when the limit should stop the second
-- one. There is no separate read step here for that race to live in.
--
-- Behavior:
--   - key doesn't exist yet: insert it with count = 1, return true.
--   - key exists but its window has expired: reset window_start = now()
--     and count = 1, return true.
--   - key exists and its window hasn't expired: increment count in place,
--     return true only if the resulting count <= p_max_attempts.
create or replace function public.check_and_increment_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_attempts integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'p_key must be a non-empty string';
  end if;

  if p_window_seconds is null or p_window_seconds <= 0 then
    raise exception 'p_window_seconds must be a positive integer';
  end if;

  if p_max_attempts is null or p_max_attempts <= 0 then
    raise exception 'p_max_attempts must be a positive integer';
  end if;

  insert into public.rate_limit_counters as rlc (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when rlc.window_start <= now() - (p_window_seconds || ' seconds')::interval
            then 1
          else rlc.count + 1
        end,
        window_start = case
          when rlc.window_start <= now() - (p_window_seconds || ' seconds')::interval
            then now()
          else rlc.window_start
        end
  returning rlc.count into v_count;

  return v_count <= p_max_attempts;
end;
$$;

-- Narrowly scoped to service_role only — this function is a security
-- boundary (it decides whether abuse-prone public flows proceed), so it
-- must never be callable directly by `anon` or `authenticated` via
-- `supabase.rpc()` from the browser (that would let a client fabricate its
-- own rate-limit key/window/limit, or simply pre-increment counters to
-- deny service to other users). Only the app's trusted server-side code,
-- via getSupabaseAdmin(), may call it. Mirrors the pattern already used
-- for get_booking_by_token (20260805020818_restrict_get_booking_by_token_execute.sql).
revoke all on function public.check_and_increment_rate_limit(text, integer, integer) from public;
revoke execute on function public.check_and_increment_rate_limit(text, integer, integer) from anon;
revoke execute on function public.check_and_increment_rate_limit(text, integer, integer) from authenticated;
grant execute on function public.check_and_increment_rate_limit(text, integer, integer) to service_role;
