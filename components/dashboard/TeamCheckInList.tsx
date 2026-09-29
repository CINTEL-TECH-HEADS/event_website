// Tick who is here for a team. Used by the scanners (after a team pass is
// scanned) and by the check-in page's attendance list. Starts with the members
// already marked present, so a first scan starts with nobody ticked.
'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

export type CheckInMember = {
  id: string
  full_name: string
  email: string
  is_leader: boolean
  checked_in_at: string | null
}

export function TeamCheckInList({
  members,
  saving = false,
  requireOne = false,
  confirmLabel = 'Save attendance',
  onConfirm,
  onCancel,
}: {
  members: CheckInMember[]
  saving?: boolean
  // Scanning needs at least one person present; the list may mark everyone absent.
  requireOne?: boolean
  confirmLabel?: string
  onConfirm: (presentIds: string[]) => void
  onCancel?: () => void
}) {
  const [present, setPresent] = useState<Set<string>>(
    () => new Set(members.filter((m) => m.checked_in_at).map((m) => m.id))
  )

  function toggle(id: string) {
    setPresent((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const count = present.size
  const blocked = saving || (requireOne && count === 0)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-widest text-foreground-soft">
        <span>{count} of {members.length} present</span>
        <span className="flex gap-3">
          <button type="button" onClick={() => setPresent(new Set(members.map((m) => m.id)))} className="text-brand hover:underline">
            All
          </button>
          <button type="button" onClick={() => setPresent(new Set())} className="text-brand hover:underline">
            None
          </button>
        </span>
      </div>

      <ul className="space-y-2">
        {members.map((m) => {
          const on = present.has(m.id)
          return (
            <li key={m.id}>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 border-border px-3 py-2.5 transition-colors duration-150 ${
                  on ? 'bg-success/15' : 'bg-panel-muted'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(m.id)}
                  className="h-5 w-5 shrink-0 accent-success"
                  aria-label={`${m.full_name} is present`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-foreground">
                    {m.full_name}
                    {m.is_leader && (
                      <span className="ml-2 rounded-full border-2 border-border bg-primary-yellow px-2 py-0.5 align-middle text-[10px] font-black uppercase tracking-wide text-[#121212]">
                        Leader
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-xs font-medium text-foreground-soft">{m.email}</span>
                </span>
                {m.checked_in_at && (
                  <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-foreground-soft">
                    since {new Date(m.checked_in_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </label>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving} className="app-button-secondary">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={() => onConfirm([...present])}
          disabled={blocked}
          className="app-button-primary disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
