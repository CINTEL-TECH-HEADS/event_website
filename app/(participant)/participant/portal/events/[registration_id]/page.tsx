'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatEventDate } from '@/lib/utils'
import { QrCode, Users, Award, ArrowLeft, MapPin, Calendar, Hash } from 'lucide-react'

export default function RegistrationDetailPage() {
  const { registration_id } = useParams<{ registration_id: string }>()
  const [reg, setReg]         = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/participant/registrations/${registration_id}`)
      .then(r => r.json())
      .then(({ data }) => { setReg(data); setLoading(false) })
  }, [registration_id])

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-10 h-10 border-4 border-border border-t-brand rounded-full animate-spin" />
    </div>
  )

  if (!reg) return (
    <div className="flex items-center justify-center py-32">
      <p className="font-bold text-danger">Registration not found</p>
    </div>
  )

  const event    = reg.events
  const attended = Array.isArray(reg.attendance) ? reg.attendance.length > 0 : !!reg.attendance?.id
  const hasCert  = Array.isArray(reg.certificates) ? reg.certificates.length > 0 : !!reg.certificates?.id

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/participant/portal" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground-soft hover:text-foreground transition-colors mb-6">
        <ArrowLeft size={14} /> Back to My Events
      </Link>

      {/* Event Info */}
      <div className="relative overflow-hidden rounded-poster border-4 border-border bg-panel p-6 mb-4 shadow-lg">
        <span className="mb-2 block font-tech text-[10px] font-bold uppercase tracking-widest text-brand">
          {event?.event_type}
        </span>
        <h1 className="font-display text-2xl uppercase leading-tight tracking-tight text-foreground mb-4">{event?.title}</h1>

        <div className="space-y-2">
          {event?.starts_at && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Calendar size={14} className="text-brand shrink-0" />
              {formatEventDate(event.starts_at)}
            </div>
          )}
          {event?.venue && (
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <MapPin size={14} className="text-brand shrink-0" />
              {event.venue}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Hash size={14} className="text-brand shrink-0" />
            <span className="font-mono font-bold text-foreground">{reg.display_id}</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {reg.status === 'waitlisted' && (
            <span className="app-badge-warning app-badge">
              Waitlisted — position #{reg.waitlist_position}
            </span>
          )}
          {reg.status === 'confirmed' && !attended && (
            <span className="app-badge-neutral app-badge">
              Confirmed
            </span>
          )}
          {attended && (
            <span className="app-badge-success app-badge">
              Attended
            </span>
          )}
          {hasCert && (
            <span className="app-badge-warning app-badge">
              Certificate Ready
            </span>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href={`/participant/portal/events/${registration_id}/qr`}
          className="app-button-secondary !rounded-2xl !bg-panel !text-foreground !border-4 !flex-col !py-4 gap-2"
        >
          <QrCode size={22} className="text-accent" />
          <span className="text-sm normal-case">My QR Code</span>
        </Link>

        {reg.registration_type === 'team' && reg.is_leader && (
          <Link
            href={`/participant/portal/events/${registration_id}/team`}
            className="app-button-secondary !rounded-2xl !bg-panel-muted !text-foreground !border-4 !flex-col !py-4 gap-2"
          >
            <Users size={22} className="text-accent" />
            <span className="text-sm normal-case">Manage Team</span>
          </Link>
        )}

        <Link
          href={`/participant/portal/events/${registration_id}/certificate`}
          className={`app-button-secondary !rounded-2xl !border-4 !flex-col !py-4 gap-2 ${
            hasCert ? '!bg-primary-yellow !text-[#121212]' : '!bg-panel-muted !text-foreground'
          }`}
        >
          <Award size={22} className={hasCert ? 'text-[#121212]' : 'text-foreground-soft'} />
          <span className="text-sm normal-case">Certificate</span>
        </Link>
      </div>

      {/* Registration Answers */}
      {reg.answers?.length > 0 && (
        <div className="rounded-poster border-4 border-border bg-panel p-6 mb-4 shadow-md">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground mb-4">Your Answers</h2>
          <div className="space-y-4">
            {reg.answers.map((a: any) => (
              <div key={a.id} className="border-b-2 border-border pb-3 last:border-0 last:pb-0">
                <p className="text-xs font-bold uppercase tracking-wide text-foreground-soft mb-1">{a.form_fields?.label}</p>
                <p className="text-sm text-foreground font-medium">{a.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {reg.members?.length > 0 && (
        <div className="rounded-poster border-4 border-border bg-panel p-6 shadow-md">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground mb-4">Team Members</h2>
          <div className="space-y-3">
            {reg.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b-2 border-border last:border-0">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {m.full_name}
                    {m.is_leader && (
                      <span className="ml-2 text-xs text-brand font-bold">Leader</span>
                    )}
                  </p>
                  <p className="text-xs text-foreground-soft">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}