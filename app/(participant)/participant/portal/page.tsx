'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { isPast, formatShortDate } from '@/lib/utils'
import {
  Ticket, LogOut, Sun, Moon, Sunset, Calendar,
  Users, Copy, Check, ChevronRight, AlertTriangle,
  UserPlus, Zap,
} from 'lucide-react'

function getGreeting(name: string) {
  const hour = new Date().getHours()
  if (hour < 12) return { text: `Good morning, ${name}`, icon: <Sun size={18} className="text-amber-400" /> }
  if (hour < 17) return { text: `Good afternoon, ${name}`, icon: <Sunset size={18} className="text-amber-400" /> }
  return { text: `Good evening, ${name}`, icon: <Moon size={18} className="text-amber-300" /> }
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
  const [userName, setUserName]           = useState('')
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [inviteCodes, setInviteCodes]     = useState<Record<string, string>>({})
  const [copied, setCopied]               = useState<string | null>(null)
  const [joiningCode, setJoiningCode]     = useState('')
  const [joinTarget, setJoinTarget]       = useState<string | null>(null)
  const [joinStatus, setJoinStatus]       = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [joinMessage, setJoinMessage]     = useState('')
  const router = useRouter()

  async function loadRegistrations() {
    const { data, error } = await fetch('/api/participant/registrations').then(r => r.json())
    if (error === 'Unauthorised') { router.replace('/login'); return }
    if (error) { setError(error); return }
    const regs = data ?? []
    setRegistrations(regs)
    const first = regs[0]
    if (first?.leader_name) setUserName(first.leader_name.split(' ')[0])
  }

  useEffect(() => {
    Promise.all([
      loadRegistrations(),
      fetch('/api/events').then(r => r.json()).then(({ data }) => setActiveEvents(data ?? [])),
    ]).finally(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  async function generateInvite(registrationId: string) {
    const { data, error } = await fetch('/api/participant/team/invite', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ registration_id: registrationId }),
    }).then(r => r.json())
    if (error) alert(error)
    else setInviteCodes(prev => ({ ...prev, [registrationId]: data.link }))
  }

  async function copyInvite(regId: string) {
    await navigator.clipboard.writeText(inviteCodes[regId])
    setCopied(regId)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleJoinTeam() {
    if (!joiningCode || !joinTarget) return
    setJoinStatus('loading')
    const email = registrations[0]?.leader_email ?? ''
    const { data, error } = await fetch('/api/participant/team/join', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code: joiningCode.toUpperCase(), full_name: userName || 'Participant', email }),
    }).then(r => r.json())
    if (error) { setJoinMessage(error); setJoinStatus('error') }
    else {
      setJoinMessage(data.message)
      setJoinStatus('success')
      setJoinTarget(null)
      setJoiningCode('')
      await loadRegistrations()
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-xs font-bold text-amber-500/70 tracking-widest uppercase">Loading...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center py-32"><p className="text-red-400">{error}</p></div>
  )

  const upcoming          = registrations.filter(r => !isPast(r.events?.starts_at))
  const past              = registrations.filter(r => isPast(r.events?.starts_at))
  const actionRequired    = upcoming.filter(r => !isRegistrationComplete(r))
  const upcomingComplete  = upcoming.filter(r => isRegistrationComplete(r))
  const registeredIds     = registrations.map(r => r.event_id)
  const availableEvents   = activeEvents.filter(e => !registeredIds.includes(e.id))
  const greeting          = getGreeting(userName || 'there')

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">

      {/* Greeting */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {greeting.icon}
            <h1 className="text-2xl font-semibold text-white tracking-tight">{greeting.text}!</h1>
          </div>
          <p className="text-slate-400 text-sm">Here's everything for your events.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 border border-white/10 rounded-full px-3 py-1.5 transition-colors shrink-0"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>

      {/* ── ACTION REQUIRED ──────────────────────────── */}
      {actionRequired.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={14} className="text-amber-400" />
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Action Required</h2>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold">
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
                <div key={r.id} className="bg-amber-500/5 border border-amber-500/25  p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">{r.events?.event_type}</span>
                        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Team
                        </span>
                      </div>
                      <h3 className="font-semibold text-white">{r.events?.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Team: <span className="text-slate-300 font-semibold">{r.team_name}</span></p>
                    </div>
                    {isLeader && (
                      <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                        Leader
                      </span>
                    )}
                  </div>

                  {/* Incomplete warning */}
                  <div className="bg-amber-500/10 border border-amber-500/20  px-4 py-3 mb-4 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-300">
                      Team needs <strong>{needed} more member{needed > 1 ? 's' : ''}</strong> to meet the minimum of {minSize}.
                      Registration is incomplete until the team is full.
                    </p>
                  </div>

                  {/* Members */}
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Users size={11} />
                      Members ({members.length}{maxSize ? `/${maxSize}` : ''} · min {minSize})
                    </p>
                    <div className="space-y-2">
                      {members.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
                          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                            {m.full_name?.[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {m.full_name}
                              {m.is_leader && <span className="ml-1.5 text-xs text-amber-400">Leader</span>}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{m.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leader — generate invite */}
                  {isLeader && (
                    <div className="border-t border-white/5 pt-4">
                      {inviteCodes[r.id] ? (
                        <div className="space-y-2">
                          <p className="text-xs text-slate-400">Share this invite link:</p>
                          <div className="bg-[#0a1629] border border-white/5  px-3 py-2 font-mono text-xs text-slate-300 break-all">
                            {inviteCodes[r.id]}
                          </div>
                          <button
                            onClick={() => copyInvite(r.id)}
                            className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 py-2  text-xs font-bold transition-colors"
                          >
                            {copied === r.id ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            {copied === r.id ? 'Copied!' : 'Copy Invite Link'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => generateInvite(r.id)}
                          className="w-full flex items-center justify-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 py-2.5  text-xs font-bold transition-colors"
                        >
                          <UserPlus size={12} />
                          Generate Invite Link for Team Members
                        </button>
                      )}
                    </div>
                  )}

                  {/* Non-leader — join with code */}
                  {!isLeader && (
                    <div className="border-t border-white/5 pt-4">
                      {joinTarget === r.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={joiningCode}
                            onChange={e => setJoiningCode(e.target.value.toUpperCase())}
                            placeholder="CINTEL-XXXX"
                            className="w-full bg-[#0a1629] border border-white/10  px-3 py-2 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />
                          {joinStatus === 'error' && <p className="text-red-400 text-xs">{joinMessage}</p>}
                          {joinStatus === 'success' && <p className="text-green-400 text-xs">{joinMessage}</p>}
                          <div className="flex gap-2">
                            <button
                              onClick={handleJoinTeam}
                              disabled={joinStatus === 'loading' || !joiningCode}
                              className="flex-1 bg-white text-slate-950 py-2  text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
                            >
                              {joinStatus === 'loading' ? 'Joining...' : 'Join Team'}
                            </button>
                            <button
                              onClick={() => { setJoinTarget(null); setJoiningCode(''); setJoinStatus('idle') }}
                              className="px-3 py-2 border border-white/10 text-slate-400  text-xs hover:bg-[#0a1629] transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setJoinTarget(r.id)}
                          className="w-full flex items-center justify-center gap-2 bg-[#0a1629] hover:bg-slate-700 text-slate-300 border border-white/10 py-2  text-xs font-bold transition-colors"
                        >
                          <Users size={12} />
                          Join with Invite Code
                        </button>
                      )}
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
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-widest">Upcoming</h2>
            <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold">
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
            <Zap size={13} className="text-amber-300" />
            <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest">Register Now</h2>
            <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full px-2 py-0.5 font-bold">
              {availableEvents.length}
            </span>
          </div>
          <div className="space-y-3">
            {availableEvents.map((e: any) => (
              <Link key={e.id} href={`/events/${e.slug}`}>
                <div className="bg-[#0a1629] border border-white/10  p-5 hover:border-amber-300/30 hover:bg-[#112240] transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">{e.event_type}</span>
                        {e.registration_mode === 'team' || e.registration_mode === 'both' ? (
                          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                            <Users size={9} /> Team
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                            Solo
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white group-hover:text-amber-200 transition-colors truncate">{e.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-500" />
                          {new Date(e.starts_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-500 group-hover:text-amber-300 transition-colors shrink-0 ml-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── PAST ─────────────────────────────────────── */}
      {past.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Past</h2>
            <span className="text-xs bg-[#0a1629] text-slate-500 border border-white/5 rounded-full px-2 py-0.5 font-bold">
              {past.length}
            </span>
          </div>
          <div className="space-y-3">
            {past.map(r => <EventCard key={r.id} reg={r} />)}
          </div>
        </section>
      )}

      {/* Empty */}
      {registrations.length === 0 && availableEvents.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-[#0a1629] border border-white/5  flex items-center justify-center mx-auto mb-4">
            <Ticket className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-white font-semibold text-lg">No events yet</p>
          <p className="text-slate-400 text-sm mt-2">Register for an upcoming event to see it here.</p>
        </div>
      )}
    </div>
  )
}

// ── Event Card with Solo/Team color coding ────────────────
function EventCard({ reg }: { reg: any }) {
  const event      = reg.events
  const isTeam     = reg.registration_type === 'team'
  const attended   = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const hasCert    = Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id

  // Color scheme: blue for team, purple for solo
  const accent = isTeam
    ? { border: 'border-amber-500/20',  bg: 'bg-amber-500/5',  text: 'text-amber-300',   badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300'   }
    : { border: 'border-amber-500/20', bg: 'bg-amber-500/5', text: 'text-amber-300', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-300' }

  const statusBadge = () => {
    if (reg.status === 'waitlisted')  return <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Waitlisted</span>
    if (reg.status === 'cancelled')   return <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">Cancelled</span>
    if (attended && hasCert)          return <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">🎓 Certificate</span>
    if (attended)                     return <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">✓ Attended</span>
    return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${accent.badge}`}>Confirmed</span>
  }

  return (
    <Link href={`/participant/portal/events/${reg.id}`}>
      <div className={`border  p-5 hover:opacity-90 transition-all cursor-pointer group ${accent.border} ${accent.bg}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-widest ${accent.text}`}>{event?.event_type}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${accent.badge}`}>
                {isTeam ? <><Users size={9} /> Team</> : 'Solo'}
              </span>
            </div>
            <h3 className="font-semibold text-white group-hover:opacity-80 transition-opacity truncate">{event?.title}</h3>
          </div>
          {statusBadge()}
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          {event?.starts_at && (
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-500" />
              {formatShortDate(event.starts_at)}
            </span>
          )}
          {event?.venue && (
            <span className="flex items-center gap-1 truncate max-w-[200px]">
              📍 {event.venue}
            </span>
          )}
          {isTeam && reg.team_name && (
            <span className="flex items-center gap-1">
              <Users size={11} className="text-slate-500" />
              {reg.team_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}