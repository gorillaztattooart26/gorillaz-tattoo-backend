import { cn } from '@/utils/cn'

interface AccordionItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

/** Single collapsible FAQ-style row. Generic enough to reuse outside the FAQ section (e.g. a future Aftercare page). */
export function AccordionItem({ question, answer, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-white/10">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-6 py-6 text-left"
      >
        <span className="text-white text-lg md:text-xl">{question}</span>
        <span
          className={cn(
            'shrink-0 text-white text-2xl leading-none transition-transform duration-300',
            isOpen && 'rotate-45',
          )}
          aria-hidden="true"
        >
          +
        </span>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <p className="max-w-[560px] pb-6 text-sm leading-relaxed text-white/70">{answer}</p>
        </div>
      </div>
    </div>
  )
}
