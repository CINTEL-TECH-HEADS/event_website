// Owner: FE2 - Dashboard home: overview of organizer events
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  LayoutGrid,
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
  const [events, setEvents] = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch(
          '/api/events'
        )

        const text =
          await res.text()

        if (!text) {
          setEvents([])
          return
        }

        const json =
          JSON.parse(text)

        setEvents(
  (json.data ?? []).map((event: any) => ({
    ...event,
    confirmed_count: Array.isArray(event.confirmed_count)
      ? event.confirmed_count[0]?.count ?? 0
      : event.confirmed_count ?? 0,
  }))
)
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
        Loading events...
      </div>
    )
  }

  return (
    <div className="space-y-8">

      <section className="app-panel relative overflow-hidden rounded-[2rem] px-6 py-7 sm:px-8 sm:py-8">
        <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.18),transparent_65%)]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

          <div className="space-y-4">
            <span className="app-kicker">
              <LayoutGrid size={14} />
              Dashboard Overview
            </span>

            <div>
              <h1 className="app-heading">
                All your events,
                from planning
                through event day.
              </h1>

              <p className="app-subheading mt-3 max-w-2xl">
                Review upcoming
                activity, monitor
                registrations,
                and jump back
                into workflows
                that matter most.
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">

        <div className="app-stat-card p-5">
          <p className="text-sm text-slate-500">
            Total Events
          </p>

          <p className="mt-3 text-4xl font-bold">
            {events.length}
          </p>
        </div>

        <div className="app-stat-card p-5">
          <p className="text-sm text-slate-500">
            Published
          </p>

          <p className="mt-3 text-4xl font-bold text-green-600">
            {
              events.filter(
                (event) =>
                  event.is_published
              ).length
            }
          </p>
        </div>

        <div className="app-stat-card p-5">
          <p className="text-sm text-slate-500">
            Registrations
          </p>

          <p className="mt-3 text-4xl font-bold text-brand-600">
            {
              events.reduce(
                (sum, event) =>
                  sum +
                  event.confirmed_count,
                0
              )
            }
          </p>
        </div>

      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">
            Assigned Events
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Jump into setup,
            registrations,
            and operations.
          </p>
        </div>

        <EventTable
          events={events}
        />
      </section>

    </div>
  )
}