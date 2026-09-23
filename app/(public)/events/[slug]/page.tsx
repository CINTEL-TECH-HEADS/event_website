//FE1 event details page. This is a client component since it needs to fetch form fields for the registration form, but it receives all other event details as a prop from the server component page. The server component fetches the event with its confirmed/waitlist counts using a single optimized query, so we don't have to worry about N+1 queries here when rendering the details.

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarPlus, CheckCircle2, MapPin, Users } from 'lucide-react'
import type { EventWithFields } from '@/types'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { formatEventDate, isPast, spotsLeft } from '@/lib/utils'
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

function normalizeCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object' && 'count' in value[0]) {
    const count = (value[0] as { count?: unknown }).count
    return typeof count === 'number' ? count : 0
  }
  return 0
}

function normalizeEvent(event: EventWithFields): EventWithFields {
  return {
    ...event,
    confirmed_count: normalizeCount((event as EventWithFields & { confirmed_count: unknown }).confirmed_count),
    waitlist_count: normalizeCount((event as EventWithFields & { waitlist_count: unknown }).waitlist_count),
    form_fields: event.form_fields ?? [],
  }
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventWithFields | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events/${slug}`)
        const { data, error } = await res.json()

        if (error) {
          setError(error)
          return
        }

        const normalized = normalizeEvent(data as EventWithFields)
        setEvent(normalized)

        // If logged in and already registered, gate the CTA.
        const mine = await fetch(`/api/registrations/mine?event_id=${normalized.id}`)
          .then((r) => r.json())
          .catch(() => null)
        if (mine?.data?.registered) setAlreadyRegistered(true)
      } catch {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }

    if (slug) loadEvent()
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl items-center justify-center px-4">
        <div className="app-empty-state">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-bold uppercase tracking-wider text-foreground-soft">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border-2 border-border bg-danger p-8 text-center text-sm font-bold text-white lg:border-4">
          {error ?? 'Event not found'}
        </div>
      </div>
    )
  }

  const closed = isPast(event.registration_closes_at)
  const spots = spotsLeft(event.capacity, event.confirmed_count)
  const calLink = generateGoogleCalendarLink({
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue: event.venue,
    description: event.description ?? undefined,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-poster border-2 border-border bg-panel shadow-lg lg:border-4">
        <div className="grid gap-px bg-border lg:grid-cols-[1.2fr_0.8fr]">
          <div className="poster-panel relative min-h-[360px] !rounded-none">
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover opacity-80 grayscale"
              />
            ) : (
              <>
                <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
                <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-90">
                  <Starburst rings color="#F2C230" className="absolute -left-6 -top-6 h-28 w-28 opacity-70" />
                  <RockShape variant={2} fill="#D6294C" className="absolute bottom-6 right-10 h-20 w-20 rotate-[14deg]" />
                  <Sparkle className="absolute right-1/4 top-6 h-3 w-3 text-primary-yellow" />
                </div>
              </>
            )}
            <div className="absolute inset-0 bg-foreground/40" />
            <div className="relative flex h-full flex-col justify-between p-8 text-[#F5F0E3]">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex w-fit rounded-full border-2 border-[#F5F0E3] bg-primary-yellow px-3 py-1 font-tech text-[11px] font-bold uppercase tracking-widest text-[#14120F]">
                  {event.event_type}
                </span>
                <span className="inline-flex w-fit rounded-full border-2 border-[#F5F0E3]/60 px-3 py-1 font-tech text-[11px] font-bold uppercase tracking-widest text-[#F5F0E3]">
                  {event.registration_mode} registration
                </span>
              </div>
              <div>
                <PosterHeading as="h1" fillClassName="text-primary-yellow" className="mt-6 text-3xl sm:text-5xl">
                  {event.title}
                </PosterHeading>
                <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-[#F5F0E3]/90 sm:text-base">
                  {event.description ?? 'Check the schedule, venue, capacity, and registration rules before you continue.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-panel p-8">
            <div className="grid gap-px overflow-hidden rounded-2xl border-2 border-border bg-border text-sm sm:grid-cols-2">
              <div className="bg-panel-muted p-5">
                <p className="font-tech text-xs font-bold uppercase tracking-widest text-brand">When</p>
                <p className="mt-1 font-bold leading-6 text-foreground">{formatEventDate(event.starts_at)}</p>
              </div>
              <div className="bg-panel-muted p-5">
                <p className="font-tech text-xs font-bold uppercase tracking-widest text-brand">Where</p>
                <p className="mt-1 flex items-center gap-1.5 font-bold leading-6 text-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  {event.venue}
                </p>
              </div>
              <div className="bg-panel-muted p-5">
                <p className="font-tech text-xs font-bold uppercase tracking-widest text-accent">Registration Mode</p>
                <p className="mt-1 flex items-center gap-1.5 font-bold capitalize text-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  {event.registration_mode}
                </p>
              </div>
              <div className="bg-panel-muted p-5">
                <p className="font-tech text-xs font-bold uppercase tracking-widest text-accent">Capacity</p>
                <p className="mt-1 font-bold text-foreground">
                  {spots === null ? 'Unlimited seats' : `${spots} spots left`}
                </p>
              </div>
            </div>

            {closed ? (
              <div className="rounded-xl border-2 border-border bg-danger px-4 py-3 text-sm font-bold text-white">
                Registration is closed.
              </div>
            ) : (
              <CountdownTimer closesAt={event.registration_closes_at} />
            )}

            {event.registration_mode !== 'solo' && (event.min_team_size || event.max_team_size) ? (
              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3 text-sm font-bold text-foreground">
                Team size: {event.min_team_size ?? 1} to {event.max_team_size ?? 'any'} members.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              {alreadyRegistered ? (
                <Link
                  href="/participant/portal"
                  className="app-button-success flex-1"
                >
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  Already Registered &mdash; View in Portal
                </Link>
              ) : (
                <Link
                  href={`/events/${event.slug}/register`}
                  aria-disabled={closed}
                  className={
                    closed
                      ? 'pointer-events-none flex-1 rounded-full border-2 border-border bg-panel-muted px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-foreground-soft'
                      : 'app-button-primary flex-1'
                  }
                >
                  {closed ? 'Registration Closed' : 'Register Now'}
                </Link>
              )}
              <a
                href={calLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-border bg-panel px-5 py-3 font-tech text-sm font-bold uppercase tracking-wider text-accent shadow-sm transition duration-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              >
                <CalendarPlus className="h-4 w-4" strokeWidth={2.5} />
                Add to Calendar
              </a>
            </div>

            <div className="rounded-2xl border-2 border-border bg-panel-muted p-5 text-sm">
              <p className="font-display text-sm uppercase tracking-tight text-foreground">Before you register</p>
              <p className="mt-2 font-medium leading-6 text-foreground-soft">
                Review the deadline, confirm the event format, and keep your confirmation QR ready after registration for a smoother check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
