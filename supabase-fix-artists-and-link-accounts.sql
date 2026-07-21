-- Run this once in the Supabase SQL Editor to:
--   1. Restore the real artist records (the `artists` table got reset to
--      its original placeholder rows — "andrea santos" / "miko reyes" —
--      while working in the SQL Editor on something else).
--   2. Link each artist to their staff login, which the new per-artist
--      gallery scoping (staff Gallery tab) depends on to know whose
--      account is whose.
--
-- Uses UPDATE rather than delete-and-reinsert: bookings.artist_id has a
-- foreign key into this table, and two test bookings already reference
-- the "andrea santos" row's id, so deleting it would fail (and did, the
-- first time this was attempted). Updating in place keeps those ids
-- valid — those two test bookings will now correctly show a real
-- artist's name instead of a placeholder one.

-- 1. Link staff logins to artist identity
alter table artists add column if not exists user_id uuid references auth.users(id) unique;

-- 2. "andrea santos" -> Park Nichole Lladoc (id referenced by 2 test bookings)
update artists set
  slug = 'park-nichole-lladoc',
  name = 'park nichole lladoc',
  specialty = 'black & grey realism',
  years = '13 yrs',
  bio = 'park is a tattoo artist based in the philippines with over 13 years of professional experience. he specializes in realism, black & grey, and hyper-realism, creating detailed, lifelike tattoos that combine technical precision with artistic expression. his work is known for its depth, realism, and commitment to delivering custom pieces that are both visually striking and deeply personal.',
  image_path = '/images/artists/artist-1.jpg',
  instagram_url = 'https://www.instagram.com/parklladoc/',
  facebook_url = 'https://www.facebook.com/park.lladoc',
  user_id = '85d00f64-e70b-4f59-accd-e3f0c153be4c' -- lladocpark@gmail.com
where slug = 'andrea-santos';

-- 3. "miko reyes" -> Isaiah Recongco
update artists set
  slug = 'isaiah-recongco',
  name = 'isaiah recongco',
  specialty = 'black and grey realism & line art',
  years = '1 year',
  bio = 'specializing in black & grey realism | fine-line & minimalist art. focused on technical shading: whip, pointillism, and pendulum shading. transforming stories into skin art.',
  image_path = '/images/artists/artist-2.jpg',
  instagram_url = 'https://www.instagram.com/justsaiinked?igsh=d2o3ZzdyanMzdWNp',
  facebook_url = 'https://www.facebook.com/profile.php?id=61590748843029',
  user_id = 'fed9e3a0-fd2d-48af-a9d6-beaafc3cf413' -- isaiahrecongco@gmail.com
where slug = 'miko-reyes';
