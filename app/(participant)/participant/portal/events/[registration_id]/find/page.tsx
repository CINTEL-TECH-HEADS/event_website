'use client'

// Matchmaking view for a team event (two-sided): the owner of an open, incomplete
// team registration can request to join other teams, invite individual seekers,
// and accept/decline incoming invites and requests. A team forms on acceptance.

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, UserPlus, Check, X, Clock, Search } from 'lucide-react'

export default function FindTeamPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const router = useRouter()
  const [reg, setReg]         = useState<any>(null)
  const [teams, setTeams]     = useState<any[]>([])
  const [seekers, setSeekers] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy]       = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')

  const load = useCallback(async () => {
    const { data: r } = await fetch(`/api/participant/registrations/${registration_id}`).then(x => x.json())
    if (!r || !r.is_leader) { router.replace(`/participant/portal/events/${registration_id}`); return }
    setReg(r)
    const eventId = r.event_id ?? r.events?.id
    const [t, s, iv] = await Promise.all([
      fetch(`/api/events/${eventId}/teams`).then(x => x.json()).then(j => j.data ?? []),
      fetch(`/api/events/${eventId}/seekers`).then(x => x.json()).then(j => j.data ?? []),
      fetch(`/api/participant/team/invites`).then(x => x.json()).then(j => j.data ?? []),
    ])
    setTeams(t); setSeekers(s); setInvites(iv)
    setLoading(false)
  }, [registration_id, router])

  useEffect(() => { load() }, [load])

  async function act(key: string, url: string, body: any) {
    setBusy(key); setError(null)
    const { data, error } = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).then(r => r.json())
    setBusy(null)
    if (error) { setError(error); return }
    if (data?.registration_id && url.endsWith('/respond')) {
      router.push(`/participant/portal/events/${data.registration_id}`); return
    }
    await load()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-border border-t-brand rounded-full animate-spin" />
    </div>
  )

  const maxSize = reg?.events?.max_team_size ?? null
  const size    = reg?.members?.length ?? 0
  const isFull  = maxSize != null && size >= maxSize
  const mine    = registration_id
  const incoming = invites.filter((i: any) => i.incoming && (i.team_registration_id === mine || i.direction === 'invite'))
  const outgoing = invites.filter((i: any) => !i.incoming && (i.team_registration_id === mine || i.direction === 'request'))

  // Client-side search across teams (name + member first names) and seekers
  // (name + skills + interests + department + year).
  const q = search.trim().toLowerCase()
  const matchTeam = (t: any) =>
    !q || [t.team_name, ...(t.members ?? [])].filter(Boolean).join(' ').toLowerCase().includes(q)
  const matchSeeker = (s: any) =>
    !q || [s.name, s.skills, s.interests, s.department, s.year_of_study].filter(Boolean).join(' ').toLowerCase().includes(q)
  const filteredTeams = teams.filter(matchTeam)
  const filteredSeekers = seekers.filter(matchSeeker)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:px-6">
      <Link href={`/participant/portal/events/${registration_id}`} className="mb-6 inline-flex items-center gap-2 font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft transition-colors hover:text-foreground">
        <ArrowLeft size={14} /> Registration
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground">Find a team</h1>
        <p className="text-foreground-soft text-sm mt-1 font-medium">
          {reg?.events?.title} · {size}{maxSize ? `/${maxSize}` : ''} members
        </p>
      </div>

      {error && <p className="mb-4 rounded-xl border-2 border-border bg-danger/15 px-4 py-2 text-sm font-medium text-danger">{error}</p>}

      {!isFull && (
        <div className="relative mb-6">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, skill, department or year…"
            className="app-input w-full !pl-9 text-sm"
          />
        </div>
      )}

      {isFull && (
        <div className="mb-6 rounded-xl border-2 border-border bg-success/15 px-4 py-3 text-sm font-medium text-foreground">
          Your team is complete. Matchmaking is closed for this team.
        </div>
      )}

      {/* Incoming — needs your response */}
      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand mb-3">Awaiting your response</h2>
          <div className="space-y-2">
            {incoming.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between rounded-2xl border-2 border-border bg-panel px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-foreground">
                  {i.direction === 'invite'
                    ? <>Invite to join <strong>{i.team_name}</strong></>
                    : <><strong>{i.seeker_name}</strong> wants to join your team</>}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => act('r'+i.id, '/api/participant/team/invite/respond', { invite_id: i.id, action: 'accept' })} disabled={busy==='r'+i.id}
                    className="app-button-primary !px-3 !py-1.5 !text-xs disabled:opacity-50"><Check size={12}/>Accept</button>
                  <button onClick={() => act('d'+i.id, '/api/participant/team/invite/respond', { invite_id: i.id, action: 'decline' })} disabled={busy==='d'+i.id}
                    className="app-button-secondary !bg-panel-muted !text-foreground !px-3 !py-1.5 !text-xs disabled:opacity-50"><X size={12}/>Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!isFull && (
        <>
          {/* Teams you can request to join */}
          <section className="mb-8">
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand mb-3">Teams looking for members</h2>
            {filteredTeams.length === 0 ? (
              <p className="rounded-2xl border-2 border-border bg-panel-muted px-4 py-5 text-center text-sm font-medium text-foreground-soft">
                {teams.length === 0 ? 'No open teams right now.' : 'No teams match your search.'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTeams.map((t: any) => (
                  <div key={t.registration_id} className="flex items-start justify-between gap-3 rounded-2xl border-2 border-border bg-panel px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{t.team_name ?? 'Team'}</p>
                      <p className="text-xs font-medium text-foreground-soft flex items-center gap-1"><Users size={11}/>{t.size}{t.max_team_size ? `/${t.max_team_size}` : ''} members</p>
                      {t.members?.length > 0 && (
                        <p className="mt-1 truncate text-xs font-medium text-foreground-soft">{t.members.join(', ')}</p>
                      )}
                    </div>
                    <button onClick={() => act('req'+t.registration_id, '/api/participant/team/request', { team_registration_id: t.registration_id })} disabled={busy==='req'+t.registration_id}
                      className="app-button-secondary shrink-0 !px-3 !py-1.5 !text-xs disabled:opacity-50">Request</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Individuals looking — you can invite */}
          <section className="mb-8">
            <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-brand mb-3">Participants looking for a team</h2>
            {filteredSeekers.length === 0 ? (
              <p className="rounded-2xl border-2 border-border bg-panel-muted px-4 py-5 text-center text-sm font-medium text-foreground-soft">
                {seekers.length === 0 ? 'No one looking right now.' : 'No participants match your search.'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSeekers.map((s: any) => (
                  <div key={s.registration_id} className="rounded-2xl border-2 border-border bg-panel px-4 py-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        {(s.department || s.year_of_study) && (
                          <p className="text-xs font-medium text-foreground-soft mt-0.5">
                            {[s.department, s.year_of_study].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button onClick={() => act('inv'+s.participant_id, '/api/participant/team/invite', { team_registration_id: mine, seeker_participant_id: s.participant_id })} disabled={busy==='inv'+s.participant_id}
                        className="app-button-secondary !bg-panel-muted !text-foreground !px-3 !py-1.5 !text-xs disabled:opacity-50 shrink-0"><UserPlus size={12}/>Invite</button>
                    </div>
                    {s.skills && <p className="mt-2 text-xs font-medium text-foreground"><span className="text-foreground-soft">Skills:</span> {s.skills}</p>}
                    {s.interests && <p className="mt-1 text-xs font-medium text-foreground"><span className="text-foreground-soft">Interests:</span> {s.interests}</p>}
                    {(s.linkedin_url || s.github_url || s.email) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold">
                        {s.email && <a href={`mailto:${s.email}`} className="text-brand hover:text-foreground">Email</a>}
                        {s.linkedin_url && <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-foreground">LinkedIn</a>}
                        {s.github_url && <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-brand hover:text-foreground">GitHub</a>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* Outgoing pending */}
      {outgoing.length > 0 && (
        <section>
          <h2 className="font-tech text-[11px] font-bold uppercase tracking-widest text-foreground-soft mb-3">Pending (waiting on them)</h2>
          <div className="space-y-2">
            {outgoing.map((i: any) => (
              <div key={i.id} className="flex items-center gap-2 rounded-2xl border-2 border-border bg-panel-muted px-4 py-2.5 text-sm font-medium text-foreground-soft">
                <Clock size={13} />
                {i.direction === 'invite'
                  ? <>Invited <strong className="text-foreground">{i.seeker_name}</strong></>
                  : <>Requested to join <strong className="text-foreground">{i.team_name}</strong></>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
