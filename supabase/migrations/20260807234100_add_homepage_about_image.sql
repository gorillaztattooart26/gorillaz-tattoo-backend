-- Tracked equivalent of supabase-add-about-image.sql. Makes the homepage
-- "About the studio" photo CMS-backed, matching the existing homepage_hero
-- pattern. The static file (public/images/studio/studio-interior.jpg)
-- stays in place as the fallback until staff upload a replacement through
-- the dashboard (see lib/homepage-media.ts:getHomepageAboutImage).
--
-- Reuses the `homepage-media` storage bucket created in
-- 20260805030100_homepage_media_storage_bucket.sql — photos here are
-- stored under the `about/` prefix, no new bucket needed.

create table if not exists homepage_about (
  id text primary key default 'about',
  image_url text not null,
  alt text not null,
  updated_at timestamptz not null default now()
);

alter table homepage_about enable row level security;

drop policy if exists "Public can read homepage about image" on homepage_about;
create policy "Public can read homepage about image" on homepage_about
  for select to anon, authenticated using (true);

drop policy if exists "Staff can insert homepage about image" on homepage_about;
create policy "Staff can insert homepage about image" on homepage_about
  for insert to authenticated with check (true);

drop policy if exists "Staff can update homepage about image" on homepage_about;
create policy "Staff can update homepage about image" on homepage_about
  for update to authenticated using (true);

drop policy if exists "Staff can delete homepage about image" on homepage_about;
create policy "Staff can delete homepage about image" on homepage_about
  for delete to authenticated using (true);
