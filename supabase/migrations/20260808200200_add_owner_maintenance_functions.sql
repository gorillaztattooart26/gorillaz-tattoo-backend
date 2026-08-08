-- Database Maintenance + "Clear Test Data" tools for the new /staff/system
-- page (Owner only). These run as `security definer` Postgres functions
-- rather than plain client-side queries for two reasons specific to this
-- feature:
--
--   1. Each one is a bulk, multi-statement operation ("delete every
--      archived inquiry older than N months, and its images, together")
--      that needs to run as a single atomic transaction — a Postgres
--      function body is one, for free; a sequence of separate
--      supabase-js calls from a Server Action is not.
--   2. Defense in depth: every Server Action calling these also calls
--      requireOwner() first (lib/staff/permissions.ts, same convention as
--      homepage-actions.ts), but a `security definer` function is
--      reachable directly via `supabase.rpc()` by any authenticated
--      session regardless of what Server Action code exists, so the owner
--      check is re-verified here too, against `artists.is_owner` for the
--      calling `auth.uid()`.
--
-- All five are owner-gated, `security definer`, and explicitly
-- `set search_path = public` (required with `security definer` so the
-- function can't be tricked by a caller-controlled search_path).

create or replace function public.assert_caller_is_owner()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.artists
    where user_id = auth.uid() and is_owner = true
  ) then
    raise exception 'Only the studio owner can do this.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_caller_is_owner() from public;
grant execute on function public.assert_caller_is_owner() to authenticated;

-- Read-only preview of what "Clear Test Data" is about to remove — the UI
-- shows these counts before the danger-zone confirmation gate unlocks.
create or replace function public.get_test_data_counts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  perform public.assert_caller_is_owner();

  select jsonb_build_object(
    'bookings', (select count(*) from public.bookings),
    'booking_reference_images', (select count(*) from public.booking_reference_images),
    'inquiries', (select count(*) from public.inquiries),
    'inquiry_images', (select count(*) from public.inquiry_images),
    'payments', (select count(*) from public.payments)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_test_data_counts() from public;
grant execute on function public.get_test_data_counts() to authenticated;

-- Wipes every booking/inquiry/payment (and their images) in FK-safe order,
-- inside one transaction. Never touches artists, gallery_items, any
-- homepage_* table, auth.*, storage.buckets, or any policy/function —
-- those are outside this function entirely (Postgres would error before
-- ever committing if any of this fails partway, so there's no risk of a
-- half-cleared table left behind). Storage objects themselves are NOT
-- removed here (a `security definer` SQL function has no way to call the
-- Storage API) — the calling Server Action fetches every image_path
-- first, calls this, then removes those paths from the `references`
-- bucket. Returns the same shape as get_test_data_counts() so the UI can
-- confirm what was actually deleted.
create or replace function public.clear_test_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payments int;
  v_booking_images int;
  v_bookings int;
  v_inquiry_images int;
  v_inquiries int;
begin
  perform public.assert_caller_is_owner();

  delete from public.payments;
  get diagnostics v_payments = row_count;

  delete from public.booking_reference_images;
  get diagnostics v_booking_images = row_count;

  delete from public.bookings;
  get diagnostics v_bookings = row_count;

  delete from public.inquiry_images;
  get diagnostics v_inquiry_images = row_count;

  delete from public.inquiries;
  get diagnostics v_inquiries = row_count;

  return jsonb_build_object(
    'payments', v_payments,
    'booking_reference_images', v_booking_images,
    'bookings', v_bookings,
    'inquiry_images', v_inquiry_images,
    'inquiries', v_inquiries
  );
end;
$$;

revoke all on function public.clear_test_data() from public;
grant execute on function public.clear_test_data() to authenticated;

-- Archives every `completed` booking whose appointment_date is older than
-- p_months months and isn't already archived. Returns the number archived.
create or replace function public.archive_completed_bookings_older_than(p_months int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_count int;
begin
  perform public.assert_caller_is_owner();

  if p_months is null or p_months < 0 then
    raise exception 'p_months must be a non-negative number of months.';
  end if;

  select id into v_owner_id from public.artists where user_id = auth.uid() and is_owner = true;

  update public.bookings
    set archived_at = now(), archived_by = v_owner_id
    where status = 'completed'
      and archived_at is null
      and appointment_date < (current_date - (p_months || ' months')::interval);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.archive_completed_bookings_older_than(int) from public;
grant execute on function public.archive_completed_bookings_older_than(int) to authenticated;

-- Permanently deletes archived inquiries (and their inquiry_images rows)
-- older than p_months months. Returns the number of inquiries deleted.
-- Image *paths* removed are returned too, so the caller can clean up
-- Storage afterward.
create or replace function public.delete_archived_inquiries_older_than(p_months int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_paths jsonb;
begin
  perform public.assert_caller_is_owner();

  if p_months is null or p_months < 0 then
    raise exception 'p_months must be a non-negative number of months.';
  end if;

  select coalesce(jsonb_agg(image_path), '[]'::jsonb) into v_paths
    from public.inquiry_images
    where inquiry_id in (
      select id from public.inquiries
        where archived_at is not null
          and archived_at < (now() - (p_months || ' months')::interval)
    );

  delete from public.inquiries
    where archived_at is not null
      and archived_at < (now() - (p_months || ' months')::interval);

  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted', v_count, 'image_paths', v_paths);
end;
$$;

revoke all on function public.delete_archived_inquiries_older_than(int) from public;
grant execute on function public.delete_archived_inquiries_older_than(int) to authenticated;

-- Permanently deletes archived bookings (and their booking_reference_images
-- rows) older than p_months months — skipping any booking that still has
-- payment records, exactly like the single-record Delete Booking action.
-- Returns how many were deleted and how many were skipped for having
-- payments, plus the image paths to clean up from Storage.
create or replace function public.delete_archived_bookings_older_than(p_months int)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_skipped int;
  v_paths jsonb;
begin
  perform public.assert_caller_is_owner();

  if p_months is null or p_months < 0 then
    raise exception 'p_months must be a non-negative number of months.';
  end if;

  select count(*) into v_skipped
    from public.bookings b
    where b.archived_at is not null
      and b.archived_at < (now() - (p_months || ' months')::interval)
      and exists (select 1 from public.payments p where p.booking_id = b.id);

  select coalesce(jsonb_agg(image_path), '[]'::jsonb) into v_paths
    from public.booking_reference_images
    where booking_id in (
      select b.id from public.bookings b
        where b.archived_at is not null
          and b.archived_at < (now() - (p_months || ' months')::interval)
          and not exists (select 1 from public.payments p where p.booking_id = b.id)
    );

  delete from public.bookings b
    where b.archived_at is not null
      and b.archived_at < (now() - (p_months || ' months')::interval)
      and not exists (select 1 from public.payments p where p.booking_id = b.id);

  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted', v_count, 'skipped_has_payments', v_skipped, 'image_paths', v_paths);
end;
$$;

revoke all on function public.delete_archived_bookings_older_than(int) from public;
grant execute on function public.delete_archived_bookings_older_than(int) to authenticated;

-- Permanently deletes archived payments older than p_months months, only
-- if their status is one this feature ever allows deleting (see
-- app/staff/(protected)/payments/actions.ts's DELETABLE_PAYMENT_STATUSES
-- for why 'pending' and 'failed' are the two — this schema's `payments`
-- CHECK constraint only defines pending/paid/failed/refunded, no separate
-- cancelled/expired status). Returns the number deleted.
create or replace function public.delete_archived_pending_payments_older_than(p_months int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform public.assert_caller_is_owner();

  if p_months is null or p_months < 0 then
    raise exception 'p_months must be a non-negative number of months.';
  end if;

  delete from public.payments
    where archived_at is not null
      and archived_at < (now() - (p_months || ' months')::interval)
      and status in ('pending', 'failed');

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.delete_archived_pending_payments_older_than(int) from public;
grant execute on function public.delete_archived_pending_payments_older_than(int) to authenticated;
