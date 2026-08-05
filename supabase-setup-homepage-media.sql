-- Run this once in the Supabase SQL Editor to set up Homepage V2 media
-- management (hero video + studio portfolio strip) as CMS-backed content
-- instead of static files under public/.
--
-- The existing static files (public/videos/homepage-v2/hero-video.mp4 and
-- public/images/portfolio/*, public/images/homepage-v2/hanya-mask-forearm.png)
-- stay in place as fallbacks — the site keeps working exactly as it does
-- today until staff upload replacements through the dashboard.

-- 1. Hero video — single row, fixed id, upserted on replace.
create table if not exists homepage_hero (
  id text primary key default 'hero',
  video_url text not null,
  updated_at timestamptz not null default now()
);

alter table homepage_hero enable row level security;

create policy "Public can read homepage hero" on homepage_hero
  for select to anon, authenticated using (true);

create policy "Staff can upsert homepage hero" on homepage_hero
  for insert to authenticated with check (true);

create policy "Staff can update homepage hero" on homepage_hero
  for update to authenticated using (true);

create policy "Staff can delete homepage hero" on homepage_hero
  for delete to authenticated using (true);

-- 2. Studio portfolio strip — the homepage section's layout (scroll-jack
-- "grow panel" reveal) is bound to exactly 8 tiles playing 8 fixed visual
-- roles (row 1: 3 tiles, row 2: 3 tiles, anchor tile, full-bleed reveal
-- tile). `slot` (0-7) identifies which role a row fills; the layout's
-- ratio/grayscale/crop styling for each slot stays in code (it's part of
-- the approved design), only the photo + alt text are admin-managed.
create table if not exists homepage_portfolio_images (
  slot smallint primary key check (slot >= 0 and slot <= 7),
  image_url text not null,
  alt text not null,
  updated_at timestamptz not null default now()
);

alter table homepage_portfolio_images enable row level security;

create policy "Public can read homepage portfolio images" on homepage_portfolio_images
  for select to anon, authenticated using (true);

create policy "Staff can insert homepage portfolio images" on homepage_portfolio_images
  for insert to authenticated with check (true);

create policy "Staff can update homepage portfolio images" on homepage_portfolio_images
  for update to authenticated using (true);

create policy "Staff can delete homepage portfolio images" on homepage_portfolio_images
  for delete to authenticated using (true);

-- 3. Storage bucket for uploaded hero videos + portfolio photos (public
-- read, staff write/delete). Paths are prefixed `hero/` and `portfolio/`.
insert into storage.buckets (id, name, public)
values ('homepage-media', 'homepage-media', true)
on conflict (id) do nothing;

create policy "Public can view homepage media" on storage.objects
  for select to anon, authenticated using (bucket_id = 'homepage-media');

create policy "Staff can upload homepage media" on storage.objects
  for insert to authenticated with check (bucket_id = 'homepage-media');

create policy "Staff can update homepage media" on storage.objects
  for update to authenticated using (bucket_id = 'homepage-media');

create policy "Staff can delete homepage media" on storage.objects
  for delete to authenticated using (bucket_id = 'homepage-media');
