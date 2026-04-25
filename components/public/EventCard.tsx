// Owner: FE1 — Event Card (Neon Cyberpunk)

import Link from 'next/link'
import Image from 'next/image'
import type { EventWithStats } from '@/types'
import { formatEventDate } from '@/lib/utils'
import { CapacityBadge } from './CapacityBadge'
import { MapPin, CalendarDays, ArrowRight } from 'lucide-react'

export function EventCard({ event }: { event: EventWithStats }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block app-panel rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] transition-all duration-300 border border-white/5 hover:border-amber-500/30 relative bg-[#060f23]"
    >
      {/* Glow Hover Effect Top */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/0 group-hover:via-amber-500/50 to-transparent transition-all duration-500"></div>

      {/* Banner */}
      <div className="relative w-full h-48 bg-[#0a0a0a] overflow-hidden border-b border-white/5">
        {event.banner_url ? (
          <>
            <Image
              src={event.banner_url}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-110 group-hover:opacity-60 opacity-80 transition-all duration-700 ease-out"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/90 to-transparent opacity-80 mix-blend-multiply"></div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col px-6 justify-center items-center bg-gradient-to-br from-slate-900 to-black text-xs font-mono text-slate-600">
             <div className="w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent absolute inset-0"></div>
             NO VISUAL DATA
          </div>
        )}

        {/* Floating Type Badge */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded text-[0.65rem] font-bold text-amber-400 uppercase tracking-widest">
          {event.event_type}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-full bg-[#030917]/80 backdrop-blur-sm">

        <h2 className="text-xl font-bold text-white leading-tight line-clamp-2 group-hover:text-amber-400 transition-colors">
          {event.title}
        </h2>

        <div className="mt-4 space-y-2.5 flex-1">
          <div className="flex items-center gap-2.5 text-sm text-slate-400 font-medium">
            <CalendarDays size={14} className="text-amber-500/70" />
            <span>{formatEventDate(event.starts_at)}</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-slate-400 font-medium">
            <MapPin size={14} className="text-amber-500/70 mt-0.5 shrink-0" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
          <CapacityBadge
            capacity={event.capacity}
            confirmed={event.confirmed_count}
          />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 group-hover:bg-amber-500 group-hover:text-slate-900 text-slate-500 transition-all shadow-[0_0_15px_rgba(245,158,11,0)] group-hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <ArrowRight size={14} className="translate-x-[-1px] group-hover:translate-x-[1px] transition-transform" />
          </span>
        </div>

      </div>
    </Link>
  )
}