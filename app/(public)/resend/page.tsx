'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Info } from 'lucide-react'
import type { Event } from '@/types'
import { Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
      <div className="app-panel relative overflow-hidden !rounded-poster">
        <div className="grid min-h-[70vh] gap-px bg-border lg:grid-cols-[0.95fr_1.05fr]">
          <div className="poster-panel relative overflow-hidden !rounded-none p-8 lg:p-10">
            <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
            <RockShape variant={1} fill="#D6294C" className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rotate-[-12deg] opacity-90" />
            <Sparkle className="pointer-events-none absolute right-10 top-6 h-3 w-3 text-primary-yellow" />
            <span className="relative inline-flex items-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-primary-red px-4 py-1.5 font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-white">
              <RefreshCw size={14} />
              Resend Confirmation
            </span>
            <h1 className="relative mt-5 font-display text-3xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow sm:text-5xl">
              Recover your event pass quickly.
            </h1>
            <p className="relative mt-4 font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
              Use this page if your confirmation email is missing or hard to find. We&apos;ll check the registration and send the right response.
            </p>
            <div className="relative mt-8 space-y-3">
              <div className="rounded-2xl border-2 border-white/40 bg-white/10 px-4 py-3 text-sm font-medium text-white">
                Confirmed registrations get a resend message.
              </div>
              <div className="rounded-2xl border-2 border-white/40 bg-white/10 px-4 py-3 text-sm font-medium text-white">
                Waitlisted or missing records are shown clearly before you retry.
              </div>
              <div className="rounded-2xl border-2 border-[#F5F0E3] bg-primary-yellow px-4 py-4 text-[#14120F]">
                <p className="flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-[0.2em]">
                  <Info size={14} />
                  Quick Tip
                </p>
                <p className="mt-2 text-sm font-medium leading-6">
                  Use the same email and event pairing from your original registration for the best result.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-panel p-8 lg:p-10">
            <div className="app-panel-muted mb-5 flex items-center justify-between !rounded-2xl px-5 py-4">
              <div>
                <p className="font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">Recovery Form</p>
                <p className="mt-1 text-sm font-medium text-foreground">Request another confirmation safely.</p>
              </div>
              <div className="rounded-full border-2 border-border bg-panel px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Public
              </div>
            </div>

            <form onSubmit={handleSubmit} className="app-panel-muted grid gap-4 !rounded-2xl p-6">
              <div>
                <label htmlFor="resend-email" className="block font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">
                  Email address
                </label>
                <input
                  id="resend-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="app-input mt-2"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="resend-event" className="block font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">
                  Event
                </label>
                <select
                  id="resend-event"
                  value={eventId}
                  onChange={e => setEventId(e.target.value)}
                  required
                  disabled={loadingEvents}
                  className="app-select mt-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? 'Sending...' : 'Resend Confirmation'}
              </button>
            </form>

            {message ? (
              <div className="app-alert-warning mt-6">
                <p className="text-sm font-medium">{message}</p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border-2 border-danger bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
