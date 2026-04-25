// Owner: FE2 - Create new event form (Neon Premium)
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, Sparkles, TerminalSquare } from 'lucide-react'
import type { CreateEventPayload } from '@/lib/validators/event'

const FIELD_GROUP = [
  { name: 'title', label: 'Event Name', type: 'text', required: true },
  { name: 'venue', label: 'Venue', type: 'text', required: true },
  { name: 'starts_at', label: 'Start Date & Time', type: 'datetime-local', required: true },
  { name: 'ends_at', label: 'End Date & Time', type: 'datetime-local', required: true },
  {
    name: 'registration_closes_at',
    label: 'Registration Closes At',
    type: 'datetime-local',
    required: true,
  },
  {
    name: 'capacity',
    label: 'Capacity (leave blank for unlimited)',
    type: 'number',
    required: false,
  },
] as const

export default function NewEventPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const payload: Partial<CreateEventPayload> = {
      title: form.get('title') as string,
      event_type: form.get('event_type') as CreateEventPayload['event_type'],
      venue: form.get('venue') as string,
      starts_at: form.get('starts_at') as string,
      ends_at: form.get('ends_at') as string,
      registration_closes_at: form.get('registration_closes_at') as string,
      registration_mode: form.get(
        'registration_mode'
      ) as CreateEventPayload['registration_mode'],
      capacity: form.get('capacity') ? Number(form.get('capacity')) : null,
      description: form.get('description') as string,
    }

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const { data, error } = await res.json()
    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    router.push(`/dashboard/events/${data.id}`)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr] app-fade-in relative z-10 w-full mb-10">
      <section className="app-panel rounded-[2rem] p-6 sm:p-10 border border-white/5 bg-[#0a0f12]">
        <div className="mb-10 space-y-4">
          <span className="app-kicker text-amber-400 bg-amber-500/10 border-amber-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <TerminalSquare size={14} />
            Initialize Event Module
          </span>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Create a polished event workspace from day one.</h1>
            <p className="mt-3 text-slate-400 max-w-2xl text-sm font-medium leading-relaxed">
              Define the core telemetry and routing properties mapping. You will be cleared to configure registrations, check-in access points, and team allocations immediately after setup.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {FIELD_GROUP.map((field) => (
              <div key={field.name} className={field.name === 'capacity' ? 'sm:col-span-2' : ''}>
                <label className="mb-2 block text-[0.65rem] tracking-widest font-bold uppercase text-slate-400">
                  {field.label}
                </label>
                <input
                  name={field.name}
                  type={field.type}
                  required={field.required}
                  className="app-input"
                  style={field.type === 'datetime-local' ? { colorScheme: 'dark' } : {}}
                />
              </div>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-[0.65rem] tracking-widest font-bold uppercase text-slate-400">Event Classifier</label>
              <select name="event_type" required className="app-input text-slate-300">
                {['workshop', 'seminar', 'fest', 'hackathon', 'talk', 'other'].map((type) => (
                  <option key={type} value={type} className="bg-[#020617] text-white">
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-[0.65rem] tracking-widest font-bold uppercase text-slate-400">
                Participation Protocol
              </label>
              <select name="registration_mode" required className="app-input text-slate-300">
                <option value="solo" className="bg-[#020617] text-white">LONE_WOLF (Solo)</option>
                <option value="team" className="bg-[#020617] text-white">SQUAD_LINK (Team)</option>
                <option value="both" className="bg-[#020617] text-white">UNRESTRICTED (Both)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[0.65rem] tracking-widest font-bold uppercase text-slate-400">Mission Briefing (Description)</label>
            <textarea name="description" rows={5} className="app-input min-h-[120px]" />
          </div>

          {error && (
            <div className="app-alert-danger rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              [ERR] {error}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-white/10 pt-6 mt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-bold max-w-xs leading-relaxed">
              Execution triggers automatic redirection to primary staging dashboard.
            </p>
            <button type="submit" disabled={loading} className="app-button-primary px-8 py-3 w-full sm:w-auto shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm tracking-widest uppercase">
              {loading ? 'Initializing Array...' : 'Deploy Event Module'}
              {!loading && <ArrowRight size={16} className="ml-2" />}
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-4">
         {/* Cyberpunk aside info block */}
        <div className="app-panel rounded-[2xl] p-8 border border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full pointer-events-none" />

          <div className="mb-6 flex items-start gap-4 flex-col">
            <span className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Sparkles size={20} />
            </span>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Phase 2 Allocation</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">Staging sequence guidelines.</p>
            </div>
          </div>
          <div className="space-y-3 text-sm font-medium text-slate-400">
            <div className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">Configure advanced registration variables</div>
            <div className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">Assign sub-admins and operational staff</div>
            <div className="rounded-xl border border-white/5 bg-black/40 px-4 py-3 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">Enable live deployment status</div>
          </div>
        </div>
      </aside>
    </div>
  )
}
