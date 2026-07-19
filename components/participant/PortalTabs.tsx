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
    <div className="sticky top-16 z-20 -mx-4 mb-6 flex gap-1 border-b border-white/10 bg-[#07101d]/94 px-4 backdrop-blur">
      {TABS.map(({ key, label, Icon }) => {
        const on = active === key
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              on
                ? 'border-amber-300 text-white'
                : 'border-transparent text-slate-400 hover:text-white'
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
