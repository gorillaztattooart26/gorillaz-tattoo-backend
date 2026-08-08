-- Tracked equivalent of supabase-add-homepage-slideshow.sql. Makes the
-- homepage "Dominate" interstitial slideshow (the full-bleed 4-slide
-- crossfade banner between the Process and Inquire sections) CMS-backed
-- instead of a hardcoded list of images in components/sections/Process.tsx.
--
-- Unlike homepage_hero/homepage_about (single row) or
-- homepage_portfolio_images (fixed 8 slots), this section is a genuinely
-- dynamic, orderable list, so it gets its own table with a real primary
-- key and a display_order column instead of a fixed id/slot.
--
-- The existing static files (public/images/homepage-v2/slider/*.png) stay
-- in place as the fallback used whenever this table is empty or
-- unreachable. Reuses the `homepage-media` Storage bucket (created in
-- 20260805030100_homepage_media_storage_bucket.sql) — slides are stored
-- under the `slideshow/` prefix, no new bucket needed.

create table if not exists homepage_slideshow_images (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  alt text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists homepage_slideshow_images_display_order_idx
  on homepage_slideshow_images (display_order);

alter table homepage_slideshow_images enable row level security;

-- Public homepage read: only active slides, in display order. Matches the
-- read pattern every other homepage_* table already uses (anon + authenticated).
drop policy if exists "Public can read active homepage slideshow images" on homepage_slideshow_images;
create policy "Public can read active homepage slideshow images" on homepage_slideshow_images
  for select to anon, authenticated using (is_active = true);

-- Staff read (dashboard needs to see inactive rows too, if any exist).
drop policy if exists "Staff can read all homepage slideshow images" on homepage_slideshow_images;
create policy "Staff can read all homepage slideshow images" on homepage_slideshow_images
  for select to authenticated using (true);

-- Write access follows the same model as every other homepage_* table:
-- broad `authenticated` RLS, with the actual owner-only restriction
-- enforced in application code (app/staff/(protected)/gallery/homepage-actions.ts
-- — see requireOwner()).
drop policy if exists "Staff can insert homepage slideshow images" on homepage_slideshow_images;
create policy "Staff can insert homepage slideshow images" on homepage_slideshow_images
  for insert to authenticated with check (true);

drop policy if exists "Staff can update homepage slideshow images" on homepage_slideshow_images;
create policy "Staff can update homepage slideshow images" on homepage_slideshow_images
  for update to authenticated using (true);

drop policy if exists "Staff can delete homepage slideshow images" on homepage_slideshow_images;
create policy "Staff can delete homepage slideshow images" on homepage_slideshow_images
  for delete to authenticated using (true);

-- Seed with the 4 real photos already live on the homepage today (same
-- files components/sections/Process.tsx falls back to). Only runs if the
-- table is empty, so it's safe to re-run this migration.
insert into homepage_slideshow_images (image_url, alt, display_order, is_active)
select seed.image_url, seed.alt, seed.display_order, true
from (
  values
    ('/images/homepage-v2/slider/slide-1-concert.png', 'Live show at Gorillaz Tattoo Art — studio community', 0),
    ('/images/homepage-v2/slider/slide-2-bmx.png', 'BMX rider at night — Gorillaz Tattoo Art studio community', 1),
    ('/images/homepage-v2/slider/slide-3-skate.png', 'Tattooed hand resting on a skateboard — Gorillaz Tattoo Art', 2),
    ('/images/homepage-v2/slider/slide-4-swim.png', 'Competitive swimmer training — Gorillaz Tattoo Art studio community', 3)
) as seed(image_url, alt, display_order)
where not exists (select 1 from homepage_slideshow_images);
