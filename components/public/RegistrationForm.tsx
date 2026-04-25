// Owner: FE1 — Registration Form (Neon Premium UI)

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { EventWithStats } from '@/types'
import { TeamMemberFields } from './TeamMemberFields'
import { Hexagon, Disc3 } from 'lucide-react'

export function RegistrationForm({ event }: { event: EventWithStats }) {
  const router = useRouter()

  const [type, setType] = useState<'solo' | 'team'>(
    event.registration_mode === 'team' ? 'team' : 'solo'
  )

  const [form, setForm] = useState({
    leader_name: '',
    leader_email: '',
    leader_phone: '',
    register_number: '',
    team_name: ''
  })

  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return

    setLoading(true)
    setError('')

    try {
      const payload = {
        event_id: event.id,
        registration_type: type,
        leader_name: form.leader_name,
        leader_email: form.leader_email,
        leader_phone: form.leader_phone,
        register_number: form.register_number,
        team_name: type === 'team' ? form.team_name : null,
        members: type === 'team' ? members : []
      }

      const res = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const { data, error: apiErr } = await res.json()

      if (apiErr || !res.ok) {
        setError(apiErr ?? 'Transmission failed.')
        setLoading(false)
        return
      }

      router.push(`/confirmation/${data.registration_id}`)
    } catch {
      setError('System interference detected. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Mode Toggle */}
      {event.registration_mode === 'both' && (
        <div className="flex gap-2 p-1.5 rounded-xl bg-black/40 border border-white/5 w-fit mb-6">
          {(['solo', 'team'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              disabled={loading}
              className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                type === t
                  ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'solo' ? 'Operative' : 'Squad'}
            </button>
          ))}
        </div>
      )}

      {/* Identity Wrapper */}
      <div className="space-y-4">
        <div>
           <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block mb-2">Primary Designator</label>
           <input
             name="leader_name"
             placeholder="Full Name"
             required
             disabled={loading}
             onChange={handleChange}
             className="app-input"
           />
        </div>

        <div>
           <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block mb-2">Commlink Address</label>
           <input
             name="leader_email"
             type="email"
             placeholder="uid@network.edu.in"
             required
             disabled={loading}
             onChange={handleChange}
             className="app-input text-slate-300"
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block mb-2">Institution Code</label>
            <input
              name="register_number"
              placeholder="e.g. RA23..."
              required
              disabled={loading}
              onChange={handleChange}
              className="app-input font-mono uppercase"
            />
          </div>

          <div>
             <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block mb-2">Mobile Frequency</label>
             <input
               name="leader_phone"
               placeholder="+91..."
               required
               disabled={loading}
               onChange={handleChange}
               className="app-input font-mono"
             />
          </div>
        </div>
      </div>

      {/* Team Division */}
      {(event.registration_mode === 'team' || type === 'team') && (
        <div className="pt-6 border-t border-white/5 space-y-6">
          <div>
             <label className="text-[0.65rem] font-bold text-slate-500 uppercase tracking-widest block mb-2">Squad Callsign</label>
             <input
               name="team_name"
               placeholder="Enter Team Alias"
               required
               disabled={loading}
               onChange={handleChange}
               className="app-input border-amber-500/30 bg-amber-500/5 focus:bg-amber-500/10 focus:border-amber-500 text-amber-400 font-bold"
             />
          </div>

          <TeamMemberFields onChange={setMembers} />
        </div>
      )}

      {/* Error Output */}
      {error && (
        <div className="app-fade-in rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
          [ERR] {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="app-button-primary w-full py-4 text-sm mt-4 tracking-widest uppercase"
      >
        {loading ? (
          <><Disc3 className="animate-spin" size={18} /> Transmitting Data...</>
        ) : (
          <><Hexagon size={18} /> Initialize Registration</>
        )}
      </button>

    </form>
  )
}