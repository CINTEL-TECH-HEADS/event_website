// Owner: FE2 - Dashboard home: overview of organizer events
// Owner: FE2 - Dashboard home (Premium Dark UI)
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  LayoutGrid,
  Activity,
  Users,
} from 'lucide-react'

import { EventTable } from '@/components/dashboard/EventTable'
import { isPast } from '@/lib/utils'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

type EventWithStats = {
  id: string
  title: string
  venue: string
  starts_at?: string
  ends_at?: string
  confirmed_count: number
  is_published: boolean
}

export default function DashboardPage() {
  const [events, setEvents] =
    useState<EventWithStats[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        console.log('Fetching events...')
        const res = await fetch(
          '/api/events?mine=true'
        )

        if (!res.ok) {
          throw new Error(
            `API returned ${res.status}`
          )
        }

        const json =
          await res.json()

        console.log('Events response:', json)

        const events = (
          json.data ?? []
        ).map(
          (event: any) => ({
            ...event,
            confirmed_count:
              Array.isArray(
                event.confirmed_count
              )
                ? event
                    .confirmed_count[0]
                    ?.count ?? 0
                : event.confirmed_count ??
                  0,
          })
        )

        setEvents(events)
      } catch (error) {
        console.error(
          'Failed to load events:',
          error
        )

        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  if (loading) {
    return (
      <div className="text-sm font-bold uppercase tracking-wide text-foreground-soft">
        Loading command center...
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Hero */}
      <section className="app-panel relative overflow-hidden px-6 py-7 sm:px-8 sm:py-8">

        {/* Restrained poster flourish — a single rock in the corner, not a scene */}
        <RockShape
          variant={2}
          fill="#F2C230"
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 rotate-[12deg] opacity-[0.1]"
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="space-y-4">

            <span className="app-kicker">
              <LayoutGrid size={14} />
              Dashboard Overview
            </span>

            <div>

              <PosterHeading as="h1" fillClassName="text-primary-yellow" className="max-w-3xl text-3xl sm:text-5xl">
                All your events,
                from planning to
                execution day.
              </PosterHeading>

              <p className="app-subheading mt-3 max-w-2xl">
                Monitor registrations,
                track activity,
                and jump into event
                operations instantly.
              </p>

            </div>

          </div>

          <Link
            href="/dashboard/events/new"
            className="app-button-primary w-full sm:w-auto"
          >
            Create New Event
            <ArrowRight size={16} />
          </Link>

        </div>

      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="font-tech text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Total Events
              </p>

              <p className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
                {events.length}
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary-yellow text-[#121212]">
              <RockShape variant={1} className="h-6 w-6" />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="font-tech text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Published
              </p>

              <p className="mt-3 font-display text-4xl text-success sm:text-5xl">
                {
                  events.filter(
                    (event) =>
                      event.is_published
                  ).length
                }
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-success text-white">
              <Activity size={18} strokeWidth={2.5} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="font-tech text-xs font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Registrations
              </p>

              <p className="mt-3 font-display text-4xl text-foreground sm:text-5xl">
                {
                  events.reduce(
                    (
                      sum,
                      event
                    ) =>
                      sum +
                      event.confirmed_count,
                    0
                  )
                }
              </p>
            </div>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-border bg-accent text-white">
              <Users size={18} strokeWidth={2.5} />
            </span>

          </div>

        </div>

      </section>

      {/* Events — active/upcoming and past are split by end date */}
      {(() => {
        const isEnded = (e: EventWithStats) => !!(e.ends_at && isPast(e.ends_at))
        const active = events.filter((e) => !isEnded(e))
        const pastEvents = events.filter(isEnded)
        return (
          <>
            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-lg uppercase tracking-tight text-foreground sm:text-xl">Managed Events</h2>
                  <p className="mt-1 text-sm font-medium text-foreground-soft">
                    Active and upcoming events — jump into setup, registrations, exports, and operations.
                  </p>
                </div>
                <p className="app-kicker">
                  <Sparkle className="h-3 w-3 text-primary-red" />
                  Live Workspace
                </p>
              </div>
              <EventTable events={active} />
            </section>

            {pastEvents.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="font-display text-lg uppercase tracking-tight text-foreground sm:text-xl">Past Events</h2>
                  <p className="mt-1 text-sm font-medium text-foreground-soft">
                    Concluded events (end date has passed).
                  </p>
                </div>
                <EventTable events={pastEvents} />
              </section>
            )}
          </>
        )
      })()}

    </div>
  )
}