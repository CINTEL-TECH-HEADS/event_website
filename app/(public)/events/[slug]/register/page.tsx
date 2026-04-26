'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import type { EventWithFields } from '@/types'
import { RegistrationForm } from '@/components/public/RegistrationForm'
import { isPast } from '@/lib/utils'

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

export default function RegisterPage() {
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
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-10 text-center shadow-sm backdrop-blur">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">Loading registration form...</p>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="space-y-6 border border-white/10 bg-[#0a1629] p-6 sm:p-8">
        <div className="space-y-3">
          <span className="inline-flex rounded-full border border-amber-300/25 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
            Registration
          </span>
          <div className="h-px w-24 bg-[linear-gradient(90deg,rgba(245,158,11,0.8),rgba(245,158,11,0))]" />
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Register for {event.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Enter your details below. The form adjusts automatically based on this event&apos;s registration mode and custom fields.
            </p>
          </div>
        </div>

        {closed ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Registration is closed for this event.
          </div>
        ) : null}

        <RegistrationForm event={event} disabled={closed} />
      </div>
    </div>
  )
}
