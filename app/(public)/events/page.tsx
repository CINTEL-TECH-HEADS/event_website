'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'
import { EventGrid } from '@/components/public/EventGrid'
import { EventCard } from '@/components/public/EventCard'
import { isRegistrationOpen } from '@/lib/utils'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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

  const openEvents = events.filter(isRegistrationOpen)
  const completedEvents = events.filter((e) => !isRegistrationOpen(e))

  return (
    <div>
      {/* Poster header band */}
      <section className="px-3 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="poster-panel relative mx-auto max-w-6xl overflow-hidden">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />

          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
            <svg className="absolute -right-10 top-0 h-full w-1/2 opacity-40" viewBox="0 0 400 400" fill="none">
              <ellipse cx="200" cy="200" rx="190" ry="70" stroke="#F2C230" strokeWidth="1" transform="rotate(-10 200 200)" />
            </svg>
            <RockShape variant={2} fill="#D6294C" className="absolute -left-6 bottom-4 h-16 w-16 rotate-[-8deg] opacity-95 sm:h-20 sm:w-20" />
            <RockShape variant={3} fill="#D6294C" className="absolute right-10 bottom-0 hidden h-14 w-14 rotate-[18deg] opacity-90 sm:block" />
            <Starburst rings color="#F2C230" className="absolute right-[10%] top-6 h-20 w-20 opacity-90 sm:h-28 sm:w-28" />
            <Sparkle className="absolute left-1/3 top-8 h-3 w-3 text-primary-yellow" />
          </div>

          <div className="relative px-5 py-10 sm:px-10 sm:py-14">
            <p className="font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-primary-yellow">Cintel Archive</p>
            <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-3 text-4xl sm:text-6xl">
              All Events
            </PosterHeading>
            <p className="mt-4 max-w-xl font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
              Browse all published events from CINTEL Student Association.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
        {loading ? (
          <div className="app-empty-state">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-foreground-soft">Loading published events...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-border bg-danger px-8 py-6 text-center text-sm font-bold text-white lg:border-4">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="app-empty-state">
            <h2 className="text-xl font-black uppercase text-foreground">No events published yet</h2>
            <p className="mt-2 text-sm font-medium text-foreground-soft">Check back soon for the next batch of registrations.</p>
          </div>
        ) : (
          <>
            <EventGrid events={openEvents} />

            {completedEvents.length > 0 && (
              <section className="mt-12 border-t-2 border-border pt-10 lg:border-t-4">
                <div className="mb-6">
                  <p className="font-tech text-[11px] font-bold uppercase tracking-[0.3em] text-foreground-soft">Archive</p>
                  <h2 className="mt-2 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">Completed Events</h2>
                  <p className="mt-1 text-sm font-medium text-foreground-soft">Registration has closed for these events.</p>
                </div>
                <div className="grid gap-5 opacity-70 sm:grid-cols-2 xl:grid-cols-3">
                  {completedEvents.map((event, index) => (
                    <div key={event.id} className="h-full">
                      <EventCard event={event} accentIndex={index} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
