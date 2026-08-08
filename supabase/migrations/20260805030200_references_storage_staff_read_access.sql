-- Tracked equivalent of supabase-add-staff-references-read-access.sql,
-- plus the live project's "Public can upload reference images" policy
-- (confirmed against the live Supabase project — not present in any
-- standalone script, added here purely to close the tracking gap).
--
-- Lets staff view the reference photos customers attach to an inquiry or
-- booking from the staff dashboard (lib/staff/inquiries.ts,
-- app/staff/create-booking/actions.ts). The `references` bucket is
-- private by design (customer-submitted images shouldn't be publicly
-- browsable) — the dashboard displays them via short-lived signed URLs,
-- which still requires the calling role to have SELECT on the underlying
-- storage object.
--
-- The public inquiry form (components/booking/actions.ts) uploads
-- reference images as `anon` before the visitor has any session — that
-- upload path is what "Public can upload reference images" grants.
--
-- The bucket itself was never created by a tracked script (confirmed by
-- auditing every supabase-*.sql file and supabase/migrations/ — see the
-- migration-drift report). It is created here, private, for fresh-project
-- parity; ON CONFLICT DO NOTHING makes this a no-op against the live
-- project where it already exists.
--
-- NOTE (unchanged from the prior audit, not addressed by this migration):
-- app/staff/create-booking/actions.ts also uploads to this bucket, as
-- `authenticated` staff, but the live project's only INSERT policy is
-- scoped to `anon`. That's a real behavioral question for the app, not a
-- tracking gap — matching the live policy exactly (per instruction) means
-- not inventing an `authenticated` INSERT grant that doesn't exist today.

insert into storage.buckets (id, name, public)
values ('references', 'references', false)
on conflict (id) do nothing;

drop policy if exists "Staff can view inquiry reference photos" on storage.objects;
create policy "Staff can view inquiry reference photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'references');

drop policy if exists "Public can upload reference images" on storage.objects;
create policy "Public can upload reference images" on storage.objects
  for insert to anon
  with check (bucket_id = 'references');
