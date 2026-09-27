'use client'

import { Ticket, History, CircleUser } from 'lucide-react'

export type PortalTab = 'events' | 'past' | 'profile'

const TABS: { key: PortalTab; label: string; Icon: typeof Ticket }[] = [
  { key: 'events', label: 'Current', Icon: Ticket },
  { key: 'past', label: 'Past', Icon: History },
  { key: 'profile', label: 'Profile', Icon: CircleUser },
]

export function PortalTabs({
  active,
  onChange,
}: {
  active: PortalTab
  onChange: (tab: PortalTab) => void
}) {
  return (
    <div className="sticky top-[66px] z-20 -mx-4 mb-8 flex gap-1 border-b-2 border-border bg-background px-4 lg:top-[84px]">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={on}
            className={`-mb-0.5 flex items-center gap-2 border-b-4 px-3 py-3 font-tech text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 sm:px-4 sm:text-xs ${
              on
                ? 'border-brand text-foreground'
                : 'border-transparent text-foreground-soft hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
