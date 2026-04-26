'use client'

import { useEffect, useState } from 'react'
import type { Event } from '@/types'

type CertificateState = 'idle' | 'loading' | 'ready' | 'not_found' | 'not_attended' | 'not_ready'
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

export default function CertificatePage() {
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [status, setStatus] = useState<CertificateState>('idle')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        const { data } = await res.json()
        setEvents(((data ?? []) as PublicEvent[]).map(normalizeEvent))
      } catch (err) {
        console.error(err)
      }
    }

    loadEvents()
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setDownloadUrl('')
    setMessage(null)

    try {
      const res = await fetch(
        `/api/certificates/download?email=${encodeURIComponent(email)}&event_id=${eventId}`
      )
      const { data, error } = await res.json()

      if (error) {
        const lower = String(error).toLowerCase()
        if (lower.includes('attendance')) {
          setStatus('not_attended')
        } else if (lower.includes('generated yet')) {
          setStatus('not_ready')
        } else {
          setStatus('not_found')
        }
        setMessage(error)
        return
      }

      if (!data?.downloadUrl) {
        setStatus('not_ready')
        setMessage('Certificate download is not ready yet.')
        return
      }

      setDownloadUrl(data.downloadUrl)
      setMessage(`Certificate ready for ${data.name}. Link expires in ${data.expiresIn}.`)
      setStatus('ready')
    } catch {
      setStatus('not_found')
      setMessage('Unable to fetch certificate details right now.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden border border-white/10 bg-[#0a1629]">
        <div className="border-b border-white/10 bg-[#112240] p-8">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex rounded-full border border-amber-300/20 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">
              Certificate Download
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Download your event certificate</h1>
            <p className="text-sm leading-6 text-slate-300 sm:text-base">
              Certificates are available for attendees with recorded attendance. Select the event, enter your registered email, and we&apos;ll show the current status.
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <label htmlFor="certificate-email" className="block text-sm font-medium text-slate-300">
                Registered email
              </label>
              <input
                id="certificate-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="certificate-event" className="block text-sm font-medium text-slate-300">
                Event
              </label>
              <select
                id="certificate-event"
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15"
              >
                <option value="">Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {event.event_type}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center border border-amber-300/20 bg-amber-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-white"
            >
              {status === 'loading' ? 'Checking...' : 'Check Certificate'}
            </button>
          </form>

          {status === 'ready' && downloadUrl ? (
            <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4">
              <p className="text-sm text-emerald-200">{message}</p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#059669,#10b981)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
              >
                Download Certificate
              </a>
            </div>
          ) : null}

          {status === 'not_attended' ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {message}
            </div>
          ) : null}

          {status === 'not_ready' ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {message}
            </div>
          ) : null}

          {status === 'not_found' ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
