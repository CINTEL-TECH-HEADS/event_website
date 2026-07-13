//FE1 event details page. This is a client component since it needs to fetch form fields for the registration form, but it receives all other event details as a prop from the server component page. The server component fetches the event with its confirmed/waitlist counts using a single optimized query, so we don't have to worry about N+1 queries here when rendering the details.

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { EventWithFields } from '@/types'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { formatEventDate, isPast, spotsLeft } from '@/lib/utils'

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

        setEvent(normalizeEvent(data as EventWithFields))
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
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-sm backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="w-full rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
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
      <div className="overflow-hidden border border-white/10 bg-[#0a1629]">
        <div className="grid gap-px bg-white/10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative min-h-[360px] bg-[#112240]">
            {event.banner_url ? (
              <img
                src={event.banner_url}
                alt={event.title}
                className="absolute inset-0 h-full w-full object-cover opacity-70"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,17,31,0.18),rgba(9,17,31,0.76))]" />
            <div className="public-event-hero-copy relative flex h-full flex-col justify-between p-8 text-white">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex w-fit border border-amber-300/30 bg-[#09111f]/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
                  {event.event_type}
                </span>
                <span className="inline-flex w-fit border border-white/20 bg-[#09111f]/60 px-3 py-1 text-xs font-medium text-slate-200">
                  {event.registration_mode} registration
                </span>
              </div>
              <div>
                <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-5xl">{event.title}</h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                  {event.description ?? 'Check the schedule, venue, capacity, and registration rules before you continue.'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 bg-[#0a1629] p-8">
            <div className="h-px w-24 bg-[linear-gradient(90deg,rgba(180,83,9,0.85),rgba(180,83,9,0))]" />
            <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 text-sm text-slate-300 sm:grid-cols-2">
              <div>
                <div className="bg-[#0f1d36] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">When</p>
                  <p className="mt-1 leading-6 text-white">{formatEventDate(event.starts_at)}</p>
                </div>
              </div>
              <div>
                <div className="bg-[#0f1d36] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Where</p>
                  <p className="mt-1 leading-6 text-white">{event.venue}</p>
                </div>
              </div>
              <div>
                <div className="bg-[#0f1d36] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Registration Mode</p>
                  <p className="mt-1 capitalize text-white">{event.registration_mode}</p>
                </div>
              </div>
              <div>
                <div className="bg-[#0f1d36] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Capacity</p>
                  <p className="mt-1 text-white">
                    {spots === null ? 'Unlimited seats' : `${spots} spots left`}
                  </p>
                </div>
              </div>
            </div>

            {closed ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Registration is closed.
              </div>
            ) : (
              <CountdownTimer closesAt={event.registration_closes_at} />
            )}

            {event.registration_mode !== 'solo' && (event.min_team_size || event.max_team_size) ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Team size: {event.min_team_size ?? 1} to {event.max_team_size ?? 'any'} members.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/events/${event.slug}/register`}
                aria-disabled={closed}
                className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold shadow-sm transition ${
                  closed
                    ? 'pointer-events-none bg-slate-300 text-white'
                    : 'border border-amber-300/35 bg-amber-300 text-slate-950 hover:bg-amber-200'
                }`}
              >
                {closed ? 'Registration Closed' : 'Register Now'}
              </Link>
              <a
                href={calLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:bg-white/10"
              >
                + Add to Google Calendar
              </a>
            </div>

            <div className="border border-white/10 bg-[#0f1d36] p-5 text-sm text-slate-300">
              <p className="font-semibold text-white">Before you register</p>
              <p className="mt-2 leading-6">
                Review the deadline, confirm the event format, and keep your confirmation QR ready after registration for a smoother check-in.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
