// Owner: FE2 - Event list table for dashboard overview
import Link from 'next/link'
import { Calendar, ChevronRight, MapPin, Users } from 'lucide-react'
import { EventWithStats } from '@/types'

interface Props {
  events: EventWithStats[]
}

export function EventTable({ events }: Props) {
  if (events.length === 0) {
    return (
      <div className="app-empty-state">
        <p className="text-sm font-medium text-slate-500">No telemetry detected</p>
        <Link
          href="/dashboard/events/new"
          className="mt-3 inline-flex text-sm font-semibold text-amber-500 hover:text-amber-400 border-b border-amber-500/30 pb-0.5"
        >
          Initialize first event
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/dashboard/events/${event.id}`}
          className="app-panel app-card-hover group flex items-center justify-between rounded-2xl p-5 border border-white/5 hover:border-amber-500/30 bg-black/40"
        >
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-baseline gap-3">
              <h3 className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-amber-400">
                {event.title}
              </h3>
              <span
                className={`app-badge ${
                  event.is_published ? 'app-badge-success' : 'app-badge-neutral'
                }`}
              >
                {event.is_published ? 'LIVE_STREAM' : 'DORMANT'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-amber-500/70" />
                {event.venue}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-500/70" />
                {new Date(event.starts_at).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-amber-500/70" />
                {event.confirmed_count} accessed
              </div>
            </div>
          </div>

          <div className="ml-6 flex items-center gap-5 text-right">
            <div>
              <div className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-cyan-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                {event.confirmed_count}
              </div>
              <p className="text-[0.65rem] font-bold tracking-widest uppercase text-slate-500 mt-1">Confirmed</p>
              {event.waitlist_count > 0 && (
                <p className="mt-1 text-[0.65rem] tracking-widest font-bold uppercase text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  {event.waitlist_count} Waitlist
                </p>
              )}
            </div>
            <span className="hidden w-10 h-10 rounded-full border border-white/5 bg-white/5 flex items-center justify-center text-slate-500 transition-all group-hover:bg-amber-500/10 group-hover:text-amber-400 group-hover:border-amber-500/30 sm:flex shrink-0">
              <ChevronRight size={18} className="translate-x-[-1px] group-hover:translate-x-[1px] transition-transform" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
