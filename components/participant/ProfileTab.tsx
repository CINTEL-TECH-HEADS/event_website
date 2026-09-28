'use client'

import { useEffect, useState } from 'react'
import { CircleUser, Pencil, Check } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import type { ParticipantProfile } from '@/types'

const YEARS = ['1st', '2nd', '3rd', '4th', 'Alumni']
const BATCHES = ['2021-2025', '2022-2026', '2023-2027', '2024-2028', '2025-2029', 'Alumni']

type FormProfile = Omit<ParticipantProfile, 'id' | 'updated_at' | 'affiliation'> & {
  affiliation: '' | 'srm' | 'external'
}
type Field = { key: keyof FormProfile; label: string; placeholder?: string; required?: boolean; hint?: string }

// SRM IST students identify with their registration number and @srmist.edu.in
// email; students from other colleges with their college name and phone.
const SRM_FIELDS: Field[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'register_number', label: 'Register Number', required: true, placeholder: 'RA2411…', hint: 'Starts with RA followed by digits.' },
  { key: 'phone', label: 'Phone' },
  { key: 'college_email', label: 'College Email', required: true, placeholder: 'name@srmist.edu.in', hint: 'Must be your @srmist.edu.in address.' },
  { key: 'personal_email', label: 'Personal Email' },
  { key: 'fa_name', label: 'Faculty Advisor (FA)' },
  { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
]
const EXTERNAL_FIELDS: Field[] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'college_name', label: 'College', required: true, placeholder: 'Your college or university', hint: 'The college you study at.' },
  { key: 'phone', label: 'Phone', required: true, placeholder: '10-digit mobile number', hint: 'So organizers can reach you about the event.' },
  { key: 'personal_email', label: 'Email' },
  { key: 'department', label: 'Department', placeholder: 'e.g. CSE' },
]

const COLLEGE_EMAIL_RE = /@srmist\.edu\.in$/i
const REGISTER_NUMBER_RE = /^RA\d+$/i

const empty: FormProfile = {
  affiliation: '', college_name: '',
  full_name: '', register_number: '', phone: '', college_email: '',
  personal_email: '', year_of_study: '', batch: '', section: '', fa_name: '',
  department: '', skills: '', interests: '', linkedin_url: '', github_url: '',
}

const AFFILIATIONS = [
  ['srm', 'SRM IST student', 'Register number and @srmist.edu.in email'],
  ['external', 'From another college', 'College name and phone'],
] as const

export function ProfileTab({
  required = false,
  onSaved,
}: {
  required?: boolean
  onSaved?: (profile: any, complete: boolean) => void
} = {}) {
  const [form, setForm] = useState<FormProfile>(empty)
  const [exists, setExists] = useState(false)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [editing, setEditing] = useState(required)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const { data } = await fetch('/api/participant/profile').then((r) => r.json())
        const p = data?.profile ?? {}
        const next = { ...empty, ...Object.fromEntries(Object.keys(empty).map((k) => [k, p[k] ?? ''])) } as FormProfile
        // Profiles from before the choice existed are SRM once they have SRM details.
        if (!next.affiliation && p.college_email) next.affiliation = 'srm'
        setForm(next)
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

  const external = form.affiliation === 'external'
  const fields = external ? EXTERNAL_FIELDS : SRM_FIELDS

  function validate(): string | null {
    if (required && !form.affiliation) {
      return 'Choose whether you are an SRM IST student or from another college.'
    }
    if (external) {
      if (required && (!(form.college_name ?? '').trim() || !(form.phone ?? '').trim())) {
        return 'College name and phone are required.'
      }
      return null
    }
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
        body: JSON.stringify({ ...form, affiliation: form.affiliation || null }),
      }).then((r) => r.json())
      if (error) { setMsg(error); return }
      setExists(true)
      setUpdatedAt(data?.profile?.updated_at ?? new Date().toISOString())
      setEditing(false)
      setMsg('Profile saved.')
      onSaved?.(data?.profile, !!data?.complete)
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
  const labelCls = 'mb-1.5 block text-xs font-bold uppercase tracking-widest text-foreground-soft'

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

      {/* SRM IST student, or from another college */}
      {editing ? (
        <fieldset className="mb-6">
          <legend className={labelCls}>
            You are<span className="ml-1 text-brand">*</span>
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {AFFILIATIONS.map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                aria-pressed={form.affiliation === value}
                onClick={() => set('affiliation', value)}
                className={`rounded-2xl border-2 border-border p-4 text-left transition duration-200 ${
                  form.affiliation === value ? 'bg-warning shadow-sm' : 'bg-panel-muted hover:bg-panel'
                }`}
              >
                <span className="block text-sm font-black uppercase tracking-wide text-foreground">{label}</span>
                <span className="mt-1 block text-xs font-medium text-foreground-soft">{hint}</span>
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        form.affiliation && (
          <p className="mb-6 text-sm font-bold text-foreground">
            {external ? `Student from ${form.college_name || 'another college'}` : 'SRM IST student'}
          </p>
        )
      )}

      {!form.affiliation && editing ? (
        <p className="text-sm font-medium text-foreground-soft">Choose one to see the details we need.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ key, label, placeholder, required: req, hint }) => (
              <div key={key}>
                <label className={labelCls}>
                  {label}{req && <span className="ml-1 text-brand">*</span>}
                </label>
                <input
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  disabled={!editing}
                  placeholder={editing ? placeholder ?? '—' : ''}
                  className={inputCls}
                />
                {req && editing && hint && <p className="mt-1 text-[11px] font-medium text-foreground-soft">{hint}</p>}
              </div>
            ))}

            <div>
              <label className={labelCls}>Year of Study</label>
              <select value={form.year_of_study ?? ''} onChange={(e) => set('year_of_study', e.target.value)} disabled={!editing} className="app-select disabled:opacity-70">
                <option value="">—</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {!external && (
              <>
                <div>
                  <label className={labelCls}>Batch</label>
                  <select value={form.batch ?? ''} onChange={(e) => set('batch', e.target.value)} disabled={!editing} className="app-select disabled:opacity-70">
                    <option value="">—</option>
                    {BATCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Section</label>
                  <input
                    value={form.section ?? ''}
                    onChange={(e) => set('section', e.target.value)}
                    disabled={!editing}
                    placeholder={editing ? 'e.g. AH1' : ''}
                    className={inputCls}
                  />
                </div>
              </>
            )}
          </div>
        </>
      )}

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
