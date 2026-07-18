export interface GalleryItem {
  /** One or more photos of the same piece. Multiple images render as an in-card carousel. */
  images: string[]
  alt: string
  piece: string
  category: string
  artistName: string
}
