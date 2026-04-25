// Owner: FE1 — Registration Page (Neon Cyberpunk UI)

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { EventWithStats } from '@/types'
import { RegistrationForm } from '@/components/public/RegistrationForm'
import { Terminal, ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const { slug } = useParams<{ slug: string }>()
  const [event, setEvent] = useState<EventWithStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadEvent() {
      try {
        const res = await fetch(`/api/events?slug=${slug}`)
        const { data, error } = await res.json()

        if (error) {
          setError(error)
        } else {
          const item = Array.isArray(data) ? data[0] : data
          setEvent(item)
        }
      } catch {
        setError('Failed to load event data stream')
      } finally {
        setLoading(false)
      }
    }

    if (slug) loadEvent()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-amber-500 font-mono text-sm tracking-widest uppercase app-pulse-soft">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
        INITIALIZING FORM MODULE...
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 font-bold bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/30">
          {error ?? '404 - EVENT CONTEXT NOT FOUND'}
        </div>
        <Link href="/" className="text-slate-400 hover:text-amber-400 transition-colors uppercase text-xs font-bold tracking-widest">
          Return to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="app-shell flex flex-col items-center px-4 py-16 relative overflow-hidden">
      
      {/* Background FX */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[150px] rounded-[100%] pointer-events-none" />

      <div className="w-full max-w-2xl relative z-10 app-fade-in space-y-6">
        
        <Link href={`/events/${slug}`} className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 transition-colors tracking-widest font-bold uppercase group">
          <ArrowLeft size={14} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Abort Registration
        </Link>

        {/* Header Block */}
        <div className="app-panel rounded-t-[2rem] rounded-b-xl p-8 md:p-10 text-center border-b-0">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black/50 text-amber-500 border border-amber-500/30 mb-6 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Terminal size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Register: {event.title}
          </h1>
          <p className="text-sm font-medium text-slate-400">
            Submit your credentials to secure clearance.
          </p>
        </div>

        {/* Form Block */}
        <div className="app-panel rounded-t-xl rounded-b-[2rem] p-6 md:p-10 relative overflow-hidden">
           <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
           <RegistrationForm event={event} />
        </div>

        <p className="text-center text-[0.65rem] tracking-widest uppercase font-bold text-slate-600 mt-8">
          End-to-End Encrypted Transmission Layer
        </p>

      </div>
    </div>
  )
}