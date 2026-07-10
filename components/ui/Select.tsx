import { ChevronIcon } from '@/components/common/icons'
import { fieldClasses } from '@/components/ui/fieldStyles'
import { cn } from '@/utils/cn'

interface SelectProps {
  value: string
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void
  options: string[]
  srLabel: string
  capitalize?: boolean
}

/** Styled native select with a custom chevron (properly padded, not flush against the edge). */
export function Select({ value, onChange, options, srLabel, capitalize = false }: SelectProps) {
  return (
    <label className="block relative">
      <span className="sr-only">{srLabel}</span>
      <select
        value={value}
        onChange={onChange}
        className={cn(fieldClasses, 'appearance-none pr-11', capitalize && 'capitalize')}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-neutral-900">
            {option}
          </option>
        ))}
      </select>
      <ChevronIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
    </label>
  )
}
