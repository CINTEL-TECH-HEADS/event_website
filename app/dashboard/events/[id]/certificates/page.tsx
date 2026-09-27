// Certificates: manage named templates, assign attendees to a template, then
// generate + release. Unassigned attendees use the default template.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Award, Check, Loader2, Mail, Trash2, Upload } from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

type Template = { id: string; name: string; is_default: boolean }
type Attendee = {
  registration_id: string
  team_member_id: string | null
  name: string
  email: string
  template_id: string | null
}

export default function CertificatesPage() {
  const { id } = useParams<{ id: string }>()
  const fileRef = useRef<HTMLInputElement>(null)

  const [templates, setTemplates] = useState<Template[]>([])
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [templateName, setTemplateName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    const { data } = await fetch(`/api/certificates/templates?event_id=${id}`).then((r) => r.json())
    setTemplates(data ?? [])
  }, [id])

  const loadAttendees = useCallback(async () => {
    const { data: regs } = await fetch(`/api/events/${id}/registrations?status=confirmed`).then((r) => r.json())
    const { data: assigns } = await fetch(`/api/certificates/assign?event_id=${id}`)
      .then((r) => r.json())
      .catch(() => ({ data: [] }))
    const assignMap = new Map(
      (assigns ?? []).map((a: any) => [`${a.registration_id}:${a.team_member_id ?? 'solo'}`, a.template_id])
    )
    const attended = (regs ?? []).filter((r: any) => {
      const a = Array.isArray(r.attendance) ? r.attendance[0] : r.attendance
      return !!a?.id
    })
    const rows: Attendee[] = []
    for (const r of attended) {
      if (r.registration_type === 'team') {
        for (const m of r.members ?? []) {
          rows.push({
            registration_id: r.id, team_member_id: m.id, name: m.full_name, email: m.email,
            template_id: (assignMap.get(`${r.id}:${m.id}`) as string) ?? null,
          })
        }
      } else {
        rows.push({
          registration_id: r.id, team_member_id: null, name: r.leader_name, email: r.leader_email,
          template_id: (assignMap.get(`${r.id}:solo`) as string) ?? null,
        })
      }
    }
    setAttendees(rows)
  }, [id])

  useEffect(() => { loadTemplates(); loadAttendees() }, [loadTemplates, loadAttendees])

  async function uploadTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!templateName.trim()) { alert('Name the template first (e.g. Winner / Participant).'); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('event_id', id); fd.append('name', templateName.trim())
      const { error } = await fetch('/api/certificates/templates', { method: 'POST', body: fd }).then((r) => r.json())
      if (error) { alert(error); return }
      setTemplateName('')
      await loadTemplates()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function deleteTemplate(tid: string) {
    if (!confirm('Delete this template?')) return
    await fetch('/api/certificates/templates', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tid, event_id: id }),
    })
    await Promise.all([loadTemplates(), loadAttendees()])
  }

  async function assign(a: Attendee, templateId: string) {
    setAttendees((prev) => prev.map((x) => (x === a ? { ...x, template_id: templateId } : x)))
    await fetch('/api/certificates/assign', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: id, template_id: templateId,
        targets: [{ registration_id: a.registration_id, team_member_id: a.team_member_id }],
      }),
    })
  }

  async function run(action: 'generate' | 'release') {
    const setBusy = action === 'generate' ? setGenerating : setReleasing
    if (!confirm(action === 'generate' ? 'Generate certificates for all attendees?' : 'Email certificates to all attendees?')) return
    setBusy(true); setResult(null)
    try {
      const { data, error } = await fetch('/api/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, event_id: id }),
      }).then((r) => r.json())
      if (error) { alert(error); return }
      setResult(action === 'generate' ? `Generated ${data.generated}/${data.total}` : `Emailed ${data.emailed}/${data.total}`)
    } finally {
      setBusy(false)
    }
  }

  const defaultTemplate = templates.find((t) => t.is_default)

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={Award}
        kicker="Certificates"
        title="Certificates"
        description={'Upload templates (e.g. Winner, Participant) and assign attendees to them. Attendees without an assignment get the default template.'}
      />

      {/* Templates */}
      <section className="app-panel-muted p-6">
        <h2 className="app-subheading text-lg font-black uppercase tracking-tight text-foreground">Templates</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-widest text-foreground-soft">Template name</label>
            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Winner"
              className="app-input py-2 text-sm" />
          </div>
          <input ref={fileRef} type="file" accept=".pdf" onChange={uploadTemplate} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            className="app-button-primary text-sm disabled:opacity-50">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? 'Uploading…' : 'Upload PDF'}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {templates.length === 0 ? (
            <p className="text-sm font-medium text-foreground-soft">No templates yet. Upload at least one to generate certificates.</p>
          ) : (
            templates.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-xl border-2 border-border bg-panel px-4 py-2.5">
                <span className="text-sm font-bold text-foreground">
                  {t.name} {t.is_default && <span className="app-badge app-badge-warning ml-2">Default</span>}
                </span>
                <button onClick={() => deleteTemplate(t.id)} className="p-1.5 text-foreground-soft transition hover:text-brand">
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Attendees + assignment */}
      <section className="app-panel-muted p-6">
        <h2 className="text-lg font-black uppercase tracking-tight text-foreground">Attendees ({attendees.length})</h2>
        <p className="mt-1 text-sm font-medium text-foreground-soft">Assign each attendee a template (defaults to {defaultTemplate?.name ?? '—'}).</p>
        <div className="mt-4 space-y-2">
          {attendees.length === 0 ? (
            <p className="text-sm font-medium text-foreground-soft">No attended participants yet. Check people in first.</p>
          ) : (
            attendees.map((a) => (
              <div key={`${a.registration_id}:${a.team_member_id ?? 'solo'}`} className="flex items-center justify-between gap-3 rounded-xl border-2 border-border bg-panel px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{a.name}</p>
                  <p className="truncate text-xs font-medium text-foreground-soft">{a.email}</p>
                </div>
                <select
                  value={a.template_id ?? ''}
                  onChange={(e) => assign(a, e.target.value)}
                  disabled={templates.length === 0}
                  className="app-select max-w-[180px] py-2 text-sm"
                >
                  <option value="">{defaultTemplate ? `Default (${defaultTemplate.name})` : 'Default'}</option>
                  {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Generate + release */}
      <section className="app-panel-muted flex flex-wrap items-center gap-3 p-6">
        <button onClick={() => run('generate')} disabled={generating || templates.length === 0}
          className="app-button-success text-sm disabled:opacity-50">
          {generating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
          {generating ? 'Generating…' : 'Generate Certificates'}
        </button>
        <button onClick={() => run('release')} disabled={releasing}
          className="app-button-secondary text-sm disabled:opacity-50">
          {releasing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
          {releasing ? 'Sending…' : 'Release by Email'}
        </button>
        {result && <span className="app-badge app-badge-warning">{result}</span>}
      </section>
    </div>
  )
}
