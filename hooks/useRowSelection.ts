'use client'

import { useMemo, useState, useCallback } from 'react'

/** Checkbox-column selection state for a bulk-select table (Bookings/Inquiries/Payments data-management views). Selection is keyed by row id and cleared whenever the caller calls `clear()` — used after a bulk action succeeds. */
export function useRowSelection(allIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const isSelected = useCallback((id: string) => selected.has(id), [selected])

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)))
  }, [allIds])

  const clear = useCallback(() => setSelected(new Set()), [])

  const allSelected = allIds.length > 0 && selected.size === allIds.length

  return { selectedIds: useMemo(() => Array.from(selected), [selected]), isSelected, toggle, toggleAll, allSelected, clear, count: selected.size }
}
