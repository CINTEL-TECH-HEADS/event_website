'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, CalendarPlus, CheckCircle2, IndianRupee, MapPin, Users } from 'lucide-react'
import type { EventWithFields } from '@/types'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { CapacityBadge } from '@/components/public/CapacityBadge'
import { PageHeader } from '@/components/site/PageHeader'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { formatEventDate, isPast } from '@/lib/utils'
import { EVENT_TYPE_LABELS, REGISTRATION_MODE_LABELS } from '@/lib/club'

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

function Fact({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-3">
      <Icon size={18} className="mt-0.5 shrink-0 text-brand" strokeWidth={2.5} />
      <div>
        <dt className="font-tech text-[11px] font-bold uppercase tracking-widest text-foreground-soft">{label}</dt>
        <dd className="mt-0.5 text-sm font-bold text-foreground">{children}</dd>
      </div>
    </div>
  )
}

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventWithFields | null>(null)
  const [registrationId, setRegistrationId] = useState<string | null>(null)
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
        if (mine?.data?.registered) {
          setAlreadyRegistered(true)
          setRegistrationId(mine.data.registration_id ?? null)
        }
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="rounded-2xl border-2 border-border bg-danger p-8 text-sm font-bold text-white">{error ?? 'Event not found'}</p>
        <Link href="/events" className="app-button-secondary mt-6">Back to all events</Link>
      </div>
    )
  }

  const closed = isPast(event.registration_closes_at)
  const fee = event.fee ?? 0
  const hasTeams = event.registration_mode !== 'solo'
  const calLink = generateGoogleCalendarLink({
    title: event.title,
    starts_at: event.starts_at,
    ends_at: event.ends_at,
    venue: event.venue,
    description: event.description ?? undefined,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        back={{ href: '/events', label: 'All events' }}
        kicker={`${EVENT_TYPE_LABELS[event.event_type] ?? event.event_type} · ${REGISTRATION_MODE_LABELS[event.registration_mode] ?? event.registration_mode}`}
        title={event.title}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="min-w-0 space-y-8">
          {event.banner_url && (
            <img
              src={event.banner_url}
              alt=""
              className="aspect-[16/8] w-full rounded-2xl border-2 border-border object-cover shadow-sm"
            />
          )}

          <section>
            <h2 className="font-display text-lg uppercase tracking-tight text-foreground">About</h2>
            <p className="mt-3 whitespace-pre-line text-base font-medium leading-7 text-foreground-soft">
              {event.description?.trim() || 'Details for this event will be added by the organizers.'}
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg uppercase tracking-tight text-foreground">Details</h2>
            <dl className="mt-2 grid divide-y-2 divide-border border-y-2 border-border sm:grid-cols-2 sm:divide-y-0">
              <Fact icon={CalendarDays} label="Starts">{formatEventDate(event.starts_at)}</Fact>
              {event.ends_at && <Fact icon={CalendarDays} label="Ends">{formatEventDate(event.ends_at)}</Fact>}
              <Fact icon={MapPin} label="Venue">{event.venue}</Fact>
              <Fact icon={Users} label="Format">
                {REGISTRATION_MODE_LABELS[event.registration_mode] ?? event.registration_mode}
                {hasTeams && (event.min_team_size || event.max_team_size)
                  ? ` · teams of ${event.min_team_size ?? 1}–${event.max_team_size ?? 'any'}`
                  : ''}
              </Fact>
              <Fact icon={IndianRupee} label="Fee">{fee > 0 ? `₹${fee}${hasTeams ? ' per registration' : ''}` : 'Free'}</Fact>
              <Fact icon={CalendarDays} label="Registration closes">{formatEventDate(event.registration_closes_at)}</Fact>
            </dl>
          </section>
        </div>

        {/* Registration card */}
        <aside className="rounded-2xl border-2 border-border bg-panel p-5 shadow-md lg:sticky lg:top-28 lg:border-4">
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">Registration</p>

          <div className="mt-4 space-y-3">
            {closed ? (
              <p className="rounded-xl border-2 border-border bg-danger px-4 py-3 text-sm font-bold text-white">Registration is closed.</p>
            ) : (
              <CountdownTimer closesAt={event.registration_closes_at} />
            )}
            <div className="flex flex-wrap gap-2">
              <span className="app-badge app-badge-neutral">{fee > 0 ? `₹${fee}` : 'Free'}</span>
              <CapacityBadge event={event} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            {alreadyRegistered ? (
              <Link
                href={registrationId ? `/participant/portal/events/${registrationId}` : '/participant/portal'}
                className="app-button-success w-full"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                You&apos;re registered · open in My events
              </Link>
            ) : (
              <Link
                href={`/events/${event.slug}/register`}
                aria-disabled={closed}
                className={
                  closed
                    ? 'pointer-events-none w-full rounded-full border-2 border-border bg-panel-muted px-5 py-3 text-center text-sm font-bold uppercase tracking-wider text-foreground-soft'
                    : 'app-button-primary w-full'
                }
              >
                {closed ? 'Registration closed' : 'Register'}
              </Link>
            )}
            <a href={calLink} target="_blank" rel="noopener noreferrer" className="app-button-secondary w-full">
              <CalendarPlus className="h-4 w-4" strokeWidth={2.5} />
              Add to Google Calendar
            </a>
          </div>

          {!closed && !alreadyRegistered && (
            <p className="mt-4 text-xs font-medium leading-5 text-foreground-soft">
              You&apos;ll sign in with Google before registering.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}
