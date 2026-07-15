'use client'

import { useEffect, useState } from 'react'
import { CircleUser, Pencil, Check } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { ParticipantProfile } from '@/types'

const YEARS = ['1st', '2nd', '3rd', '4th', 'Alumni']
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', 'Alumni']

type FormProfile = Omit<ParticipantProfile, 'id' | 'updated_at'>

const TEXT_FIELDS: { key: keyof FormProfile; label: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'register_number', label: 'Register Number' },
  { key: 'phone', label: 'Phone' },
  { key: 'college_email', label: 'College Email' },
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'fa_name', label: 'Faculty Advisor (FA)' },
]

const empty: FormProfile = {
  full_name: '', register_number: '', phone: '', college_email: '',
  personal_email: '', year_of_study: '', batch: '', section: '', fa_name: '',
}

export function ProfileTab() {
  const [form, setForm] = useState<FormProfile>(empty)
  const [exists, setExists] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await fetch('/api/participant/profile').then((r) => r.json())
        const p = data?.profile ?? {}
        setForm({ ...empty, ...Object.fromEntries(Object.keys(empty).map((k) => [k, p[k] ?? ''])) } as FormProfile)
        setExists(!!data?.exists)
        setUpdatedAt(p?.updated_at ?? null)
        if (!data?.exists) setEditing(true)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function set<K extends keyof FormProfile>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setMsg(null)
  }

  async function save() {
    setSaving(true)
    setMsg(null)
    try {
      const { data, error } = await fetch('/api/participant/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      }).then((r) => r.json())
      if (error) { setMsg(error); return }
      setExists(true)
      setUpdatedAt(data?.profile?.updated_at ?? new Date().toISOString())
      setEditing(false)
      setMsg('Profile saved.')
    } catch {
      setMsg('Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-16 text-center text-sm text-slate-400">Loading your profile…</div>
  }

  const inputCls =
    'w-full bg-[#0a1629] border border-white/10 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/60 focus:ring-1 focus:ring-amber-300/40 transition disabled:opacity-70'

  return (
    <div className="bg-[#0a1629] border border-white/10 p-6 sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CircleUser size={18} className="text-amber-300" />
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-300">My Profile</h2>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200"
          >
            <Pencil size={13} /> Edit
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">{label}</label>
            <input
              value={(form[key] as string) ?? ''}
              onChange={(e) => set(key, e.target.value)}
              disabled={!editing}
              placeholder={editing ? '—' : ''}
              className={inputCls}
            />
          </div>
        ))}

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">Year of Study</label>
          <select value={form.year_of_study ?? ''} onChange={(e) => set('year_of_study', e.target.value)} disabled={!editing} className={inputCls}>
            <option value="">—</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">Batch</label>
          <select value={form.batch ?? ''} onChange={(e) => set('batch', e.target.value)} disabled={!editing} className={inputCls}>
            <option value="">—</option>
            {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">Section</label>
          <select value={form.section ?? ''} onChange={(e) => set('section', e.target.value)} disabled={!editing} className={inputCls}>
            <option value="">—</option>
            {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {msg && (
        <div className="mt-5 inline-flex items-center gap-2 border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-sm text-amber-200">
          <Check size={14} /> {msg}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {exists && updatedAt ? `Last updated: ${formatShortDate(updatedAt)}` : 'Not saved yet'}
        </p>
        {editing && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="public-force-white border border-amber-300/35 bg-amber-300 hover:bg-amber-200 text-slate-950 font-semibold uppercase tracking-[0.14em] px-5 py-2.5 text-sm transition disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}
