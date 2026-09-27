'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import type { Event, EventType } from '@/types'
import { EVENT_TYPE_LABELS } from '@/lib/club'
import { cn } from '@/lib/utils'
import { EventCard } from './EventCard'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

// Search + type filter over a list of events. Only types that actually occur
// in the list are offered as filters.
export function EventGrid({ events, past = false }: { events: PublicEvent[]; past?: boolean }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | EventType>('all')

  const types = useMemo(() => {
    const counts = new Map<EventType, number>()
    for (const e of events) counts.set(e.event_type, (counts.get(e.event_type) ?? 0) + 1)
    return [...counts.entries()]
  }, [events])

  const query = search.trim().toLowerCase()
  const filtered = events.filter(
    (e) => (query === '' || e.title.toLowerCase().includes(query)) && (type === 'all' || e.event_type === type)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-soft" strokeWidth={2.5} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            aria-label="Search events by name"
            className="app-input !pl-11"
          />
        </div>

        {types.length > 1 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
            {[['all', events.length] as const, ...types].map(([value, count]) => (
              <button
                key={value}
                type="button"
                onClick={() => setType(value)}
                aria-pressed={type === value}
                className={cn(
                  'rounded-full border-2 border-border px-3.5 py-1.5 font-tech text-xs font-bold uppercase tracking-wider transition-colors duration-200',
                  type === value ? 'bg-foreground text-background' : 'bg-panel text-foreground-soft hover:text-foreground'
                )}
              >
                {value === 'all' ? 'All' : EVENT_TYPE_LABELS[value] ?? value}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="app-empty-state">
          <p className="text-base font-black uppercase text-foreground">No events match</p>
          <p className="mt-2 text-sm font-medium text-foreground-soft">Try a different name or clear the filter.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} past={past} />
          ))}
        </div>
      )}
    </div>
  )
}
