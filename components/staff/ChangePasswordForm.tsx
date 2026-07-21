'use client'

import { useRef, useState, useTransition } from 'react'
import { KeyRound } from 'lucide-react'
import { changePasswordAction } from '@/app/staff/(protected)/settings/actions'
import { fieldClasses } from '@/components/ui/fieldStyles'

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const onSubmit = (formData: FormData) => {
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const result = await changePasswordAction(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      setSaved(true)
    })
  }

  return (
    <form
      ref={formRef}
      action={onSubmit}
      onChange={() => setSaved(false)}
      className="flex flex-col gap-6 rounded-lg border border-white/10 bg-neutral-900/60 p-6 md:rounded-2xl"
    >
      <div>
        <h2 className="text-base font-semibold text-white">Change password</h2>
        <p className="mt-1 text-sm text-white/50">Update the password you use to log in to this dashboard.</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Current password</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">New password</span>
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClasses}
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-xs text-white/50">Confirm new password</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={fieldClasses}
        />
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && !error && <p className="text-sm text-emerald-400">Password changed.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-full bg-[#fabb42] px-6 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#ffc85c] disabled:opacity-60 lg:w-fit"
      >
        <KeyRound className="h-4 w-4" />
        {isPending ? 'saving…' : 'change password'}
      </button>
    </form>
  )
}
