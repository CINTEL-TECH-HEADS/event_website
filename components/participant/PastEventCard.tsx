'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Award } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { EVENT_TYPE_LABELS } from '@/lib/club'

export function PastEventCard({ reg }: { reg: any }) {
  const event = reg.events
  const members = reg.members ?? []
  const attended = Array.isArray(reg.attendance)
    ? reg.attendance.length > 0
    : !!reg.attendance?.id
  const released = !!event?.certificates_released_at
  const hasAny = (v: any) => (Array.isArray(v) ? v.length > 0 : !!v?.id)
  const hasCert = released && (hasAny(reg.certificates) || hasAny(reg.assignments))

  return (
    <Link href={`/participant/portal/events/${reg.id}`} className="block h-full">
      <div className="h-full rounded-2xl border-2 border-border bg-panel p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="font-tech text-[10px] font-bold text-brand uppercase tracking-widest">{EVENT_TYPE_LABELS[event?.event_type] ?? event?.event_type}</span>
            <h3 className="mt-0.5 truncate font-black uppercase tracking-tight text-foreground">{event?.title}</h3>
          </div>
          {attended ? (
            <span className="app-badge-success app-badge shrink-0">Attended</span>
          ) : (
            <span className="app-badge-neutral app-badge shrink-0">Not marked</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground-soft">
          {event?.starts_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatShortDate(event.starts_at)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1">
              <MapPin size={11} />
              {event.venue}
            </span>
          )}
          {reg.registration_type === 'team' && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {reg.team_name}{members.length ? ` · ${members.length} member${members.length === 1 ? '' : 's'}` : ''}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between border-t-2 border-border pt-3">
          {hasCert ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-primary-yellow px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[#121212]">
              <Award size={12} /> Certificate ready
            </span>
          ) : <span />}
          <span className="text-[11px] font-mono font-bold text-foreground-soft">#{reg.display_id}</span>
        </div>
      </div>
    </Link>
  )
}
