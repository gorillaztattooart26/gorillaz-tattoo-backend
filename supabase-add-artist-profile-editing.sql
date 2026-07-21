-- Run this once in the Supabase SQL Editor to support the new staff
-- Artists tab (self-service profile editing) and to make the homepage
-- artist section read from this table instead of hardcoded content.
--
-- No new Storage bucket is needed — profile photo uploads reuse the
-- existing `gallery` bucket (already public-read, authenticated-write).

-- 1. Explicit ordering, since Park and Isaiah share the exact same
--    created_at timestamp (both written in the same original seed
--    statement) and the homepage needs a stable, intentional order.
alter table artists add column if not exists display_order integer not null default 0;

update artists set display_order = 0 where slug = 'park-nichole-lladoc';
update artists set display_order = 1 where slug = 'isaiah-recongco';

-- 2. Let a staff member update their own artist row (and only their own —
--    scoped by user_id, same ownership pattern as the Gallery tab's
--    delete check, just enforced here at the RLS layer instead of in
--    application code).
create policy "Staff can update their own artist profile" on artists
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
