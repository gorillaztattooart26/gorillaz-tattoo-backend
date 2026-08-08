'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CopyBookingLinkProps {
  url: string
}

/** Copies a booking's unique client link to the clipboard — lets staff recover a link the customer lost without digging through email history. */
export function CopyBookingLink({ url }: CopyBookingLinkProps) {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'copied' : 'copy link'}
    </button>
  )
}
