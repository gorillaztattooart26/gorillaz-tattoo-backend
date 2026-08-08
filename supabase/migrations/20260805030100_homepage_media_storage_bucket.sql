-- Tracked equivalent of supabase-setup-homepage-media.sql, part 3 (storage
-- bucket only). The homepage_hero and homepage_portfolio_images tables and
-- their RLS policies (parts 1-2 of that script) were already captured in
-- 20260805013917_remote_schema.sql; this migration closes the remaining
-- gap: the `homepage-media` Storage bucket and its storage.objects
-- policies were applied via the Supabase SQL Editor and never had a
-- tracked migration.

insert into storage.buckets (id, name, public)
values ('homepage-media', 'homepage-media', true)
on conflict (id) do nothing;

drop policy if exists "Public can view homepage media" on storage.objects;
create policy "Public can view homepage media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'homepage-media');

drop policy if exists "Staff can upload homepage media" on storage.objects;
create policy "Staff can upload homepage media" on storage.objects
  for insert to authenticated with check (bucket_id = 'homepage-media');

drop policy if exists "Staff can update homepage media" on storage.objects;
create policy "Staff can update homepage media" on storage.objects
  for update to authenticated using (bucket_id = 'homepage-media');

drop policy if exists "Staff can delete homepage media" on storage.objects;
create policy "Staff can delete homepage media" on storage.objects
  for delete to authenticated using (bucket_id = 'homepage-media');
