'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Link2, Copy, Check, Trash2, UserPlus } from 'lucide-react'

export default function TeamPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const router = useRouter()
  const [reg, setReg]               = useState<any>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]         = useState(false)

  async function loadReg() {
    const { data } = await fetch(`/api/participant/registrations/${registration_id}`).then(r => r.json())
    if (!data?.is_leader) {
      router.replace(`/participant/portal/events/${registration_id}`)
      return
    }
    setReg(data)
    setLoading(false)
  }

  useEffect(() => { loadReg() }, [registration_id])

  async function generateInvite() {
    setGenerating(true)
    const res = await fetch('/api/participant/team/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registration_id }),
    })
    const { data, error } = await res.json()
    if (error) alert(error)
    else setInviteData(data)
    setGenerating(false)
  }

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

  async function copyLink() {
    await navigator.clipboard.writeText(inviteData.link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function revokeCode() {
    await fetch('/api/participant/team/invite/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: inviteData.code }),
    })
    setInviteData(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  const maxSize     = reg?.events?.max_team_size
  const memberCount = reg?.members?.length ?? 0

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href={`/participant/portal/events/${registration_id}`} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={14} /> Back
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Team</h1>
        <p className="text-slate-400 text-sm mt-1">{reg?.team_name} · {reg?.events?.title}</p>
      </div>

      {/* Members */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-white flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            Members
          </h2>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 border border-white/5 px-2 py-0.5 rounded-full">
            {memberCount}{maxSize ? `/${maxSize}` : ''}
          </span>
        </div>

        <div className="space-y-3">
          {reg?.members?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-bold text-white">
                  {m.full_name}
                  {m.is_leader && <span className="ml-2 text-xs text-amber-400 font-bold">Leader</span>}
                </p>
                <p className="text-xs text-slate-400">{m.email}</p>
              </div>
              {!m.is_leader && (
                <button
                  onClick={() => removeMember(m.id, m.full_name)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite */}
      <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={16} className="text-blue-400" />
          <h2 className="font-black text-white">Invite Member</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Generate a link and share it. They fill in their details and join instantly. Expires in 48 hours.
        </p>

        {!inviteData ? (
          <button
            onClick={generateInvite}
            disabled={generating || (maxSize && memberCount >= maxSize)}
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-950 py-2.5 rounded-xl font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            {generating ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-slate-900 rounded-full animate-spin" />
            ) : (
              <Link2 size={16} className="text-amber-500" />
            )}
            {generating ? 'Generating...' : 'Generate Invite Link'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-800 border border-white/5 rounded-xl p-3 font-mono text-xs text-slate-300 break-all">
              {inviteData.link}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center gap-2 bg-white text-slate-950 py-2 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} className="text-amber-500" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button
                onClick={revokeCode}
                className="px-3 py-2 border border-red-500/20 text-red-400 rounded-xl text-sm hover:bg-red-500/10 transition-colors"
              >
                Revoke
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Expires: {new Date(inviteData.expires_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}