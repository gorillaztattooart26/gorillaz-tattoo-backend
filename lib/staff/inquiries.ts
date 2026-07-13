import { createClient } from '@/lib/supabase/server'
import type { Inquiry } from '@/types/supabase'

/**
 * Uses the session-aware server client (not lib/supabase.ts's anon
 * client) — only that client carries the staff member's JWT, which is
 * what lets Postgres evaluate the `authenticated`-scoped RLS policies
 * (see setup-staff-read-access.sql) instead of `anon`.
 */
export async function getInquiries(): Promise<Inquiry[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[staff/inquiries] getInquiries failed:', error)
    return []
  }
  return data
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
