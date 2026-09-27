'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatEventDate } from '@/lib/utils'
import { QrCode, Users, Award, MapPin, Calendar, Hash, Phone, IndianRupee, Clock } from 'lucide-react'
import { PageHeader } from '@/components/site/PageHeader'
import { EVENT_TYPE_LABELS } from '@/lib/club'

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
  const feeVal   = event?.fee ?? 0
  const confirmed = reg.status === 'confirmed' && (reg.payment_status === 'paid' || feeVal === 0)
  const isTeam   = reg.registration_type === 'team'
  const teamComplete = !isTeam || (reg.members?.length ?? 0) >= (event?.min_team_size ?? 1)
  const owesPayment = feeVal > 0 && reg.status === 'confirmed' &&
                      (reg.payment_status === 'pending' || reg.payment_status === 'rejected')
  const canPay   = owesPayment && teamComplete && (!isTeam || reg.is_leader)
  const paymentUnderReview = feeVal > 0 && reg.payment_status === 'submitted'

  const actionCls = 'flex items-center gap-3 rounded-xl border-2 border-border px-4 py-3 text-sm font-bold text-foreground transition-colors duration-200 hover:bg-panel-muted'

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        back={{ href: '/participant/portal', label: 'My events' }}
        kicker={EVENT_TYPE_LABELS[event?.event_type] ?? event?.event_type}
        title={event?.title}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* Payment due / status */}
          {canPay && (
            <div className="rounded-2xl border-2 border-border bg-warning/30 p-5 shadow-sm">
              <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-wide text-foreground">
                <IndianRupee size={16} className="text-brand" />
                Payment {reg.payment_status === 'rejected' ? 'needs to be redone' : 'pending'}
              </h2>
              <p className="mt-2 mb-4 text-sm font-medium text-foreground">
                {reg.payment_status === 'rejected'
                  ? 'Your previous payment was rejected. Please pay again and resubmit your proof.'
                  : `Complete the ₹${feeVal} payment to confirm your spot and receive your pass.`}
              </p>
              <Link href={`/participant/portal/events/${registration_id}/pay`} className="app-button-primary">
                <IndianRupee size={15} /> {reg.payment_status === 'rejected' ? 'Pay again' : `Complete payment — ₹${feeVal}`}
              </Link>
            </div>
          )}
          {owesPayment && !canPay && (
            <p className="rounded-2xl border-2 border-border bg-panel-muted p-4 text-sm font-medium text-foreground-soft">
              {isTeam && reg.is_leader && !teamComplete
                ? <>Add at least {event?.min_team_size} team members, then you can pay the ₹{feeVal} fee. Use <strong className="text-foreground">Manage team</strong>.</>
                : <>Waiting for your team leader to complete the ₹{feeVal} payment.</>}
            </p>
          )}
          {paymentUnderReview && (
            <p className="flex items-center gap-2 rounded-2xl border-2 border-border bg-warning/30 p-4 text-sm font-medium text-foreground">
              <Clock size={15} className="shrink-0" /> Payment submitted — awaiting organizer verification. Your pass appears once it&apos;s approved.
            </p>
          )}

          {/* Team Members */}
          {reg.members?.length > 0 && (
            <section className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
              <h2 className="font-display text-sm uppercase tracking-wide text-foreground">Team members</h2>
              <ul className="mt-3 divide-y-2 divide-border">
                {reg.members.map((m: any) => (
                  <li key={m.id} className="py-3">
                    <p className="text-sm font-bold text-foreground">
                      {m.full_name}
                      {m.is_leader && <span className="ml-2 text-xs font-bold text-brand">Leader</span>}
                    </p>
                    <p className="text-xs text-foreground-soft">{m.email}</p>
                    {confirmed && m.phone && (
                      <a href={`tel:${m.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-brand">
                        <Phone size={11} /> {m.phone}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              {confirmed && (
                <p className="mt-2 text-xs font-medium text-foreground-soft">Contact numbers are shared so your team can coordinate.</p>
              )}
            </section>
          )}

          {/* Registration Answers */}
          {reg.answers?.length > 0 && (
            <section className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
              <h2 className="font-display text-sm uppercase tracking-wide text-foreground">Your answers</h2>
              <dl className="mt-3 divide-y-2 divide-border">
                {reg.answers.map((a: any) => (
                  <div key={a.id} className="py-3">
                    <dt className="text-xs font-bold uppercase tracking-wide text-foreground-soft">{a.form_fields?.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{a.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Registration facts + actions */}
        <aside className="space-y-4 lg:sticky lg:top-28">
          <div className="rounded-2xl border-2 border-border bg-panel p-5 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {reg.status === 'waitlisted' && (
                <span className="app-badge-warning app-badge">Waitlisted — position #{reg.waitlist_position}</span>
              )}
              {reg.status === 'confirmed' && !attended && <span className="app-badge-neutral app-badge">Confirmed</span>}
              {attended && <span className="app-badge-success app-badge">Attended</span>}
              {hasCert && <span className="app-badge-warning app-badge">Certificate ready</span>}
            </div>
            <div className="mt-4 space-y-2 text-sm font-medium text-foreground">
              {event?.starts_at && (
                <p className="flex items-start gap-2"><Calendar size={14} className="mt-0.5 shrink-0 text-brand" />{formatEventDate(event.starts_at)}</p>
              )}
              {event?.venue && (
                <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 shrink-0 text-brand" />{event.venue}</p>
              )}
              <p className="flex items-center gap-2"><Hash size={14} className="shrink-0 text-brand" /><span className="font-mono font-bold">{reg.display_id}</span></p>
            </div>
          </div>

          <nav className="space-y-2" aria-label="Registration actions">
            <Link href={`/participant/portal/events/${registration_id}/qr`} className={`${actionCls} bg-panel`}>
              <QrCode size={18} className="text-accent" /> QR pass
            </Link>
            {reg.registration_type === 'team' && reg.is_leader && (
              <Link href={`/participant/portal/events/${registration_id}/team`} className={`${actionCls} bg-panel`}>
                <Users size={18} className="text-accent" /> Manage team
              </Link>
            )}
            <Link
              href={`/participant/portal/events/${registration_id}/certificate`}
              className={`${actionCls} ${hasCert ? 'bg-primary-yellow !text-[#121212]' : 'bg-panel'}`}
            >
              <Award size={18} className={hasCert ? 'text-[#121212]' : 'text-foreground-soft'} /> Certificate
            </Link>
          </nav>
        </aside>
      </div>
    </div>
  )
}
