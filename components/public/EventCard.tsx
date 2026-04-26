import Link from 'next/link'
import type { Event } from '@/types'
import { formatShortDate } from '@/lib/utils'
import { CapacityBadge } from './CapacityBadge'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

export function EventCard({ event }: { event: PublicEvent }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group overflow-hidden border border-white/10 bg-[#0a1629] transition duration-300 hover:border-amber-300/25"
    >
      <div className="relative h-48 overflow-hidden border-b border-white/10 bg-[#112240]">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-medium text-slate-200">
            Event banner coming soon
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,31,0.06),rgba(9,17,31,0.72))]" />
        <span className="absolute left-4 top-4 border border-amber-300/30 bg-[#07101d]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
          {event.event_type}
        </span>
        <div className="absolute bottom-4 left-4 border-l-2 border-amber-300 bg-[#07101d]/80 px-3 py-2 text-white">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-100">Starts</p>
          <p className="mt-1 text-sm font-semibold">{formatShortDate(event.starts_at)}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h2 className="line-clamp-2 text-xl font-semibold tracking-tight text-white transition group-hover:text-amber-200">
            {event.title}
          </h2>
          <div className="space-y-1 text-sm text-slate-300">
            <p className="line-clamp-1">{event.venue}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <CapacityBadge event={event} />
          <span className="text-sm font-semibold text-amber-200 transition group-hover:translate-x-1">
            View event
          </span>
        </div>
      </div>
    </Link>
  )
}
