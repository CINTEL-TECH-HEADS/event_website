// Owner: FE1 — Homepage (Premium EdTech AI/ML)
// Updated: Added Organizer Login and Participant Portal buttons

'use client'

import { useEffect, useState } from 'react'
import { Sparkles, BrainCircuit, ExternalLink, Blocks, LogIn, User } from 'lucide-react'
import { EventGrid } from '@/components/public/EventGrid'

type EventWithStats = {
  id: string
  title: string
  venue: string
  confirmed_count?: number
}

export default function HomePage() {
  const [events, setEvents]   = useState<EventWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events')
        const { data } = await res.json()
        setEvents(data ?? [])
      } catch (err) {
        console.error('Failed to load events:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      
      {/* Dynamic AI/ML Mesh Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-amber-600/10 via-slate-900 to-transparent"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>
      </div>

      {/* Top nav — Organizer login link */}
      <nav className="relative z-20 flex justify-end px-6 pt-5">
        <a
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors border border-white/10 rounded-full px-4 py-1.5 hover:bg-white/5"
        >
          <LogIn size={12} />
          Organizer Login
        </a>
      </nav>

      <main className="relative z-10 flex flex-col items-center">
        {/* Hero */}
        <section className="w-full max-w-6xl px-6 pt-16 pb-20 relative flex flex-col items-center text-center">
          
          <div className="app-fade-in relative max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold text-amber-400 uppercase tracking-[0.2em] mb-8 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
              <Blocks size={14} />
              Department of Computational Intelligence
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-[1.05]">
              Pioneering <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 drop-shadow-sm">
                Emerging Technologies.
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-400 leading-relaxed font-light max-w-2xl mx-auto">
              The premier platform for students innovating in Artificial Intelligence, Machine Learning, and next-generation computational frameworks.
            </p>

            <div className="mt-12 flex justify-center gap-4 flex-wrap">
              <a
                href="#events"
                className="group relative inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-slate-950 transition-all hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-amber-500/30 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite]" />
                <BrainCircuit size={18} className="text-amber-500" />
                Initialize Portal
              </a>

              {/* Participant Portal Button */}
              <a
                href="/participant/login"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-8 py-4 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/20 hover:border-blue-400/50"
              >
                <User size={18} />
                My Registrations
              </a>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="w-full border-y border-white/5 bg-slate-900/50 backdrop-blur-sm app-fade-in-delayed relative z-10">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              
              <div className="flex flex-col items-center justify-center py-4 md:py-0">
                <p className="text-4xl font-black text-white">{events.length}</p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">Active Events</p>
              </div>

              <div className="flex flex-col items-center justify-center py-4 md:py-0">
                <p className="text-4xl font-black text-amber-400">
                  {events.reduce((sum, item) => sum + (typeof item.confirmed_count === 'number' ? item.confirmed_count : 0), 0)}+
                </p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">Innovators Enrolled</p>
              </div>

              <div className="flex flex-col items-center justify-center py-4 md:py-0">
                <p className="text-4xl font-black text-white flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#f59e0b] animate-pulse"></span>
                  Online
                </p>
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase mt-2">System Core</p>
              </div>

            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section id="events" className="w-full max-w-6xl mx-auto px-6 py-24 relative z-10">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Active Transmissions</h2>
              <p className="text-slate-400 mt-3 text-lg max-w-xl font-light">Engage with upcoming workshops and hackathons deployed by the Computational Intelligence division.</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-6">
              <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin shadow-[0_0_20px_rgba(245,158,11,0.3)]" />
              <p className="text-xs font-bold text-amber-500/70 tracking-widest uppercase">Syncing Neural Nodes...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="app-panel rounded-3xl p-12 text-center border border-white/5 bg-slate-900/50 backdrop-blur-md">
              <BrainCircuit className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
              <p className="text-xl text-white font-semibold">No active modules available.</p>
              <p className="text-slate-400 mt-2 font-light">Stand by. Processing future events globally.</p>
            </div>
          ) : (
            <EventGrid events={events} />
          )}
        </section>

      </main>
    </div>
  )
}
