-- get_booking_by_token(uuid) is SECURITY DEFINER and returns the full
-- booking row (customer name/email/mobile, tattoo details, appointment,
-- invoice/payment figures) plus the linked artist and reference images.
-- It was previously GRANTed to `anon`, which meant anyone holding a
-- booking token could call it directly through the Supabase REST API
-- (POST /rest/v1/rpc/get_booking_by_token with just the public anon key)
-- and retrieve that data, bypassing the application's own server-side
-- identity verification entirely.
--
-- The application is now the only legitimate caller, and it always
-- invokes this function from trusted server-only code (Server Components
-- / Server Actions, never shipped to the client) using the service_role
-- key. Neither `anon` nor `authenticated` need direct access: anonymous
-- visitors should only reach booking data through the app's verification
-- flow, and staff already read bookings through the `bookings` table's
-- own RLS policies, not through this RPC.

REVOKE EXECUTE ON FUNCTION public.get_booking_by_token(uuid) FROM anon;

REVOKE EXECUTE ON FUNCTION public.get_booking_by_token(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.get_booking_by_token(uuid) FROM PUBLIC;

-- service_role keeps EXECUTE (already granted) — it's the only role the
-- application now uses to call this function.
