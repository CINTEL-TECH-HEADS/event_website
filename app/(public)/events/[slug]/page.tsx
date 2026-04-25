// Owner: FE1 — Event Detail Page (Neon Cyberpunk)

'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import type { EventWithStats } from '@/types'
import { formatEventDate, spotsLeft, isPast } from '@/lib/utils'
import { CountdownTimer } from '@/components/public/CountdownTimer'
import { generateGoogleCalendarLink } from '@/lib/calendar/gcal-link'
import { CalendarDays, MapPin, Share2, Terminal, ShieldAlert } from 'lucide-react'

export default function EventPage() {
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
          if (!item) {
            setError('Event not found')
            return
          }
          setEvent({
            ...item,
            confirmed_count: Array.isArray(item.confirmed_count)
              ? item.confirmed_count[0]?.count ?? 0
              : item.confirmed_count ?? 0,
          })
        }
      } catch {
        setError('Failed to load event')
      } finally {
        setLoading(false)
      }
    }
    if (slug) loadEvent()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin glow" />
        <p className="text-amber-500/70 text-xs font-mono tracking-widest uppercase animate-pulse">Decrypting Payload...</p>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <ShieldAlert size={48} className="text-red-500" />
        <div className="text-red-500 font-bold bg-red-500/10 px-6 py-3 border border-red-500/30 rounded-lg">
          {error ?? '404 - Transmission Not Found'}
        </div>
      </div>
    )
  }

  const spots = spotsLeft(event.capacity ?? null, event.confirmed_count ?? 0)
  const closed = isPast(event.registration_closes_at ?? '')

  const calLink = event.starts_at ? generateGoogleCalendarLink({
    title: event.title,
    description: event.description ?? '',
    venue: event.venue ?? '',
    starts_at: event.starts_at,
    ends_at: event.ends_at ?? event.starts_at,
  }) : '#'

  return (
    <div className="min-h-screen relative overflow-hidden py-16 px-4">
      {/* Background visual elements */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-brand-900/40 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-accent-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 app-fade-in">
        
        <Link href="/" className="inline-flex items-center text-xs text-slate-400 hover:text-amber-400 transition-colors uppercase tracking-widest font-bold">
          <span className="mr-2">←</span> Return to Interface
        </Link>

        {/* Banner container */}
        <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-white/10 group">
          {event.banner_url ? (
            <>
              <img
                src={event.banner_url}
                alt={event.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center font-mono text-slate-600">
              <span className="tracking-widest">IMAGE_NOT_FOUND</span>
            </div>
          )}

          {/* Floating content inside banner */}
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-10 flex flex-col gap-3">
            <div className="flex">
              <span className="app-badge app-badge-brand backdrop-blur-md">
                {event.event_type ?? 'Event'}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tight text-shadow-lg">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="app-panel rounded-2xl p-6 md:p-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6 border-b border-white/5 pb-4">
                <Terminal size={16} /> Mission Briefing
              </h2>
              {event.description ? (
                <div className="prose prose-invert prose-amber min-w-full">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-light">
                    {event.description}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">No briefing details provided.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Meta Control Panel */}
            <div className="app-panel rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full" />
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Timestamp</p>
                  <p className="text-white flex items-center gap-2 font-medium">
                    <CalendarDays size={16} className="text-amber-500" />
                    {formatEventDate(event.starts_at ?? '')}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Coordinates</p>
                  <p className="text-white flex items-center gap-2 font-medium">
                    <MapPin size={16} className="text-amber-500" />
                    {event.venue ?? 'Venue TBA'}
                  </p>
                </div>

                {spots !== null && (
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Availability</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded bg-black/50 border border-white/5 ${
                        spots <= 0 ? 'text-red-400 border-red-500/30' : spots <= 10 ? 'text-amber-400 border-amber-500/30' : 'text-amber-400 border-amber-500/30'
                      }`}>
                      <div className={`w-2 h-2 rounded-full ${spots <= 0 ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`} />
                      <span className="font-bold">
                        {spots <= 0 ? 'Capacity Reached' : `${spots} Slots Open`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Console */}
            <div className="app-panel-muted rounded-2xl p-6 border border-white/5">
              <div className="mb-6">
                {closed ? (
                  <div className="app-alert-danger text-center font-mono">
                    REGISTRATION_LOCKED
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-center">Countdown</p>
                    <CountdownTimer target={event.registration_closes_at ?? ''} />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Link
                  href={`/events/${slug}/register`}
                  className={`flex items-center justify-center w-full py-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-300 ${
                    closed
                      ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
                      : 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]'
                  }`}
                >
                  {closed ? 'System Closed' : 'Initiate Access'}
                </Link>

                <a
                  href={calLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition text-sm font-medium"
                >
                  <CalendarDays size={16} /> Sync to Cal
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}