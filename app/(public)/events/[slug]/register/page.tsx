'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { EventWithFields } from '@/types'
import { RegistrationForm } from '@/components/public/RegistrationForm'
import { formatEventDate, isPast } from '@/lib/utils'
import { PageHeader } from '@/components/site/PageHeader'
import { REGISTRATION_MODE_LABELS } from '@/lib/club'

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
    <div className="space-y-3 rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
      <p className="text-sm font-medium text-foreground-soft">Enter the team code your teammate shared with you.</p>
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
  const [mode, setMode] = useState<'create' | 'code'>('create')
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
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
  const fee = event.fee ?? 0

  // Effective participation: fixed for solo/team events, chosen for `both`.
  const part =
    event.registration_mode === 'solo' ? 'solo'
    : event.registration_mode === 'team' ? 'team'
    : participation

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <PageHeader
        back={{ href: `/events/${event.slug}`, label: 'Event details' }}
        kicker="Register"
        title={event.title}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {closed && (
            <div className="rounded-2xl border-2 border-border bg-danger px-4 py-3 text-sm font-bold text-white">
              Registration is closed for this event.
            </div>
          )}

          {alreadyRegistered ? (
            <div className="space-y-4 rounded-2xl border-2 border-border bg-panel px-5 py-8 text-center shadow-sm">
              <p className="text-lg font-black uppercase text-foreground">You&apos;re already registered</p>
              <p className="text-sm font-medium text-foreground-soft">
                Your registration and QR pass are in My events.
              </p>
              <Link href="/participant/portal" className="app-button-success">
                Open My events
              </Link>
            </div>
          ) : (
            <>
              {/* `both` events: choose solo or team participation first */}
              {event.registration_mode === 'both' && !closed && (
                <fieldset>
                  <legend className="mb-3 font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
                    How are you taking part?
                  </legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {([
                      ['solo', 'Solo', 'Register just yourself.'],
                      ['team', 'As a team', 'Create a team or join one with a code.'],
                    ] as const).map(([p, label, hint]) => (
                      <ChoiceCard key={p} active={part === p} onClick={() => setParticipation(p)} label={label} hint={hint} />
                    ))}
                  </div>
                </fieldset>
              )}

              {event.registration_mode === 'both' && part === null && !closed ? null : part === 'team' ? (
                <>
                  {/* Team: create a team or join one with a code */}
                  {!closed && (
                    <fieldset>
                      <legend className="mb-3 font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
                        Your team
                      </legend>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {([
                          ['create', 'Create a team', 'You become the team leader and get a code to share.'],
                          ['code', 'Join with code', 'A teammate already created the team.'],
                        ] as const).map(([m, label, hint]) => (
                          <ChoiceCard key={m} active={mode === m} onClick={() => setMode(m)} label={label} hint={hint} />
                        ))}
                      </div>
                    </fieldset>
                  )}

                  {mode === 'code' && !closed ? (
                    <JoinByCode />
                  ) : (
                    <FormPanel>
                      <RegistrationForm
                        event={event}
                        disabled={closed}
                        prefill={prefill}
                        forceTeam
                      />
                    </FormPanel>
                  )}
                </>
              ) : (
                // Solo registration
                <FormPanel>
                  <RegistrationForm event={event} disabled={closed} prefill={prefill} />
                </FormPanel>
              )}
            </>
          )}
        </div>

        {/* Event summary */}
        <aside className="rounded-2xl border-2 border-border bg-panel-muted p-5 text-sm lg:sticky lg:top-28">
          <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">Summary</p>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">When</dt>
              <dd className="font-bold text-foreground">{formatEventDate(event.starts_at)}</dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">Where</dt>
              <dd className="font-bold text-foreground">{event.venue}</dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">Format</dt>
              <dd className="font-bold text-foreground">
                {REGISTRATION_MODE_LABELS[event.registration_mode] ?? event.registration_mode}
                {event.registration_mode !== 'solo' && (event.min_team_size || event.max_team_size)
                  ? ` · teams of ${event.min_team_size ?? 1}–${event.max_team_size ?? 'any'}`
                  : ''}
              </dd>
            </div>
            <div>
              <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">Fee</dt>
              <dd className="font-bold text-foreground">{fee > 0 ? `₹${fee}` : 'Free'}</dd>
            </div>
          </dl>
          {fee > 0 && (
            <p className="mt-4 border-t-2 border-border pt-3 text-xs font-medium leading-5 text-foreground-soft">
              After registering you pay and upload proof from My events. Your pass is issued once the payment is verified.
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

function ChoiceCard({ active, onClick, label, hint }: { active: boolean; onClick: () => void; label: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-2xl border-2 border-border p-4 text-left transition duration-200 ${
        active ? 'bg-warning shadow-sm' : 'bg-panel hover:bg-panel-muted'
      }`}
    >
      <span className="block text-sm font-black uppercase tracking-wide text-foreground">{label}</span>
      <span className="mt-1 block text-xs font-medium leading-5 text-foreground-soft">{hint}</span>
    </button>
  )
}

function FormPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm sm:p-6">{children}</div>
}
