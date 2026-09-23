'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Award } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { RockShape } from '@/components/brand/RockShape'

export function PastEventCard({ reg }: { reg: any }) {
  const event = reg.events
  const members = reg.members ?? []
  const attended = Array.isArray(reg.attendance)
    ? reg.attendance.length > 0
    : !!reg.attendance?.id
  const released = !!event?.certificates_released_at
  const hasCert = released && (
    Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id ||
    Array.isArray(reg.assignments) ? reg.assignments.length > 0 : !!reg.assignments?.id
  )

  return (
    <Link href={`/participant/portal/events/${reg.id}`}>
      <div className="app-card-hover relative overflow-hidden rounded-poster border-4 border-border bg-panel p-5 shadow-md transition">
        <RockShape variant={3} fill="#F2C230" className="absolute -right-2 -top-2 h-8 w-8 rotate-[10deg] opacity-90" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="font-tech text-[10px] font-bold text-brand uppercase tracking-widest">{event?.event_type}</span>
            <h3 className="font-bold text-foreground mt-0.5 truncate">{event?.title}</h3>
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
