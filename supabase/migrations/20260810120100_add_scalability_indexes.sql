-- Scalability indexes for hot filter/join/sort paths, identified by
-- auditing every `.eq()/.in()/.order()` call against these tables across
-- lib/, app/, and components/. Skips anything already covered by an
-- existing PRIMARY KEY, UNIQUE constraint, or partial index:
--   - bookings.token, bookings.booking_id, payments.checkout_session_id
--     are already UNIQUE (see 20260805013917_remote_schema.sql).
--   - bookings.archived_at, inquiries.archived_at, payments.archived_at
--     already have partial indexes (see 20260808200000_add_archive_columns.sql).
--   - gallery_items.display_order already has an index; homepage_hero and
--     homepage_portfolio_images are tiny, fixed-cardinality tables (looked
--     up only by their primary key) with no query pattern that would
--     benefit from an index.

-- bookings: every staff list scopes by artist_id (getBookingsForStaffArtist,
-- getRecentBookingsForStaffArtist, getBookingCountsForStaffArtist in
-- lib/staff/bookings.ts), and checkBookingConflict
-- (lib/staff/booking-availability.ts) filters artist_id + appointment_date
-- together on every new booking / reschedule. artist_id is a foreign key,
-- which Postgres does not index automatically. A composite index serves
-- both: its leading column alone accelerates the plain artist_id filters,
-- and the full pair accelerates the conflict check.
create index if not exists bookings_artist_id_appointment_date_idx
  on public.bookings (artist_id, appointment_date);

-- Every unscoped staff/dashboard list (getBookings, getRecentBookings, the
-- owner-wide branch of getBookingsForStaffArtist) sorts by created_at
-- descending with no other filter.
create index if not exists bookings_created_at_idx
  on public.bookings (created_at desc);

-- checkBookingConflict filters `status IN ('awaiting_down_payment',
-- 'appointment_confirmed')` alongside artist_id + appointment_date above;
-- combines with that composite index via a bitmap AND for that query, and
-- covers any future direct status filter (low cardinality on its own, but
-- cheap to maintain on a table this shape).
create index if not exists bookings_status_idx
  on public.bookings (status);

-- payments: getLatestPaymentAttempt (lib/booking.ts, powers the Payment
-- Failed page) and reconcilePaymentEvent (lib/payments/reconcile.ts, the
-- PayMongo webhook handler — fires on every payment event) both look up
-- "this booking's payments, newest first". booking_id is a foreign key
-- with no automatic index. The webhook additionally filters
-- status = 'pending', but with only a handful of payment attempts per
-- booking the composite index already makes that filter effectively free,
-- so a narrower partial index isn't worth the extra maintenance at this
-- table's shape.
create index if not exists payments_booking_id_created_at_idx
  on public.payments (booking_id, created_at desc);

-- getPayments / the owner-wide branch of getPaymentsForStaffArtist list
-- every payment newest-first with no booking_id filter.
create index if not exists payments_created_at_idx
  on public.payments (created_at desc);

-- inquiries: getInquiries (lib/staff/inquiries.ts) lists every inquiry
-- newest-first, unscoped — inquiries aren't tied to an artist the way
-- bookings/payments are.
create index if not exists inquiries_created_at_idx
  on public.inquiries (created_at desc);

-- booking_reference_images: the get_booking_by_token SECURITY DEFINER
-- function (called on every booking-portal page load) runs
-- `where ri.booking_id = b.id order by ri.created_at` — the hottest read
-- path this table has. booking_id is a foreign key with no automatic
-- index.
create index if not exists booking_reference_images_booking_id_created_at_idx
  on public.booking_reference_images (booking_id, created_at);

-- inquiry_images: filtered by inquiry_id on every inquiry detail load
-- (getInquiryImagePaths, getInquiryById's join) and by the
-- inquiry-to-booking conversion flow. Foreign key with no automatic index.
create index if not exists inquiry_images_inquiry_id_idx
  on public.inquiry_images (inquiry_id);
