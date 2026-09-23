import Link from 'next/link'
import type { Event } from '@/types'
import { formatShortDate } from '@/lib/utils'
import { CapacityBadge } from './CapacityBadge'
import { RockShape } from '@/components/brand/RockShape'
import { Sparkle } from '@/components/brand/Starburst'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

const ACCENTS = ['#D6294C', '#14120F', '#F2C230']
const ROCK_VARIANTS = [1, 2, 3] as const

export function EventCard({ event, accentIndex = 0 }: { event: PublicEvent; accentIndex?: number }) {
  const accent = ACCENTS[accentIndex % ACCENTS.length]
  const rockVariant = ROCK_VARIANTS[accentIndex % ROCK_VARIANTS.length]

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative block overflow-hidden rounded-poster border-2 border-border bg-panel shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg lg:border-4"
    >
      {/* Decorative corner accent, rotated 1-in-3 */}
      {accentIndex % 3 === 1 ? (
        <Sparkle className="absolute right-3 top-3 z-10 h-6 w-6" color={accent} />
      ) : (
        <RockShape
          variant={rockVariant}
          fill={accent}
          className={`absolute right-3 top-3 z-10 h-7 w-7 ${accentIndex % 3 === 0 ? 'rotate-[12deg]' : '-rotate-6'}`}
        />
      )}

      <div className="relative h-48 overflow-hidden border-b-2 border-border bg-panel-muted lg:border-b-4">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.title}
            className="h-full w-full object-cover grayscale transition duration-300 group-hover:scale-[1.03] group-hover:grayscale-0"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-tech text-xs font-bold uppercase tracking-wider text-foreground-soft">
            Event banner coming soon
          </div>
        )}

        <span className="absolute left-4 top-4 rounded-full border-2 border-border bg-panel px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-widest text-foreground">
          {event.event_type}
        </span>
        <div className="absolute bottom-0 left-0 rounded-tr-2xl border-r-2 border-t-2 border-border bg-foreground px-3 py-2 text-background">
          <p className="font-tech text-[9px] font-bold uppercase tracking-widest opacity-70">Starts</p>
          <p className="mt-1 font-display text-sm">{formatShortDate(event.starts_at)}</p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <h2 className="line-clamp-2 text-xl font-black uppercase leading-tight tracking-tight text-foreground transition duration-200 group-hover:text-brand">
            {event.title}
          </h2>
          <div className="space-y-1 text-sm font-medium text-foreground-soft">
            <p className="line-clamp-1">{event.venue}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t-2 border-border pt-4">
          <CapacityBadge event={event} />
          <span className="font-tech text-xs font-bold uppercase tracking-widest text-brand transition duration-200 group-hover:translate-x-1">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  )
}
