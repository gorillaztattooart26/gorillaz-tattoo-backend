'use client'

import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ReferenceImage } from '@/types/booking-portal'

interface ReferenceImageGalleryProps {
  images: ReferenceImage[]
}

/** Responsive thumbnail grid; each thumbnail opens its own fullscreen dialog. */
export function ReferenceImageGallery({ images }: ReferenceImageGalleryProps) {
  if (images.length === 0) {
    return <p className="text-sm text-white/50">No reference images attached.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((image) => (
        <Dialog key={image.src}>
          <DialogTrigger className="group relative aspect-square overflow-hidden rounded-xl bg-neutral-900">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="200px"
              className="object-cover grayscale opacity-80 transition-transform duration-300 group-hover:scale-105"
            />
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-black p-2 sm:max-w-3xl">
            <DialogTitle className="sr-only">{image.alt}</DialogTitle>
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg sm:aspect-video">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
