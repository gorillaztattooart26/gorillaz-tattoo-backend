'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

const GALLERY_BUCKET = 'gallery'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB

export interface GalleryActionResult {
  error?: string
}

/**
 * Adds a new piece: uploads its photos to the `gallery` Storage bucket,
 * then inserts one `gallery_items` row pointing at their public URLs.
 * The artist is whoever's logged in (via artists.user_id) rather than a
 * manual picker — each artist has their own account, so there's nothing
 * to choose. Uses the session-aware client so RLS evaluates the staff
 * member's JWT as `authenticated`, not `anon`.
 */
export async function createGalleryItemAction(formData: FormData): Promise<GalleryActionResult> {
  const artist = await getCurrentStaffArtist()
  if (!artist) {
    return { error: "Your account isn't linked to an artist yet — ask the studio owner to link it." }
  }

  const piece = String(formData.get('piece') ?? '').trim()
  const category = String(formData.get('category') ?? '').trim()
  const alt = String(formData.get('alt') ?? '').trim()

  if (!piece || !category || !alt) {
    return { error: 'Fill in the piece name, category, and alt text.' }
  }

  const files = formData
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  if (files.length === 0) {
    return { error: 'Add at least one photo.' }
  }
  for (const file of files) {
    if (!file.type.startsWith('image/')) {
      return { error: `${file.name} isn't an image file.` }
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `${file.name} is larger than 10MB.` }
    }
  }

  const supabase = await createClient()

  const { count } = await supabase
    .from('gallery_items')
    .select('*', { count: 'exact', head: true })

  const imageUrls: string[] = []
  for (const file of files) {
    const path = `${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(path, file, { contentType: file.type })

    if (uploadError) {
      console.error('[staff/gallery] upload failed:', uploadError)
      return { error: 'Something went wrong uploading a photo. Please try again.' }
    }

    const { data: publicUrl } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path)
    imageUrls.push(publicUrl.publicUrl)
  }

  const { error: insertError } = await supabase.from('gallery_items').insert({
    piece,
    category,
    artist_name: artist.name,
    alt,
    images: imageUrls,
    display_order: count ?? 0,
  })

  if (insertError) {
    console.error('[staff/gallery] insert failed:', insertError)
    return { error: 'Something went wrong saving this piece. Please try again.' }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/gallery')
  return {}
}

/**
 * Deletes a piece and best-effort cleans up its Storage objects. Legacy
 * pieces (migrated from the old static data.ts file) point at local
 * `/images/portfolio/...` files rather than Storage, so those are just
 * skipped — only URLs actually inside the `gallery` bucket get removed.
 *
 * Checks the piece's artist_name matches the logged-in artist before
 * allowing the delete — RLS alone doesn't scope gallery_items per artist,
 * so this is where that ownership boundary is actually enforced.
 */
export async function deleteGalleryItemAction(id: string): Promise<GalleryActionResult> {
  const artist = await getCurrentStaffArtist()
  if (!artist) {
    return { error: "Your account isn't linked to an artist yet — ask the studio owner to link it." }
  }

  const supabase = await createClient()

  const { data: item, error: fetchError } = await supabase
    .from('gallery_items')
    .select('images, artist_name')
    .eq('id', id)
    .single()

  if (fetchError || !item) {
    console.error('[staff/gallery] fetch before delete failed:', fetchError)
    return { error: 'Could not find that piece.' }
  }

  if (item.artist_name !== artist.name) {
    return { error: "That piece belongs to another artist's gallery." }
  }

  const { error: deleteError } = await supabase.from('gallery_items').delete().eq('id', id)
  if (deleteError) {
    console.error('[staff/gallery] delete failed:', deleteError)
    return { error: 'Something went wrong deleting this piece. Please try again.' }
  }

  const bucketMarker = `/storage/v1/object/public/${GALLERY_BUCKET}/`
  const storagePaths = item.images
    .filter((url) => url.includes(bucketMarker))
    .map((url) => url.split(bucketMarker)[1])
    .filter((path): path is string => Boolean(path))

  if (storagePaths.length > 0) {
    const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove(storagePaths)
    if (removeError) {
      console.error('[staff/gallery] storage cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/gallery')
  return {}
}
