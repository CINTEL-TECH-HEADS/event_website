// Owner: FE2 - Event list table for dashboard overview
import Link from 'next/link'
import {
  Calendar,
  ChevronRight,
  MapPin,
  Users,
} from 'lucide-react'

import { EventWithStats } from '@/types'

interface Props {
  events: EventWithStats[]
}

export function EventTable({
  events,
}: Props) {
  if (events.length === 0) {
    return (
      <div className="app-empty-state">

        <p className="text-sm font-medium">
          No active events detected
        </p>

        <Link
          href="/dashboard/events/new"
          className="mt-4 inline-flex text-sm font-semibold text-[#F5E62D] hover:text-[#FFF27A]"
        >
          Initialize first event
        </Link>

      </div>
    )
  }

  return (
    <div className="space-y-4">

      {events.map(
        (event) => (
          <Link
            key={
              event.id
            }
            href={`/dashboard/events/${event.id}`}
            className="app-panel app-card-hover group flex items-center justify-between p-5"
          >

            {/* Left */}
            <div className="flex-1">

              <div className="mb-3 flex flex-wrap items-center gap-3">

                <h3 className="text-lg font-bold text-white transition group-hover:text-[#F5E62D]">
                  {
                    event.title
                  }
                </h3>

                <span
                  className={`app-badge ${
                    event.is_published
                      ? 'app-badge-success'
                      : 'app-badge-neutral'
                  }`}
                >
                  {event.is_published
                    ? 'LIVE'
                    : 'DRAFT'}
                </span>

              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-400">

                <div className="flex items-center gap-1.5">

                  <MapPin
                    size={14}
                    className="text-[#F5E62D]"
                  />

                  {event.venue}

                </div>

                <div className="flex items-center gap-1.5">

                  <Calendar
                    size={14}
                    className="text-[#F5E62D]"
                  />

                  {event.starts_at
                    ? new Date(event.starts_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}

                </div>

                <div className="flex items-center gap-1.5">

                  <Users
                    size={14}
                    className="text-[#F5E62D]"
                  />

                  {
                    event.confirmed_count
                  }{' '}
                  Registered

                </div>

              </div>

            </div>

            {/* Right */}
            <div className="ml-6 flex items-center gap-5">

              <div className="text-right">

                <div className="text-4xl font-semibold text-[#F5E62D]">
                  {
                    event.confirmed_count
                  }
                </div>

                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">
                  Confirmed
                </p>

                {(event.waitlist_count ??
                  0) >
                  0 && (
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#93C5FD]">
                    {
                      event.waitlist_count
                    }{' '}
                    Waitlist
                  </p>
                )}

              </div>

              <span className="hidden h-10 w-10 items-center justify-center border border-[#243B72] bg-[#10224A] text-slate-400 transition group-hover:border-[#F5E62D] group-hover:text-[#F5E62D] sm:flex">

                <ChevronRight
                  size={18}
                />

              </span>

            </div>

          </Link>
        )
      )}

    </div>
  )
}