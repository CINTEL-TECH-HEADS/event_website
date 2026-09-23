'use client'

import { Ticket, History, CircleUser } from 'lucide-react'

export type PortalTab = 'events' | 'past' | 'profile'

const TABS: { key: PortalTab; label: string; Icon: typeof Ticket }[] = [
  { key: 'events', label: 'My Events', Icon: Ticket },
  { key: 'past', label: 'Past Events', Icon: History },
  { key: 'profile', label: 'My Profile', Icon: CircleUser },
]

export function PortalTabs({
  active,
  onChange,
}: {
  active: PortalTab
  onChange: (tab: PortalTab) => void
}) {
  return (
    <div className="sticky top-16 z-20 -mx-4 mb-6 flex gap-2 bg-background px-4 py-2 sm:gap-3">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`flex items-center gap-2 rounded-full border-2 border-border px-3 py-2 font-tech text-[10px] font-bold uppercase tracking-widest transition duration-200 active:translate-x-[2px] active:translate-y-[2px] sm:px-4 sm:py-2.5 sm:text-xs ${
              on
                ? 'bg-brand text-white shadow-sm active:shadow-none'
                : 'bg-transparent text-foreground-soft hover:text-foreground'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
