import Link from 'next/link'
import { formatShortDate, isPast } from '@/lib/utils'
import { MapPin, Calendar, Users } from 'lucide-react'

interface Props {
  reg: any
}

export function RegistrationCard({ reg }: Props) {
  const event    = reg.events
  const attended = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const hasCert  = Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id

  const statusBadge = () => {
    if (reg.status === 'waitlisted')
      return <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Waitlisted</span>
    if (reg.status === 'cancelled')
      return <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Cancelled</span>
    if (attended && hasCert)
      return <span className="text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">🎓 Certificate Ready</span>
    if (attended)
      return <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Attended</span>
    return <span className="text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Confirmed</span>
  }

  return (
    <Link href={`/participant/portal/events/${reg.id}`}>
      <div className="bg-slate-900/80 border border-white/10 rounded-xl p-5 hover:border-amber-500/30 hover:bg-slate-800/80 transition-all cursor-pointer group">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              {event?.event_type}
            </span>
            <h3 className="font-black text-white mt-0.5 group-hover:text-amber-300 transition-colors truncate">
              {event?.title}
            </h3>
          </div>
          {statusBadge()}
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
          {reg.registration_type === 'team' && reg.team_name && (
            <span className="flex items-center gap-1">
              <Users size={11} className="text-slate-500" />
              {reg.team_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}