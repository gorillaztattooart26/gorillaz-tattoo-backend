-- Run this once in the Supabase SQL Editor.
--
-- Lets staff view the reference photos customers attach to an inquiry
-- from the /staff/inquiries tab. The `references` Storage bucket is
-- private by design (customer-submitted images shouldn't be publicly
-- browsable), so the dashboard displays them via short-lived signed URLs
-- instead — but generating a signed URL still requires the calling role
-- to have SELECT permission on the underlying storage object, which
-- didn't exist yet (only the public inquiry form's INSERT policy did).
--
-- Scoped to `authenticated` only — the anon/public role still can't read
-- these images, matching the customer-privacy intent of a private bucket.
create policy "Staff can view inquiry reference photos" on storage.objects
  for select to authenticated
  using (bucket_id = 'references');
