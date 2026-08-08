-- Tracked equivalent of supabase-add-artist-owner-flag.sql. Marks Park
-- Nichole Lladoc as studio owner. Owner artists see every booking (and its
-- unique booking link) in the staff dashboard's Bookings tab; every other
-- artist only sees bookings assigned to them.

alter table artists add column if not exists is_owner boolean not null default false;

update artists set is_owner = true where slug = 'park-nichole-lladoc';
