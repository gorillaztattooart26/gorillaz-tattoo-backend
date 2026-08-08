-- Soft-delete support for the Owner data-management dashboard (Archive /
-- Restore / Delete on Bookings, Inquiries, Payments). Timestamps rather
-- than a boolean flag, per the design brief: `archived_at` alone tells us
-- both "is it archived" (NULL check) and "when" — a boolean would lose the
-- second half for free. `archived_by` records which artist archived it
-- (nullable, set null if that artist is ever removed — an archived record
-- shouldn't become undeletable just because the staff account that
-- archived it is gone).
--
-- `booking_reference_images` and `inquiry_images` intentionally do NOT get
-- their own archive columns — they live and die with their parent
-- (booking/inquiry) via existing `ON DELETE CASCADE` FKs, and the feature
-- spec never asks to archive an image independent of its parent record.

alter table public.bookings
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.artists(id) on delete set null;

alter table public.inquiries
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.artists(id) on delete set null;

alter table public.payments
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.artists(id) on delete set null;

-- Every list view on these three tables will filter on "is archived_at
-- null" (active) or "is archived_at not null" (archived) on every load —
-- worth a partial index each rather than a full-column index, since the
-- common case (mostly active rows) keeps the archived-side index tiny.
create index if not exists bookings_archived_at_idx on public.bookings (archived_at) where archived_at is not null;
create index if not exists inquiries_archived_at_idx on public.inquiries (archived_at) where archived_at is not null;
create index if not exists payments_archived_at_idx on public.payments (archived_at) where archived_at is not null;
