'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EventWithFields } from '@/types'
import { RegistrationForm } from '@/components/public/RegistrationForm'
import { isPast } from '@/lib/utils'
import { Sparkle } from '@/components/brand/Starburst'

// Instant join with a shared group code (known teammate).
function JoinByCode() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function join() {
    if (!code) return
    setStatus('loading')
    const { data, error } = await fetch('/api/participant/team/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase().trim() }),
    }).then((r) => r.json())
    if (error) { setMessage(error); setStatus('error') }
    else router.push(`/participant/portal/events/${data.registration_id}`)
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-border bg-panel-muted p-5">
      <p className="text-sm font-medium text-foreground-soft">Have a group code from a teammate? Enter it to join instantly.</p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setStatus('idle') }}
          placeholder="TEAM-XXXXX"
          className="app-input flex-1 font-mono tracking-widest"
        />
        <button
          onClick={join}
          disabled={!code || status === 'loading'}
          className="app-button-primary disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining…' : 'Join'}
        </button>
      </div>
      {status === 'error' && <p className="text-sm font-bold text-danger">{message}</p>}
    </div>
  )
}

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
  const [prefill, setPrefill] = useState<Record<string, any> | null>(null)
  const [alreadyRegistered, setAlreadyRegistered] = useState(false)
  const [mode, setMode] = useState<'create' | 'find' | 'code'>('create')
  // For `both` events the participant chooses; solo/team events are fixed.
  const [participation, setParticipation] = useState<'solo' | 'team' | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        // Registration requires an account — gate behind login, then pre-fill from profile
        const profRes = await fetch('/api/participant/profile')
        if (profRes.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/events/${slug}/register`)}`
          return
        }
        const profJson = await profRes.json().catch(() => null)
        setPrefill(profJson?.data?.profile ?? null)

        const res = await fetch(`/api/events/${slug}`)
        const { data, error } = await res.json()

        if (error) {
          setError(error)
          return
        }

        const normalized = normalizeEvent(data as EventWithFields)
        setEvent(normalized)

        // Already registered under this account → show a notice, not the form.
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

    if (slug) load()
  }, [slug])

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-4xl items-center justify-center px-4">
        <div className="app-empty-state">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          <p className="mt-4 text-sm font-bold uppercase tracking-wider text-foreground-soft">Loading registration form...</p>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="relative space-y-6 rounded-poster border-2 border-border bg-panel p-6 shadow-lg sm:p-8 lg:border-4">
        <Sparkle className="absolute right-6 top-6 h-5 w-5 text-primary-yellow" />
        <div className="space-y-3">
          <span className="app-badge app-badge-warning">Registration</span>
          <div className="space-y-2">
            <h1 className="font-display text-2xl uppercase leading-[0.95] tracking-tight text-foreground sm:text-4xl">
              Register for {event.title}
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-foreground-soft sm:text-base">
              Enter your details below. The form adjusts automatically based on this event&apos;s registration mode and custom fields.
            </p>
          </div>
        </div>

        {closed ? (
          <div className="rounded-2xl border-2 border-border bg-danger px-4 py-3 text-sm font-bold text-white">
            Registration is closed for this event.
          </div>
        ) : null}

        {alreadyRegistered ? (
          <div className="space-y-4 rounded-2xl border-2 border-border bg-panel-muted px-5 py-6 text-center">
            <p className="text-lg font-black uppercase text-foreground">You&apos;re already registered</p>
            <p className="text-sm font-medium text-foreground-soft">
              You have already registered for this event. You can view your registration and QR code in
              your portal.
            </p>
            <Link href="/participant/portal" className="app-button-success">
              View in Portal
            </Link>
          </div>
        ) : (() => {
          // Effective participation: fixed for solo/team events, chosen for `both`.
          const part =
            event.registration_mode === 'solo' ? 'solo'
            : event.registration_mode === 'team' ? 'team'
            : participation
          return (
          <>
            {/* `both` events: choose solo or team participation first */}
            {event.registration_mode === 'both' && !closed && (
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['solo', 'Register solo'],
                  ['team', 'Register as a team'],
                ] as const).map(([p, label]) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setParticipation(p)}
                    className={`rounded-xl border-2 px-3 py-3 text-sm font-bold uppercase tracking-wide transition duration-200 ${
                      part === p
                        ? 'border-border bg-warning text-foreground shadow-sm'
                        : 'border-border bg-panel-muted text-foreground-soft hover:bg-panel'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Prompt to pick for `both` before showing a form */}
            {event.registration_mode === 'both' && part === null && !closed ? (
              <p className="rounded-2xl border-2 border-border bg-panel-muted px-4 py-4 text-sm font-medium text-foreground-soft">
                This event allows both solo and team entries &mdash; choose how you&apos;d like to register.
              </p>
            ) : part === 'team' ? (
              <>
                {/* Team: create a team, find a team, or join with a code */}
                {!closed && (
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      ['create', 'Create a team'],
                      ['find', 'Find a team'],
                      ['code', 'Join with code'],
                    ] as const).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={`rounded-xl border-2 px-3 py-3 text-sm font-bold uppercase tracking-wide transition duration-200 ${
                          mode === m
                            ? 'border-border bg-warning text-foreground shadow-sm'
                            : 'border-border bg-panel-muted text-foreground-soft hover:bg-panel'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'code' && !closed ? (
                  <JoinByCode />
                ) : (
                  <RegistrationForm
                    event={event}
                    disabled={closed}
                    prefill={prefill}
                    forceTeam
                    seeking={mode === 'find'}
                  />
                )}
              </>
            ) : (
              // Solo registration
              <RegistrationForm event={event} disabled={closed} prefill={prefill} />
            )}
          </>
          )
        })()}
      </div>
    </div>
  )
}
