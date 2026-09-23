// Owner: FE2 - Edit event details + sub-nav to registrations, check-in, export, etc.
'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleDashed, Settings2, Users } from 'lucide-react'
import { FormFieldBuilder } from '@/components/dashboard/FormFieldBuilder'
import { OrganizerManager } from '@/components/dashboard/OrganizerManager'
import { EventWithStats } from '@/types'
import { PosterHeading } from '@/components/brand/PosterHeading'

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
  const [fieldsCount, setFieldsCount] = useState<number | null>(null)
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
      })

      // Fields count gates publishing.
      fetch(`/api/events/${id}/form-fields`)
        .then((r) => r.json())
        .then((j) => setFieldsCount((j.data ?? []).length))
        .catch(() => setFieldsCount(0))
    } catch (error) {
      console.error('Failed to load event:', error)
      setEvent(null)
    } finally {
      setLoading(false)
    }
  }

  if (id) loadEvent()
}, [id])

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
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to save event')
      }

      const { data } = await res.json()
      setEvent(data)
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

  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <span className="app-kicker">
              <Settings2 size={14} />
              Event Control Center
            </span>
            <div>
              <PosterHeading as="h1" fillClassName="text-primary-yellow" className="text-2xl sm:text-4xl">
                {event.title}
              </PosterHeading>
              <p className="app-subheading mt-3">
                {event.event_type} • {event.venue}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`app-badge ${event.is_published ? 'app-badge-success' : 'app-badge-neutral'}`}>
                {event.is_published ? 'Published' : 'Draft'}
              </span>
              <span className="app-badge bg-brand text-white">{event.confirmed_count} confirmed</span>
              <span className="app-badge app-badge-warning">{event.waitlist_count || 0} waitlisted</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={togglePublish}
              disabled={saving || (!event.is_published && fieldsCount === 0)}
              className={event.is_published ? 'app-button-secondary' : 'app-button-primary'}
            >
              {event.is_published ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
              {event.is_published ? 'Published' : 'Publish Event'}
            </button>
            {!event.is_published && fieldsCount === 0 && (
              <p className="text-xs font-bold uppercase tracking-wide text-warning">Add at least one field (Form tab) to publish.</p>
            )}
          </div>
        </div>
      </section>

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
               ? 'border-border bg-accent text-white shadow-sm'
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
                Update the core information organizers and attendees rely on.
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

              <div className="flex justify-end border-t-2 border-border pt-5">
                <button onClick={handleSaveEvent} disabled={saving} className="app-button-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          <aside className="app-panel p-6 h-fit">
            <div className="mb-6 flex items-center gap-3 border-b-2 border-border pb-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-border bg-primary-yellow text-[#121212]">
                <Users size={16} strokeWidth={2.5} />
              </span>
              <div>
                <h3 className="text-sm font-black text-foreground tracking-widest uppercase">Quick Context</h3>
                <p className="text-[0.65rem] font-mono font-medium text-foreground-soft">Live operational readout.</p>
              </div>
            </div>
            <div className="space-y-2 font-tech text-xs font-medium text-foreground-soft">
              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                Protocol: <span className="font-bold text-accent tracking-wider">{(event.registration_mode ?? 'both').toUpperCase()}</span>
              </div>
              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                Capacity: <span className="font-bold text-accent tracking-wider">{event.capacity ?? 'UNRESTRICTED'}</span>
              </div>
              <div className="rounded-xl border-2 border-border bg-panel-muted px-4 py-3">
                State: <span className="font-bold text-success tracking-wider">{event.is_published ? 'LIVE_STREAM' : 'DORMANT'}</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {tab === 'form' && <FormFieldBuilder eventId={id} />}
      {tab === 'organizers' && <OrganizerManager eventId={id} />}
    </div>
  )
}
