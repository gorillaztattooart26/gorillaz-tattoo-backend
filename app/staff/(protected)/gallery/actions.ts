'use server'

import { createHash } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentStaffArtist } from '@/lib/staff/artists'
import { requireOwner } from '@/lib/staff/permissions'

const GALLERY_BUCKET = 'gallery'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
const DUPLICATE_IMAGE_ERROR = 'This image is already used in the portfolio. Please choose a different image.'

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
 *
 * Exact-duplicate protection: every submitted file's SHA-256 is checked
 * against `gallery_image_hashes` (via the service-role client — that table
 * has no authenticated grants, see lib/supabase-admin.ts) before anything
 * is uploaded. Any match — against an existing portfolio image, or between
 * two files in the same submission — rejects the whole creation; nothing
 * is uploaded and no gallery_items row is created. This is a
 * check-then-act race against concurrent uploads, so it's not the real
 * safety boundary: `gallery_image_hashes.file_hash` has a UNIQUE
 * constraint, and the hash-insert step below is what actually can't be
 * raced. If that insert loses the race (or fails for any other reason),
 * the gallery_items row and any newly uploaded files from this request are
 * rolled back rather than left as an unprotected, unregistered piece.
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

  const fileBuffers: { file: File; buffer: Buffer; hash: string }[] = []
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const hash = createHash('sha256').update(buffer).digest('hex')
    fileBuffers.push({ file, buffer, hash })
  }

  const submittedHashes = fileBuffers.map((f) => f.hash)
  if (new Set(submittedHashes).size !== submittedHashes.length) {
    return { error: DUPLICATE_IMAGE_ERROR }
  }

  const admin = getSupabaseAdmin()
  const { data: existingHashes, error: hashCheckError } = await admin
    .from('gallery_image_hashes')
    .select('file_hash')
    .in('file_hash', submittedHashes)

  if (hashCheckError) {
    console.error('[staff/gallery] hash check failed:', hashCheckError)
    return { error: 'Something went wrong checking this photo. Please try again.' }
  }
  if (existingHashes.length > 0) {
    return { error: DUPLICATE_IMAGE_ERROR }
  }

  const supabase = await createClient()

  const { count } = await supabase
    .from('gallery_items')
    .select('*', { count: 'exact', head: true })

  const uploadedPaths: string[] = []
  const imageUrls: string[] = []
  for (const { file, buffer } of fileBuffers) {
    const path = `${crypto.randomUUID()}-${file.name}`
    const { error: uploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(path, buffer, { contentType: file.type })

    if (uploadError) {
      console.error('[staff/gallery] upload failed:', uploadError)
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(GALLERY_BUCKET).remove(uploadedPaths)
      }
      return { error: 'Something went wrong uploading a photo. Please try again.' }
    }
    uploadedPaths.push(path)

    const { data: publicUrl } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path)
    imageUrls.push(publicUrl.publicUrl)
  }

  const { data: insertedItem, error: insertError } = await supabase
    .from('gallery_items')
    .insert({
      piece,
      category,
      artist_name: artist.name,
      alt,
      images: imageUrls,
      display_order: count ?? 0,
    })
    .select('id')
    .single()

  if (insertError || !insertedItem) {
    console.error('[staff/gallery] insert failed:', insertError)
    await supabase.storage.from(GALLERY_BUCKET).remove(uploadedPaths)
    return { error: 'Something went wrong saving this piece. Please try again.' }
  }

  const hashRows = fileBuffers.map(({ hash }, index) => ({
    gallery_item_id: insertedItem.id,
    image_url: imageUrls[index],
    file_hash: hash,
  }))

  const { error: hashInsertError } = await admin.from('gallery_image_hashes').insert(hashRows)

  if (hashInsertError) {
    console.error('[staff/gallery] hash registration failed:', hashInsertError)
    await supabase.from('gallery_items').delete().eq('id', insertedItem.id)
    await supabase.storage.from(GALLERY_BUCKET).remove(uploadedPaths)
    // A unique-hash violation here means another request registered the
    // same image in the moment between our check above and this insert —
    // still a genuine duplicate from the caller's point of view. Any other
    // failure is a real error, but either way the piece must not exist
    // half-protected, so both cases roll back identically above.
    return { error: hashInsertError.code === '23505' ? DUPLICATE_IMAGE_ERROR : 'Something went wrong saving this piece. Please try again.' }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/portfolio')
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
  revalidatePath('/portfolio')
  return {}
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Persists the Owner's new global portfolio order (Task 7) — the *only*
 * client input trusted here is the requested sequence of gallery_items
 * ids; the server both re-derives who's allowed to call this at all
 * (requireOwner(), independent of whatever the UI does or doesn't show)
 * and re-derives the actual display_order values from array position, so
 * a tampered/replayed request can't inject an arbitrary display_order or
 * artist_name for any row.
 *
 * `orderedIds` must be exactly the current full set of gallery_items ids
 * — no more, no fewer, no duplicates — or the request is rejected outright
 * rather than applying a partial reorder that would leave the global
 * sequence incomplete or duplicated. Writes are sequential, awaited,
 * per-row updates (same convention already used for reorderPortfolioSlotsAction
 * in homepage-actions.ts and elsewhere in this app for a variable-length
 * set of rows, rather than a single fixed-shape upsert) — the loop stops
 * and returns an error on the first failure rather than continuing and
 * reporting success, so the final `display_order` state is never left
 * half-old/half-new without the caller being told.
 */
export async function reorderGalleryItemsAction(orderedIds: string[]): Promise<GalleryActionResult> {
  const authCheck = await requireOwner('Only the studio owner can reorder the portfolio.')
  if (!authCheck.ok) return { error: authCheck.error }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: 'No items to reorder.' }
  }

  if (!orderedIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))) {
    return { error: 'That order contains an invalid item. Please refresh and try again.' }
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    return { error: 'That order contains a duplicate item. Please refresh and try again.' }
  }

  const supabase = await createClient()

  const { data: existingItems, error: fetchError } = await supabase.from('gallery_items').select('id')

  if (fetchError) {
    console.error('[staff/gallery] reorder fetch failed:', fetchError)
    return { error: 'Something went wrong loading the current portfolio. Please try again.' }
  }

  const existingIds = new Set((existingItems ?? []).map((row) => row.id))
  const submittedIds = new Set(orderedIds)

  const setsMatch =
    existingIds.size === submittedIds.size && [...existingIds].every((id) => submittedIds.has(id))

  if (!setsMatch) {
    return {
      error: "That order doesn't match the current portfolio — someone may have added or removed a piece. Please refresh and try again.",
    }
  }

  for (let index = 0; index < orderedIds.length; index++) {
    const { error: updateError } = await supabase
      .from('gallery_items')
      .update({ display_order: index })
      .eq('id', orderedIds[index])

    if (updateError) {
      console.error('[staff/gallery] reorder update failed at index', index, updateError)
      return {
        error: 'Something went wrong saving the new order partway through — please refresh and check the order before trying again.',
      }
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/portfolio')
  return {}
}
