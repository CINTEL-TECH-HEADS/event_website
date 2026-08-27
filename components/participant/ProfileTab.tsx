'use client'

import { useEffect, useState } from 'react'
import { CircleUser, Pencil, Check } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { ParticipantProfile } from '@/types'

const YEARS = ['1st', '2nd', '3rd', '4th', 'Alumni']
const BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', 'Alumni']

type FormProfile = Omit<ParticipantProfile, 'id' | 'updated_at'>

const TEXT_FIELDS: { key: keyof FormProfile; label: string; placeholder?: string; required?: boolean; hint?: string }[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'register_number', label: 'Register Number', required: true, placeholder: 'RA2411…', hint: 'Starts with RA followed by digits.' },
  { key: 'phone', label: 'Phone' },
  { key: 'college_email', label: 'College Email', required: true, placeholder: 'name@srmist.edu.in', hint: 'Must be your @srmist.edu.in address.' },
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'fa_name', label: 'Faculty Advisor (FA)' },
  { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
]

const COLLEGE_EMAIL_RE = /@srmist\.edu\.in$/i
const REGISTER_NUMBER_RE = /^RA\d+$/i

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

export function ProfileTab({
  required = false,
  onSaved,
}: {
  required?: boolean
  onSaved?: (profile: any) => void
} = {}) {
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

  function validate(): string | null {
    const college = (form.college_email ?? '').trim()
    const regNo = (form.register_number ?? '').trim()
    if (required && (!college || !regNo)) {
      return 'College email and registration number are required.'
    }
    if (college && !COLLEGE_EMAIL_RE.test(college)) {
      return 'College email must be a valid @srmist.edu.in address.'
    }
    if (regNo && !REGISTER_NUMBER_RE.test(regNo)) {
      return 'Registration number must start with "RA" followed by digits.'
    }
    return null
  }

  async function save() {
    const problem = validate()
    if (problem) { setMsg(problem); return }
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
      onSaved?.(data?.profile)
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
        {TEXT_FIELDS.map(({ key, label, placeholder, required: req, hint }) => (
          <div key={key}>
            <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">
              {label}{req && <span className="ml-1 text-amber-300">*</span>}
            </label>
            <input
              value={(form[key] as string) ?? ''}
              onChange={(e) => set(key, e.target.value)}
              disabled={!editing}
              placeholder={editing ? placeholder ?? '—' : ''}
              className={inputCls}
            />
            {req && editing && hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
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
      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-amber-300">
          Networking (Find Teammates)
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {NETWORK_FIELDS.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-bold text-slate-400 tracking-wide">{label}</label>
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
