-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT SELECT, USAGE ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

CREATE FUNCTION public.get_booking_by_token (
  p_token uuid
)
  RETURNS json
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO 'public'
  AS $function$
  select json_build_object(
    'booking', to_jsonb(b) - 'artist_id',
    'artist', to_jsonb(a),
    'reference_images', coalesce(
      (
        select json_agg(to_jsonb(ri) order by ri.created_at)
        from booking_reference_images ri
        where ri.booking_id = b.id
      ),
      '[]'::json
    )
  )
  from bookings b
  join artists a on a.id = b.artist_id
  where b.token = p_token;
$function$;

GRANT ALL ON FUNCTION public.get_booking_by_token(uuid) TO anon;

GRANT ALL ON FUNCTION public.get_booking_by_token(uuid) TO authenticated;

GRANT ALL ON FUNCTION public.get_booking_by_token(uuid) TO service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;

GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;

CREATE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

GRANT ALL ON FUNCTION public.set_updated_at() TO anon;

GRANT ALL ON FUNCTION public.set_updated_at() TO authenticated;

GRANT ALL ON FUNCTION public.set_updated_at() TO service_role;

CREATE TABLE public.artists (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  slug          text                     NOT NULL,
  name          text                     NOT NULL,
  specialty     text                     NOT NULL,
  years         text                     NOT NULL,
  bio           text                     NOT NULL,
  image_path    text                     NOT NULL,
  instagram_url text,
  facebook_url  text,
  created_at    timestamp with time zone DEFAULT now() NOT NULL,
  user_id       uuid,
  display_order integer                  DEFAULT 0 NOT NULL
);

ALTER TABLE public.artists
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.artists
  ADD CONSTRAINT artists_pkey PRIMARY KEY (id);

ALTER TABLE public.artists
  ADD CONSTRAINT artists_slug_key UNIQUE (slug);

ALTER TABLE public.artists
  ADD CONSTRAINT artists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE public.artists
  ADD CONSTRAINT artists_user_id_key UNIQUE (user_id);

GRANT ALL ON public.artists TO anon;

GRANT ALL ON public.artists TO authenticated;

GRANT ALL ON public.artists TO service_role;

CREATE POLICY "Anyone can read artists" ON public.artists
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Staff can read artists" ON public.artists
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can update their own artist profile" ON public.artists
  FOR UPDATE
  TO authenticated
  USING ((user_id = auth.uid()))
  WITH CHECK ((user_id = auth.uid()));

CREATE TABLE public.booking_reference_images (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  booking_id uuid                     NOT NULL,
  image_path text                     NOT NULL,
  alt_text   text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.booking_reference_images
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.booking_reference_images
  ADD CONSTRAINT booking_reference_images_pkey PRIMARY KEY (id);

GRANT ALL ON public.booking_reference_images TO anon;

GRANT ALL ON public.booking_reference_images TO authenticated;

GRANT ALL ON public.booking_reference_images TO service_role;

CREATE POLICY "Staff can attach reference images" ON public.booking_reference_images
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can read booking reference images" ON public.booking_reference_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.bookings (
  id                       uuid                     DEFAULT gen_random_uuid() NOT NULL,
  token                    uuid                     DEFAULT gen_random_uuid() NOT NULL,
  booking_id               text                     NOT NULL,
  status                   text                     DEFAULT 'awaiting_down_payment'::text NOT NULL,
  customer_name            text                     NOT NULL,
  customer_email           text                     NOT NULL,
  customer_mobile          text                     NOT NULL,
  preferred_contact_method text                     NOT NULL,
  artist_id                uuid                     NOT NULL,
  tattoo_description       text                     NOT NULL,
  tattoo_style             text                     NOT NULL,
  placement                text                     NOT NULL,
  estimated_size           text                     NOT NULL,
  estimated_session_hours  numeric                  NOT NULL,
  estimated_session_count  integer                  NOT NULL,
  studio_address           text                     NOT NULL,
  appointment_date         date                     NOT NULL,
  appointment_time         text                     NOT NULL,
  consultation_method      text                     NOT NULL,
  currency                 text                     DEFAULT 'PHP'::text NOT NULL,
  estimated_price          numeric                  NOT NULL,
  down_payment_percent     numeric                  NOT NULL,
  down_payment_amount      numeric                  NOT NULL,
  remaining_balance        numeric                  NOT NULL,
  created_at               timestamp with time zone DEFAULT now() NOT NULL,
  updated_at               timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.bookings
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id);

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_booking_id_key UNIQUE (booking_id);

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);

ALTER TABLE public.booking_reference_images
  ADD CONSTRAINT booking_reference_images_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_preferred_contact_method_check CHECK (preferred_contact_method = ANY (ARRAY['email'::text, 'sms'::text, 'call'::text, 'messenger'::text]));

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check CHECK (status = ANY (ARRAY['awaiting_down_payment'::text, 'appointment_confirmed'::text, 'completed'::text, 'cancelled'::text]));

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_token_key UNIQUE (token);

GRANT ALL ON public.bookings TO anon;

GRANT ALL ON public.bookings TO authenticated;

GRANT ALL ON public.bookings TO service_role;

CREATE TRIGGER bookings_set_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Staff can create bookings" ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can read bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.gallery_items (
  id            uuid                     DEFAULT gen_random_uuid() NOT NULL,
  piece         text                     NOT NULL,
  category      text                     NOT NULL,
  artist_name   text                     NOT NULL,
  alt           text                     NOT NULL,
  images        text[]                   NOT NULL,
  display_order integer                  DEFAULT 0 NOT NULL,
  created_at    timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.gallery_items
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.gallery_items
  ADD CONSTRAINT gallery_items_pkey PRIMARY KEY (id);

GRANT ALL ON public.gallery_items TO anon;

GRANT ALL ON public.gallery_items TO authenticated;

GRANT ALL ON public.gallery_items TO service_role;

CREATE INDEX gallery_items_display_order_idx ON public.gallery_items (display_order);

CREATE POLICY "Public can read gallery items" ON public.gallery_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can delete gallery items" ON public.gallery_items
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert gallery items" ON public.gallery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update gallery items" ON public.gallery_items
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE TABLE public.homepage_hero (
  id         text                     DEFAULT 'hero'::text NOT NULL,
  video_url  text                     NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.homepage_hero
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.homepage_hero
  ADD CONSTRAINT homepage_hero_pkey PRIMARY KEY (id);

GRANT ALL ON public.homepage_hero TO anon;

GRANT ALL ON public.homepage_hero TO authenticated;

GRANT ALL ON public.homepage_hero TO service_role;

CREATE POLICY "Public can read homepage hero" ON public.homepage_hero
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can delete homepage hero" ON public.homepage_hero
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can update homepage hero" ON public.homepage_hero
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can upsert homepage hero" ON public.homepage_hero
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE public.homepage_portfolio_images (
  slot       smallint                 NOT NULL,
  image_url  text                     NOT NULL,
  alt        text                     NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.homepage_portfolio_images
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.homepage_portfolio_images
  ADD CONSTRAINT homepage_portfolio_images_pkey PRIMARY KEY (slot);

ALTER TABLE public.homepage_portfolio_images
  ADD CONSTRAINT homepage_portfolio_images_slot_check CHECK (slot >= 0 AND slot <= 7);

GRANT ALL ON public.homepage_portfolio_images TO anon;

GRANT ALL ON public.homepage_portfolio_images TO authenticated;

GRANT ALL ON public.homepage_portfolio_images TO service_role;

CREATE POLICY "Public can read homepage portfolio images" ON public.homepage_portfolio_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Staff can delete homepage portfolio images" ON public.homepage_portfolio_images
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Staff can insert homepage portfolio images" ON public.homepage_portfolio_images
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can update homepage portfolio images" ON public.homepage_portfolio_images
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE TABLE public.inquiries (
  id                uuid                     DEFAULT gen_random_uuid() NOT NULL,
  created_at        timestamp with time zone DEFAULT now() NOT NULL,
  updated_at        timestamp with time zone DEFAULT now() NOT NULL,
  full_name         text                     NOT NULL,
  email             text                     NOT NULL,
  phone             text                     NOT NULL,
  preferred_contact text                     NOT NULL,
  preferred_artist  text,
  tattoo_type       text                     NOT NULL,
  placement         text                     NOT NULL,
  size              text                     NOT NULL,
  height            text,
  weight            text,
  message           text
);

ALTER TABLE public.inquiries
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inquiries
  ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);

GRANT ALL ON public.inquiries TO anon;

GRANT ALL ON public.inquiries TO authenticated;

GRANT ALL ON public.inquiries TO service_role;

CREATE POLICY "Public can submit inquiries" ON public.inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can read inquiries" ON public.inquiries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.inquiry_images (
  id         uuid                     DEFAULT gen_random_uuid() NOT NULL,
  inquiry_id uuid                     NOT NULL,
  image_path text                     NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.inquiry_images
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inquiry_images
  ADD CONSTRAINT inquiry_images_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES public.inquiries(id) ON DELETE CASCADE;

ALTER TABLE public.inquiry_images
  ADD CONSTRAINT inquiry_images_pkey PRIMARY KEY (id);

GRANT ALL ON public.inquiry_images TO anon;

GRANT ALL ON public.inquiry_images TO authenticated;

GRANT ALL ON public.inquiry_images TO service_role;

CREATE POLICY "Public can attach inquiry images" ON public.inquiry_images
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can read inquiry images" ON public.inquiry_images
  FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE public.payments (
  id                  uuid                     DEFAULT gen_random_uuid() NOT NULL,
  booking_id          uuid                     NOT NULL,
  checkout_session_id text                     NOT NULL,
  provider            text                     DEFAULT 'paymongo'::text NOT NULL,
  method              text,
  status              text                     DEFAULT 'pending'::text NOT NULL,
  amount              numeric                  NOT NULL,
  currency            text                     DEFAULT 'PHP'::text NOT NULL,
  paid_at             timestamp with time zone,
  created_at          timestamp with time zone DEFAULT now() NOT NULL,
  updated_at          timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.payments
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  ADD CONSTRAINT payments_checkout_session_id_key UNIQUE (checkout_session_id);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_pkey PRIMARY KEY (id);

ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'failed'::text, 'refunded'::text]));

GRANT ALL ON public.payments TO anon;

GRANT ALL ON public.payments TO authenticated;

GRANT ALL ON public.payments TO service_role;

CREATE TRIGGER payments_set_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Public can create a pending payment" ON public.payments
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Staff can read payments" ON public.payments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
