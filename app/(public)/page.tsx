'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Event } from '@/types'
import { EventGrid } from '@/components/public/EventGrid'
import { EventCard } from '@/components/public/EventCard'
import { isRegistrationOpen } from '@/lib/utils'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'
import { ShipShape } from '@/components/brand/ShipShape'
import PixelTrail from '@/components/brand/PixelTrail'

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

  const openEvents = events.filter(isRegistrationOpen)
  const completedEvents = events.filter((e) => !isRegistrationOpen(e))

  return (
    <div>
      {/* HERO — the poster scene */}
      <section className="px-3 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="poster-panel relative mx-auto max-w-6xl overflow-hidden">
          <div className="halftone pointer-events-none absolute inset-0 z-0 opacity-[0.15]" />

          {/* interactive gooey pixel trail — follows the pointer, themed gold */}
          <div className="absolute inset-0 z-[1]">
            <PixelTrail
              gridSize={46}
              trailSize={0.12}
              maxAge={350}
              interpolate={6}
              color="#F2C230"
              gooeyFilter={{ id: 'hero-goo-filter', strength: 3 }}
            />
          </div>

          {/* orbit rings + scattered rocks + ship, all decorative */}
          <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-90">
            <svg className="absolute -right-10 top-0 h-full w-2/3 opacity-40" viewBox="0 0 400 400" fill="none">
              <ellipse cx="200" cy="200" rx="190" ry="70" stroke="#F2C230" strokeWidth="1" transform="rotate(-10 200 200)" />
              <ellipse cx="200" cy="200" rx="150" ry="55" stroke="#F2C230" strokeWidth="1" transform="rotate(-10 200 200)" />
            </svg>
            <RockShape variant={1} className="absolute -left-6 top-8 h-16 w-16 rotate-[-8deg] opacity-95 sm:h-24 sm:w-24" />
            <RockShape variant={2} className="absolute right-6 top-4 h-12 w-12 rotate-[16deg] opacity-90 sm:h-16 sm:w-16" />
            <RockShape variant={3} className="absolute bottom-6 left-10 hidden h-14 w-14 rotate-[24deg] opacity-90 sm:block" />
            <RockShape variant={1} className="absolute -bottom-4 right-16 h-20 w-20 rotate-[10deg] opacity-95 sm:h-28 sm:w-28" />
            <ShipShape className="absolute bottom-0 right-0 h-32 w-52 translate-x-6 translate-y-4 opacity-95 sm:h-44 sm:w-72 lg:h-56 lg:w-[26rem]" />
            <Starburst rings color="#F2C230" className="absolute right-[28%] top-1/4 h-24 w-24 opacity-90 sm:h-32 sm:w-32" />
            <Sparkle className="absolute left-1/3 top-8 h-3 w-3 text-primary-yellow" />
            <Sparkle className="absolute right-1/4 bottom-10 h-2.5 w-2.5 text-[#F5F0E3]" />
          </div>

          <div className="relative z-20 px-5 py-10 sm:px-10 sm:py-16 lg:py-20">
            <p className="inline-flex items-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-primary-red px-4 py-1.5 font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-white">
              Cintel Student Association
            </p>

            <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-6 max-w-3xl text-4xl sm:text-6xl lg:text-7xl">
              Events &amp;
              <br />
              Registration
            </PosterHeading>

            <p className="mt-6 max-w-lg font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
              The official event portal for CINTEL Student Association at SRM. Browse upcoming workshops, hackathons, and talks, register for events, and manage your team and certificates.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="#event-grid" className="app-button-primary">
                Explore Events
              </Link>
              <Link href="/resend" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-transparent px-6 py-3 font-tech text-xs font-bold uppercase tracking-wider text-[#F5F0E3] shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Resend Pass
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-primary-yellow px-6 py-3 font-tech text-xs font-bold uppercase tracking-wider text-[#14120F] shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS — mission-log readout strip */}
      <section className="px-3 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x-2 divide-border overflow-hidden rounded-poster border-2 border-border bg-panel shadow-md lg:border-4">
          <div className="px-4 py-7 text-center sm:py-9">
            <p className="font-tech text-[9px] font-bold uppercase tracking-[0.24em] text-brand sm:text-[10px]">Published</p>
            <p className="mt-2 font-display text-3xl text-foreground sm:text-5xl">{events.length}</p>
          </div>
          <div className="px-4 py-7 text-center sm:py-9">
            <p className="font-tech text-[9px] font-bold uppercase tracking-[0.24em] text-brand sm:text-[10px]">Hands-on</p>
            <p className="mt-2 font-display text-3xl text-foreground sm:text-5xl">
              {events.filter(event => event.event_type === 'hackathon' || event.event_type === 'workshop').length}
            </p>
          </div>
          <div className="px-4 py-7 text-center sm:py-9">
            <p className="font-tech text-[9px] font-bold uppercase tracking-[0.24em] text-brand sm:text-[10px]">Open</p>
            <p className="mt-2 font-display text-3xl text-foreground sm:text-5xl">
              {events.filter(event => event.capacity === null || event.confirmed_count < event.capacity).length}
            </p>
          </div>
        </div>
      </section>

      {/* MISSION — split panel */}
      <section className="px-3 py-6 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-3 md:grid-cols-[0.68fr_0.32fr]">
            <div className="app-panel-muted !rounded-poster p-6 sm:p-10">
              <p className="font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-accent">The Intellectual Core</p>
              <p className="mt-4 max-w-2xl font-display text-xl leading-tight tracking-tight text-foreground sm:text-3xl">
                Cultivating a strong technical culture where students don&apos;t just learn &mdash; they build, explore, and push boundaries.
              </p>
            </div>
            <div className="poster-panel flex items-end p-6 sm:p-8">
              <p className="relative font-tech text-xs font-bold uppercase tracking-wider text-primary-yellow">Browse. Register. Return.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="relative app-panel-muted p-5">
              <RockShape variant={1} fill="#D6294C" className="absolute right-3 top-3 h-8 w-8" />
              <p className="font-tech text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Discover</p>
              <p className="mt-3 text-sm font-medium leading-6 text-foreground-soft">Find and register for our latest technical, creative, and research-driven initiatives.</p>
            </div>
            <div className="relative app-panel-muted p-5">
              <Sparkle className="absolute right-3 top-3 h-6 w-6 text-primary-yellow" />
              <p className="font-tech text-[11px] font-bold uppercase tracking-[0.22em] text-accent">Participate</p>
              <p className="mt-3 text-sm font-medium leading-6 text-foreground-soft">Join individual sessions or form teams for our large-scale hackathons and symposiums.</p>
            </div>
            <div className="relative app-panel-muted p-5">
              <RockShape variant={2} fill="#F2C230" className="absolute right-3 top-3 h-8 w-8" />
              <p className="font-tech text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Manage</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/certificate" className="app-button-primary px-4 py-2 text-xs">
                  Certificate
                </Link>
                <Link href="/resend" className="app-button-secondary px-4 py-2 text-xs">
                  Confirmation
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="event-grid" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {loading ? (
          <div className="app-empty-state">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="mt-4 text-sm font-bold uppercase tracking-wider text-foreground-soft">Loading published events...</p>
          </div>
        ) : error ? (
          <div className="border-2 border-border bg-danger px-8 py-6 text-center text-sm font-bold text-white lg:border-4">
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
            <div className="mt-8 flex justify-center">
              <Link href="/events" className="app-button-primary">
                Show More
              </Link>
            </div>
          </>
        )}

        {!loading && !error && completedEvents.length > 0 && (
          <div className="mt-14 border-t-2 border-border pt-10 lg:border-t-4">
            <div className="mb-6">
              <p className="font-tech text-[11px] font-bold uppercase tracking-[0.3em] text-foreground-soft">Archive</p>
              <h2 className="mt-2 font-display text-xl uppercase tracking-tight text-foreground sm:text-2xl">Completed Events</h2>
              <p className="mt-1 text-sm font-medium text-foreground-soft">Registration has closed for these events.</p>
            </div>
            <div className="grid gap-5 opacity-70 sm:grid-cols-2 xl:grid-cols-3">
              {completedEvents.slice(0, 6).map((event, index) => (
                <div key={event.id} className="h-full">
                  <EventCard event={event} accentIndex={index} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
