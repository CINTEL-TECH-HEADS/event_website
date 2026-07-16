// Owner: FE2 - Edit event details + sub-nav to registrations, check-in, export, etc.
'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, CircleDashed, Settings2, Users } from 'lucide-react'
import { FormFieldBuilder } from '@/components/dashboard/FormFieldBuilder'
import { OrganizerManager } from '@/components/dashboard/OrganizerManager'
import { EventWithStats } from '@/types'

const SUBNAV = [
  { label: 'Registrations', path: 'registrations' },
  { label: 'Check-In', path: 'checkin' },
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
  const [tab, setTab] = useState<'details' | 'form' | 'organizers'>('details')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    capacity: '',
    registration_mode: 'both' as 'solo' | 'team' | 'both',
    min_team_size: '',
    max_team_size: '',
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

      if (!res.ok) {
  const text = await res.text()
  console.log(text)
  throw new Error(text || 'Failed to toggle publish')
}

      const { data } = await res.json()
      setEvent(data)
    } catch (error) {
      console.error('Failed to toggle publish:', error)
      alert('Failed to update event status')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-400">Loading event...</div>
  }

  if (!event) {
    return <div className="text-sm text-red-500">Event not found</div>
  }

  return (
    <div className="space-y-6">
      <section className="app-panel  px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <span className="app-kicker">
              <Settings2 size={14} />
              Event Control Center
            </span>
            <div>
              <h1 className="app-heading">{event.title}</h1>
              <p className="app-subheading mt-3">
                {event.event_type} • {event.venue}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`app-badge ${event.is_published ? 'app-badge-success' : 'app-badge-neutral'}`}>
                {event.is_published ? 'Published' : 'Draft'}
              </span>
              <span className="app-badge app-badge-brand">{event.confirmed_count} confirmed</span>
              <span className="app-badge app-badge-warning">{event.waitlist_count || 0} waitlisted</span>
            </div>
          </div>

          <button
            onClick={togglePublish}
            disabled={saving}
            className={event.is_published ? 'app-button-secondary' : 'app-button-primary'}
          >
            {event.is_published ? <CheckCircle2 size={16} /> : <CircleDashed size={16} />}
            {event.is_published ? 'Published' : 'Publish Event'}
          </button>
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
            className={` px-4 py-3 text-sm font-bold tracking-widest uppercase transition-all border ${
              tab === item.key
               ? 'bg-[#F5E62D] text-[#0B1736] border-[#FFF27A] '
               : 'bg-[#10224A] text-slate-300 border-[#243B72] hover:text-white hover:border-[#F5E62D]'
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
            className={` border px-3 mt-2 py-2 text-xs font-bold tracking-widest uppercase transition-all ${
              pathname.includes(item.path)
             ? 'border-[#FFF27A] bg-[#F5E62D] text-[#0B1736]'
             : 'border-[#243B72] bg-[#10224A] text-slate-300 hover:border-[#F5E62D] hover:text-white'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </section>

      {tab === 'details' && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="app-panel  p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Event details</h2>
              <p className="mt-1 text-sm text-slate-400">
                Update the core information organizers and attendees rely on.
              </p>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Event Name</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="app-input"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="app-textarea"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">Capacity</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    className="app-input"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
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
                    <label className="mb-2 block text-sm font-semibold text-slate-300">Min team size</label>
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
                    <label className="mb-2 block text-sm font-semibold text-slate-300">Max team size</label>
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

              <div className="flex justify-end border-t border-[#243B72] pt-5">
                <button onClick={handleSaveEvent} disabled={saving} className="app-button-primary">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </section>

          <aside className="app-panel  p-6 h-fit">
            <div className="mb-6 flex items-center gap-3 border-b border-[#243B72] pb-4">
              <span className=" border border-[#243B72] bg-[#0B1736] p-2 text-[#F5E62D] shrink-0">
                <Users size={16} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white tracking-widest uppercase">Quick Context</h3>
                <p className="text-[0.65rem] font-mono text-slate-500">Live operational readout.</p>
              </div>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-400">
              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                Protocol: <span className="font-bold text-[#F5E62D] tracking-wider">{(event.registration_mode ?? 'both').toUpperCase()}</span>
              </div>
              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                Capacity: <span className="font-bold text-[#93C5FD] tracking-wider">{event.capacity ?? 'UNRESTRICTED'}</span>
              </div>
              <div className=" border border-[#243B72] bg-[#0B1736] px-4 py-3">
                State: <span className="font-bold text-[#F5E62D] tracking-wider">{event.is_published ? 'LIVE_STREAM' : 'DORMANT'}</span>
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
