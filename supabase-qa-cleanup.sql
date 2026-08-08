-- =============================================================================
-- QA environment data cleanup
--
-- Wipes transactional/test data (bookings, payments, inquiries, and their
-- child image tables) while preserving all content, schema, and auth state:
-- artists, gallery_items, homepage_hero, homepage_about,
-- homepage_portfolio_images, homepage_slideshow_images, storage buckets,
-- storage policies, RLS policies, functions, triggers, migration history,
-- and auth.users.
--
-- Schema facts this script relies on (verified against
-- supabase/migrations/20260805013917_remote_schema.sql):
--   - booking_reference_images.booking_id -> bookings.id  (ON DELETE CASCADE)
--   - payments.booking_id                 -> bookings.id  (ON DELETE CASCADE)
--   - inquiry_images.inquiry_id           -> inquiries.id (ON DELETE CASCADE)
--   - No other table references any of these five.
--   - Every primary key is `gen_random_uuid()` — there are no serial/identity
--     columns or sequences on these tables, so there is nothing to reset
--     (step 7 of the request is a no-op here, kept as a no-op comment below
--     rather than inventing a RESTART IDENTITY that doesn't apply).
--
-- Review before running. Nothing in this file executes on its own.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------
-- Step 1: Delete storage objects tied to rows that are about to be deleted.
-- Must run *before* the row deletes below, while image_path values still
-- exist to read.
-- -----------------------------------------------------------------------

-- 1a. inquiry_images -> private `references` bucket.
-- inquiry_images.image_path is stored as the raw object key within the
-- bucket (e.g. "<inquiry_id>/<uuid>-<filename>"), written directly by
-- components/booking/actions.ts — a straight match on storage.objects.name.
DELETE FROM storage.objects
WHERE bucket_id = 'references'
  AND name IN (SELECT image_path FROM public.inquiry_images);

-- 1b. booking_reference_images -> two possible shapes of image_path:
--   - Carried-over photos from an inquiry: a full public URL into the
--     `homepage-media` bucket, written by
--     app/staff/create-booking/actions.ts's copyInquiryReferenceImages()
--     via storage.getPublicUrl(), e.g.
--     ".../storage/v1/object/public/homepage-media/booking-references/<booking_id>/<uuid>-<filename>"
--   - Fallback sample photos: static app assets under /images/portfolio/...
--     (DEFAULT_REFERENCE_IMAGES in the same file) — these are NOT storage
--     objects and must be left alone.
-- Only the first shape is deleted here; the LIKE filter excludes the
-- static fallback paths.
DELETE FROM storage.objects
WHERE bucket_id = 'homepage-media'
  AND name IN (
    SELECT regexp_replace(image_path, '^.*/storage/v1/object/public/homepage-media/', '')
    FROM public.booking_reference_images
    WHERE image_path LIKE '%/storage/v1/object/public/homepage-media/%'
  );

-- -----------------------------------------------------------------------
-- Step 2: Delete table rows in dependency order (children before parents).
-- Relying on the ON DELETE CASCADE above would also work, but deleting
-- explicitly in order is clearer to review and doesn't depend on the
-- cascade being configured the way we expect.
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

-- Optional: confirm preserved tables were untouched (expect non-zero / prior counts).
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
