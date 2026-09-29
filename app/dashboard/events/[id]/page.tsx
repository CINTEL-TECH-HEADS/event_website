// Owner: FE2 - Edit event details + sub-nav to registrations, check-in, export, etc.
'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleDashed, Settings2 } from 'lucide-react'
import { FormFieldBuilder } from '@/components/dashboard/FormFieldBuilder'
import { OrganizerManager } from '@/components/dashboard/OrganizerManager'
import { EventWithStats } from '@/types'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'
import { EVENT_TYPE_LABELS, REGISTRATION_MODE_LABELS } from '@/lib/club'
import { isPast } from '@/lib/utils'

const SUBNAV = [
  { label: 'Registrations', path: 'registrations' },
  { label: 'Check-In', path: 'checkin' },
  { label: 'Payments', path: 'payments' },
  { label: 'Export', path: 'export' },
  { label: 'Certificates', path: 'certificates' },
  { label: 'Notifications', path: 'notifications' },
  { label: 'Duplicates', path: 'duplicates' },
] as const

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pathname = usePathname()
  const [event, setEvent] = useState<EventWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Custom field counts per form (SRM KTR / other colleges); they gate publishing.
  const [fieldCounts, setFieldCounts] = useState<{ srm: number; external: number } | null>(null)
  const [tab, setTab] = useState<'details' | 'form' | 'organizers'>('details')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    capacity: '',
    registration_mode: 'both' as 'solo' | 'team' | 'both',
    min_team_size: '',
    max_team_size: '',
    fee: '',
    waitlist_capacity: '',
    payment_method: 'upi' as 'upi' | 'bank',
    upi_id: '',
    upi_payee_name: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_name: '',
    open_to_external: false,
  })

  useEffect(() => {
  const loadEvent = async () => {
    try {
      const res = await fetch(`/api/events/${id}`)
      const json = await res.json()

      if (!json.data) {
        setEvent(null)
        return
      }

      const data = json.data

      setEvent(data)

      setFormData({
        title: data.title ?? '',
        description: data.description ?? '',
        capacity: data.capacity?.toString() ?? '',
        registration_mode: data.registration_mode ?? 'both',
        min_team_size: data.min_team_size?.toString() ?? '',
        max_team_size: data.max_team_size?.toString() ?? '',
        fee: data.fee ? data.fee.toString() : '',
        waitlist_capacity: data.waitlist_capacity?.toString() ?? '',
        payment_method: (data.payment_method as 'upi' | 'bank') ?? 'upi',
        upi_id: data.upi_id ?? '',
        upi_payee_name: data.upi_payee_name ?? '',
        bank_account_name: data.bank_account_name ?? '',
        bank_account_number: data.bank_account_number ?? '',
        bank_ifsc: data.bank_ifsc ?? '',
        bank_name: data.bank_name ?? '',
        open_to_external: data.open_to_external === true,
      })

    } catch (error) {
      console.error('Failed to load event:', error)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }

  if (id) loadEvent()
}, [id])

  // Open a specific tab from the URL (e.g. ?tab=form right after creating an event).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t === 'form' || t === 'organizers' || t === 'details') setTab(t)
  }, [])

  // Refresh the per-form field counts whenever the details tab is shown, so the
  // publish gate reflects edits made in the Custom fields tab.
  useEffect(() => {
    if (!id || tab !== 'details') return
    fetch(`/api/events/${id}/form-fields`)
      .then((r) => r.json())
      .then((j) => {
        const list: { audience?: string }[] = j.data ?? []
        const external = list.filter((f) => f.audience === 'external').length
        setFieldCounts({ srm: list.length - external, external })
      })
      .catch(() => setFieldCounts({ srm: 0, external: 0 }))
  }, [id, tab])

  const handleSaveEvent = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          capacity: formData.capacity ? Number(formData.capacity) : null,
          min_team_size:
            formData.registration_mode !== 'solo' && formData.min_team_size
              ? Number(formData.min_team_size)
              : null,
          max_team_size:
            formData.registration_mode !== 'solo' && formData.max_team_size
              ? Number(formData.max_team_size)
              : null,
          fee: formData.fee ? Number(formData.fee) : 0,
          waitlist_capacity: formData.waitlist_capacity ? Number(formData.waitlist_capacity) : null,
          // Payment config — only persisted when the event is paid.
          payment_method: Number(formData.fee) > 0 ? formData.payment_method : null,
          upi_id: formData.upi_id || null,
          upi_payee_name: formData.upi_payee_name || null,
          bank_account_name: formData.bank_account_name || null,
          bank_account_number: formData.bank_account_number || null,
          bank_ifsc: formData.bank_ifsc || null,
          bank_name: formData.bank_name || null,
        }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        // Surface the server's reason (e.g. who can register is locked).
        alert(json?.error ?? 'Failed to save event')
        return
      }
      setEvent(json.data)
    } catch (error) {
      console.error('Failed to save event:', error)
      alert('Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const togglePublish = async () => {
    if (!event) {
      return
    }

    if (
      !event.is_published &&
      !window.confirm(
        `Publish "${event.title}"?\n\nCheck the registration form${event.open_to_external ? 's' : ''} and who can register first. They can't be changed after publishing.`
      )
    ) {
      return
    }

    setSaving(true)
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !event.is_published }),
      })

      const json = await res.json().catch(() => null)
      if (!res.ok) {
        // Surface the server's reason (e.g. "add at least one field").
        alert(json?.error ?? 'Failed to update event status')
        return
      }
      setEvent(json.data)
    } catch (error) {
      console.error('Failed to toggle publish:', error)
      alert('Failed to update event status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm font-bold uppercase tracking-wide text-foreground-soft">Loading event...</div>
  }

  if (!event) {
    return <div className="text-sm font-bold uppercase tracking-wide text-brand">Event not found</div>
  }

  // The form and who can register are fixed once the event is published or
  // anyone has registered (see lib/events/form-lock.ts).
  const formLock = event.form_lock ?? (event.is_published ? 'published' : null)

  // Publishing needs a form: at least one custom field, and for events open to
  // other colleges at least one in each form.
  const publishBlocker = !fieldCounts
    ? null
    : event.open_to_external
      ? fieldCounts.srm === 0
        ? 'Add at least one field to the SRM KTR form (Custom fields tab) to publish.'
        : fieldCounts.external === 0
          ? 'Add at least one field to the other-college form (Custom fields tab) to publish.'
          : null
      : fieldCounts.srm + fieldCounts.external === 0
        ? 'Add at least one field (Custom fields tab) to publish.'
        : null

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={Settings2}
        kicker={`${EVENT_TYPE_LABELS[event.event_type ?? ''] ?? event.event_type ?? 'Event'}${event.venue ? ` · ${event.venue}` : ''}`}
        title={event.title}
        actions={
          <div className="flex flex-col items-start gap-1 lg:items-end">
            <button
              onClick={togglePublish}
              disabled={saving || (!event.is_published && !!publishBlocker)}
              className={event.is_published ? 'app-button-secondary' : 'app-button-primary'}
            >
              {event.is_published ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              {event.is_published ? 'Published' : 'Publish event'}
            </button>
            {!event.is_published && publishBlocker && (
              <p className="text-xs font-bold uppercase tracking-wide text-warning">{publishBlocker}</p>
            )}
          </div>
        }
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`app-badge ${event.is_published ? 'app-badge-success' : 'app-badge-neutral'}`}>
            {event.is_published ? 'Published' : 'Draft'}
          </span>
          {/* GET /api/events/[id] doesn't include counts; show them only when present. */}
          {typeof event.confirmed_count === 'number' && (
            <span className="app-badge bg-brand text-white">{event.confirmed_count} confirmed</span>
          )}
          {typeof event.waitlist_count === 'number' && (
            <span className="app-badge app-badge-warning">{event.waitlist_count} waitlisted</span>
          )}
        </div>
      </DashboardPageHeader>

      <section className="flex flex-wrap gap-3">
        {([
          { key: 'details', label: 'Event Details' },
          { key: 'form', label: 'Custom Fields' },
          { key: 'organizers', label: 'Access Control' },
        ] as const).map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`rounded-full border-2 px-4 py-3 font-tech text-sm font-bold tracking-widest uppercase transition-all duration-200 ease-out ${
              tab === item.key
               ? 'border-border bg-accent text-background shadow-sm'
               : 'border-border bg-panel-muted text-foreground-soft hover:text-foreground'
            }`}
          >
            {item.label}
          </button>
        ))}
      </section>

      <section className="flex flex-wrap gap-3">
        {SUBNAV.map((item) => (
          <Link
            key={item.path}
            href={`/dashboard/events/${id}/${item.path}`}
            className={`mt-2 rounded-full border-2 px-3 py-2 font-tech text-xs font-bold tracking-widest uppercase transition-all duration-200 ease-out ${
              pathname.includes(item.path)
             ? 'border-border bg-primary-yellow text-[#121212]'
             : 'border-border bg-panel-muted text-foreground-soft hover:text-foreground'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </section>

      {tab === 'details' && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="app-panel p-6">
            <div className="mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Event details</h2>
              <p className="mt-1 text-sm font-medium text-foreground-soft">
                Title, description, dates, capacity, fee and team size.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Event Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="app-textarea"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    className="app-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">
                    Registration Mode
                  </label>
                  <select
                    value={formData.registration_mode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registration_mode: e.target.value as typeof formData.registration_mode,
                      })
                    }
                    className="app-select"
                  >
                    <option value="solo">Solo only</option>
                    <option value="team">Team only</option>
                    <option value="both">Both solo and team</option>
                  </select>
                </div>
              </div>

              {formData.registration_mode !== 'solo' && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Min team size</label>
                    <input
                      type="number"
                      min={2}
                      value={formData.min_team_size}
                      onChange={(e) => setFormData({ ...formData, min_team_size: e.target.value })}
                      placeholder="2"
                      className="app-input"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Max team size</label>
                    <input
                      type="number"
                      min={2}
                      value={formData.max_team_size}
                      onChange={(e) => setFormData({ ...formData, max_team_size: e.target.value })}
                      placeholder="4"
                      className="app-input"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Fee (₹) — 0 for free</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.fee}
                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                    placeholder="0"
                    className="app-input"
                  />
                </div>
                <div>
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Waitlist spots — blank for none</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.waitlist_capacity}
                    onChange={(e) => setFormData({ ...formData, waitlist_capacity: e.target.value })}
                    placeholder="No waitlist"
                    className="app-input"
                  />
                </div>
              </div>

              <div className="rounded-xl border-2 border-border bg-panel-muted p-4">
                <label className="flex items-center gap-3 text-sm font-bold uppercase tracking-wide text-foreground">
                  <input
                    type="checkbox"
                    checked={formData.open_to_external}
                    disabled={!!formLock}
                    onChange={(e) => setFormData({ ...formData, open_to_external: e.target.checked })}
                    className="h-4 w-4 accent-accent disabled:opacity-60"
                  />
                  Open to students from other colleges
                </label>
                <p className="mt-2 text-xs font-medium text-foreground-soft">
                  Off: only SRM KTR students can see and register. On: students from other colleges can too.
                  {formLock === 'published' && ' Locked while the event is published.'}
                  {formLock === 'registrations' && ' Locked because people have already registered.'}
                </p>
              </div>

              {Number(formData.fee) > 0 && (
                <div className="border-t-2 border-border pt-5">
                  <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Payment method</label>
                  <p className="mb-3 text-xs font-medium text-foreground-soft">
                    Participants pay to these details and submit proof; verify each payment in the Payments tab. Switchable any time.
                  </p>
                  <div className="mb-4 inline-flex flex-wrap gap-2">
                    {(['upi', 'bank'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setFormData({ ...formData, payment_method: m })}
                        className={`rounded-full border-2 px-4 py-2 font-tech text-xs font-bold uppercase tracking-widest transition-all duration-200 ease-out ${
                          formData.payment_method === m
                            ? 'border-border bg-accent text-background shadow-sm'
                            : 'border-border bg-panel-muted text-foreground-soft hover:text-foreground'
                        }`}
                      >
                        {m === 'upi' ? 'UPI ID' : 'Bank transfer'}
                      </button>
                    ))}
                  </div>
                  {formData.payment_method === 'upi' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">UPI ID</label>
                        <input value={formData.upi_id} onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })} placeholder="cintel@oksbi" className="app-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Payee name</label>
                        <input value={formData.upi_payee_name} onChange={(e) => setFormData({ ...formData, upi_payee_name: e.target.value })} placeholder="Shown to payer" className="app-input" />
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Account holder</label>
                        <input value={formData.bank_account_name} onChange={(e) => setFormData({ ...formData, bank_account_name: e.target.value })} className="app-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Account number</label>
                        <input value={formData.bank_account_number} onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })} className="app-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">IFSC</label>
                        <input value={formData.bank_ifsc} onChange={(e) => setFormData({ ...formData, bank_ifsc: e.target.value })} className="app-input" />
                      </div>
                      <div>
                        <label className="mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft">Bank name</label>
                        <input value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} className="app-input" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end border-t-2 border-border pt-5">
                <button onClick={handleSaveEvent} disabled={saving} className="app-button-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          <aside className="h-fit rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground">At a glance</h3>
            <dl className="mt-3 divide-y-2 divide-border text-sm">
              {[
                ['Status', event.is_published ? 'Published' : 'Draft'],
                ['Registration', event.registration_closes_at && isPast(event.registration_closes_at) ? 'Closed' : 'Open'],
                ['Format', REGISTRATION_MODE_LABELS[event.registration_mode ?? 'both'] ?? event.registration_mode],
                ['Capacity', event.capacity ?? 'Unlimited'],
                ['Fee', (event.fee ?? 0) > 0 ? `₹${event.fee}` : 'Free'],
                ['Open to', event.open_to_external ? 'All colleges' : 'SRM KTR only'],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-center justify-between gap-3 py-2.5">
                  <dt className="font-tech text-[11px] font-bold uppercase tracking-widest text-foreground-soft">{label}</dt>
                  <dd className="font-bold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      )}

      {tab === 'form' && (
        <FormFieldBuilder eventId={id} openToExternal={event.open_to_external === true} lock={formLock} />
      )}
      {tab === 'organizers' && <OrganizerManager eventId={id} />}
    </div>
  )
}
