'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteAvailabilityBlockAction } from '@/app/staff/(protected)/availability/actions'

interface AvailabilityBlockDeleteButtonProps {
  blockId: string
}

/**
 * Row-level delete control for the Availability table — same
 * confirm()/pending/inline-feedback shape as RecordArchiveControls'
 * delete pill, just scoped to a single action instead of
 * archive/restore/delete. Kept as its own small Client Component so
 * AvailabilityDataTable.tsx can stay a Server Component; only this
 * button needs interactivity.
 */
export function AvailabilityBlockDeleteButton({ blockId }: AvailabilityBlockDeleteButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onDelete = async () => {
    if (!confirm('Delete availability block? This will remove this blocked period from the artist’s availability.')) {
      return
    }

    setError(null)
    setIsPending(true)
    const result = await deleteAvailabilityBlockAction(blockId)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => void onDelete()}
        className="flex items-center gap-1.5 rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-60"
      >
        <Trash2 className="h-3.5 w-3.5" />
        {isPending ? 'deleting…' : 'delete'}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
