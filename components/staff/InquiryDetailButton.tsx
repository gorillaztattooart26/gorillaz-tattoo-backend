'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/staff/format'
import type { StaffInquiry } from '@/lib/staff/inquiries'

interface InquiryDetailButtonProps {
  inquiry: StaffInquiry
}

/**
 * Trigger + modal in one component so the open/close state stays local
 * to each row — the Inquiries table itself is a Server Component and
 * can't hold interactive state. `fixed inset-0` here works correctly
 * even though this renders inside a scrollable table cell, since nothing
 * in the staff layout (StaffSidebar, the table's overflow-x-auto wrapper)
 * sets a transform/filter that would create a containing block.
 */
export function InquiryDetailButton({ inquiry }: InquiryDetailButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const triggerNode = triggerRef.current
    const modalNode = modalRef.current
    const focusable = modalNode?.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
    )
    focusable?.[0]?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        return
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      triggerNode?.focus()
    }
  }, [isOpen])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5"
      >
        view full inquiry
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Full inquiry from ${inquiry.full_name}`}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--background)]/80 p-4"
        >
          <div
            ref={modalRef}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold capitalize text-[var(--foreground)]">{inquiry.full_name}</h2>
                <p className="mt-1 text-xs text-[var(--foreground)]/40">submitted {formatDate(inquiry.created_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[var(--foreground)]/60 transition-colors hover:bg-[var(--foreground)]/10 hover:text-[var(--foreground)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <Field label="Email" value={inquiry.email} className="col-span-2" />
              <Field label="Phone" value={inquiry.phone} />
              <Field label="Preferred contact" value={inquiry.preferred_contact} capitalize />
              <Field label="Preferred artist" value={inquiry.preferred_artist} capitalize />
              <Field label="Tattoo style" value={inquiry.tattoo_type} capitalize />
              <Field label="Placement" value={inquiry.placement} />
              <Field label="Size" value={inquiry.size} />
              <Field label="Height" value={inquiry.height || '—'} />
              <Field label="Weight" value={inquiry.weight || '—'} />
              <Field label="Description" value={inquiry.message} multiline className="col-span-2" />
            </dl>

            {inquiry.images.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-[var(--foreground)]/40">Reference images</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {inquiry.images.map((url, index) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block h-20 w-20 overflow-hidden rounded-lg border border-[var(--border)] transition-opacity hover:opacity-80"
                    >
                      <Image
                        src={url}
                        alt={`Reference image ${index + 1} of ${inquiry.images.length} from ${inquiry.full_name}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Field({
  label,
  value,
  capitalize,
  multiline,
  className,
}: {
  label: string
  value: string
  capitalize?: boolean
  multiline?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-[var(--foreground)]/40">{label}</dt>
      <dd className={cn('mt-1 text-[var(--foreground)]/80', capitalize && 'capitalize', multiline && 'whitespace-pre-wrap leading-relaxed')}>
        {value}
      </dd>
    </div>
  )
}
