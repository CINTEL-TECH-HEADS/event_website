'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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

export default function HomePage() {
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
    <div>
      <section className="border-b border-slate-200 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="border border-slate-200 bg-white dark:border-white/10 dark:bg-[#112240]">
              <div className="border-b border-slate-200 px-6 py-4 dark:border-white/10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-blue-700 dark:text-amber-200">Open Program</p>
              </div>
              <div className="space-y-8 p-6 sm:p-8">
                <div className="space-y-2">
                  <h1 className="max-w-xl text-3xl font-semibold leading-[0.98] tracking-[-0.04em] text-slate-950 dark:text-white sm:text-4xl lg:text-[2.95rem]">
                    Public event pages that feel more like a lineup board.
                  </h1>
                  <p className="max-w-lg text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
                    A calmer, sharper way to browse campus events, check availability, register, and return for confirmations or certificates.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href="#event-grid"
                      className="public-force-white inline-flex items-center justify-center border border-blue-600 bg-blue-600 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-700 dark:border-amber-300/35 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                    >
                      Explore Events
                    </Link>
                    <Link
                      href="/resend"
                      className="public-force-white inline-flex items-center justify-center border border-blue-600 bg-blue-600 px-4 py-3 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-700 dark:border-amber-300/35 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                    >
                      Resend Pass
                    </Link>
                  </div>
                  <Link
                    href="/login"
                    className="public-force-white inline-flex w-full items-center justify-center border border-blue-600 bg-blue-600 px-5 py-3 text-center text-sm font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-blue-700 dark:border-amber-300/35 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                  >
                    Organiser Login
                  </Link>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Published</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">{events.length}</p>
                    </div>
                    <div className="border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Hands-on</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                        {events.filter(event => event.event_type === 'hackathon' || event.event_type === 'workshop').length}
                      </p>
                    </div>
                    <div className="border border-slate-200 bg-white px-4 py-4 dark:border-slate-700 dark:bg-slate-800/50">
                      <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Open</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
                        {events.filter(event => event.capacity === null || event.confirmed_count < event.capacity).length}
                      </p>
                    </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              <div className="grid gap-px border border-slate-200 bg-slate-200 dark:border-white/10 dark:bg-white/10 md:grid-cols-[0.72fr_0.28fr]">
                <div className="bg-white p-6 dark:bg-[#0a1629] sm:p-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">What changes here</p>
                  <p className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-slate-950 dark:text-white sm:text-3xl">
                    Less hero-template energy. More like an event catalog with strong sections and clearer rhythm.
                  </p>
                </div>
                <div className="public-force-white flex items-end bg-slate-900 p-6 pr-6 text-white dark:bg-blue-900/40 dark:text-blue-200">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em]">Browse. Register. Return.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0a1629]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-amber-200">Search</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Find events by title instead of digging through cards.</p>
                </div>
                <div className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0a1629]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-200">Filter</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Switch between workshops, talks, hackathons, and more in one row.</p>
                </div>
                <div className="border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#0a1629]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:text-amber-200">Return</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <Link
                      href="/certificate"
                      className="public-force-white border border-blue-600 bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 dark:border-amber-300/35 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                    >
                      Certificate
                    </Link>
                    <Link
                      href="/resend"
                      className="public-force-white border border-blue-600 bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 dark:border-amber-300/35 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"
                    >
                      Confirmation
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="event-grid" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
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
      </section>
    </div>
  )
}
