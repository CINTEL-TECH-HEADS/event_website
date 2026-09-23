'use client'

import { useEffect, useState } from 'react'
import { CircleUser, Pencil, Check } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { ParticipantProfile } from '@/types'

const YEARS = ['1st', '2nd', '3rd', '4th', 'Alumni']
const BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', 'Alumni']

type FormProfile = Omit<ParticipantProfile, 'id' | 'updated_at'>

const TEXT_FIELDS: { key: keyof FormProfile; label: string; placeholder?: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'register_number', label: 'Register Number' },
  { key: 'phone', label: 'Phone' },
  { key: 'college_email', label: 'College Email' },
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'fa_name', label: 'Faculty Advisor (FA)' },
  { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
]

// Networking fields shown in Find Teammates.
const NETWORK_FIELDS: { key: keyof FormProfile; label: string; placeholder?: string }[] = [
  { key: 'skills', label: 'Skills', placeholder: 'e.g. AI/ML, Web Dev, UI/UX' },
  { key: 'interests', label: 'Interests', placeholder: 'e.g. Hackathons, Robotics' },
  { key: 'linkedin_url', label: 'LinkedIn (optional)', placeholder: 'https://linkedin.com/in/…' },
  { key: 'github_url', label: 'GitHub (optional)', placeholder: 'https://github.com/…' },
]

const empty: FormProfile = {
  full_name: '', register_number: '', phone: '', college_email: '',
  personal_email: '', year_of_study: '', batch: '', section: '', fa_name: '',
  department: '', skills: '', interests: '', linkedin_url: '', github_url: '',
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
    return <div className="py-16 text-center text-sm font-bold uppercase tracking-widest text-foreground-soft">Loading your profile…</div>
  }

  const inputCls = 'app-input disabled:opacity-70'

  return (
    <div className="rounded-poster border-4 border-border bg-panel p-6 shadow-lg sm:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6 border-b-2 border-border pb-4">
        <div className="flex items-center gap-2">
          <CircleUser size={18} className="text-brand" />
          <h2 className="font-display text-sm uppercase tracking-widest text-foreground">My Profile</h2>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand hover:text-foreground"
          >
            <Pencil size={13} /> Edit
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft">{label}</label>
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
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft">Year of Study</label>
          <select value={form.year_of_study ?? ''} onChange={(e) => set('year_of_study', e.target.value)} disabled={!editing} className="app-select disabled:opacity-70">
            <option value="">—</option>
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft">Batch</label>
          <select value={form.batch ?? ''} onChange={(e) => set('batch', e.target.value)} disabled={!editing} className="app-select disabled:opacity-70">
            <option value="">—</option>
            {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft">Section</label>
          <input
            value={form.section ?? ''}
            onChange={(e) => set('section', e.target.value)}
            disabled={!editing}
            placeholder={editing ? 'e.g. AH1' : ''}
            className={inputCls}
          />
        </div>
      </div>

      {/* Networking — shown to teams in Find Teammates */}
      <div className="mt-6 border-t-2 border-border pt-6">
        <p className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
          <span aria-hidden className="h-2 w-2 rotate-45 bg-accent" />
          Networking (Find Teammates)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {NETWORK_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft">{label}</label>
              <input
                value={(form[key] as string) ?? ''}
                onChange={(e) => set(key, e.target.value)}
                disabled={!editing}
                placeholder={editing ? placeholder ?? '—' : ''}
                className={inputCls}
              />
            </div>
          ))}
        </div>
      </div>

      {msg && (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary-yellow px-4 py-2 text-sm font-bold text-[#121212]">
          <Check size={14} /> {msg}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-xs font-medium text-foreground-soft">
          {exists && updatedAt ? `Last updated: ${formatShortDate(updatedAt)}` : 'Not saved yet'}
        </p>
        {editing && (
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="app-button-primary disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  )
}
