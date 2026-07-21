'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Save } from 'lucide-react'
import { updateArtistProfileAction } from '@/app/staff/(protected)/artists/actions'
import { fieldClasses } from '@/components/ui/fieldStyles'
import type { StaffArtist } from '@/lib/staff/artists'

interface ArtistProfileFormProps {
  artist: StaffArtist
}

export function ArtistProfileForm({ artist }: ArtistProfileFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await updateArtistProfileAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setSaved(true)
    })
  }

  return (
    <form
      action={onSubmit}
      onChange={() => setSaved(false)}
      className="grid grid-cols-1 gap-6 rounded-lg border border-white/10 bg-neutral-900/60 p-6 md:rounded-2xl lg:grid-cols-2"
    >
      <div className="flex items-center gap-4 lg:col-span-2">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-neutral-800">
          <Image src={artist.image_path} alt={artist.name} fill sizes="64px" className="object-cover" />
        </div>
        <div>
          <p className="text-base font-semibold capitalize text-white">{artist.name}</p>
          <p className="text-xs text-white/40">this is how you appear on the public site</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Specialty</span>
        <input
          name="specialty"
          required
          defaultValue={artist.specialty}
          placeholder="e.g. black & grey realism"
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Years of experience</span>
        <input name="years" required defaultValue={artist.years} placeholder="e.g. 3 yrs" className={fieldClasses} />
      </label>

      <label className="block lg:col-span-2">
        <span className="mb-2 block text-xs text-white/50">Bio</span>
        <textarea name="bio" required rows={4} defaultValue={artist.bio} className={fieldClasses} />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Instagram URL</span>
        <input
          name="instagram_url"
          type="url"
          defaultValue={artist.instagram_url ?? ''}
          placeholder="https://instagram.com/..."
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Facebook URL</span>
        <input
          name="facebook_url"
          type="url"
          defaultValue={artist.facebook_url ?? ''}
          placeholder="https://facebook.com/..."
          className={fieldClasses}
        />
      </label>

      <label className="block lg:col-span-2">
        <span className="mb-2 block text-xs text-white/50">Replace photo</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="block w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[#fabb42] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-black"
        />
      </label>

      {error && <p className="text-sm text-red-400 lg:col-span-2">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-400 lg:col-span-2">Profile updated.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-[#fabb42] px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] disabled:opacity-60 lg:col-span-2 lg:w-fit"
      >
        <Save className="h-4 w-4" />
        {isPending ? 'saving…' : 'save changes'}
      </button>
    </form>
  )
}
