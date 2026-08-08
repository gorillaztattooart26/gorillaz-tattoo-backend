-- Security hardening: `inquiries` and `inquiry_images` genuinely need
-- anon INSERT — components/booking/actions.ts's submitInquiryAction is the
-- public homepage inquiry form, reachable with no login, and must stay
-- that way. Their INSERT policies (`WITH CHECK (true)`) are intentionally
-- left as-is: the form is meant to accept freeform customer input, and
-- there's no narrower condition that matches what the app actually sends
-- without inventing a business rule that doesn't exist today (unlike
-- payments, where "pending, no paid_at" is a real, load-bearing
-- distinction the app already relies on).
--
-- What both tables did have was the project's original broad default
-- privileges (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/TRIGGER/REFERENCES for
-- both anon and authenticated), never scoped down the way
-- 20260805025944 already did for bookings/payments. RLS policies block
-- SELECT/UPDATE/DELETE at the row level regardless (no policy exists for
-- those on these tables, for either role), but TRUNCATE bypasses RLS
-- entirely in Postgres — a role with the base TRUNCATE privilege can wipe
-- the table even though every row-level policy would have blocked a
-- normal DELETE. Closing that the same way 20260805025944 did.
--
-- `anon` keeps only INSERT (inquiries: "Public can submit inquiries",
-- inquiry_images: "Public can attach inquiry images"). `authenticated`
-- keeps only SELECT (inquiries: "Staff can read inquiries", inquiry_images:
-- "Staff can read inquiry images") — matching exactly what the staff
-- Inquiries tab uses (lib/staff/inquiries.ts never inserts, updates, or
-- deletes either table).

revoke select, update, delete, truncate, trigger, references
  on public.inquiries from anon;

revoke insert, update, delete, truncate, trigger, references
  on public.inquiries from authenticated;

revoke select, update, delete, truncate, trigger, references
  on public.inquiry_images from anon;

revoke insert, update, delete, truncate, trigger, references
  on public.inquiry_images from authenticated;
