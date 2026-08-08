import type { StaffInquiry } from '@/lib/staff/inquiries'
import type { CreateBookingFormInput } from '@/app/staff/create-booking/schema'
import type { Artist } from '@/types/artist'

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z]/g, ' ').replace(/\s+/g, ' ').trim()
}

/**
 * `inquiries.preferred_artist` is free text picked from a fixed dropdown
 * (see components/booking/options.ts's ARTIST_OPTIONS) — it isn't a
 * foreign key, and its wording doesn't exactly match `artists.name`
 * (e.g. "park lladoc" vs "park nichole lladoc"). Matches on whichever
 * artist's name contains every word of the inquiry's preference, which
 * covers both current artists without hardcoding either name; falls back
 * to undefined (caller defaults to the first artist, same as a blank
 * Create Booking form) if nothing matches.
 */
export function matchArtistSlugFromInquiry(preferredArtist: string, artists: Artist[]): string | undefined {
  const words = normalize(preferredArtist).split(' ').filter(Boolean)
  if (words.length === 0) return undefined

  const match = artists.find((artist) => {
    const name = normalize(artist.name)
    return words.every((word) => name.includes(word))
  })
  return match?.slug
}

export interface BookingPrefill extends Partial<CreateBookingFormInput> {
  sourceInquiryId: string
  referenceImageCount: number
}

/**
 * Builds Create Booking form defaults from an inquiry so staff don't
 * re-type what the customer already submitted. Height/weight have no
 * home on the bookings table, so they're folded into the tattoo
 * description as context rather than dropped — the description field is
 * a free-text note the artist reads before the session either way.
 */
export function buildBookingPrefillFromInquiry(inquiry: StaffInquiry, artists: Artist[]): BookingPrefill {
  const bodyNotes = [
    inquiry.height ? `Height: ${inquiry.height}` : null,
    inquiry.weight ? `Weight: ${inquiry.weight}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const tattooDescription = bodyNotes ? `${inquiry.message}\n\n${bodyNotes}` : inquiry.message

  return {
    sourceInquiryId: inquiry.id,
    referenceImageCount: inquiry.images.length,
    customerName: inquiry.full_name,
    customerEmail: inquiry.email,
    customerMobile: inquiry.phone,
    preferredContactMethod: (['email', 'sms', 'call', 'messenger'] as const).includes(
      inquiry.preferred_contact as 'email' | 'sms' | 'call' | 'messenger',
    )
      ? (inquiry.preferred_contact as 'email' | 'sms' | 'call' | 'messenger')
      : 'email',
    artistSlug: matchArtistSlugFromInquiry(inquiry.preferred_artist, artists),
    tattooStyle: inquiry.tattoo_type,
    placement: inquiry.placement,
    estimatedSize: inquiry.size,
    tattooDescription,
  }
}
