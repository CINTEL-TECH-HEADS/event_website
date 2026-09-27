'use client'

import { useEffect, useState } from 'react'
import { EventGrid } from '@/components/public/EventGrid'
import { PageHeader } from '@/components/site/PageHeader'
import { isRegistrationOpen } from '@/lib/utils'
import { CLUB } from '@/lib/club'
import { normalizeEvent, type PublicEvent } from '@/lib/public-events'

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        const { data } = await res.json()
        setEvents(((data ?? []) as PublicEvent[]).map(normalizeEvent))
      } catch (err) {
        console.error('Failed to load events:', err)
        setError('Unable to load events right now.')
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const openEvents = events.filter(isRegistrationOpen)
  const completedEvents = events.filter((e) => !isRegistrationOpen(e))

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        kicker={CLUB.name}
        title="All events"
        description="Everything the association has published, open events first."
      />

      {loading ? (
        <div className="app-empty-state mt-10">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl border-2 border-border bg-danger px-6 py-5 text-center text-sm font-bold text-white">{error}</div>
      ) : events.length === 0 ? (
        <div className="app-empty-state mt-10">
          <p className="text-base font-black uppercase text-foreground">No events published yet</p>
        </div>
      ) : (
        <>
          <section className="pt-10">
            <h2 className="mb-5 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">
              Open for registration <span className="text-foreground-soft">({openEvents.length})</span>
            </h2>
            {openEvents.length > 0 ? (
              <EventGrid events={openEvents} />
            ) : (
              <p className="app-empty-state text-sm font-medium text-foreground-soft">No events are open for registration right now.</p>
            )}
          </section>

          {completedEvents.length > 0 && (
            <section id="past" className="mt-14 scroll-mt-24 border-t-2 border-border pt-10 lg:border-t-4">
              <h2 className="mb-1 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">
                Past events <span className="text-foreground-soft">({completedEvents.length})</span>
              </h2>
              <p className="mb-5 text-sm font-medium text-foreground-soft">Registration has closed for these.</p>
              <EventGrid events={completedEvents} past />
            </section>
          )}
        </>
      )}
    </div>
  )
}
