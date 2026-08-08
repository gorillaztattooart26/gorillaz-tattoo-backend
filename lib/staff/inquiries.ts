import { createClient } from '@/lib/supabase/server'
import type { Inquiry } from '@/types/supabase'
import type { RecordView } from '@/lib/staff/bookings'

const REFERENCES_BUCKET = 'references'
// Long enough to comfortably view during a staff session without the URL
// expiring mid-view; regenerated fresh on every page load regardless.
const SIGNED_URL_EXPIRY_SECONDS = 60 * 60

export interface StaffInquiry extends Inquiry {
  images: string[]
}

/**
 * Uses the session-aware server client (not lib/supabase.ts's anon
 * client) — only that client carries the staff member's JWT, which is
 * what lets Postgres evaluate the `authenticated`-scoped RLS policies
 * (see setup-staff-read-access.sql) instead of `anon`.
 *
 * Reference images live in the private `references` Storage bucket (see
 * components/booking/actions.ts), so `inquiry_images.image_path` is just
 * a storage path, not a browsable URL — each one needs a signed URL
 * generated per request to actually display.
 */
export async function getInquiries(view: RecordView = 'active'): Promise<StaffInquiry[]> {
  const supabase = await createClient()
  let query = supabase
    .from('inquiries')
    .select('*, inquiry_images(image_path)')
    .order('created_at', { ascending: false })

  query = view === 'archived' ? query.not('archived_at', 'is', null) : query.is('archived_at', null)

  const { data, error } = await query

  if (error || !data) {
    console.error('[staff/inquiries] getInquiries failed:', error)
    return []
  }

  return Promise.all(
    data.map(async ({ inquiry_images, ...inquiry }) => {
      const images = await Promise.all(
        inquiry_images.map(async ({ image_path }) => {
          const { data: signed, error: signError } = await supabase.storage
            .from(REFERENCES_BUCKET)
            .createSignedUrl(image_path, SIGNED_URL_EXPIRY_SECONDS)

          if (signError || !signed) {
            console.error('[staff/inquiries] createSignedUrl failed:', signError)
            return null
          }
          return signed.signedUrl
        }),
      )
      return { ...inquiry, images: images.filter((url): url is string => Boolean(url)) }
    }),
  )
}

/** Single inquiry lookup (with signed reference-image URLs) — powers the "Convert to booking" flow's prefill + reference-photo preview on the Create Booking form. */
export async function getInquiryById(id: string): Promise<StaffInquiry | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .select('*, inquiry_images(image_path)')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('[staff/inquiries] getInquiryById failed:', error)
    return null
  }
  if (!data) return null

  const { inquiry_images, ...inquiry } = data
  const images = await Promise.all(
    inquiry_images.map(async ({ image_path }) => {
      const { data: signed, error: signError } = await supabase.storage
        .from(REFERENCES_BUCKET)
        .createSignedUrl(image_path, SIGNED_URL_EXPIRY_SECONDS)

      if (signError || !signed) {
        console.error('[staff/inquiries] createSignedUrl failed:', signError)
        return null
      }
      return signed.signedUrl
    }),
  )
  return { ...inquiry, images: images.filter((url): url is string => Boolean(url)) }
}

export async function getRecentInquiries(limit = 5): Promise<Inquiry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[staff/inquiries] getRecentInquiries failed:', error)
    return []
  }
  return data
}

export async function getInquiryCount(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('[staff/inquiries] getInquiryCount failed:', error)
    return 0
  }
  return count ?? 0
}

/** Raw storage paths for one inquiry's reference photos — used by Delete Inquiry to clean up the `references` bucket after the DB rows are gone. */
export async function getInquiryImagePaths(inquiryId: string): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('inquiry_images').select('image_path').eq('inquiry_id', inquiryId)

  if (error) {
    console.error('[staff/inquiries] getInquiryImagePaths failed:', error)
    return []
  }
  return data.map((row) => row.image_path)
}
