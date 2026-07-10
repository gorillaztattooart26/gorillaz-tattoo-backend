import type { Artist } from '@/types/artist'

/**
 * Shared artist roster — used by the staff booking form's artist picker.
 * Mirrors the same two artists shown on the homepage carousel
 * (components/sections/ArtistsPreview.tsx keeps its own copy since its
 * bio copy is tuned for that specific layout).
 */
export const ARTISTS: Artist[] = [
  {
    slug: 'andrea-santos',
    src: '/images/artists/artist-1.jpg',
    name: 'andrea santos',
    specialty: 'fine line & script',
    years: '8 yrs',
    bio: 'andrea found tattooing through hand-poke work before moving to machine fine line. every piece favors negative space over noise — delicate linework built to age well.',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    alt: 'andrea santos — fine line and script tattoo artist at gorillaz tattoo art studio philippines',
  },
  {
    slug: 'miko-reyes',
    src: '/images/artists/artist-2.jpg',
    name: 'miko reyes',
    specialty: 'blackwork & tribal',
    years: '12 yrs',
    bio: 'miko apprenticed under traditional filipino tattooists and has spent over a decade pushing heavy blackwork and tribal patterns into bold, modern silhouettes.',
    instagram: 'https://instagram.com',
    facebook: 'https://facebook.com',
    alt: 'miko reyes — blackwork and tribal tattoo artist at gorillaz tattoo art studio philippines',
  },
]

export function getArtistBySlug(slug: string): Artist | null {
  return ARTISTS.find((artist) => artist.slug === slug) ?? null
}
