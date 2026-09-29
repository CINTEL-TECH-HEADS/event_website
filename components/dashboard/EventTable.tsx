// Owner: FE2 - Event list table for dashboard overview
import Link from 'next/link'
import { dashboardEventHref } from '@/lib/events/href'
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

        <p className="text-sm font-bold uppercase tracking-wide">
          No events yet
        </p>

        <Link
          href="/dashboard/events/new"
          className="mt-4 inline-flex text-sm font-bold uppercase tracking-wide text-accent transition-colors duration-200 hover:text-brand"
        >
          Create an event
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
            href={dashboardEventHref(event)}
            className="app-panel app-card-hover group flex items-center justify-between p-5"
          >

            {/* Left */}
            <div className="flex-1">

              <div className="mb-3 flex flex-wrap items-center gap-3">

                <h3 className="text-lg font-black uppercase tracking-tight text-foreground transition-colors duration-200 group-hover:text-accent">
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

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-medium text-foreground-soft">

                <div className="flex items-center gap-1.5">

                  <MapPin
                    size={14}
                    className="text-brand"
                  />

                  {event.venue}

                </div>

                <div className="flex items-center gap-1.5">

                  <Calendar
                    size={14}
                    className="text-brand"
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
                    className="text-brand"
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

                <div className="text-4xl font-black text-foreground">
                  {
                    event.confirmed_count
                  }
                </div>

                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-soft">
                  Confirmed
                </p>

                {(event.waitlist_count ??
                  0) >
                  0 && (
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-accent">
                    {
                      event.waitlist_count
                    }{' '}
                    Waitlist
                  </p>
                )}

              </div>

              <span className="hidden h-10 w-10 items-center justify-center rounded-full border-2 border-border bg-panel-muted text-foreground-soft transition-all duration-200 ease-out group-hover:border-accent group-hover:text-accent sm:flex">

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