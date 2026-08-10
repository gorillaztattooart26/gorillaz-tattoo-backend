-- Closes a defense-in-depth gap left by 20260810140000: that migration
-- scoped every homepage_* INSERT/UPDATE/DELETE to owner-only, but left
-- homepage_slideshow_images' staff SELECT policy as `USING (true)`,
-- reasoning it was "public marketing-site content." It isn't quite —
-- the anon/authenticated "active only" policy already covers the public
-- content; the separate staff-wide policy exists specifically so the
-- owner CMS can see draft/inactive rows before publishing them
-- (lib/staff/homepage-media.ts's getStaffSlideshowImages, rendered only
-- behind the `artist.is_owner` check in
-- app/staff/(protected)/gallery/page.tsx). No application code path
-- gives a non-owner artist a legitimate reason to see inactive slides,
-- so scope the staff-wide policy to owner, matching every other
-- homepage_* write policy's ownership model.
--
-- Reuses public.is_current_user_owner() (SECURITY DEFINER, created in
-- 20260810140000) — no new function needed.
--
-- The "Public can read active homepage slideshow images" policy
-- (anon + authenticated, is_active = true) is untouched, so public
-- homepage behavior and non-owner active-slide visibility don't change.

drop policy if exists "Staff can read all homepage slideshow images" on public.homepage_slideshow_images;
create policy "Owner can read all homepage slideshow images" on public.homepage_slideshow_images
  for select to authenticated
  using (public.is_current_user_owner());
