-- Run this once in the Supabase SQL Editor to make the homepage "About the
-- studio" photo CMS-backed, matching the existing homepage_hero pattern.
-- The static file (public/images/studio/studio-interior.jpg) stays in
-- place as the fallback until staff upload a replacement through the
-- dashboard.

create table if not exists homepage_about (
  id text primary key default 'about',
  image_url text not null,
  alt text not null,
  updated_at timestamptz not null default now()
);

alter table homepage_about enable row level security;

create policy "Public can read homepage about image" on homepage_about
  for select to anon, authenticated using (true);

create policy "Staff can insert homepage about image" on homepage_about
  for insert to authenticated with check (true);

create policy "Staff can update homepage about image" on homepage_about
  for update to authenticated using (true);

create policy "Staff can delete homepage about image" on homepage_about
  for delete to authenticated using (true);

-- Reuses the existing `homepage-media` storage bucket (already public-read,
-- staff-write) created by supabase-setup-homepage-media.sql — photos here
-- are stored under the `about/` prefix.
