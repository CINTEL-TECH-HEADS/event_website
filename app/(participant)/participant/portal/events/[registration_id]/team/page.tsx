'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Copy, Check, Trash2, KeyRound, Lock, Unlock, Pencil, IndianRupee, Clock, Phone } from 'lucide-react'

export default function TeamPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const router = useRouter()
  const [reg, setReg]         = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)
  const [editing, setEditing] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [busy, setBusy]       = useState(false)

  async function loadReg() {
    const { data } = await fetch(`/api/participant/registrations/${registration_id}`).then(r => r.json())
    if (!data?.is_leader) {
      router.replace(`/participant/portal/events/${registration_id}`)
      return
    }
    setReg(data)
    setNameDraft(data.team_name ?? '')
    setLoading(false)
  }

  useEffect(() => { loadReg() }, [registration_id])

  async function removeMember(member_id: string, name: string) {
    if (!confirm(`Remove ${name} from the team?`)) return
    const { error } = await fetch('/api/participant/team/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ member_id, registration_id }),
    }).then(r => r.json())
    if (error) alert(error)
    else loadReg()
  }

  async function patchTeam(update: Record<string, unknown>) {
    setBusy(true)
    const { error } = await fetch(`/api/participant/team/${registration_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    }).then(r => r.json())
    setBusy(false)
    if (error) { alert(error); return false }
    await loadReg()
    return true
  }

  async function copyCode() {
    await navigator.clipboard.writeText(reg.group_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  const maxSize     = reg?.events?.max_team_size
  const memberCount = reg?.members?.length ?? 0
  const isFull      = maxSize && memberCount >= maxSize

  const fee         = reg?.events?.fee ?? 0
  const minSize     = reg?.events?.min_team_size ?? 1
  const payStatus   = reg?.payment_status ?? 'not_required'
  const isPaid      = payStatus === 'paid'
  const isPaidEvent = fee > 0
  const locked      = isPaid
  const canPay      = isPaidEvent && !isPaid && memberCount >= minSize
  const confirmed   = reg?.status === 'confirmed' && (isPaid || !isPaidEvent)

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/participant/portal/events/${registration_id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                className="bg-[#0a1629] border border-white/10 px-3 py-1.5 text-lg font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                disabled={busy}
                onClick={async () => { if (await patchTeam({ team_name: nameDraft })) setEditing(false) }}
                className="text-xs font-bold bg-amber-400 text-slate-950 px-3 py-1.5 hover:bg-amber-300 disabled:opacity-50"
              >
                Save
              </button>
              <button onClick={() => { setEditing(false); setNameDraft(reg.team_name ?? '') }} className="text-xs text-slate-400 px-2 py-1.5">Cancel</button>
            </div>
          ) : (
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
              {reg?.team_name}
              {!locked && (
                <button onClick={() => setEditing(true)} className="text-slate-500 hover:text-amber-300" title="Rename team">
                  <Pencil size={15} />
                </button>
              )}
            </h1>
          )}
          <p className="text-slate-400 text-sm mt-1">{reg?.events?.title}</p>
        </div>
      </div>

      {/* Group code */}
      <div className="bg-slate-900/80 border border-white/10 p-6 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={16} className="text-amber-300" />
          <h2 className="font-semibold text-white">Group code</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Share this code. Teammates sign in and enter it (or find your team in the Team Finder) to join.
        </p>
        <div className="flex gap-2">
          <div className="flex-1 bg-[#0a1629] border border-white/10 px-4 py-3 font-mono text-lg font-bold tracking-widest text-white">
            {reg?.group_code ?? '—'}
          </div>
          <button
            onClick={copyCode}
            className="flex items-center justify-center gap-2 bg-white text-slate-950 px-4 font-bold hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-amber-500" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Open / closed for the finder */}
        <button
          disabled={busy || locked}
          onClick={() => patchTeam({ is_open: !reg.is_open })}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-300 border border-white/10 px-4 py-2 hover:bg-white/5 disabled:opacity-50"
        >
          {reg?.is_open ? <Unlock size={14} className="text-emerald-400" /> : <Lock size={14} className="text-slate-400" />}
          {reg?.is_open ? 'Open — visible in Team Finder' : 'Closed — hidden from Team Finder'}
        </button>
      </div>

      {/* Payment (paid team events) */}
      {isPaidEvent && (
        <div className="bg-slate-900/80 border border-white/10 p-6 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={16} className="text-amber-300" />
            <h2 className="font-semibold text-white">Payment</h2>
          </div>
          {isPaid ? (
            <p className="flex items-center gap-2 text-sm text-emerald-300">
              <Check size={15} /> Paid — team confirmed. Your roster is now locked.
            </p>
          ) : payStatus === 'submitted' ? (
            <p className="flex items-center gap-2 text-sm text-amber-300">
              <Clock size={15} /> Payment under review by the organizer.
            </p>
          ) : canPay ? (
            <>
              <p className="mb-3 text-sm text-slate-400">
                Your team has enough members. Pay the ₹{fee} fee to confirm all {memberCount} members.
              </p>
              <Link
                href={`/participant/portal/events/${registration_id}/pay`}
                className="inline-flex items-center gap-2 bg-[#F5E62D] text-black px-5 py-2.5 text-sm font-bold hover:brightness-110"
              >
                <IndianRupee size={15} /> Pay ₹{fee}
                {payStatus === 'rejected' && ' again'}
              </Link>
              {payStatus === 'rejected' && (
                <p className="mt-2 text-xs text-red-300">Your previous payment was rejected — please pay and resubmit.</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Add at least <strong className="text-white">{minSize}</strong> members
              (currently {memberCount}) to unlock payment.
            </p>
          )}
        </div>
      )}

      {/* Members */}
      <div className="bg-slate-900/80 border border-white/10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            Members
          </h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${isFull ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 bg-slate-800 border-white/5'}`}>
            {memberCount}{maxSize ? `/${maxSize}` : ''}
          </span>
        </div>

        <div className="space-y-3">
          {reg?.members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">
                  {m.full_name}
                  {m.is_leader && <span className="ml-2 text-xs text-amber-400 font-bold">Creator</span>}
                </p>
                <p className="text-xs text-slate-400">{m.email}</p>
                {confirmed && m.phone && (
                  <a href={`tel:${m.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200">
                    <Phone size={11} /> {m.phone}
                  </a>
                )}
              </div>
              {!m.is_leader && !locked && (
                <button
                  onClick={() => removeMember(m.id, m.full_name)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Remove member"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        {confirmed && (
          <p className="mt-4 text-xs text-slate-500">
            Members&apos; contact numbers are shared here so your team can coordinate.
          </p>
        )}
      </div>
    </div>
  )
}
