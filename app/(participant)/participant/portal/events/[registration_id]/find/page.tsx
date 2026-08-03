'use client'

// Matchmaking view for a team event (two-sided): the owner of an open, incomplete
// team registration can request to join other teams, invite individual seekers,
// and accept/decline incoming invites and requests. A team forms on acceptance.

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, UserPlus, Check, X, Clock } from 'lucide-react'

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
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  const maxSize = reg?.events?.max_team_size ?? null
  const size    = reg?.members?.length ?? 0
  const isFull  = maxSize != null && size >= maxSize
  const mine    = registration_id
  const incoming = invites.filter((i: any) => i.incoming && (i.team_registration_id === mine || i.direction === 'invite'))
  const outgoing = invites.filter((i: any) => !i.incoming && (i.team_registration_id === mine || i.direction === 'request'))

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/participant/portal/events/${registration_id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Find a team</h1>
        <p className="text-slate-400 text-sm mt-1">
          {reg?.events?.title} · {size}{maxSize ? `/${maxSize}` : ''} members
        </p>
      </div>

      {error && <p className="mb-4 rounded border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</p>}

      {isFull && (
        <div className="mb-6 rounded border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Your team is complete. Matchmaking is closed for this team.
        </div>
      )}

      {/* Incoming — needs your response */}
      {incoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3">Awaiting your response</h2>
          <div className="space-y-2">
            {incoming.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between bg-amber-500/5 border border-amber-500/20 px-4 py-3">
                <p className="text-sm text-white">
                  {i.direction === 'invite'
                    ? <>Invite to join <strong>{i.team_name}</strong></>
                    : <><strong>{i.seeker_name}</strong> wants to join your team</>}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => act('r'+i.id, '/api/participant/team/invite/respond', { invite_id: i.id, action: 'accept' })} disabled={busy==='r'+i.id}
                    className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-3 py-1.5 text-xs font-bold hover:bg-amber-300 disabled:opacity-50"><Check size={12}/>Accept</button>
                  <button onClick={() => act('d'+i.id, '/api/participant/team/invite/respond', { invite_id: i.id, action: 'decline' })} disabled={busy==='d'+i.id}
                    className="inline-flex items-center gap-1 border border-white/10 text-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-white/5 disabled:opacity-50"><X size={12}/>Decline</button>
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
            <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3">Teams looking for members</h2>
            {teams.length === 0 ? (
              <p className="rounded border border-white/10 bg-[#0a1629] px-4 py-5 text-center text-sm text-slate-400">No open teams right now.</p>
            ) : (
              <div className="space-y-2">
                {teams.map((t: any) => (
                  <div key={t.registration_id} className="flex items-center justify-between bg-[#0a1629] border border-white/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{t.team_name ?? 'Team'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1"><Users size={11}/>{t.size}{t.max_team_size ? `/${t.max_team_size}` : ''}</p>
                    </div>
                    <button onClick={() => act('req'+t.registration_id, '/api/participant/team/request', { team_registration_id: t.registration_id })} disabled={busy==='req'+t.registration_id}
                      className="border border-amber-300/35 bg-amber-300/10 text-amber-200 px-3 py-1.5 text-xs font-bold hover:bg-amber-300/20 disabled:opacity-50">Request</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Individuals looking — you can invite */}
          <section className="mb-8">
            <h2 className="text-xs font-bold text-amber-300 uppercase tracking-widest mb-3">Participants looking for a team</h2>
            {seekers.length === 0 ? (
              <p className="rounded border border-white/10 bg-[#0a1629] px-4 py-5 text-center text-sm text-slate-400">No one looking right now.</p>
            ) : (
              <div className="space-y-3">
                {seekers.map((s: any) => (
                  <div key={s.registration_id} className="bg-[#0a1629] border border-white/10 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{s.name}</p>
                        {(s.department || s.year_of_study) && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {[s.department, s.year_of_study].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <button onClick={() => act('inv'+s.participant_id, '/api/participant/team/invite', { team_registration_id: mine, seeker_participant_id: s.participant_id })} disabled={busy==='inv'+s.participant_id}
                        className="inline-flex items-center gap-1 border border-white/10 text-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-white/5 disabled:opacity-50 shrink-0"><UserPlus size={12}/>Invite</button>
                    </div>
                    {s.skills && <p className="mt-2 text-xs text-slate-300"><span className="text-slate-500">Skills:</span> {s.skills}</p>}
                    {s.interests && <p className="mt-1 text-xs text-slate-300"><span className="text-slate-500">Interests:</span> {s.interests}</p>}
                    {(s.linkedin_url || s.github_url || s.email) && (
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {s.email && <a href={`mailto:${s.email}`} className="text-amber-300 hover:text-amber-200">Email</a>}
                        {s.linkedin_url && <a href={s.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200">LinkedIn</a>}
                        {s.github_url && <a href={s.github_url} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:text-amber-200">GitHub</a>}
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
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Pending (waiting on them)</h2>
          <div className="space-y-2">
            {outgoing.map((i: any) => (
              <div key={i.id} className="flex items-center gap-2 bg-[#0a1629] border border-white/5 px-4 py-2.5 text-sm text-slate-400">
                <Clock size={13} className="text-slate-500" />
                {i.direction === 'invite'
                  ? <>Invited <strong className="text-slate-300">{i.seeker_name}</strong></>
                  : <>Requested to join <strong className="text-slate-300">{i.team_name}</strong></>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
