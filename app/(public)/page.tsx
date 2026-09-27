'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import { EventGrid } from '@/components/public/EventGrid'
import { EventCard } from '@/components/public/EventCard'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst } from '@/components/brand/Starburst'
import { formatEventDate, isRegistrationOpen } from '@/lib/utils'
import { CLUB, EVENT_TYPE_LABELS, FLAGSHIP_EVENTS, SOCIALS } from '@/lib/club'
import { normalizeEvent, type PublicEvent } from '@/lib/public-events'

const STEPS = [
  { title: 'Sign in with Google', text: 'One click. No separate account or password to remember.' },
  { title: 'Add your details once', text: 'Your college email and registration number are saved to your profile.' },
  { title: 'Register solo or as a team', text: 'Create a team, find one that needs members, or join with a team code.' },
  { title: 'Show your QR pass', text: 'Your pass is in My events. Paid events issue it once your payment is verified.' },
]

const instagram = SOCIALS.find((s) => s.label === 'Instagram')!

function SectionHeading({ kicker, title, action }: { kicker: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">{kicker}</p>
        <h2 className="mt-2 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  )
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
  // Most recent first.
  const completedEvents = events
    .filter((e) => !isRegistrationOpen(e))
    .sort((a, b) => +new Date(b.starts_at) - +new Date(a.starts_at))
  const nextUp = [...openEvents].sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0]

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Hero: who we are on the left, the next open event on the right */}
      <section className="grid gap-8 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:py-16">
        <div>
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
            {CLUB.department} · SRM IST {CLUB.campus}
          </p>
          <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-4 text-5xl sm:text-7xl">
            Cintel
            <br />
            Events
          </PosterHeading>
          <p className="mt-6 max-w-md text-base font-medium leading-7 text-foreground-soft">
            Register for the hackathons, workshops, CTFs and talks run by the {CLUB.name}, solo or as a team.
          </p>
          <Link href="#upcoming" className="app-button-primary mt-8">
            See open events <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>

        <div className="poster-panel p-6 sm:p-8">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.12]" />
          <Starburst rings color="#F2C230" className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 opacity-80" />
          <p className="relative font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-primary-yellow">Next up</p>

          {loading ? (
            <div className="relative mt-6 space-y-3">
              <div className="h-8 w-3/4 animate-pulse rounded bg-[#F5F0E3]/10" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#F5F0E3]/10" />
            </div>
          ) : nextUp ? (
            <div className="relative mt-4">
              <span className="inline-block rounded-full border-2 border-[#F5F0E3]/40 px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-widest text-[#F5F0E3]/80">
                {EVENT_TYPE_LABELS[nextUp.event_type] ?? nextUp.event_type}
              </span>
              <h2 className="mt-3 font-display text-2xl uppercase leading-tight text-[#F5F0E3] sm:text-3xl">{nextUp.title}</h2>
              <div className="mt-4 space-y-2 text-sm text-[#F5F0E3]/80">
                <p className="flex items-center gap-2">
                  <CalendarDays size={15} className="shrink-0 text-primary-yellow" strokeWidth={2.5} />
                  {formatEventDate(nextUp.starts_at)}
                </p>
                {nextUp.venue && (
                  <p className="flex items-center gap-2">
                    <MapPin size={15} className="shrink-0 text-primary-yellow" strokeWidth={2.5} />
                    {nextUp.venue}
                  </p>
                )}
              </div>
              {nextUp.registration_closes_at && (
                <div className="mt-4 text-primary-yellow">
                  <CountdownTimer closesAt={nextUp.registration_closes_at} compact />
                </div>
              )}
              <Link href={`/events/${nextUp.slug}`} className="app-button-primary mt-6">
                View &amp; register <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          ) : (
            <div className="relative mt-4">
              <h2 className="font-display text-2xl uppercase leading-tight text-[#F5F0E3]">Nothing open right now</h2>
              <p className="mt-3 text-sm leading-6 text-[#F5F0E3]/75">
                Follow{' '}
                <a href={instagram.href} target="_blank" rel="noopener noreferrer" className="font-bold text-primary-yellow underline">
                  {instagram.handle}
                </a>{' '}
                to hear about the next event.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Open events */}
      <section id="upcoming" className="scroll-mt-24 border-t-2 border-border py-12 lg:border-t-4">
        <SectionHeading
          kicker="Registration open"
          title="Open events"
          action={
            <Link href="/events" className="inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-widest text-brand hover:underline">
              All events <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          }
        />
        {loading ? (
          <div className="app-empty-state">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border-2 border-border bg-danger px-6 py-5 text-center text-sm font-bold text-white">{error}</div>
        ) : openEvents.length === 0 ? (
          <div className="app-empty-state">
            <p className="text-base font-black uppercase text-foreground">No events are open for registration</p>
            <p className="mt-2 text-sm font-medium text-foreground-soft">New events are announced on {instagram.handle}.</p>
          </div>
        ) : (
          <EventGrid events={openEvents} />
        )}
      </section>

      {/* How registration works */}
      <section className="border-t-2 border-border py-12 lg:border-t-4">
        <SectionHeading kicker="How it works" title="Registering for an event" />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
              <span className="font-display text-3xl text-primary-red">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-sm font-black uppercase tracking-tight text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Flagship events */}
      <section className="border-t-2 border-border py-12 lg:border-t-4">
        <SectionHeading kicker={`From ${CLUB.shortName}`} title="What we run" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FLAGSHIP_EVENTS.map((e) => (
            <figure key={e.title} className="overflow-hidden rounded-2xl border-2 border-border bg-panel shadow-sm">
              <img src={e.photo} alt={e.alt} loading="lazy" className="aspect-[4/3] w-full border-b-2 border-border object-cover" />
              <figcaption className="p-4">
                <p className="font-display text-lg uppercase leading-tight text-foreground">{e.title}</p>
                <p className="mt-2 text-sm font-medium leading-6 text-foreground-soft">{e.text}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Past events */}
      {!loading && !error && completedEvents.length > 0 && (
        <section className="border-t-2 border-border py-12 lg:border-t-4">
          <SectionHeading
            kicker="Archive"
            title="Past events"
            action={
              completedEvents.length > 3 ? (
                <Link href="/events#past" className="inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-widest text-brand hover:underline">
                  See all {completedEvents.length} <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              ) : undefined
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {completedEvents.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} past />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
