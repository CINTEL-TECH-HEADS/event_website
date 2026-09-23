import Link from 'next/link'
import { formatShortDate, isPast } from '@/lib/utils'
import { MapPin, Calendar, Users } from 'lucide-react'
import { Sparkle } from '@/components/brand/Starburst'

interface Props {
  reg: any
}

export function RegistrationCard({ reg }: Props) {
  const event    = reg.events
  const attended = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const released = !!event?.certificates_released_at
  const hasCert  = released && (Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id || Array.isArray(reg.assignments) ? reg.assignments.length > 0 : !!reg.assignments?.id)

  const statusBadge = () => {
    if (reg.status === 'waitlisted')
      return <span className="app-badge-warning app-badge">Waitlisted</span>
    if (reg.status === 'cancelled')
      return <span className="app-badge-danger app-badge">Cancelled</span>
    if (attended && hasCert)
      return <span className="app-badge-success app-badge">Certificate Ready</span>
    if (attended)
      return <span className="app-badge-success app-badge">Attended</span>
    return <span className="app-badge-neutral app-badge">Confirmed</span>
  }

  return (
    <Link href={`/participant/portal/events/${reg.id}`}>
      <div className="app-card-hover relative rounded-poster border-4 border-border bg-panel p-5 shadow-lg transition-all group">
        <Sparkle className="absolute right-3 top-3 h-4 w-4 text-primary-yellow" />
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <span className="font-tech text-[10px] font-bold text-brand uppercase tracking-widest">
              {event?.event_type}
            </span>
            <h3 className="font-bold text-foreground mt-0.5 group-hover:text-brand transition-colors truncate">
              {event?.title}
            </h3>
          </div>
          {statusBadge()}
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
          {reg.registration_type === 'team' && reg.team_name && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {reg.team_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}