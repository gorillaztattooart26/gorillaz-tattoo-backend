/**
 * Hand-written Supabase `Database` type — covers the tables that currently
 * exist (`inquiries`, `inquiry_images`, `artists`, `bookings`,
 * `booking_reference_images`). Shape (Tables/Views/Functions at the schema
 * level, Row/Insert/Update/Relationships per table) matches what
 * `supabase gen types typescript` produces and what `@supabase/supabase-js`'s
 * `createClient<Database>()` generic requires — verified against the
 * installed SDK's `GenericSchema`/`GenericTable` constraints in
 * node_modules/@supabase/supabase-js/dist/index.d.cts.
 *
 * Once the Supabase CLI is available in this environment, replace this
 * file with the real generated one:
 * `supabase gen types typescript --project-id <ref> > types/supabase.ts`.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      inquiries: {
        Row: {
          id: string
          full_name: string
          email: string
          phone: string
          preferred_contact: string
          preferred_artist: string
          tattoo_type: string
          placement: string
          size: string
          height: string | null
          weight: string | null
          message: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          phone: string
          preferred_contact: string
          preferred_artist: string
          tattoo_type: string
          placement: string
          size: string
          height?: string | null
          weight?: string | null
          message: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          phone?: string
          preferred_contact?: string
          preferred_artist?: string
          tattoo_type?: string
          placement?: string
          size?: string
          height?: string | null
          weight?: string | null
          message?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inquiry_images: {
        Row: {
          id: string
          inquiry_id: string
          image_path: string
          created_at: string
        }
        Insert: {
          id?: string
          inquiry_id: string
          image_path: string
          created_at?: string
        }
        Update: {
          id?: string
          inquiry_id?: string
          image_path?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inquiry_images_inquiry_id_fkey'
            columns: ['inquiry_id']
            isOneToOne: false
            referencedRelation: 'inquiries'
            referencedColumns: ['id']
          },
        ]
      }
      artists: {
        Row: {
          id: string
          slug: string
          name: string
          specialty: string
          years: string
          bio: string
          image_path: string
          instagram_url: string | null
          facebook_url: string | null
          user_id: string | null
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          specialty: string
          years: string
          bio: string
          image_path: string
          instagram_url?: string | null
          facebook_url?: string | null
          user_id?: string | null
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          specialty?: string
          years?: string
          bio?: string
          image_path?: string
          instagram_url?: string | null
          facebook_url?: string | null
          user_id?: string | null
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          id: string
          piece: string
          category: string
          artist_name: string
          alt: string
          images: string[]
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          piece: string
          category: string
          artist_name: string
          alt: string
          images: string[]
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          piece?: string
          category?: string
          artist_name?: string
          alt?: string
          images?: string[]
          display_order?: number
          created_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          token: string
          booking_id: string
          status: string
          customer_name: string
          customer_email: string
          customer_mobile: string
          preferred_contact_method: string
          artist_id: string
          tattoo_description: string
          tattoo_style: string
          placement: string
          estimated_size: string
          estimated_session_hours: number
          estimated_session_count: number
          studio_address: string
          appointment_date: string
          appointment_time: string
          consultation_method: string
          currency: string
          estimated_price: number
          down_payment_percent: number
          down_payment_amount: number
          remaining_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          token?: string
          booking_id: string
          status?: string
          customer_name: string
          customer_email: string
          customer_mobile: string
          preferred_contact_method: string
          artist_id: string
          tattoo_description: string
          tattoo_style: string
          placement: string
          estimated_size: string
          estimated_session_hours: number
          estimated_session_count: number
          studio_address: string
          appointment_date: string
          appointment_time: string
          consultation_method: string
          currency?: string
          estimated_price: number
          down_payment_percent: number
          down_payment_amount: number
          remaining_balance: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          token?: string
          booking_id?: string
          status?: string
          customer_name?: string
          customer_email?: string
          customer_mobile?: string
          preferred_contact_method?: string
          artist_id?: string
          tattoo_description?: string
          tattoo_style?: string
          placement?: string
          estimated_size?: string
          estimated_session_hours?: number
          estimated_session_count?: number
          studio_address?: string
          appointment_date?: string
          appointment_time?: string
          consultation_method?: string
          currency?: string
          estimated_price?: number
          down_payment_percent?: number
          down_payment_amount?: number
          remaining_balance?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bookings_artist_id_fkey'
            columns: ['artist_id']
            isOneToOne: false
            referencedRelation: 'artists'
            referencedColumns: ['id']
          },
        ]
      }
      booking_reference_images: {
        Row: {
          id: string
          booking_id: string
          image_path: string
          alt_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          image_path: string
          alt_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          image_path?: string
          alt_text?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'booking_reference_images_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          checkout_session_id: string
          provider: string
          method: string | null
          status: string
          amount: number
          currency: string
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          checkout_session_id: string
          provider?: string
          method?: string | null
          status?: string
          amount: number
          currency?: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          checkout_session_id?: string
          provider?: string
          method?: string | null
          status?: string
          amount?: number
          currency?: string
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_booking_id_fkey'
            columns: ['booking_id']
            isOneToOne: false
            referencedRelation: 'bookings'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      get_booking_by_token: {
        Args: { p_token: string }
        Returns: Json
      }
    }
  }
}

export type Inquiry = Database['public']['Tables']['inquiries']['Row']
export type InquiryInsert = Database['public']['Tables']['inquiries']['Insert']
export type InquiryImage = Database['public']['Tables']['inquiry_images']['Row']
export type InquiryImageInsert = Database['public']['Tables']['inquiry_images']['Insert']
export type ArtistRow = Database['public']['Tables']['artists']['Row']
export type BookingRow = Database['public']['Tables']['bookings']['Row']
export type BookingReferenceImageRow = Database['public']['Tables']['booking_reference_images']['Row']
export type PaymentRow = Database['public']['Tables']['payments']['Row']
export type PaymentInsert = Database['public']['Tables']['payments']['Insert']
