'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isPast, isRegistrationOpen, formatShortDate } from '@/lib/utils'
import {
  LogOut, Sun, Moon, Sunset, Calendar,
  Users, Copy, Check, ChevronRight, AlertTriangle,
  Zap, IndianRupee, Clock,
} from 'lucide-react'
import { PortalTabs, type PortalTab } from '@/components/participant/PortalTabs'
import { PastEventCard } from '@/components/participant/PastEventCard'
import { ProfileTab } from '@/components/participant/ProfileTab'
import { RockShape } from '@/components/brand/RockShape'
import { Sparkle } from '@/components/brand/Starburst'

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
  const [invites, setInvites]             = useState<any[]>([])
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

  async function loadInvites() {
    const { data } = await fetch('/api/participant/team/invites').then(r => r.json()).catch(() => ({ data: [] }))
    setInvites(data ?? [])
  }

  useEffect(() => {
    Promise.all([
      loadRegistrations(),
      loadInvites(),
      fetch('/api/events').then(r => r.json()).then(({ data }) => setActiveEvents(data ?? [])),
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

  // Accept / decline an incoming team invite or request.
  async function respondInvite(inviteId: string, action: 'accept' | 'decline') {
    setRespBusy(inviteId + action)
    const { data, error } = await fetch('/api/participant/team/invite/respond', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ invite_id: inviteId, action }),
    }).then(r => r.json())
    setRespBusy(null)
    if (error) { alert(error); return }
    if (action === 'accept' && data?.registration_id) {
      router.push(`/participant/portal/events/${data.registration_id}`); return
    }
    await Promise.all([loadRegistrations(), loadInvites()])
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
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-border border-t-brand rounded-full animate-spin" />
        <p className="text-xs font-bold text-brand/70 tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-32"><p className="font-bold text-danger">{error}</p></div>
  )

  // First sign-in gate: participants must record their college email + registration
  // number before using the portal.
  if (!profileComplete) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground">Welcome — complete your details</h1>
        <p className="mt-1 text-sm font-medium text-foreground-soft">
          Before you register for events, add your <strong className="text-foreground">college email</strong> and
          <strong className="text-foreground"> registration number</strong>. These are required and unique to your account.
        </p>
      </div>
      <ProfileTab required onSaved={(p) => { if (p?.college_email && p?.register_number) setProfileComplete(true) }} />
      <div className="mt-6 text-center">
        <button onClick={handleLogout} className="text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground">Sign out</button>
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Greeting */}
      <div className="relative flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {greeting.icon}
            <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground sm:text-3xl">{greeting.text}!</h1>
            <Sparkle className="h-3 w-3 text-primary-yellow" />
          </div>
          <p className="font-tech text-xs font-medium text-foreground-soft">Here's everything for your events.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex shrink-0 items-center gap-2 rounded-full border-2 border-border px-3 py-1.5 font-tech text-[10px] font-bold uppercase tracking-wide text-foreground-soft transition duration-200 hover:text-foreground active:translate-x-[2px] active:translate-y-[2px]"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>

      <PortalTabs active={tab} onChange={setTab} />

      {tab === 'events' && (
      <>
      {/* ── WAITLIST SPOT OFFERS (needs your response) ── */}
      {registrations.filter((r: any) => r.offer_status === 'offered').length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Zap size={13} className="text-brand" />
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand">Spot Offered</h2>
          </div>
          <div className="space-y-2">
            {registrations.filter((r: any) => r.offer_status === 'offered').map((r: any) => {
              const paid = (r.events?.fee ?? 0) > 0
              return (
                <div key={r.id} className="flex flex-col gap-2 rounded-2xl border-2 border-border bg-panel px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-foreground">
                    A spot opened for <strong>{r.events?.title}</strong>
                    {paid && <span className="text-brand"> · ₹{r.events.fee} on accept</span>}
                  </p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => respondOffer(r.id, 'accept')} disabled={respBusy === 'offer' + r.id + 'accept'}
                      className="app-button-primary !px-3 !py-1.5 !text-xs disabled:opacity-50"><Check size={12}/>Accept{paid ? ' & Pay' : ''}</button>
                    <button onClick={() => respondOffer(r.id, 'decline')} disabled={respBusy === 'offer' + r.id + 'decline'}
                      className="app-button-secondary !bg-panel-muted !text-foreground !px-3 !py-1.5 !text-xs disabled:opacity-50">Decline</button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── TEAM INVITES / REQUESTS (needs your response) ── */}
      {invites.filter((i: any) => i.incoming).length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Users size={13} className="text-brand" />
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand">Team Invites</h2>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-border bg-brand px-1.5 text-[11px] font-bold text-white">
              {invites.filter((i: any) => i.incoming).length}
            </span>
          </div>
          <div className="space-y-2">
            {invites.filter((i: any) => i.incoming).map((i: any) => (
              <div key={i.id} className="flex items-center justify-between rounded-2xl border-2 border-border bg-panel px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-foreground">
                  {i.direction === 'invite'
                    ? <>Invite to join <strong>{i.team_name}</strong> · {i.event_title}</>
                    : <><strong>{i.seeker_name}</strong> wants to join your team · {i.event_title}</>}
                </p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => respondInvite(i.id, 'accept')} disabled={respBusy === i.id + 'accept'}
                    className="app-button-primary !px-3 !py-1.5 !text-xs disabled:opacity-50"><Check size={12}/>Accept</button>
                  <button onClick={() => respondInvite(i.id, 'decline')} disabled={respBusy === i.id + 'decline'}
                    className="app-button-secondary !bg-panel-muted !text-foreground !px-3 !py-1.5 !text-xs disabled:opacity-50">Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ACTION REQUIRED ──────────────────────────── */}
      {actionRequired.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={14} className="text-warning" />
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-foreground">Action Required</h2>
            <span className="app-badge-warning app-badge">
              {actionRequired.length}
            </span>
          </div>

          <div className="space-y-4">
            {actionRequired.map(r => {
              const members    = r.members ?? []
              const minSize    = r.events?.min_team_size ?? 0
              const maxSize    = r.events?.max_team_size
              const isLeader   = members.find((m: any) => m.is_leader)?.email === r.leader_email
              const needed     = Math.max(0, minSize - members.length)

              return (
                <div key={r.id} className="relative rounded-poster border-4 border-border bg-panel p-5 shadow-lg">
                  <RockShape variant={2} fill="#F2C230" className="absolute -right-2 -top-2 h-9 w-9 rotate-[12deg] opacity-90" />
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">{r.events?.event_type}</span>
                        <span className="app-badge-neutral app-badge">
                          Team
                        </span>
                      </div>
                      <h3 className="font-bold text-foreground">{r.events?.title}</h3>
                      <p className="text-xs text-foreground-soft mt-0.5">Team: <span className="text-foreground font-semibold">{r.team_name}</span></p>
                    </div>
                    {isLeader && (
                      <span className="app-badge-warning app-badge shrink-0">
                        Leader
                      </span>
                    )}
                  </div>

                  {/* Incomplete warning */}
                  <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-border bg-warning/15 px-4 py-3">
                    <AlertTriangle size={14} className="text-warning shrink-0" />
                    <p className="text-xs font-medium text-foreground">
                      Team needs <strong>{needed} more member{needed > 1 ? 's' : ''}</strong> to meet the minimum of {minSize}.
                      Registration is incomplete until the team is full.
                    </p>
                  </div>

                  {/* Members */}
                  <div className="mb-4">
                    <p className="text-xs font-bold text-foreground-soft uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Users size={11} />
                      Members ({members.length}{maxSize ? `/${maxSize}` : ''} · min {minSize})
                    </p>
                    <div className="space-y-2">
                      {members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 py-1.5 border-b-2 border-border last:border-0">
                          <div className="w-7 h-7 rounded-full border-2 border-border bg-panel-muted flex items-center justify-center text-xs font-bold text-foreground shrink-0">
                            {m.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {m.full_name}
                              {m.is_leader && <span className="ml-1.5 text-xs text-brand">Leader</span>}
                            </p>
                            <p className="text-xs text-foreground-soft truncate">{m.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Group code — creator can share it and manage the team */}
                  {isLeader && (
                    <div className="border-t-2 border-border pt-4 space-y-2">
                      <p className="text-xs font-medium text-foreground-soft">Share this group code so teammates can join:</p>
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
                      <div className="flex gap-2">
                        <Link
                          href={`/participant/portal/events/${r.id}/team`}
                          className="app-button-secondary flex-1 !bg-panel-muted !text-foreground"
                        >
                          <Users size={12} /> Manage Team
                        </Link>
                        <Link
                          href={`/participant/portal/events/${r.id}/find`}
                          className="app-button-primary relative flex-1"
                        >
                          <Users size={12} /> Find Teammates
                          {(() => {
                            const pending = invites.filter((i: any) => i.incoming && i.team_registration_id === r.id).length
                            return pending > 0 ? (
                              <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-border bg-brand px-1 text-[10px] font-bold text-white">
                                {pending}
                              </span>
                            ) : null
                          })()}
                        </Link>
                      </div>
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
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-foreground">Upcoming</h2>
            <span className="app-badge-neutral app-badge">
              {upcomingComplete.length}
            </span>
          </div>
          <div className="space-y-3">
            {upcomingComplete.map(r => (
              <EventCard key={r.id} reg={r} />
            ))}
          </div>
        </section>
      )}

      {/* ── REGISTER NOW ─────────────────────────────── */}
      {availableEvents.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Zap size={13} className="text-brand" />
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand">Register Now</h2>
            <span className="app-badge-warning app-badge">
              {availableEvents.length}
            </span>
          </div>
          <div className="space-y-3">
            {availableEvents.map((e: any) => (
              <Link key={e.id} href={`/events/${e.slug}`}>
                <div className="app-card-hover rounded-poster border-4 border-border bg-panel p-5 shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">{e.event_type}</span>
                        {e.registration_mode === 'team' || e.registration_mode === 'both' ? (
                          <span className="app-badge-neutral app-badge flex items-center gap-1">
                            <Users size={9} /> Team
                          </span>
                        ) : (
                          <span className="app-badge-neutral app-badge">
                            Solo
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground group-hover:text-brand transition-colors truncate">{e.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs font-medium text-foreground-soft">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(e.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-foreground-soft group-hover:text-brand transition-colors shrink-0 ml-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty (My Events) */}
      {registrations.length === 0 && availableEvents.length === 0 && (
        <div className="app-empty-state">
          <Sparkle className="mx-auto mb-4 h-8 w-8 text-primary-yellow" />
          <p className="text-foreground font-black uppercase text-lg">No events yet</p>
          <p className="text-foreground-soft text-sm mt-2 font-medium">Register for an upcoming event to see it here.</p>
        </div>
      )}
      </>
      )}

      {/* ── PAST EVENTS TAB ──────────────────────────── */}
      {tab === 'past' && (
        past.length > 0 ? (
          <div className="space-y-3">
            {past.map(r => <PastEventCard key={r.id} reg={r} />)}
          </div>
        ) : (
          <div className="app-empty-state">
            <RockShape variant={3} fill="#F2C230" className="mx-auto mb-4 h-14 w-14 rotate-[6deg]" />
            <p className="text-foreground font-black uppercase text-lg">No past events yet</p>
          </div>
        )
      )}

      {/* ── PROFILE TAB ──────────────────────────────── */}
      {tab === 'profile' && <ProfileTab />}
    </div>
  )
}

// ── Event Card with Solo/Team accent flourish ────────────────
function EventCard({ reg }: { reg: any }) {
  const event      = reg.events
  const isTeam     = reg.registration_type === 'team'
  const attended   = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const hasCert    = Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id

  // Payment state — only the owner (solo owner / team leader) pays, and for a
  // team only once it has reached the minimum size.
  const fee               = event?.fee ?? 0
  const teamComplete      = !isTeam || (reg.members?.length ?? 0) >= (event?.min_team_size ?? 1)
  const owesPayment       = reg._owner && fee > 0 && reg.status === 'confirmed' && teamComplete &&
                            (reg.payment_status === 'pending' || reg.payment_status === 'rejected')
  const paymentUnderReview = fee > 0 && reg.payment_status === 'submitted'

  const statusBadge = () => {
    if (reg.status === 'waitlisted')  return <span className="app-badge-warning app-badge">Waitlisted</span>
    if (reg.status === 'cancelled')   return <span className="app-badge-danger app-badge">Cancelled</span>
    if (owesPayment)                  return <span className="app-badge-danger app-badge">Payment due</span>
    if (paymentUnderReview)           return <span className="app-badge-warning app-badge">Under review</span>
    if (attended && hasCert)          return <span className="app-badge-success app-badge">Certificate</span>
    if (attended)                     return <span className="app-badge-success app-badge">Attended</span>
    return <span className="app-badge-neutral app-badge">Confirmed</span>
  }

  return (
    <div>
    <Link href={`/participant/portal/events/${reg.id}`}>
      <div className="app-card-hover relative rounded-poster border-4 border-border bg-panel p-5 shadow-md transition-all cursor-pointer group">
        {isTeam ? (
          <span aria-hidden className="absolute right-3 top-3 h-3 w-3 rounded-full bg-accent" />
        ) : (
          <Sparkle className="absolute right-2 top-2 h-4 w-4 text-primary-yellow" />
        )}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-tech text-[10px] font-bold uppercase tracking-widest text-brand">{event?.event_type}</span>
              <span className="app-badge-neutral app-badge">
                {isTeam ? <><Users size={9} /> Team</> : 'Solo'}
              </span>
            </div>
            <h3 className="font-bold text-foreground group-hover:text-brand transition-colors truncate">{event?.title}</h3>
          </div>
          {statusBadge()}
        </div>
        <div className="flex flex-wrap gap-3 text-xs font-medium text-foreground-soft">
          {event?.starts_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {formatShortDate(event.starts_at)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              <span aria-hidden>📍</span> {event.venue}
            </span>
          )}
          {isTeam && reg.team_name && (
            <span className="flex items-center gap-1">
              <Users size={11} />
              {reg.team_name}
            </span>
          )}
        </div>
      </div>
    </Link>

    {owesPayment && (
      <Link
        href={`/participant/portal/events/${reg.id}/pay`}
        className="app-button-primary mt-2 flex w-full items-center justify-center gap-2 !py-2.5 text-sm"
      >
        <IndianRupee size={14} /> Complete payment — ₹{fee}
      </Link>
    )}
    {paymentUnderReview && (
      <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-brand">
        <Clock size={12} /> Payment submitted — awaiting organizer verification
      </p>
    )}
    </div>
  )
}