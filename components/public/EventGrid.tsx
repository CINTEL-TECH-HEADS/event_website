// Owner: FE1 — Event Grid (Premium Neon)

'use client'

import { useMemo, useState } from 'react'
import type { EventWithStats } from '@/types'
import { EventCard } from './EventCard'
import { Search } from 'lucide-react'

const TYPES = ['all', 'workshop', 'seminar', 'fest', 'hackathon', 'talk', 'other']

export function EventGrid({ events }: { events: EventWithStats[] }) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title?.toLowerCase().includes(search.toLowerCase())
      const matchesType = type === 'all' || event.event_type === type
      return matchesSearch && matchesType
    })
  }, [events, search, type])

  return (
    <div className="space-y-8 app-fade-in">
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:max-w-sm group">
          <input
            type="text"
            placeholder="Search payload..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="app-input pl-11 shadow-[0_0_15px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          />
          <Search size={16} className="absolute left-4 top-3.5 text-slate-500 group-focus-within:text-amber-500 transition-colors" />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-[0.45rem] rounded-full text-[0.8rem] font-bold uppercase tracking-wider transition-all duration-300 border
                  ${type === t
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-black/20 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-300'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <p className="text-xs font-semibold tracking-widest text-slate-500 uppercase">
          {filteredEvents.length} Item{filteredEvents.length !== 1 ? 's' : ''} Matched
        </p>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="app-empty-state">
          <p className="text-slate-400">Zero matches for current query parameters.</p>
          <button onClick={() => {setSearch(''); setType('all')}} className="mt-4 text-xs font-bold text-amber-500 hover:text-amber-400 border-b border-amber-500/50 pb-0.5">Reset Filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

    </div>
  )
}
