'use client'

import { useEffect, useState } from 'react'
import { FileBadge, ShieldAlert, CheckCircle2 } from 'lucide-react'

export default function CertificatePage() {
  const [email, setEmail] = useState('')
  const [eventId, setEventId] = useState('')
  const [events, setEvents] = useState<any[]>([])

  const [status, setStatus] =
    useState<'idle' | 'loading' | 'ready' | 'not_found' | 'not_attended'>('idle')

  const [downloadUrl, setDownloadUrl] = useState('')

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) throw new Error('Failed to fetch events')
        const { data } = await res.json()
        setEvents(data ?? [])
      } catch (err) {
        console.error(err)
      }
    }
    loadEvents()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!eventId) {
      setStatus('not_found')
      return
    }

    setStatus('loading')
    setDownloadUrl('')

    try {
      const res = await fetch(
        `/api/certificates/download?email=${encodeURIComponent(email)}&event_id=${eventId}`
      )

      if (!res.ok) {
        throw new Error('Request failed')
      }

      const { data, error } = await res.json()

      if (error) {
        setStatus('not_found')
      } else if (!data?.url) {
        setStatus('not_attended')
      } else {
        setDownloadUrl(data.url)
        setStatus('ready')
      }
    } catch {
      setStatus('not_found')
    }
  }

  return (
    <div className="app-shell flex items-center justify-center px-4 py-20 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-lg app-panel rounded-[2rem] p-8 md:p-10 relative z-10 app-fade-in shadow-[0_0_50px_rgba(16,185,129,0.05)] border-amber-500/20">

        {/* Header */}
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <FileBadge size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Certificate Portal
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Verify attendance and download encrypted certificates.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Participant Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="operator@cintel.in"
              required
              className="app-input"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Registered Event</label>
            <select
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              required
              className="app-input text-slate-300"
            >
              <option value="" className="bg-[#020617]">Select Target Event</option>
              {events.map(event => (
                <option key={event.id} value={event.id} className="bg-[#020617]">
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="app-button-primary w-full py-4 text-base font-bold shadow-[0_0_20px_rgba(16,185,129,0.3)] mt-4"
          >
            {status === 'loading' ? 'Authenticating...' : 'Fetch Certificate'}
          </button>
        </form>

        {/* States Box */}
        <div className="mt-8">
          {status === 'ready' && (
            <div className="app-fade-in text-center space-y-4 pt-6 border-t border-white/10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mb-2">
                 <CheckCircle2 size={24} />
              </div>
              <p className="text-amber-400 font-bold tracking-wide">Verification Successful</p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full app-button-success py-3 text-sm"
              >
                Download PDF
              </a>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                Secure Link Expires in 7 Days
              </p>
            </div>
          )}

          {status === 'not_attended' && (
            <div className="app-fade-in app-alert-warning flex items-center gap-3">
              <ShieldAlert size={20} className="shrink-0" />
              <p className="text-sm">Attendance not confirmed for this event.</p>
            </div>
          )}

          {status === 'not_found' && (
            <div className="app-fade-in app-alert-danger text-red-400 border border-red-500/30 bg-red-500/10 rounded-lg p-4 flex items-center gap-3">
              <ShieldAlert size={20} className="shrink-0" />
              <p className="text-sm font-medium">Record not found. Check parameters.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
