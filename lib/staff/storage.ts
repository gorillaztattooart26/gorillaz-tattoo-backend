import { createClient } from '@/lib/supabase/server'

const REFERENCES_BUCKET = 'references'

/**
 * Best-effort removal of one or more reference photos from the private
 * `references` Storage bucket (booking_reference_images.image_path /
 * inquiry_images.image_path are already raw storage paths, not public
 * URLs — see lib/staff/inquiries.ts — so no URL-parsing is needed here,
 * unlike homepage-actions.ts's storagePathFromPublicUrl helper for the
 * public `homepage-media` bucket). Failures are logged, not thrown — the
 * DB rows are the source of truth and are always deleted first by the
 * caller; an orphaned Storage object is a cleanup nuisance, not a data
 * integrity problem.
 */
export async function deleteReferenceImages(paths: string[]): Promise<void> {
  const cleanPaths = paths.filter((path) => path.trim().length > 0)
  if (cleanPaths.length === 0) return

  const supabase = await createClient()
  const { error } = await supabase.storage.from(REFERENCES_BUCKET).remove(cleanPaths)
  if (error) {
    console.error('[staff/storage] deleteReferenceImages failed:', error)
  }
}
