import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import type { Event } from '@/types'
import { formatShortDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/club'
import { CapacityBadge } from './CapacityBadge'
import { optimizedImage } from '@/lib/image'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

export function EventCard({ event, past = false }: { event: PublicEvent; past?: boolean; accentIndex?: number }) {
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] ?? event.event_type
  const fee = event.fee ?? 0

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-border bg-panel shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] overflow-hidden border-b-2 border-border bg-[#14120F]">
        {event.banner_url ? (
          <img
            src={optimizedImage(event.banner_url, 828)}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="relative flex h-full items-end p-4">
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.18]" />
            <span className="relative font-display text-3xl uppercase text-primary-yellow/90">{typeLabel}</span>
          </div>
        )}
        {event.banner_url && (
          <span className="absolute left-3 top-3 rounded-full border-2 border-border bg-panel px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-widest text-foreground">
            {typeLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-lg font-black uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-brand">
          {event.title}
        </h3>
        <div className="space-y-1.5 text-sm font-medium text-foreground-soft">
          <p className="flex items-center gap-2">
            <CalendarDays size={14} className="shrink-0 text-brand" strokeWidth={2.5} />
            {formatShortDate(event.starts_at)}
          </p>
          {event.venue && (
            <p className="flex items-center gap-2">
              <MapPin size={14} className="shrink-0 text-brand" strokeWidth={2.5} />
              <span className="line-clamp-1">{event.venue}</span>
            </p>
          )}
        </div>
        {!past && (
          <div className="mt-auto flex flex-wrap items-center gap-2 border-t-2 border-border pt-3">
            <span className="app-badge app-badge-neutral">{fee > 0 ? `₹${fee}` : 'Free'}</span>
            {event.open_to_external && <span className="app-badge app-badge-warning">Open to all colleges</span>}
            <CapacityBadge event={event} />
          </div>
        )}
      </div>
    </Link>
  )
}
