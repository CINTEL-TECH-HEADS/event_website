'use client'

import { useEffect, useState } from 'react'
import { Award } from 'lucide-react'
import type { Event } from '@/types'
import { Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
      <div className="app-panel relative overflow-hidden !rounded-poster">
        <div className="poster-panel relative overflow-hidden p-8">
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.15]" />
          <RockShape variant={2} fill="#F2C230" className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rotate-12 opacity-90" />
          <Sparkle className="pointer-events-none absolute left-1/3 top-4 h-3 w-3 text-primary-yellow" />
          <div className="relative max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#F5F0E3] bg-primary-red px-4 py-1.5 font-tech text-[10px] font-bold uppercase tracking-[0.3em] text-white">
              <Award size={14} />
              Certificate Download
            </span>
            <h1 className="font-display text-3xl uppercase leading-[0.95] tracking-tight text-poster-outline text-primary-yellow sm:text-5xl">
              Download your event certificate
            </h1>
            <p className="font-tech text-xs leading-relaxed text-[#F5F0E3]/80 sm:text-sm">
              Certificates are available for attendees with recorded attendance. Select the event, enter your registered email, and we&apos;ll show the current status.
            </p>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="app-panel-muted grid gap-4 !rounded-2xl p-6">
            <div>
              <label htmlFor="certificate-email" className="block font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Registered email
              </label>
              <input
                id="certificate-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="app-input mt-2"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="certificate-event" className="block font-tech text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-soft">
                Event
              </label>
              <select
                id="certificate-event"
                value={eventId}
                onChange={e => setEventId(e.target.value)}
                required
                className="app-select mt-2"
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
              className="app-button-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === 'loading' ? 'Checking...' : 'Check Certificate'}
            </button>
          </form>

          {status === 'ready' && downloadUrl ? (
            <div className="app-alert-success mt-6">
              <p className="text-sm font-medium">{message}</p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-button-success mt-4 inline-flex"
              >
                Download Certificate
              </a>
            </div>
          ) : null}

          {status === 'not_attended' ? (
            <div className="app-alert-warning mt-6">
              <p className="text-sm font-medium">{message}</p>
            </div>
          ) : null}

          {status === 'not_ready' ? (
            <div className="app-alert-info mt-6">
              <p className="text-sm font-medium">{message}</p>
            </div>
          ) : null}

          {status === 'not_found' ? (
            <div className="mt-6 rounded-2xl border-2 border-danger bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
