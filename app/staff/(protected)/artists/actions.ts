'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentStaffArtist } from '@/lib/staff/artists'

const GALLERY_BUCKET = 'gallery'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024 // 10MB

export interface ArtistProfileActionResult {
  error?: string
}

/**
 * Updates the logged-in artist's own public profile — specialty, years,
 * bio, socials, and photo. Name/slug stay fixed since gallery_items.
 * artist_name and bookings both key off the artist's identity, not this
 * form. Reuses the `gallery` Storage bucket for the photo (already
 * public-read + authenticated-write) rather than standing up a second
 * bucket just for profile photos.
 */
export async function updateArtistProfileAction(formData: FormData): Promise<ArtistProfileActionResult> {
  const artist = await getCurrentStaffArtist()
  if (!artist) {
    return { error: "Your account isn't linked to an artist yet — ask the studio owner to link it." }
  }

  const specialty = String(formData.get('specialty') ?? '').trim()
  const years = String(formData.get('years') ?? '').trim()
  const bio = String(formData.get('bio') ?? '').trim()
  const instagramUrl = String(formData.get('instagram_url') ?? '').trim()
  const facebookUrl = String(formData.get('facebook_url') ?? '').trim()

  if (!specialty || !years || !bio) {
    return { error: 'Fill in your specialty, years of experience, and bio.' }
  }

  const supabase = await createClient()

  let imagePath = artist.image_path
  const photo = formData.get('photo')
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith('image/')) {
      return { error: `${photo.name} isn't an image file.` }
    }
    if (photo.size > MAX_IMAGE_BYTES) {
      return { error: `${photo.name} is larger than 10MB.` }
    }

    const path = `profiles/${artist.id}-${crypto.randomUUID()}-${photo.name}`
    const { error: uploadError } = await supabase.storage
      .from(GALLERY_BUCKET)
      .upload(path, photo, { contentType: photo.type })

    if (uploadError) {
      console.error('[staff/artists] photo upload failed:', uploadError)
      return { error: 'Something went wrong uploading your photo. Please try again.' }
    }

    const { data: publicUrl } = supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path)
    imagePath = publicUrl.publicUrl
  }

  const { error: updateError } = await supabase
    .from('artists')
    .update({
      specialty,
      years,
      bio,
      instagram_url: instagramUrl || null,
      facebook_url: facebookUrl || null,
      image_path: imagePath,
    })
    .eq('id', artist.id)

  if (updateError) {
    console.error('[staff/artists] update failed:', updateError)
    return { error: 'Something went wrong saving your profile. Please try again.' }
  }

  // Best-effort cleanup of the old Storage photo, once the new one is
  // safely saved. Legacy photos point at local /images/artists/... files,
  // which are just skipped since they aren't in Storage.
  if (photo instanceof File && photo.size > 0) {
    const bucketMarker = `/storage/v1/object/public/${GALLERY_BUCKET}/`
    if (artist.image_path.includes(bucketMarker)) {
      const oldPath = artist.image_path.split(bucketMarker)[1]
      if (oldPath) {
        const { error: removeError } = await supabase.storage.from(GALLERY_BUCKET).remove([oldPath])
        if (removeError) {
          console.error('[staff/artists] old photo cleanup failed:', removeError)
        }
      }
    }
  }

  revalidatePath('/staff/artists')
  revalidatePath('/')
  return {}
}
