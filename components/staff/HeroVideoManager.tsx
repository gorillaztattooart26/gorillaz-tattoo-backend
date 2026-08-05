'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, Trash2, Upload } from 'lucide-react'
import {
  deleteHeroVideoAction,
  uploadHeroVideoAction,
} from '@/app/staff/(protected)/gallery/homepage-actions'
import type { HomepageHeroRow } from '@/lib/staff/homepage-media'

const DEFAULT_HERO_VIDEO_URL = '/videos/homepage-v2/hero-video.mp4'

interface HeroVideoManagerProps {
  hero: HomepageHeroRow | null
}

export function HeroVideoManager({ hero }: HeroVideoManagerProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const activeVideoUrl = hero?.video_url ?? DEFAULT_HERO_VIDEO_URL

  const onSubmit = (formData: FormData) => {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await uploadHeroVideoAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setSuccess('Hero video updated — live on the homepage now.')
    })
  }

  const onDelete = () => {
    if (!confirm('Remove the current hero video? The homepage will fall back to its default reel.')) return
    setError(null)
    setSuccess(null)
    setIsDeleting(true)
    startTransition(async () => {
      const result = await deleteHeroVideoAction()
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Hero video removed — homepage reverted to its default reel.')
      }
      setIsDeleting(false)
    })
  }

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]/60 p-6 md:rounded-2xl">
      <h2 className="text-base font-semibold text-[var(--foreground)]">Homepage Hero Video</h2>
      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
        The feature tile in the homepage hero plays this video on loop. Replacing it updates the live site
        immediately — no code changes needed.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[240px_1fr]">
        <div className="relative aspect-square w-full max-w-[240px] overflow-hidden rounded-lg bg-[var(--gz-ink-900)] md:rounded-xl">
          <video key={activeVideoUrl} src={activeVideoUrl} autoPlay loop muted playsInline className="h-full w-full object-cover" />
        </div>

        <form ref={formRef} action={onSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-2 block text-xs text-[var(--foreground)]/50">
              {hero ? 'Replace video' : 'Upload video'}
            </span>
            <input
              name="video"
              type="file"
              accept="video/*"
              required
              className="block w-full text-sm text-[var(--foreground)]/70 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--primary)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--primary-foreground)]"
            />
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-400">
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
              {isPending && !isDeleting ? 'uploading…' : hero ? 'replace video' : 'upload video'}
            </button>

            {hero && (
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
            {hero ? 'Currently using an uploaded video.' : 'Currently using the default studio reel.'} MP4, up to
            200MB.
          </p>
        </form>
      </div>
    </div>
  )
}
