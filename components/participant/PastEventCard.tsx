'use client'

import Link from 'next/link'
import { Calendar, MapPin, Users, Award } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'

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
      <div className="bg-[#0a1629] border border-white/10 p-5 transition hover:border-amber-300/30">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">{event?.event_type}</span>
            <h3 className="font-semibold text-white mt-0.5 truncate">{event?.title}</h3>
          </div>
          {attended ? (
            <span className="shrink-0 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5">✓ Attended</span>
          ) : (
            <span className="shrink-0 text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5">Not marked</span>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {event?.starts_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-500" />
              {formatShortDate(event.starts_at)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1">
              <MapPin size={11} className="text-slate-500" />
              {event.venue}
            </span>
          )}
          {reg.registration_type === 'team' && (
            <span className="flex items-center gap-1">
              <Users size={11} className="text-slate-500" />
              {reg.team_name}{members.length ? ` · ${members.length} member${members.length === 1 ? '' : 's'}` : ''}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between">
          {hasCert ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold border border-amber-300/30 bg-amber-300/10 text-amber-200 px-2.5 py-1">
              <Award size={12} /> Certificate ready
            </span>
          ) : <span />}
          <span className="text-[11px] font-mono text-slate-600">#{reg.display_id}</span>
        </div>
      </div>
    </Link>
  )
}
