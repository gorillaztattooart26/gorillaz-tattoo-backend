-- Run this once in the Supabase SQL Editor to set up the gallery
-- CMS (table + RLS + storage bucket) and migrate the 151 existing
-- gallery entries from components/gallery/data.ts into it.
--
-- Existing images stay exactly where they are (public/images/portfolio/*
-- served as static files) — nothing needs to be re-uploaded. The new
-- `gallery` storage bucket is only for photos the staff dashboard
-- uploads going forward.

-- 1. Table
create table if not exists gallery_items (
  id uuid primary key default gen_random_uuid(),
  piece text not null,
  category text not null,
  artist_name text not null,
  alt text not null,
  images text[] not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_items_display_order_idx on gallery_items (display_order);

-- 2. RLS — gallery is public-facing content, so anyone can read it, but
-- only logged-in staff can add/edit/remove pieces.
alter table gallery_items enable row level security;

create policy "Public can read gallery items" on gallery_items
  for select to anon, authenticated using (true);

create policy "Staff can insert gallery items" on gallery_items
  for insert to authenticated with check (true);

create policy "Staff can update gallery items" on gallery_items
  for update to authenticated using (true);

create policy "Staff can delete gallery items" on gallery_items
  for delete to authenticated using (true);

-- 3. Storage bucket for newly-uploaded photos (public read, staff write)
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy "Public can view gallery photos" on storage.objects
  for select to anon, authenticated using (bucket_id = 'gallery');

create policy "Staff can upload gallery photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery');

create policy "Staff can delete gallery photos" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery');

-- 4. Seed data — the 151 entries currently hardcoded in
-- components/gallery/data.ts, carried over as-is (same photos, same
-- order, same captions).
insert into gallery_items (piece, category, artist_name, alt, images, display_order) values
('hyper-realism piece 1', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-49.jpg']::text[], 0),
('hyper-realism piece 2', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-50.jpg']::text[], 1),
('hyper-realism piece 3', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-19.jpg']::text[], 2),
('hyper-realism piece 4', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-51.jpg']::text[], 3),
('hyper-realism piece 7', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-54.jpg']::text[], 4),
('hyper-realism piece 8', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-55.jpg']::text[], 5),
('hyper-realism piece 11', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-58.jpg']::text[], 6),
('hyper-realism piece 12', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 12 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-59.jpg']::text[], 7),
('hyper-realism piece 13', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 13 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-60.jpg']::text[], 8),
('hyper-realism piece 15', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 15 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-29.jpg']::text[], 9),
('hyper-realism piece 16', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 16 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-62.jpg']::text[], 10),
('hyper-realism piece 17', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 17 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-63.jpg']::text[], 11),
('hyper-realism piece 18', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 18 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-64.jpg']::text[], 12),
('hyper-realism piece 19', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 19 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-65.jpg']::text[], 13),
('hyper-realism piece 21', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 21 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-67.jpg']::text[], 14),
('hyper-realism piece 22', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 22 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-33.jpg']::text[], 15),
('hyper-realism piece 23', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 23 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-68.jpg']::text[], 16),
('hyper-realism piece 24', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 24 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-34.jpg']::text[], 17),
('hyper-realism piece 25', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 25 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-69.jpg']::text[], 18),
('hyper-realism piece 27', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 27 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-35.jpg']::text[], 19),
('hyper-realism piece 28', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 28 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-70.jpg']::text[], 20),
('hyper-realism piece 30', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 30 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-71.jpg']::text[], 21),
('hyper-realism piece 31', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 31 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-72.jpg']::text[], 22),
('hyper-realism piece 32', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 32 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-73.jpg']::text[], 23),
('hyper-realism piece 33', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 33 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-74.jpg']::text[], 24),
('hyper-realism piece 34', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 34 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-75.jpg']::text[], 25),
('hyper-realism piece 35', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 35 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-76.jpg']::text[], 26),
('hyper-realism piece 36', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 36 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-77.jpg']::text[], 27),
('hyper-realism piece 37', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 37 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-78.jpg']::text[], 28),
('hyper-realism piece 38', 'hyper-realism', 'park nichole lladoc', 'hyper-realism tattoo piece 38 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-38.jpg']::text[], 29),
('realism piece 1', 'realism', 'park nichole lladoc', 'realism tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-49.jpg']::text[], 30),
('realism piece 2', 'realism', 'park nichole lladoc', 'realism tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-125.jpg']::text[], 31),
('realism piece 4', 'realism', 'park nichole lladoc', 'realism tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-59.jpg']::text[], 32),
('realism piece 5', 'realism', 'park nichole lladoc', 'realism tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-65.jpg']::text[], 33),
('realism piece 6', 'realism', 'park nichole lladoc', 'realism tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-126.jpg']::text[], 34),
('realism piece 8', 'realism', 'park nichole lladoc', 'realism tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-127.jpg']::text[], 35),
('realism piece 9', 'realism', 'park nichole lladoc', 'realism tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-71.jpg']::text[], 36),
('realism piece 10', 'realism', 'park nichole lladoc', 'realism tattoo piece 10 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-72.jpg']::text[], 37),
('realism piece 11', 'realism', 'park nichole lladoc', 'realism tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-73.jpg']::text[], 38),
('realism piece 12', 'realism', 'park nichole lladoc', 'realism tattoo piece 12 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-75.jpg']::text[], 39),
('realism piece 13', 'realism', 'park nichole lladoc', 'realism tattoo piece 13 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-76.jpg']::text[], 40),
('realism piece 14', 'realism', 'park nichole lladoc', 'realism tattoo piece 14 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-77.jpg']::text[], 41),
('realism piece 15', 'realism', 'park nichole lladoc', 'realism tattoo piece 15 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-78.jpg']::text[], 42),
('realism piece 16', 'realism', 'park nichole lladoc', 'realism tattoo piece 16 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-128.jpg']::text[], 43),
('realism piece 17', 'realism', 'park nichole lladoc', 'realism tattoo piece 17 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-129.jpg']::text[], 44),
('realism piece 18', 'realism', 'park nichole lladoc', 'realism tattoo piece 18 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-130.jpg']::text[], 45),
('realism piece 19', 'realism', 'park nichole lladoc', 'realism tattoo piece 19 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-131.jpg']::text[], 46),
('realism piece 20', 'realism', 'park nichole lladoc', 'realism tattoo piece 20 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-132.jpg']::text[], 47),
('anime piece 12', 'anime', 'park nichole lladoc', 'anime dragon ball full sleeve tattoo by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-138.jpg', '/images/portfolio/portfolio-133.jpg', '/images/portfolio/portfolio-134.jpg', '/images/portfolio/portfolio-135.jpg', '/images/portfolio/portfolio-136.jpg', '/images/portfolio/portfolio-137.jpg']::text[], 48),
('anime piece 5', 'anime', 'park nichole lladoc', 'anime tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-11.jpg']::text[], 49),
('anime piece 7', 'anime', 'park nichole lladoc', 'anime tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-13.jpg']::text[], 50),
('anime piece 8', 'anime', 'park nichole lladoc', 'anime tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-14.jpg']::text[], 51),
('anime piece 9', 'anime', 'park nichole lladoc', 'anime tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-15.jpg']::text[], 52),
('anime piece 10', 'anime', 'park nichole lladoc', 'anime tattoo piece 10 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-16.jpg']::text[], 53),
('anime piece 11', 'anime', 'park nichole lladoc', 'anime tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-17.jpg']::text[], 54),
('blackwork piece 1', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-19.jpg']::text[], 55),
('blackwork piece 2', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-20.jpg']::text[], 56),
('blackwork piece 3', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-21.jpg']::text[], 57),
('blackwork piece 4', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-22.jpg']::text[], 58),
('blackwork piece 5', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-23.jpg']::text[], 59),
('blackwork piece 6', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-24.jpg']::text[], 60),
('blackwork piece 8', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-26.jpg']::text[], 61),
('blackwork piece 9', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-27.jpg']::text[], 62),
('blackwork piece 10', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 10 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-28.jpg']::text[], 63),
('blackwork piece 11', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-29.jpg']::text[], 64),
('blackwork piece 12', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 12 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-30.jpg']::text[], 65),
('blackwork piece 13', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 13 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-31.jpg']::text[], 66),
('blackwork piece 14', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 14 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-32.jpg']::text[], 67),
('blackwork piece 15', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 15 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-33.jpg']::text[], 68),
('blackwork piece 16', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 16 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-34.jpg']::text[], 69),
('blackwork piece 17', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 17 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-35.jpg']::text[], 70),
('blackwork piece 18', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 18 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-36.jpg']::text[], 71),
('blackwork piece 19', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 19 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-37.jpg']::text[], 72),
('blackwork piece 20', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 20 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-38.jpg']::text[], 73),
('blackwork piece 21', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 21 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-39.jpg']::text[], 74),
('blackwork piece 22', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 22 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-40.jpg']::text[], 75),
('blackwork piece 23', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 23 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-41.jpg']::text[], 76),
('blackwork piece 24', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 24 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-42.jpg']::text[], 77),
('blackwork piece 25', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 25 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-43.jpg']::text[], 78),
('blackwork piece 26', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 26 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-44.jpg']::text[], 79),
('blackwork piece 27', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 27 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-45.jpg']::text[], 80),
('blackwork piece 28', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 28 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-46.jpg']::text[], 81),
('blackwork piece 29', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 29 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-47.jpg']::text[], 82),
('blackwork piece 30', 'blackwork', 'park nichole lladoc', 'blackwork tattoo piece 30 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-48.jpg']::text[], 83),
('blackwork piece 31', 'blackwork', 'park nichole lladoc', 'blackwork guardian lion and all-seeing eye full sleeve tattoo by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-139.jpg', '/images/portfolio/portfolio-140.jpg']::text[], 84),
('japanese piece 1', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-79.jpg']::text[], 85),
('japanese piece 3', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-81.jpg']::text[], 86),
('japanese piece 4', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-67.jpg']::text[], 87),
('japanese piece 5', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-82.jpg']::text[], 88),
('japanese piece 6', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-83.jpg']::text[], 89),
('japanese piece 7', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-34.jpg']::text[], 90),
('japanese piece 8', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-84.jpg']::text[], 91),
('japanese piece 9', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-85.jpg']::text[], 92),
('japanese piece 10', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 10 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-86.jpg']::text[], 93),
('japanese piece 11', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-87.jpg']::text[], 94),
('japanese piece 12', 'japanese', 'park nichole lladoc', 'japanese tattoo piece 12 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-88.jpg']::text[], 95),
('line art piece 1', 'line art', 'park nichole lladoc', 'line art tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-90.jpg']::text[], 96),
('line art piece 2', 'line art', 'park nichole lladoc', 'line art tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-91.jpg']::text[], 97),
('line art piece 3', 'line art', 'park nichole lladoc', 'line art tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-92.jpg']::text[], 98),
('line art piece 4', 'line art', 'park nichole lladoc', 'line art tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-93.jpg']::text[], 99),
('line art piece 5', 'line art', 'park nichole lladoc', 'line art tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-94.jpg']::text[], 100),
('line art piece 6', 'line art', 'park nichole lladoc', 'line art tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-95.jpg']::text[], 101),
('line art piece 7', 'line art', 'park nichole lladoc', 'line art tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-96.jpg']::text[], 102),
('line art piece 8', 'line art', 'park nichole lladoc', 'line art tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-80.jpg']::text[], 103),
('line art piece 9', 'line art', 'park nichole lladoc', 'line art tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-97.jpg']::text[], 104),
('line art piece 10', 'line art', 'park nichole lladoc', 'line art tattoo piece 10 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-98.jpg']::text[], 105),
('line art piece 11', 'line art', 'park nichole lladoc', 'line art tattoo piece 11 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-99.jpg']::text[], 106),
('line art piece 12', 'line art', 'park nichole lladoc', 'line art tattoo piece 12 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-100.jpg']::text[], 107),
('line art piece 13', 'line art', 'park nichole lladoc', 'line art tattoo piece 13 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-101.jpg']::text[], 108),
('minimalist piece 1', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-102.jpg']::text[], 109),
('minimalist piece 2', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-97.jpg']::text[], 110),
('minimalist piece 3', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-11.jpg']::text[], 111),
('minimalist piece 4', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-103.jpg']::text[], 112),
('minimalist piece 5', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-100.jpg']::text[], 113),
('minimalist piece 6', 'minimalist', 'park nichole lladoc', 'minimalist tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-104.jpg']::text[], 114),
('neo traditional piece 1', 'neo traditional', 'park nichole lladoc', 'neo traditional tattoo piece 1 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-105.jpg']::text[], 115),
('neo traditional piece 2', 'neo traditional', 'park nichole lladoc', 'neo traditional tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-106.jpg']::text[], 116),
('neo traditional piece 3', 'neo traditional', 'park nichole lladoc', 'neo traditional tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-107.jpg']::text[], 117),
('neo traditional piece 7', 'neo traditional', 'park nichole lladoc', 'neo traditional tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-110.jpg']::text[], 118),
('polynesian piece 2', 'polynesian', 'park nichole lladoc', 'polynesian tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-112.jpg']::text[], 119),
('polynesian piece 8', 'polynesian', 'park nichole lladoc', 'polynesian tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-117.jpg']::text[], 120),
('polynesian piece 9', 'polynesian', 'park nichole lladoc', 'polynesian tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-41.jpg']::text[], 121),
('polynesian piece 11', 'polynesian', 'park nichole lladoc', 'polynesian tribal forearm sleeve tattoo by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-141.jpg', '/images/portfolio/portfolio-142.jpg', '/images/portfolio/portfolio-143.jpg']::text[], 122),
('polynesian piece 12', 'polynesian', 'park nichole lladoc', 'polynesian lotus mandala leg sleeve tattoo by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-144.jpg', '/images/portfolio/portfolio-145.jpg']::text[], 123),
('portrait piece 2', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 2 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-120.jpg']::text[], 124),
('portrait piece 3', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 3 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-33.jpg']::text[], 125),
('portrait piece 4', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 4 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-72.jpg']::text[], 126),
('portrait piece 5', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 5 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-40.jpg']::text[], 127),
('portrait piece 6', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 6 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-121.jpg']::text[], 128),
('portrait piece 7', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 7 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-122.jpg']::text[], 129),
('portrait piece 8', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 8 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-123.jpg']::text[], 130),
('portrait piece 9', 'portrait', 'park nichole lladoc', 'portrait tattoo piece 9 by park nichole lladoc — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-124.jpg']::text[], 131),
('anime piece 13', 'anime', 'isaiah recongco', 'anime titan transformation calf tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-146.jpg']::text[], 132),
('blackwork piece 32', 'blackwork', 'isaiah recongco', 'blackwork skull and mushrooms shoulder tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-147.jpg']::text[], 133),
('blackwork piece 33', 'blackwork', 'isaiah recongco', 'blackwork ancient tree face forearm tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-148.jpg']::text[], 134),
('blackwork piece 34', 'blackwork', 'isaiah recongco', 'blackwork scorpion and flowers forearm tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-149.jpg']::text[], 135),
('blackwork piece 35', 'blackwork', 'isaiah recongco', 'blackwork winged cross chest tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-150.jpg']::text[], 136),
('japanese piece 13', 'japanese', 'isaiah recongco', 'japanese hannya mask and katana forearm tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-151.jpg']::text[], 137),
('japanese piece 14', 'japanese', 'isaiah recongco', 'japanese maneki-neko lucky cat and matryoshka doll leg tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-152.jpg']::text[], 138),
('japanese piece 15', 'japanese', 'isaiah recongco', 'japanese samurai and hannya mask leg sleeve tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-153.jpg']::text[], 139),
('japanese piece 16', 'japanese', 'isaiah recongco', 'japanese koi fish and kanji script spine tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-154.jpg']::text[], 140),
('japanese piece 17', 'japanese', 'isaiah recongco', 'japanese geisha and dragon leg tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-155.jpg']::text[], 141),
('line art piece 14', 'line art', 'isaiah recongco', 'fine line lily flowers spine tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-156.jpg']::text[], 142),
('line art piece 15', 'line art', 'isaiah recongco', 'fine line lily flower rib tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-157.jpg']::text[], 143),
('line art piece 16', 'line art', 'isaiah recongco', 'fine line lily flower and stars ribcage tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-158.jpg']::text[], 144),
('minimalist piece 7', 'minimalist', 'isaiah recongco', 'minimalist butterfly and stars hip tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-159.jpg']::text[], 145),
('minimalist piece 8', 'minimalist', 'isaiah recongco', 'minimalist color storm cloud forearm tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-160.jpg']::text[], 146),
('minimalist piece 9', 'minimalist', 'isaiah recongco', 'minimalist red ink florals hip tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-161.jpg']::text[], 147),
('minimalist piece 10', 'minimalist', 'isaiah recongco', 'minimalist blackwork symbols neck tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-162.jpg']::text[], 148),
('minimalist piece 11', 'minimalist', 'isaiah recongco', 'minimalist red ink name script forearm tattoo by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-163.jpg']::text[], 149),
('minimalist piece 12', 'minimalist', 'isaiah recongco', 'minimalist matching four elements symbol tattoos by isaiah recongco — gorillaz tattoo art studio philippines', ARRAY['/images/portfolio/portfolio-164.jpg']::text[], 150);
