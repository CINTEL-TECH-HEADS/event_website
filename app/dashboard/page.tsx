// Owner: FE2 - Dashboard home: overview of organizer events
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Plus } from 'lucide-react'

import { EventTable } from '@/components/dashboard/EventTable'
import { isPast } from '@/lib/utils'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

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

  // Only club organizers create events; sub-admins and judges don't see it.
  const [canCreate, setCanCreate] =
    useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((me) => setCanCreate(me?.can_manage_club === true))
      .catch(() => {})
  }, [])

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
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
    )
  }

  const stats = [
    { label: 'Events', value: events.length },
    { label: 'Published', value: events.filter((event) => event.is_published).length },
    { label: 'Confirmed', value: events.reduce((sum, event) => sum + event.confirmed_count, 0) },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        icon={LayoutGrid}
        kicker="Dashboard"
        title="Events"
        description={canCreate
          ? 'Every event you manage. Open one to edit it, see registrations, check people in or export data.'
          : 'The events you help run. Open one to see registrations, check people in or export data.'}
        actions={
          canCreate ? (
            <Link href="/dashboard/events/new" className="app-button-primary">
              <Plus size={16} strokeWidth={2.5} />
              Create event
            </Link>
          ) : undefined
        }
      />

      <dl className="grid grid-cols-3 divide-x-2 divide-border overflow-hidden rounded-2xl border-2 border-border bg-panel shadow-sm">
        {stats.map(({ label, value }) => (
          <div key={label} className="px-4 py-4 sm:px-6">
            <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft sm:text-xs">{label}</dt>
            <dd className="mt-1 font-display text-2xl text-foreground sm:text-4xl">{value}</dd>
          </div>
        ))}
      </dl>

      {/* Events — active/upcoming and past are split by end date */}
      {(() => {
        const isEnded = (e: EventWithStats) => !!(e.ends_at && isPast(e.ends_at))
        const active = events.filter((e) => !isEnded(e))
        const pastEvents = events.filter(isEnded)
        return (
          <>
            <section>
              <h2 className="mb-4 font-display text-lg uppercase tracking-tight text-foreground">Active and upcoming</h2>
              <EventTable events={active} canCreate={canCreate} />
            </section>

            {pastEvents.length > 0 && (
              <section>
                <h2 className="mb-1 font-display text-lg uppercase tracking-tight text-foreground">Past</h2>
                <p className="mb-4 text-sm font-medium text-foreground-soft">Events whose end date has passed.</p>
                <EventTable events={pastEvents} canCreate={canCreate} />
              </section>
            )}
          </>
        )
      })()}
    </div>
  )
}
