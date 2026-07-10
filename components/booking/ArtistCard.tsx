import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InstagramIcon } from '@/components/common/icons'
import type { Artist } from '@/types/artist'

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Card className="p-6">
      <CardHeader className="px-0 pb-2">
        <CardTitle className="text-lg text-white">Your Artist</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-6 px-0 sm:flex-row">
        <div className="relative mx-auto h-40 w-40 shrink-0 overflow-hidden rounded-2xl sm:mx-0">
          <Image
            src={artist.src}
            alt={artist.alt}
            fill
            sizes="160px"
            className="object-cover grayscale"
          />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="hero-title first-letter:uppercase text-2xl font-medium text-white">
            {artist.name}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {artist.specialty} · {artist.years} experience
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/70">{artist.bio}</p>
          <a
            href={artist.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            <InstagramIcon className="h-4 w-4" />
            Instagram
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
