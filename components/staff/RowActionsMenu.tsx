'use client'

import { Menu } from '@base-ui/react/menu'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RowActionsMenuProps {
  /** Screen-reader label for the trigger, e.g. "Actions for GTA-XXXXXXX". */
  label: string
  children: React.ReactNode
  className?: string
}

/**
 * Compact per-row "Actions" trigger + popup menu — replaces a row's
 * previously always-visible stack of action buttons (Reschedule/Complete/
 * Cancel/Archive/Delete/etc.) with a single control, revealed on demand.
 * Doesn't own or alter any action's behavior: callers pass their existing
 * action components as `children`, restyled from inline pills to a
 * vertical menu list, but with the exact same onClick/confirm()/server
 * action/feedback-state logic as before.
 *
 * Built on the Base UI Menu primitive already used elsewhere in this app
 * (see components/ui/dialog.tsx's equivalent Dialog primitive) rather than
 * a hand-rolled dropdown: `Menu.Portal` renders the popup to `document.body`
 * and `Menu.Positioner` handles anchored placement with collision
 * avoidance, so the popup is never clipped by the table's own
 * `overflow-x-auto` scroll container. `modal={false}` keeps it a
 * lightweight dropdown (no body-scroll lock, rest of the page stays
 * interactive) rather than a full modal takeover. Outside-press and Escape
 * are handled by Menu.Root itself — opening a different row's menu counts
 * as an outside press on the first, so only one row's menu is ever open at
 * a time without extra state.
 *
 * Deliberately does not use `Menu.Item` for the actions themselves: those
 * already carry their own confirm()/async/feedback-message logic (and, for
 * reschedule, its own nested dialog) unrelated to menu semantics — using
 * Menu.Item's built-in close-on-click would hide the inline success/error
 * feedback text the moment an action is clicked, before the customer
 * could ever see it. The popup stays open until the user dismisses it
 * (outside click, Escape, or the same close affordance), so that feedback
 * text remains visible exactly as it did before this change.
 */
export function RowActionsMenu({ label, children, className }: RowActionsMenuProps) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label={label}
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 transition-colors hover:bg-[var(--foreground)]/5 data-[popup-open]:bg-[var(--foreground)]/10"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
        Actions
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6} collisionPadding={12} className="z-50 outline-none">
          <Menu.Popup
            className={cn(
              'flex w-[min(280px,90vw)] flex-col gap-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-xl',
              className,
            )}
          >
            {children}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}
