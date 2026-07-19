'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'
import { EventGrid } from '@/components/public/EventGrid'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

function normalizeConfirmedCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (Array.isArray(value)) {
    const first = value[0]
    if (first && typeof first === 'object' && 'count' in first) {
      const count = (first as { count?: unknown }).count
      return typeof count === 'number' ? count : 0
    }
  }
  return 0
}

function normalizeEvent(event: PublicEvent): PublicEvent {
  return {
    ...event,
    confirmed_count: normalizeConfirmedCount((event as PublicEvent & { confirmed_count: unknown }).confirmed_count),
  }
}

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
      <div className="mb-8 border-b border-white/10 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-amber-200">Cintel Archive</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">All Events</h1>
        <p className="mt-2 text-sm text-slate-400">Browse all published events from CINTEL Student Association.</p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-sm backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading published events...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
          {error}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center shadow-sm backdrop-blur">
          <h2 className="text-xl font-semibold text-white">No events published yet</h2>
          <p className="mt-2 text-sm text-slate-400">Check back soon for the next batch of registrations.</p>
        </div>
      ) : (
        <EventGrid events={events} />
      )}
    </div>
  )
}
