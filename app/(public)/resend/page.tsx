'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'

type PublicEvent = Event & {
  confirmed_count: number
  waitlist_count?: number
}

function normalizeConfirmedCount(value: unknown): number {
  if (typeof value === 'number') return value
  if (Array.isArray(value) && value[0] && typeof value[0] === 'object' && 'count' in value[0]) {
    const count = (value[0] as { count?: unknown }).count
    return typeof count === 'number' ? count : 0
  }
  return 0
}

function normalizeEvent(event: PublicEvent): PublicEvent {
  return {
    ...event,
    confirmed_count: normalizeConfirmedCount((event as PublicEvent & { confirmed_count: unknown }).confirmed_count),
  }
}

export default function ResendPage() {
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        const { data } = await res.json()
        setEvents(((data ?? []) as PublicEvent[]).map(normalizeEvent))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingEvents(false)
      }
    }

    loadEvents()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          event_id: eventId,
        }),
      })

      const { data, error } = await res.json()

      if (error) {
        setError(error)
        return
      }

      setMessage(data?.message ?? 'Confirmation sent successfully.')
    } catch {
      setError('Unable to resend confirmation right now.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-9rem)] max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="overflow-hidden border border-white/10 bg-[#0a1629]">
        <div className="grid min-h-[70vh] gap-px bg-white/10 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#112240] p-8 lg:p-10">
            <span className="inline-flex rounded-full border border-amber-300/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Resend Confirmation
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-white">Recover your event pass quickly.</h1>
            <p className="mt-4 text-sm leading-6 text-slate-300 sm:text-base">
              Use this page if your confirmation email is missing or hard to find. We&apos;ll check the registration and send the right response.
            </p>
            <div className="mt-8 space-y-3">
              <div className="rounded-xl border border-white/10 bg-[#0a1629] px-4 py-3 text-sm text-slate-300">
                Confirmed registrations get a resend message.
              </div>
              <div className="rounded-xl border border-white/10 bg-[#0a1629] px-4 py-3 text-sm text-slate-300">
                Waitlisted or missing records are shown clearly before you retry.
              </div>
              <div className="rounded-[1.6rem] border border-amber-300/15 bg-[#0a1629] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Quick Tip</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Use the same email and event pairing from your original registration for the best result.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0a1629] p-8 lg:p-10">
            <div className="mb-5 flex items-center justify-between border border-white/10 bg-[#0f1d36] px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">Recovery Form</p>
                <p className="mt-1 text-sm text-slate-300">Request another confirmation safely.</p>
              </div>
              <div className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-300">
                Public
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-blue-500/30 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="resend-event" className="block text-sm font-medium text-slate-300">
                  Event
                </label>
                <select
                  id="resend-event"
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  required
                  disabled={loadingEvents}
                  className="mt-2 w-full rounded-2xl border border-blue-500/30 bg-[#08111f] px-4 py-3 text-sm text-white outline-none transition focus:border-amber-300 focus:ring-4 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:bg-[#0b1526]"
                >
                  <option value="">{loadingEvents ? 'Loading events...' : 'Select an event'}</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {event.event_type}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingEvents}
                className="inline-flex items-center justify-center border border-amber-300/20 bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-amber-200 hover:shadow-lg hover:shadow-amber-300/20 disabled:cursor-not-allowed disabled:bg-amber-300/50 disabled:text-slate-500 disabled:hover:bg-amber-300/50 disabled:hover:shadow-none"
              >
                {submitting ? 'Sending...' : 'Resend Confirmation'}
              </button>
            </form>

            {message ? (
              <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100 shadow-[0_18px_38px_-28px_rgba(245,158,11,0.35)]">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-[0_18px_38px_-28px_rgba(239,68,68,0.35)]">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
