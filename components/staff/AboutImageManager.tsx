'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { CheckCircle2, Trash2, Upload } from 'lucide-react'
import {
  deleteAboutImageAction,
  uploadAboutImageAction,
} from '@/app/staff/(protected)/gallery/homepage-actions'
import type { HomepageAboutRow } from '@/lib/staff/homepage-media'

const DEFAULT_ABOUT_IMAGE_URL = '/images/studio/studio-interior.jpg'
const DEFAULT_ABOUT_ALT = 'Inside Gorillaz Tattoo Art — private tattoo studio in the Philippines'

interface AboutImageManagerProps {
  about: HomepageAboutRow | null
}

export function AboutImageManager({ about }: AboutImageManagerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const activeImageUrl = about?.image_url ?? DEFAULT_ABOUT_IMAGE_URL
  const activeAlt = about?.alt ?? DEFAULT_ABOUT_ALT

  const onSubmit = (formData: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await uploadAboutImageAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setSuccess('About photo updated — live on the homepage now.')
    })
  }

  const onDelete = () => {
    if (!confirm('Remove the current "About the studio" photo? The homepage will fall back to its default photo.')) return
    setError(null)
    setSuccess(null)
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteAboutImageAction()
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('About photo removed — homepage reverted to its default photo.')
      }
      setIsDeleting(false)
    })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl">
      <h2 className="text-base font-semibold text-[var(--foreground)]">About The Studio Photo</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        The photo next to the &quot;About the studio&quot; text on the homepage. Replacing it updates the live site
        immediately — no code changes needed.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <div className="relative aspect-[4/5] w-full max-w-[240px] overflow-hidden rounded-lg bg-[var(--gz-ink-900)] md:rounded-xl">
          <Image key={activeImageUrl} src={activeImageUrl} alt={activeAlt} fill className="object-cover" />
        </div>

        <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block text-xs text-[var(--foreground)]/50">
              {about ? 'Replace photo' : 'Upload photo'}
            </span>
            <input
              name="image"
              type="file"
              accept="image/*"
              required
              className="block w-full text-sm text-[var(--foreground)]/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--primary-foreground)]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs text-[var(--foreground)]/50">Alt text</span>
            <input
              name="alt"
              type="text"
              required
              defaultValue={about?.alt ?? ''}
              placeholder="Inside Gorillaz Tattoo Art — private tattoo studio in the Philippines"
              className="block w-full rounded-lg border border-[var(--border)] bg-transparent px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30"
            />
          </label>

          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
          {success && (
            <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isPending && !isDeleting ? 'uploading…' : about ? 'replace photo' : 'upload photo'}
            </button>

            {about && (
              <button
                type="button"
                onClick={onDelete}
                disabled={isPending}
                className="flex items-center justify-center gap-2 rounded-full border border-red-500/40 px-5 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'removing…' : 'delete'}
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--foreground)]/40">
            {about ? 'Currently using an uploaded photo.' : 'Currently using the default studio photo.'} JPG or PNG,
            up to 10MB.
          </p>
        </form>
      </div>
    </div>
  )
}
