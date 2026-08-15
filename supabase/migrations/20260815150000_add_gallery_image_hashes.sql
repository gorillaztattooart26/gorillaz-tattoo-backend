-- Exact-duplicate image prevention (Phase 3) — one row per individual
-- portfolio photo (a gallery_items row with 3 images gets 3 rows here),
-- recording the SHA-256 of that photo's actual file bytes. The `UNIQUE
-- (file_hash)` constraint is the real safety boundary: createGalleryItemAction
-- checks submitted hashes against this table before uploading anything, but
-- that application-level check has a TOCTOU race under concurrent staff
-- uploads, so the database constraint is what actually stops two identical
-- photos from ever both being registered, regardless of what the
-- application layer does or doesn't catch first.
--
-- Deliberately a separate table rather than a hash column on gallery_items:
-- gallery_items.images is a variable-length array (one row can hold several
-- photos), and a per-array-element UNIQUE constraint isn't expressible on a
-- text[] column in Postgres. One-row-per-image is also what makes the
-- ON DELETE CASCADE below correct — deleting a gallery_items row should
-- free up every hash it registered, not just one.
create table public.gallery_image_hashes (
  id              uuid        primary key default gen_random_uuid(),
  gallery_item_id uuid        not null references public.gallery_items(id) on delete cascade,
  image_url       text        not null,
  file_hash       text        not null,
  created_at      timestamptz not null default now(),
  constraint gallery_image_hashes_file_hash_key unique (file_hash)
);

-- Serves gallery_items → its hash rows lookups (e.g. cascading delete
-- housekeeping, future backfill/audit queries) — same rationale as every
-- other FK index in this project (reminder_deliveries.booking_id,
-- artist_availability_blocks.artist_id).
create index gallery_image_hashes_gallery_item_id_idx
  on public.gallery_image_hashes (gallery_item_id);

-- This table has no legitimate client-facing read or write path — it is a
-- pure server-side integrity mechanism for createGalleryItemAction's
-- duplicate check, called via the service-role client (getSupabaseAdmin()),
-- which bypasses RLS entirely. RLS is still enabled with zero policies,
-- and the default table-level grants are explicitly revoked from anon and
-- authenticated, so there is no path to this table for either role even
-- via a future policy added in error — identical defense-in-depth pattern
-- to rate_limit_counters (20260810170000). Critically, `authenticated`
-- (i.e. Park) must NOT be able to read, insert, or delete hash rows
-- directly: allowing that would let a staff account either discover other
-- artists' unpublished image hashes or manually delete/fabricate a hash
-- row to bypass duplicate protection for their own uploads.
alter table public.gallery_image_hashes enable row level security;
revoke all on public.gallery_image_hashes from anon;
revoke all on public.gallery_image_hashes from authenticated;

-- service_role already has table privileges via this project's default-
-- privilege grant (20260805013917_remote_schema.sql) and bypasses RLS
-- entirely — no explicit grant needed for it.
