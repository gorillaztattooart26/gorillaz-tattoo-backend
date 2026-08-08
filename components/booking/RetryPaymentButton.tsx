'use client'

import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { createCheckoutSessionAction } from '@/components/booking/payment-actions'

interface RetryPaymentButtonProps {
  token: string
}

/**
 * Starts a new PayMongo checkout session for the same booking — the
 * exact same Server Action PaymentCard's "Pay Down Payment" button
 * calls, just triggered from the Payment Failed page instead. No new
 * payment logic: `createCheckoutSessionAction` already re-validates the
 * booking is still awaiting a down payment and re-derives the amount
 * server-side before creating anything.
 */
export function RetryPaymentButton({ token }: RetryPaymentButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRetry() {
    setError(null)
    setIsRedirecting(true)

    const result = await createCheckoutSessionAction(token)

    if (!result.checkoutUrl) {
      setError(result.error ?? 'Something went wrong. Please try again.')
      setIsRedirecting(false)
      return
    }

    window.location.href = result.checkoutUrl
  }

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleRetry}
        disabled={isRedirecting}
        className="flex h-auto w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] py-3.5 text-sm font-semibold text-[var(--primary-foreground)] transition-all duration-300 hover:bg-[var(--primary)]/90 hover:shadow-[0_0_24px_rgba(196,98,43,0.5)] disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-8"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {isRedirecting ? 'Redirecting…' : 'Retry Payment'}
      </button>
      {error && (
        <p role="alert" className="text-center text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
