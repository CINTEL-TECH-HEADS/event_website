'use client'

import { useEffect, useState } from 'react'
import { EventGrid } from '@/components/public/EventGrid'
import { PageHeader } from '@/components/site/PageHeader'
import { isRegistrationOpen } from '@/lib/utils'
import { ARCHIVE_2025_26, CLUB, EVENT_TYPE_LABELS } from '@/lib/club'
import { ArchiveCard } from '@/components/public/ArchiveCard'
import { normalizeEvent, type PublicEvent } from '@/lib/public-events'

export default function EventsPage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Links like /events?type=hackathon (from the home page's lane folders)
  // preselect that type filter.
  const [typeParam, setTypeParam] = useState<string | null>(null)

  useEffect(() => {
    setTypeParam(new URLSearchParams(window.location.search).get('type'))
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
  // Most recent first.
  const completedEvents = events
    .filter((e) => !isRegistrationOpen(e))
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at))
  // The 2025–26 archive honours ?type= too, when that type occurs in it.
  const archiveFiltered = !!typeParam && ARCHIVE_2025_26.some((e) => e.type === typeParam)
  const archive = archiveFiltered ? ARCHIVE_2025_26.filter((e) => e.type === typeParam) : ARCHIVE_2025_26

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        kicker={CLUB.name}
        title="All events"
        description="Open events first, then what the association has run before."
      />

      {loading ? (
        <div className="app-empty-state mt-10">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      ) : error ? (
        <div className="mt-10 rounded-2xl border-2 border-border bg-danger px-6 py-5 text-center text-sm font-bold text-white">{error}</div>
      ) : (
        <section className="pt-10">
          <h2 className="mb-5 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">
            Open for registration <span className="text-foreground-soft">({openEvents.length})</span>
          </h2>
          {openEvents.length > 0 ? (
            <EventGrid events={openEvents} initialType={typeParam} />
          ) : (
            <p className="app-empty-state text-sm font-medium text-foreground-soft">No events are open for registration right now.</p>
          )}
        </section>
      )}

      <section id="past" className="mt-14 scroll-mt-24 border-t-2 border-border pt-10 lg:border-t-4">
        <h2 className="mb-1 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">Past events</h2>
        <p className="mb-6 text-sm font-medium text-foreground-soft">Registration has closed for these.</p>

        {!loading && completedEvents.length > 0 && (
          <div className="mb-12">
            <EventGrid events={completedEvents} past initialType={typeParam} />
          </div>
        )}

        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-display text-lg uppercase tracking-tight text-foreground">2025–26</h3>
          {archiveFiltered && (
            <a href="/events#past" className="font-tech text-xs font-bold uppercase tracking-widest text-brand hover:underline">
              Showing {EVENT_TYPE_LABELS[typeParam!] ?? typeParam} events · show all
            </a>
          )}
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {archive.map((e) => (
            <ArchiveCard key={e.title} event={e} />
          ))}
        </div>
      </section>
    </div>
  )
}
