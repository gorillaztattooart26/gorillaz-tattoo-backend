'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

const BUCKET = 'homepage-media'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_BYTES = 200 * 1024 * 1024 // 200MB

export interface HomepageMediaActionResult {
  error?: string
}

const NOT_OWNER_ERROR = 'Only the studio owner can update homepage media.'

/**
 * Hero video, About photo, and Studio Portfolio slideshow are shared,
 * site-wide homepage content — every exported action below must gate on
 * this before touching Storage or the DB, since these are Server Actions
 * and can be invoked directly regardless of what the Gallery page UI
 * shows/hides. Mirrors the `!artist.is_owner` guard style already used in
 * app/staff/(protected)/bookings/actions.ts.
 */
async function requireOwner(): Promise<{ ok: true } | { ok: false; error: string }> {
  const artist = await getCurrentStaffArtist()
  if (!artist || !artist.is_owner) {
    return { ok: false, error: NOT_OWNER_ERROR }
  }
  return { ok: true }
}

function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`
  const path = url.includes(marker) ? url.split(marker)[1] : null
  return path || null
}

/**
 * Uploads a new hero video to Storage and upserts the single `homepage_hero`
 * row to point at it, replacing whatever was live before. Old file is
 * best-effort removed from Storage after the DB row is safely pointed at
 * the new one.
 */
export async function uploadHeroVideoAction(formData: FormData): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const file = formData.get('video')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a video file to upload.' }
  }
  if (!file.type.startsWith('video/')) {
    return { error: `${file.name} isn't a video file.` }
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { error: `${file.name} is larger than 200MB.` }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('homepage_hero').select('video_url').eq('id', 'hero').maybeSingle()

  const path = `hero/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })

  if (uploadError) {
    console.error('[staff/homepage-media] hero upload failed:', uploadError)
    return { error: 'Something went wrong uploading the video. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: upsertError } = await supabase
    .from('homepage_hero')
    .upsert({ id: 'hero', video_url: publicUrl.publicUrl, updated_at: new Date().toISOString() })

  if (upsertError) {
    console.error('[staff/homepage-media] hero upsert failed:', upsertError)
    return { error: 'Something went wrong saving the new video. Please try again.' }
  }

  const oldPath = existing?.video_url ? storagePathFromPublicUrl(existing.video_url) : null
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
    if (removeError) {
      console.error('[staff/homepage-media] old hero video cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/** Removes the current hero video, reverting the homepage to its static fallback. */
export async function deleteHeroVideoAction(): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('homepage_hero')
    .select('video_url')
    .eq('id', 'hero')
    .maybeSingle()

  if (fetchError) {
    console.error('[staff/homepage-media] hero fetch before delete failed:', fetchError)
    return { error: 'Something went wrong. Please try again.' }
  }
  if (!existing) return {}

  const { error: deleteError } = await supabase.from('homepage_hero').delete().eq('id', 'hero')
  if (deleteError) {
    console.error('[staff/homepage-media] hero delete failed:', deleteError)
    return { error: 'Something went wrong removing the video. Please try again.' }
  }

  const path = storagePathFromPublicUrl(existing.video_url)
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])
    if (removeError) {
      console.error('[staff/homepage-media] hero storage cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Uploads a new photo to Storage and upserts the single `homepage_about`
 * row to point at it, replacing whatever was live before. Old file is
 * best-effort removed from Storage after the DB row is safely pointed at
 * the new one.
 */
export async function uploadAboutImageAction(formData: FormData): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const alt = String(formData.get('alt') ?? '').trim()
  if (!alt) {
    return { error: 'Add alt text for this photo.' }
  }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a photo to upload.' }
  }
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} isn't an image file.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is larger than 10MB.` }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase.from('homepage_about').select('image_url').eq('id', 'about').maybeSingle()

  const path = `about/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })

  if (uploadError) {
    console.error('[staff/homepage-media] about upload failed:', uploadError)
    return { error: 'Something went wrong uploading the photo. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: upsertError } = await supabase
    .from('homepage_about')
    .upsert({ id: 'about', image_url: publicUrl.publicUrl, alt, updated_at: new Date().toISOString() })

  if (upsertError) {
    console.error('[staff/homepage-media] about upsert failed:', upsertError)
    return { error: 'Something went wrong saving the new photo. Please try again.' }
  }

  const oldPath = existing?.image_url ? storagePathFromPublicUrl(existing.image_url) : null
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
    if (removeError) {
      console.error('[staff/homepage-media] old about photo cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/** Removes the current "About the studio" photo, reverting the homepage to its static fallback. */
export async function deleteAboutImageAction(): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('homepage_about')
    .select('image_url')
    .eq('id', 'about')
    .maybeSingle()

  if (fetchError) {
    console.error('[staff/homepage-media] about fetch before delete failed:', fetchError)
    return { error: 'Something went wrong. Please try again.' }
  }
  if (!existing) return {}

  const { error: deleteError } = await supabase.from('homepage_about').delete().eq('id', 'about')
  if (deleteError) {
    console.error('[staff/homepage-media] about delete failed:', deleteError)
    return { error: 'Something went wrong removing the photo. Please try again.' }
  }

  const path = storagePathFromPublicUrl(existing.image_url)
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])
    if (removeError) {
      console.error('[staff/homepage-media] about storage cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/** Uploads a photo and assigns it to one of the 8 fixed "Studio Portfolio" slots, replacing whatever was in that slot. */
export async function uploadPortfolioSlotImageAction(formData: FormData): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const slot = Number(formData.get('slot'))
  if (!Number.isInteger(slot) || slot < 0 || slot > 7) {
    return { error: 'Invalid slot.' }
  }

  const alt = String(formData.get('alt') ?? '').trim()
  if (!alt) {
    return { error: 'Add alt text for this photo.' }
  }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a photo to upload.' }
  }
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} isn't an image file.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is larger than 10MB.` }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('homepage_portfolio_images')
    .select('image_url')
    .eq('slot', slot)
    .maybeSingle()

  const path = `portfolio/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })

  if (uploadError) {
    console.error('[staff/homepage-media] portfolio upload failed:', uploadError)
    return { error: 'Something went wrong uploading the photo. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: upsertError } = await supabase
    .from('homepage_portfolio_images')
    .upsert({ slot, image_url: publicUrl.publicUrl, alt, updated_at: new Date().toISOString() })

  if (upsertError) {
    console.error('[staff/homepage-media] portfolio upsert failed:', upsertError)
    return { error: 'Something went wrong saving this photo. Please try again.' }
  }

  const oldPath = existing?.image_url ? storagePathFromPublicUrl(existing.image_url) : null
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
    if (removeError) {
      console.error('[staff/homepage-media] old portfolio photo cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Points a "Studio Portfolio" slot at a photo that's already live
 * elsewhere on the site (an existing gallery piece) instead of uploading
 * a new file — no Storage write, just a DB pointer to the same URL. Still
 * cleans up whatever custom upload previously occupied the slot.
 */
export async function assignExistingPortfolioSlotImageAction(
  slot: number,
  imageUrl: string,
  alt: string,
): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  if (!Number.isInteger(slot) || slot < 0 || slot > 7) {
    return { error: 'Invalid slot.' }
  }
  if (!imageUrl.trim() || !alt.trim()) {
    return { error: 'Invalid photo selection.' }
  }

  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('homepage_portfolio_images')
    .select('image_url')
    .eq('slot', slot)
    .maybeSingle()

  const { error: upsertError } = await supabase
    .from('homepage_portfolio_images')
    .upsert({ slot, image_url: imageUrl, alt, updated_at: new Date().toISOString() })

  if (upsertError) {
    console.error('[staff/homepage-media] portfolio assign-existing failed:', upsertError)
    return { error: 'Something went wrong saving this photo. Please try again.' }
  }

  const oldPath = existing?.image_url ? storagePathFromPublicUrl(existing.image_url) : null
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
    if (removeError) {
      console.error('[staff/homepage-media] old portfolio photo cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/** Clears a "Studio Portfolio" slot, reverting it to its static fallback photo. */
export async function deletePortfolioSlotImageAction(slot: number): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  if (!Number.isInteger(slot) || slot < 0 || slot > 7) {
    return { error: 'Invalid slot.' }
  }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('homepage_portfolio_images')
    .select('image_url')
    .eq('slot', slot)
    .maybeSingle()

  if (fetchError) {
    console.error('[staff/homepage-media] portfolio fetch before delete failed:', fetchError)
    return { error: 'Something went wrong. Please try again.' }
  }
  if (!existing) return {}

  const { error: deleteError } = await supabase.from('homepage_portfolio_images').delete().eq('slot', slot)
  if (deleteError) {
    console.error('[staff/homepage-media] portfolio delete failed:', deleteError)
    return { error: 'Something went wrong removing this photo. Please try again.' }
  }

  const path = storagePathFromPublicUrl(existing.image_url)
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])
    if (removeError) {
      console.error('[staff/homepage-media] portfolio storage cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Persists a drag-and-drop reorder — `entries` is the full new slot
 * arrangement (only slots that currently hold a custom photo; slots with
 * no entry are left on their static fallback). Only rewrites which photo
 * plays which fixed visual role — never touches Storage.
 */
export async function reorderPortfolioSlotsAction(
  entries: { slot: number; imageUrl: string; alt: string }[],
): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const slots = entries.map((e) => e.slot)
  const validSlots = slots.every((slot) => Number.isInteger(slot) && slot >= 0 && slot <= 7)
  const uniqueSlots = new Set(slots).size === slots.length

  if (!validSlots || !uniqueSlots) {
    return { error: 'Invalid slot arrangement.' }
  }

  const supabase = await createClient()

  const { data: existingRows, error: fetchError } = await supabase.from('homepage_portfolio_images').select('slot')

  if (fetchError) {
    console.error('[staff/homepage-media] reorder fetch failed:', fetchError)
    return { error: 'Something went wrong. Please try again.' }
  }

  const newSlots = new Set(slots)
  const slotsToClear = (existingRows ?? []).map((row) => row.slot).filter((slot) => !newSlots.has(slot))

  if (slotsToClear.length > 0) {
    const { error: deleteError } = await supabase.from('homepage_portfolio_images').delete().in('slot', slotsToClear)
    if (deleteError) {
      console.error('[staff/homepage-media] reorder clear failed:', deleteError)
      return { error: 'Something went wrong saving the new order. Please try again.' }
    }
  }

  if (entries.length > 0) {
    const { error: upsertError } = await supabase.from('homepage_portfolio_images').upsert(
      entries.map((entry) => ({
        slot: entry.slot,
        image_url: entry.imageUrl,
        alt: entry.alt,
        updated_at: new Date().toISOString(),
      })),
    )
    if (upsertError) {
      console.error('[staff/homepage-media] reorder upsert failed:', upsertError)
      return { error: 'Something went wrong saving the new order. Please try again.' }
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Uploads a new photo and appends it to the end of the homepage "Dominate"
 * interstitial slideshow (the full-bleed crossfade banner between Process
 * and Inquire). Unlike the fixed 8-slot Studio Portfolio strip, this list
 * has no fixed length — new slides just go on the end. Owner-only.
 */
export async function uploadSlideshowImageAction(formData: FormData): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const alt = String(formData.get('alt') ?? '').trim()
  if (!alt) {
    return { error: 'Add alt text for this photo.' }
  }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a photo to upload.' }
  }
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} isn't an image file.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is larger than 10MB.` }
  }

  const supabase = await createClient()

  const { count } = await supabase
    .from('homepage_slideshow_images')
    .select('*', { count: 'exact', head: true })

  const path = `slideshow/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })

  if (uploadError) {
    console.error('[staff/homepage-media] slideshow upload failed:', uploadError)
    return { error: 'Something went wrong uploading the photo. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: insertError } = await supabase.from('homepage_slideshow_images').insert({
    image_url: publicUrl.publicUrl,
    alt,
    display_order: count ?? 0,
  })

  if (insertError) {
    console.error('[staff/homepage-media] slideshow insert failed:', insertError)
    return { error: 'Something went wrong saving this photo. Please try again.' }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Replaces an existing slide's photo in place — same row, same position,
 * new file. Old Storage object is best-effort removed after the DB row is
 * safely pointed at the new one. Owner-only.
 */
export async function replaceSlideshowImageAction(
  id: string,
  formData: FormData,
): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const alt = String(formData.get('alt') ?? '').trim()
  if (!alt) {
    return { error: 'Add alt text for this photo.' }
  }

  const file = formData.get('image')
  if (!(file instanceof File) || file.size === 0) {
    return { error: 'Choose a photo to upload.' }
  }
  if (!file.type.startsWith('image/')) {
    return { error: `${file.name} isn't an image file.` }
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: `${file.name} is larger than 10MB.` }
  }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('homepage_slideshow_images')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    console.error('[staff/homepage-media] slideshow fetch before replace failed:', fetchError)
    return { error: 'Could not find that slide.' }
  }

  const path = `slideshow/${crypto.randomUUID()}-${file.name}`
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })

  if (uploadError) {
    console.error('[staff/homepage-media] slideshow replace upload failed:', uploadError)
    return { error: 'Something went wrong uploading the photo. Please try again.' }
  }

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path)

  const { error: updateError } = await supabase
    .from('homepage_slideshow_images')
    .update({ image_url: publicUrl.publicUrl, alt, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (updateError) {
    console.error('[staff/homepage-media] slideshow replace update failed:', updateError)
    return { error: 'Something went wrong saving this photo. Please try again.' }
  }

  const oldPath = storagePathFromPublicUrl(existing.image_url)
  if (oldPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([oldPath])
    if (removeError) {
      console.error('[staff/homepage-media] old slideshow photo cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/** Removes a slide entirely, shifting nothing else — reorder afterward if a gap needs closing. Owner-only. */
export async function deleteSlideshowImageAction(id: string): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('homepage_slideshow_images')
    .select('image_url')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    console.error('[staff/homepage-media] slideshow fetch before delete failed:', fetchError)
    return { error: 'Something went wrong. Please try again.' }
  }
  if (!existing) return {}

  const { error: deleteError } = await supabase.from('homepage_slideshow_images').delete().eq('id', id)
  if (deleteError) {
    console.error('[staff/homepage-media] slideshow delete failed:', deleteError)
    return { error: 'Something went wrong removing this photo. Please try again.' }
  }

  const path = storagePathFromPublicUrl(existing.image_url)
  if (path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([path])
    if (removeError) {
      console.error('[staff/homepage-media] slideshow storage cleanup failed:', removeError)
    }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}

/**
 * Persists a drag-and-drop reorder of the slideshow — `orderedIds` is the
 * full new arrangement, front to back. Only rewrites display_order, never
 * touches Storage or image_url/alt. Owner-only.
 */
export async function reorderSlideshowImagesAction(orderedIds: string[]): Promise<HomepageMediaActionResult> {
  const authCheck = await requireOwner()
  if (!authCheck.ok) return { error: authCheck.error }

  if (orderedIds.length === 0) return {}
  if (new Set(orderedIds).size !== orderedIds.length) {
    return { error: 'Invalid slide arrangement.' }
  }

  const supabase = await createClient()

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from('homepage_slideshow_images')
        .update({ display_order: index, updated_at: new Date().toISOString() })
        .eq('id', id),
    ),
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    console.error('[staff/homepage-media] slideshow reorder failed:', failed.error)
    return { error: 'Something went wrong saving the new order. Please try again.' }
  }

  revalidatePath('/staff/gallery')
  revalidatePath('/')
  return {}
}
