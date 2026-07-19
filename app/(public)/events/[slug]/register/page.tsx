'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EventWithFields } from '@/types'
import { RegistrationForm } from '@/components/public/RegistrationForm'
import { isPast } from '@/lib/utils'

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
    <div className="space-y-3 rounded-2xl border border-white/10 bg-[#0f1d36] p-5">
      <p className="text-sm text-slate-300">Have a group code from a teammate? Enter it to join instantly.</p>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setStatus('idle') }}
          placeholder="TEAM-XXXXX"
          className="flex-1 rounded-2xl border border-[#243B72] bg-[#07101f] px-4 py-3 font-mono text-sm tracking-widest text-white outline-none focus:border-[#F5E62D]"
        />
        <button
          onClick={join}
          disabled={!code || status === 'loading'}
          className="rounded-2xl bg-[#F5E62D] px-5 text-sm font-bold text-black transition hover:brightness-110 disabled:opacity-50"
        >
          {status === 'loading' ? 'Joining…' : 'Join'}
        </button>
      </div>
      {status === 'error' && <p className="text-sm text-red-300">{message}</p>}
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

        {alreadyRegistered ? (
          <div className="space-y-4 rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-5 py-6 text-center">
            <p className="text-lg font-semibold text-white">You&apos;re already registered</p>
            <p className="text-sm text-emerald-100/80">
              You have already registered for this event. You can view your registration and QR code in
              your portal.
            </p>
            <Link
              href="/participant/portal"
              className="inline-flex items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-400/20 px-5 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/30"
            >
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
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                      part === p
                        ? 'border-amber-300/40 bg-amber-300/15 text-amber-100'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Prompt to pick for `both` before showing a form */}
            {event.registration_mode === 'both' && part === null && !closed ? (
              <p className="rounded-2xl border border-white/10 bg-[#0f1d36] px-4 py-4 text-sm text-slate-300">
                This event allows both solo and team entries — choose how you&apos;d like to register.
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
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                          mode === m
                            ? 'border-amber-300/40 bg-amber-300/15 text-amber-100'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
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
