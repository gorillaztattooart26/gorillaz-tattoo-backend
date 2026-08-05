import { cn } from '@/utils/cn'

/** Shared V2 form-field styling — pill-shaped, dark fill, copper focus ring. */
export const fieldClasses =
  'w-full rounded-[var(--gz-radius-pill)] border border-[var(--gz-border-subtle)] bg-[var(--gz-ink-900)] px-5 py-[13px] text-sm text-[var(--gz-paper-050)] outline-none placeholder:text-[var(--gz-ink-400)] transition-colors duration-150 ease-out focus:border-[var(--gz-copper-500)] focus:ring-2 focus:ring-[rgba(196,98,43,0.22)]'

export const selectClasses = cn(fieldClasses, 'appearance-none capitalize pr-11')

const cardClasses =
  'flex flex-col gap-3.5 rounded-xl border border-[var(--gz-border-subtle)] p-5 md:p-7'

/** Titled card wrapper for a group of related fields (e.g. "01 — Who you are"). */
export function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={cardClasses}>
      <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--gz-ink-400)]">
        {label}
      </span>
      {children}
    </div>
  )
}

/** Native select styled to match `fieldClasses`, with a text-glyph chevron. */
export function SelectField({
  value,
  onChange,
  options,
  srLabel,
}: {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  srLabel: string
}) {
  return (
    <label className="relative block">
      <span className="sr-only">{srLabel}</span>
      <select value={value} onChange={onChange} className={selectClasses}>
        {options.map((option) => (
          <option key={option} value={option} className="bg-[var(--gz-ink-900)]">
            {option}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[11px] text-[var(--gz-ink-400)]"
      >
        ▾
      </span>
    </label>
  )
}
