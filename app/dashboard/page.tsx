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
  Rocket,
} from 'lucide-react'

import { EventTable } from '@/components/dashboard/EventTable'

type EventWithStats = {
  id: string
  title: string
  venue: string
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
      <div className="text-sm text-slate-400">
        Loading command center...
      </div>
    )
  }

  return (
    <div className="space-y-8">

      {/* Hero */}
      <section className="app-panel relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">

        <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(90deg,rgba(245,230,45,0.08),transparent,rgba(59,130,246,0.10))]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="space-y-4">

            <span className="app-kicker">
              <LayoutGrid size={14} />
              Dashboard Overview
            </span>

            <div>

              <h1 className="app-heading max-w-3xl">
                All your events,
                from planning to
                execution day.
              </h1>

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
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Total Events
              </p>

              <p className="mt-3 text-5xl font-black text-white">
                {events.length}
              </p>
            </div>

            <span className="rounded-2xl bg-[#0B1736] p-3 text-[#F5E62D]">
              <Rocket size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Published
              </p>

              <p className="mt-3 text-5xl font-black text-green-400">
                {
                  events.filter(
                    (event) =>
                      event.is_published
                  ).length
                }
              </p>
            </div>

            <span className="rounded-2xl bg-[#0B1736] p-3 text-green-400">
              <Activity size={18} />
            </span>

          </div>

        </div>

        <div className="app-stat-card p-5">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                Registrations
              </p>

              <p className="mt-3 text-5xl font-black text-[#F5E62D]">
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

            <span className="rounded-2xl bg-[#0B1736] p-3 text-[#93C5FD]">
              <Users size={18} />
            </span>

          </div>

        </div>

      </section>

      {/* Events */}
      <section>

        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <h2 className="text-xl font-bold text-white">
              Assigned Events
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Jump into setup,
              registrations,
              exports,
              and operations.
            </p>

          </div>

          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F5E62D]">
            Live Workspace
          </p>

        </div>

        <EventTable
          events={events}
        />

      </section>

    </div>
  )
}