-- Run this once in the Supabase SQL Editor to make the homepage "Dominate"
-- interstitial slideshow (the full-bleed 4-slide crossfade banner between
-- the Process and Inquire sections) CMS-backed instead of a hardcoded list
-- of images in components/sections/Process.tsx.
--
-- Unlike homepage_hero/homepage_about (single row) or
-- homepage_portfolio_images (fixed 8 slots), this section is a genuinely
-- dynamic, orderable list — the owner can add/remove/reorder any number of
-- slides — so it gets its own table with a real primary key and a
-- display_order column instead of a fixed id/slot.
--
-- The existing static files (public/images/homepage-v2/slider/*.png) stay
-- in place as the fallback used whenever this table is empty or unreachable
-- — the homepage keeps working exactly as it does today until the owner
-- uploads slides through the dashboard.

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
create policy "Public can read active homepage slideshow images" on homepage_slideshow_images
  for select to anon, authenticated using (is_active = true);

-- Staff read (dashboard needs to see inactive rows too, if any exist).
create policy "Staff can read all homepage slideshow images" on homepage_slideshow_images
  for select to authenticated using (true);

-- Write access follows the same model as every other homepage_* table:
-- broad `authenticated` RLS, with the actual owner-only restriction
-- enforced in application code (app/staff/(protected)/gallery/homepage-actions.ts
-- — see requireOwner()), consistent with how this project already handles
-- the hero video and About photo. Not tightening RLS itself keeps this
-- migration additive and low-risk; revisit if per-role DB policies are
-- ever introduced project-wide.
create policy "Staff can insert homepage slideshow images" on homepage_slideshow_images
  for insert to authenticated with check (true);

create policy "Staff can update homepage slideshow images" on homepage_slideshow_images
  for update to authenticated using (true);

create policy "Staff can delete homepage slideshow images" on homepage_slideshow_images
  for delete to authenticated using (true);

-- Reuses the existing `homepage-media` Storage bucket (already public-read,
-- staff-write, created by supabase-setup-homepage-media.sql) — slides are
-- stored under the `slideshow/` prefix, no new bucket needed.

-- Seed with the 4 real photos already live on the homepage today (same
-- files components/sections/Process.tsx falls back to), so the owner's
-- dashboard opens with real, manageable slides instead of an empty state
-- that would otherwise make them re-upload photos that are already on the
-- site. These are existing static files under public/images/homepage-v2/
-- slider/ — no Storage upload needed for the seed itself; replacing any of
-- them through the dashboard uploads a real file to Storage as normal.
-- Only runs if the table is empty, so it's safe to re-run this script.
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
