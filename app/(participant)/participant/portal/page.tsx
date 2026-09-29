'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isPast, isRegistrationOpen, formatShortDate } from '@/lib/utils'
import {
  Sun, Moon, Sunset, Calendar, MapPin, QrCode,
  Users, Copy, Check, ChevronRight, AlertTriangle,
  Zap, IndianRupee, Clock,
} from 'lucide-react'
import { PortalTabs, type PortalTab } from '@/components/participant/PortalTabs'
import { PastEventCard } from '@/components/participant/PastEventCard'
import { ProfileTab } from '@/components/participant/ProfileTab'
import { EVENT_TYPE_LABELS, REGISTRATION_MODE_LABELS } from '@/lib/club'

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? ''
}

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return { text: `Good morning, ${name}`, icon: <Sun size={18} className="text-brand" /> }
  if (hour < 17) return { text: `Good afternoon, ${name}`, icon: <Sunset size={18} className="text-brand" /> }
  return { text: `Good evening, ${name}`, icon: <Moon size={18} className="text-accent" /> }
}

function isTeamComplete(reg: any): boolean {
  const minSize    = reg.events?.min_team_size
  const memberCount = reg.members?.length ?? 0
  if (!minSize) return true
  return memberCount >= minSize
}

function isRegistrationComplete(reg: any): boolean {
  if (reg.status !== 'confirmed') return false
  if (reg.registration_type === 'team') return isTeamComplete(reg)
  return true
}

export default function PortalPage() {
  const [registrations, setRegistrations] = useState<any[]>([])
  const [activeEvents, setActiveEvents]   = useState<any[]>([])
  const [profileName, setProfileName]     = useState('')
  const [regName, setRegName]             = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [copied, setCopied]               = useState<string | null>(null)
  const [respBusy, setRespBusy]           = useState<string | null>(null)
  const [tab, setTab]                     = useState<PortalTab>('events')
  const [profileComplete, setProfileComplete] = useState(true)
  const router = useRouter()

  async function loadRegistrations() {
    const { data, error } = await fetch('/api/participant/registrations').then(r => r.json())
    if (error === 'Unauthorised') { router.replace('/login'); return }
    if (error) { setError(error); return }
    const regs = data ?? []
    setRegistrations(regs)
    const first = regs[0]
    if (first?.leader_name) setRegName(firstName(first.leader_name))
  }

  // /api/events is filtered by the viewer's affiliation (other-college students
  // only get open_to_external events), so reload it whenever the profile is saved:
  // on first sign-in the list is fetched before setup records the affiliation.
  async function loadEvents() {
    const { data } = await fetch('/api/events', { cache: 'no-store' }).then(r => r.json())
    setActiveEvents(data ?? [])
  }

  useEffect(() => {
    Promise.all([
      loadRegistrations(),
      loadEvents(),
      fetch('/api/participant/profile').then(r => r.json()).then(j => {
        setProfileComplete(!!j.data?.complete)
        if (j.data?.profile?.full_name) setProfileName(firstName(j.data.profile.full_name))
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function copyInvite(regId: string, code: string) {
    await navigator.clipboard.writeText(code)
    setCopied(regId)
    setTimeout(() => setCopied(null), 2000)
  }

  // Respond to a waitlist spot offer.
  async function respondOffer(regId: string, action: 'accept' | 'decline') {
    setRespBusy('offer' + regId + action)
    const { data, error } = await fetch(`/api/participant/registrations/${regId}/offer`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    }).then(r => r.json())
    setRespBusy(null)
    if (error) { alert(error); return }
    if (action === 'accept' && data?.requires_payment) {
      router.push(`/participant/portal/events/${regId}/pay`); return
    }
    await loadRegistrations()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-brand" />
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-32"><p className="font-bold text-danger">{error}</p></div>
  )

  // First sign-in gate: participants record who they are (SRM KTR student, or
  // a student from another college) before using the portal.
  if (!profileComplete) return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">One-time setup</p>
      <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight text-foreground">Complete your details</h1>
      <p className="mt-2 mb-6 max-w-xl text-sm font-medium leading-6 text-foreground-soft">
        Tell us whether you study at SRM KTR or another college. SRM students add their registration number and
        college email; students from other colleges add their college name and phone.
      </p>
      <ProfileTab required onSaved={async (_p, complete) => {
        if (!complete) return
        await loadEvents()
        setProfileComplete(true)
      }} />
      <div className="mt-6">
        <button onClick={handleLogout} className="font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground">Sign out</button>
      </div>
    </div>
  )

  const upcoming          = registrations.filter(r => !isPast(r.events?.starts_at))
  const past              = registrations.filter(r => isPast(r.events?.starts_at))
  const actionRequired    = upcoming.filter(r => !isRegistrationComplete(r))
  const upcomingComplete  = upcoming.filter(r => isRegistrationComplete(r))
  const registeredIds     = registrations.map(r => r.event_id)
  // "Register Now" = not already registered AND registration is still open.
  const availableEvents   = activeEvents.filter(
    e => !registeredIds.includes(e.id) && isRegistrationOpen(e)
  )
  const greeting          = getGreeting(profileName || regName || 'there')
  const offers            = registrations.filter((r: any) => r.offer_status === 'offered')
  const paymentsDue       = upcoming.filter(owesPayment)

  const summary = [
    { label: 'Upcoming', value: upcoming.length },
    { label: 'Need action', value: actionRequired.length + offers.length },
    { label: 'Payments due', value: paymentsDue.length },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

      {/* Greeting + summary */}
      <div className="mb-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-tech text-[11px] font-bold uppercase tracking-[0.25em] text-brand">
            {greeting.icon} My events
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase leading-tight tracking-tight text-foreground sm:text-4xl">{greeting.text}</h1>
        </div>
        <dl className="grid grid-cols-3 divide-x-2 divide-border overflow-hidden rounded-2xl border-2 border-border bg-panel text-center shadow-sm">
          {summary.map(({ label, value }) => (
            <div key={label} className="px-4 py-3">
              <dd className={`font-display text-2xl ${value > 0 && label !== 'Upcoming' ? 'text-primary-red' : 'text-foreground'}`}>{value}</dd>
              <dt className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">{label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <PortalTabs active={tab} onChange={setTab} />

      {tab === 'events' && (
      <div className="space-y-10">
      {/* ── WAITLIST SPOT OFFERS (needs your response) ── */}
      {offers.length > 0 && (
        <section>
          <SectionTitle icon={<Zap size={13} className="text-brand" />} title="Spot offered" count={offers.length} />
          <div className="space-y-2">
            {offers.map((r: any) => {
              const paid = (r.events?.fee ?? 0) > 0
              return (
                <div key={r.id} className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-warning/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">
                    A spot opened for <strong>{r.events?.title}</strong>
                    {paid && <span className="text-brand"> · ₹{r.events.fee} on accept</span>}
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respondOffer(r.id, 'accept')} disabled={respBusy === 'offer' + r.id + 'accept'}
                      className="app-button-primary !px-3 !py-1.5 !text-xs disabled:opacity-50"><Check size={12}/>Accept{paid ? ' & pay' : ''}</button>
                    <button onClick={() => respondOffer(r.id, 'decline')} disabled={respBusy === 'offer' + r.id + 'decline'}
                      className="app-button-secondary !bg-panel !text-foreground !px-3 !py-1.5 !text-xs disabled:opacity-50">Decline</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── ACTION REQUIRED (teams below minimum size) ── */}
      {actionRequired.length > 0 && (
        <section>
          <SectionTitle icon={<AlertTriangle size={14} className="text-warning" />} title="Team incomplete" count={actionRequired.length} />
          <div className="grid gap-4 md:grid-cols-2">
            {actionRequired.map(r => {
              const members    = r.members ?? []
              const minSize    = r.events?.min_team_size ?? 0
              const maxSize    = r.events?.max_team_size
              const isLeader   = members.find((m: any) => m.is_leader)?.email === r.leader_email
              const needed     = Math.max(0, minSize - members.length)

              return (
                <div key={r.id} className="flex flex-col rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
                        {EVENT_TYPE_LABELS[r.events?.event_type] ?? r.events?.event_type} · Team
                      </p>
                      <h3 className="mt-1 truncate font-black uppercase tracking-tight text-foreground">{r.events?.title}</h3>
                      <p className="mt-0.5 text-xs text-foreground-soft">Team <span className="font-semibold text-foreground">{r.team_name}</span></p>
                    </div>
                    {isLeader && <span className="app-badge-warning app-badge shrink-0">Leader</span>}
                  </div>

                  <p className="mt-4 rounded-xl border-2 border-border bg-warning/20 px-3 py-2 text-xs font-medium text-foreground">
                    Needs <strong>{needed} more member{needed > 1 ? 's' : ''}</strong> (minimum {minSize}). The registration is incomplete until then.
                  </p>

                  <ul className="mt-4 space-y-1.5">
                    <li className="font-tech text-[10px] font-bold uppercase tracking-widest text-foreground-soft">
                      Members {members.length}{maxSize ? `/${maxSize}` : ''}
                    </li>
                    {members.map((m: any) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border bg-panel-muted text-[10px] font-bold text-foreground">
                          {m.full_name?.[0]?.toUpperCase()}
                        </span>
                        <span className="truncate font-semibold text-foreground">{m.full_name}</span>
                        {m.is_leader && <span className="text-xs text-brand">Leader</span>}
                      </li>
                    ))}
                  </ul>

                  {/* Group code — creator can share it and manage the team */}
                  {isLeader && (
                    <div className="mt-auto space-y-2 border-t-2 border-border pt-4">
                      <p className="text-xs font-medium text-foreground-soft">Share this team code so teammates can join:</p>
                      <div className="flex gap-2">
                        <div className="flex-1 rounded-full border-2 border-border bg-panel-muted px-4 py-2 font-mono text-sm font-bold tracking-widest text-foreground">
                          {r.group_code ?? '—'}
                        </div>
                        <button
                          onClick={() => copyInvite(r.id, r.group_code)}
                          className="flex items-center justify-center gap-1.5 rounded-full border-2 border-border bg-panel-muted px-3 text-xs font-bold text-foreground transition duration-200 hover:bg-brand hover:text-white"
                        >
                          {copied === r.id ? <Check size={12} /> : <Copy size={12} />}
                          {copied === r.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <Link href={`/participant/portal/events/${r.id}/team`} className="app-button-secondary w-full !bg-panel-muted !text-foreground">
                        <Users size={12} /> Manage team
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── UPCOMING (complete registrations) ────────── */}
      {upcomingComplete.length > 0 && (
        <section>
          <SectionTitle title="Upcoming" count={upcomingComplete.length} />
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingComplete.map(r => (
              <RegistrationCard key={r.id} reg={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── OPEN FOR REGISTRATION ────────────────────── */}
      {availableEvents.length > 0 && (
        <section>
          <SectionTitle icon={<Zap size={13} className="text-brand" />} title="Open for registration" count={availableEvents.length} />
          <div className="grid gap-3 md:grid-cols-2">
            {availableEvents.map((e: any) => (
              <Link
                key={e.id}
                href={`/events/${e.slug}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border-2 border-border bg-panel p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="min-w-0">
                  <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
                    {EVENT_TYPE_LABELS[e.event_type] ?? e.event_type} · {REGISTRATION_MODE_LABELS[e.registration_mode] ?? e.registration_mode}
                  </p>
                  <h3 className="mt-1 truncate font-black uppercase tracking-tight text-foreground group-hover:text-brand">{e.title}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground-soft">
                    <Calendar size={11} /> {formatShortDate(e.starts_at)}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-foreground-soft transition-colors group-hover:text-brand" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty (My Events) */}
      {registrations.length === 0 && availableEvents.length === 0 && (
        <div className="app-empty-state">
          <p className="text-lg font-black uppercase text-foreground">No events yet</p>
          <p className="mt-2 text-sm font-medium text-foreground-soft">When you register for an event it shows up here, with your QR pass.</p>
          <Link href="/events" className="app-button-primary mt-5">Browse events</Link>
        </div>
      )}
      </div>
      )}

      {/* ── PAST EVENTS TAB ──────────────────────────── */}
      {tab === 'past' && (
        past.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {past.map(r => <PastEventCard key={r.id} reg={r} />)}
          </div>
        ) : (
          <div className="app-empty-state">
            <p className="text-lg font-black uppercase text-foreground">No past events yet</p>
            <p className="mt-2 text-sm font-medium text-foreground-soft">Events move here once they have started. Certificates appear here when released.</p>
          </div>
        )
      )}

      {/* ── PROFILE TAB ──────────────────────────────── */}
      {tab === 'profile' && <ProfileTab onSaved={() => { loadEvents() }} />}
    </div>
  )
}

function SectionTitle({ title, count, icon }: { title: string; count?: number; icon?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {icon}
      <h2 className="font-display text-base uppercase tracking-tight text-foreground">{title}</h2>
      {count !== undefined && <span className="app-badge-neutral app-badge">{count}</span>}
    </div>
  )
}

// Payment state — only the owner (solo owner / team leader) pays, and for a
// team only once it has reached the minimum size.
function owesPayment(reg: any): boolean {
  const event        = reg.events
  const fee          = event?.fee ?? 0
  const isTeam       = reg.registration_type === 'team'
  const teamComplete = !isTeam || (reg.members?.length ?? 0) >= (event?.min_team_size ?? 1)
  return !!reg._owner && fee > 0 && reg.status === 'confirmed' && teamComplete &&
    (reg.payment_status === 'pending' || reg.payment_status === 'rejected')
}

// ── A confirmed registration ───────────────────────────────
function RegistrationCard({ reg }: { reg: any }) {
  const event      = reg.events
  const isTeam     = reg.registration_type === 'team'
  const attended   = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const hasCert    = Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id

  const fee                = event?.fee ?? 0
  const due                = owesPayment(reg)
  const paymentUnderReview = fee > 0 && reg.payment_status === 'submitted'

  const statusBadge = () => {
    if (reg.status === 'waitlisted')  return <span className="app-badge-warning app-badge">Waitlisted</span>
    if (reg.status === 'cancelled')   return <span className="app-badge-danger app-badge">Cancelled</span>
    if (due)                          return <span className="app-badge-danger app-badge">Payment due</span>
    if (paymentUnderReview)           return <span className="app-badge-warning app-badge">Under review</span>
    if (attended && hasCert)          return <span className="app-badge-success app-badge">Certificate</span>
    if (attended)                     return <span className="app-badge-success app-badge">Attended</span>
    return <span className="app-badge-neutral app-badge">Confirmed</span>
  }

  return (
    <div className="flex flex-col rounded-2xl border-2 border-border bg-panel shadow-sm">
      <Link href={`/participant/portal/events/${reg.id}`} className="group flex-1 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
            {EVENT_TYPE_LABELS[event?.event_type] ?? event?.event_type} · {isTeam ? 'Team' : 'Solo'}
          </p>
          {statusBadge()}
        </div>
        <h3 className="mt-2 font-black uppercase leading-tight tracking-tight text-foreground transition-colors group-hover:text-brand">{event?.title}</h3>
        <div className="mt-3 space-y-1 text-xs font-medium text-foreground-soft">
          {event?.starts_at && (
            <p className="flex items-center gap-1.5"><Calendar size={12} className="shrink-0" />{formatShortDate(event.starts_at)}</p>
          )}
          {event?.venue && (
            <p className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0" /><span className="truncate">{event.venue}</span></p>
          )}
          {isTeam && reg.team_name && (
            <p className="flex items-center gap-1.5"><Users size={12} className="shrink-0" />{reg.team_name}</p>
          )}
        </div>
      </Link>

      <div className="border-t-2 border-border px-5 py-3">
        {due ? (
          <Link href={`/participant/portal/events/${reg.id}/pay`} className="app-button-primary w-full !py-2.5 text-sm">
            <IndianRupee size={14} /> Complete payment — ₹{fee}
          </Link>
        ) : paymentUnderReview ? (
          <p className="flex items-center gap-1.5 text-xs font-bold text-brand">
            <Clock size={12} /> Payment submitted — awaiting organizer verification
          </p>
        ) : (
          <Link href={`/participant/portal/events/${reg.id}/qr`} className="inline-flex items-center gap-1.5 font-tech text-xs font-bold uppercase tracking-widest text-brand hover:underline">
            <QrCode size={13} /> Show QR pass
          </Link>
        )}
      </div>
    </div>
  )
}
