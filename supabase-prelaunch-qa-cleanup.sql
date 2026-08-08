-- =============================================================================
-- Pre-launch production cleanup — clear test data before final Manual QA
--
-- TARGET: production Supabase project (mbatxrlijcueciegwkgy — this repo's
-- only linked project). Confirmed by the requester: no real customer
-- bookings/inquiries exist yet (pre-launch); all rows in the five tables
-- below are test data safe to delete.
--
-- Wipes: bookings, booking_reference_images, payments, inquiries,
-- inquiry_images — plus the customer-uploaded reference images those rows
-- point to in Storage.
--
-- Explicitly untouched (not referenced anywhere in this script):
-- artists, gallery_items, homepage_hero, homepage_about,
-- homepage_portfolio_images, homepage_slideshow_images, the
-- `gallery`/`homepage-media` storage buckets and their objects other than
-- the specific carried-over booking-reference objects identified below,
-- all storage policies, all RLS policies, all functions, all triggers,
-- migration history, auth.users, staff accounts, owner permissions
-- (artists.is_owner), application settings.
--
-- Schema facts this script relies on (verified against
-- supabase/migrations/20260805013917_remote_schema.sql):
--   - booking_reference_images.booking_id -> bookings.id  (ON DELETE CASCADE)
--   - payments.booking_id                 -> bookings.id  (ON DELETE CASCADE)
--   - inquiry_images.inquiry_id           -> inquiries.id (ON DELETE CASCADE)
--   - No other table references any of these five.
--   - Every primary key on these tables is `gen_random_uuid()` — there are
--     no serial/identity columns or sequences to reset.
--
-- NOT executed. Review before running against production.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Step 1: Delete storage objects tied to rows about to be deleted.
-- Must run before the row deletes below, while image_path values still
-- exist to read.
-- -----------------------------------------------------------------------

-- 1a. inquiry_images -> private `references` bucket.
-- image_path is the raw object key within the bucket (e.g.
-- "<inquiry_id>/<uuid>-<filename>"), written by
-- components/booking/actions.ts. These are always customer-uploaded
-- reference photos from the public inquiry form — nothing else is stored
-- in this bucket.
DELETE FROM storage.objects
WHERE bucket_id = 'references'
  AND name IN (SELECT image_path FROM public.inquiry_images);

-- 1b. booking_reference_images -> lives in ONE of two shapes:
--   - Carried-over customer photos: a full public URL into the
--     `homepage-media` bucket under the `booking-references/` prefix,
--     written by app/staff/create-booking/actions.ts's
--     copyInquiryReferenceImages() via storage.getPublicUrl().
--   - Fallback sample photos: static app assets under /images/portfolio/
--     (DEFAULT_REFERENCE_IMAGES in the same file) — NOT storage objects,
--     must not be touched.
-- The bucket_id + prefix filter below is deliberately narrow so this can
-- never match real homepage CMS media (hero video, about photo,
-- portfolio tiles, slideshow images) that also lives in `homepage-media`
-- outside the `booking-references/` prefix.
DELETE FROM storage.objects
WHERE bucket_id = 'homepage-media'
  AND name LIKE 'booking-references/%'
  AND name IN (
    SELECT regexp_replace(image_path, '^.*/storage/v1/object/public/homepage-media/', '')
    FROM public.booking_reference_images
    WHERE image_path LIKE '%/storage/v1/object/public/homepage-media/booking-references/%'
  );

-- -----------------------------------------------------------------------
-- Step 2: Delete table rows in dependency order (children before parents).
-- -----------------------------------------------------------------------

-- Children of bookings:
DELETE FROM public.payments;
DELETE FROM public.booking_reference_images;

-- Parent:
DELETE FROM public.bookings;

-- Children of inquiries:
DELETE FROM public.inquiry_images;

-- Parent:
DELETE FROM public.inquiries;

-- -----------------------------------------------------------------------
-- Step 3: Sequences/identities.
-- No-op: every table above uses `id uuid DEFAULT gen_random_uuid()`, not a
-- serial/identity column, so there is no sequence to reset.
-- -----------------------------------------------------------------------

COMMIT;

-- =============================================================================
-- Verification — run after COMMIT. All five counts must read 0.
-- =============================================================================
SELECT 'bookings' AS table_name, count(*) AS row_count FROM public.bookings
UNION ALL
SELECT 'booking_reference_images', count(*) FROM public.booking_reference_images
UNION ALL
SELECT 'payments', count(*) FROM public.payments
UNION ALL
SELECT 'inquiries', count(*) FROM public.inquiries
UNION ALL
SELECT 'inquiry_images', count(*) FROM public.inquiry_images;

-- Preserved tables — expect unchanged row counts vs. before this script ran.
SELECT 'artists' AS table_name, count(*) AS row_count FROM public.artists
UNION ALL
SELECT 'gallery_items', count(*) FROM public.gallery_items
UNION ALL
SELECT 'homepage_hero', count(*) FROM public.homepage_hero
UNION ALL
SELECT 'homepage_about', count(*) FROM public.homepage_about
UNION ALL
SELECT 'homepage_portfolio_images', count(*) FROM public.homepage_portfolio_images
UNION ALL
SELECT 'homepage_slideshow_images', count(*) FROM public.homepage_slideshow_images;

-- Preserved storage — spot-check counts for the two touched buckets,
-- restricted to prefixes this script never deletes from. Compare before/after.
SELECT 'homepage-media (outside booking-references/)' AS bucket_scope, count(*) AS object_count
FROM storage.objects
WHERE bucket_id = 'homepage-media'
  AND name NOT LIKE 'booking-references/%'
UNION ALL
SELECT 'gallery (untouched bucket)', count(*)
FROM storage.objects
WHERE bucket_id = 'gallery';
