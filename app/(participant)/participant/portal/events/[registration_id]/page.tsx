'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { formatEventDate } from '@/lib/utils'
import { QrCode, Users, Award, ArrowLeft, MapPin, Calendar, Hash, Phone, IndianRupee, Clock } from 'lucide-react'

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
      <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
    </div>
  )

  if (!reg) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-red-400">Registration not found</p>
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

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/participant/portal" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
        <ArrowLeft size={14} /> Back to My Events
      </Link>

      {/* Event Info */}
      <div className="bg-slate-900/80 border border-white/10  p-6 mb-4">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2 block">
          {event?.event_type}
        </span>
        <h1 className="text-2xl font-semibold text-white mb-4">{event?.title}</h1>

        <div className="space-y-2">
          {event?.starts_at && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              {formatEventDate(event.starts_at)}
            </div>
          )}
          {event?.venue && (
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={14} className="text-amber-400 shrink-0" />
              {event.venue}
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <Hash size={14} className="text-amber-400 shrink-0" />
            <span className="font-mono font-bold text-white">{reg.display_id}</span>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {reg.status === 'waitlisted' && (
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              ⏳ Waitlisted — position #{reg.waitlist_position}
            </span>
          )}
          {reg.status === 'confirmed' && !attended && (
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              ✓ Confirmed
            </span>
          )}
          {attended && (
            <span className="text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
              ✓ Attended
            </span>
          )}
          {hasCert && (
            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              🎓 Certificate Ready
            </span>
          )}
        </div>
      </div>

      {/* Payment due / status */}
      {canPay && (
        <div className="mb-4 border border-[#F5E62D]/30 bg-[#F5E62D]/5 p-5">
          <div className="flex items-center gap-2 mb-1 text-amber-300">
            <IndianRupee size={16} />
            <h2 className="font-semibold text-white">Payment {reg.payment_status === 'rejected' ? 'needs to be redone' : 'pending'}</h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            {reg.payment_status === 'rejected'
              ? 'Your previous payment was rejected. Please pay again and resubmit your proof.'
              : `Complete the ₹${feeVal} payment to confirm your spot and receive your pass.`}
          </p>
          <Link
            href={`/participant/portal/events/${registration_id}/pay`}
            className="inline-flex items-center gap-2 bg-[#F5E62D] text-black px-5 py-2.5 text-sm font-bold hover:brightness-110 transition"
          >
            <IndianRupee size={15} /> {reg.payment_status === 'rejected' ? 'Pay again' : `Complete payment — ₹${feeVal}`}
          </Link>
        </div>
      )}
      {owesPayment && !canPay && (
        <div className="mb-4 border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          {isTeam && reg.is_leader && !teamComplete
            ? <>Add at least {event?.min_team_size} team members, then you can pay the ₹{feeVal} fee. Use <strong className="text-white">Manage Team</strong> below.</>
            : <>Waiting for your team leader to complete the ₹{feeVal} payment.</>}
        </div>
      )}
      {paymentUnderReview && (
        <div className="mb-4 flex items-center gap-2 border border-amber-500/25 bg-amber-500/10 p-4 text-sm text-amber-200">
          <Clock size={15} /> Payment submitted — awaiting organizer verification. Your pass appears once it&apos;s approved.
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Link
          href={`/participant/portal/events/${registration_id}/qr`}
          className="bg-white text-slate-950  p-4 text-center font-bold hover:bg-slate-100 transition-colors flex flex-col items-center gap-2"
        >
          <QrCode size={22} className="text-amber-500" />
          <span className="text-sm">My QR Code</span>
        </Link>

        {reg.registration_type === 'team' && reg.is_leader && (
          <Link
            href={`/participant/portal/events/${registration_id}/team`}
            className="bg-slate-800 border border-white/10 text-white  p-4 text-center font-bold hover:bg-[#112240] transition-colors flex flex-col items-center gap-2"
          >
            <Users size={22} className="text-amber-300" />
            <span className="text-sm">Manage Team</span>
          </Link>
        )}

        <Link
          href={`/participant/portal/events/${registration_id}/certificate`}
          className={`bg-slate-800 border  p-4 text-center font-bold transition-colors flex flex-col items-center gap-2 ${
            hasCert ? 'border-amber-500/30 text-amber-200 hover:bg-[#112240]' : 'border-white/10 text-slate-300 hover:bg-[#112240]'
          }`}
        >
          <Award size={22} className={hasCert ? 'text-amber-300' : 'text-slate-500'} />
          <span className="text-sm">Certificate</span>
        </Link>
      </div>

      {/* Registration Answers */}
      {reg.answers?.length > 0 && (
        <div className="bg-slate-900/80 border border-white/10  p-6 mb-4">
          <h2 className="font-semibold text-white mb-4">Your Answers</h2>
          <div className="space-y-4">
            {reg.answers.map((a: any) => (
              <div key={a.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <p className="text-xs text-slate-500 mb-1">{a.form_fields?.label}</p>
                <p className="text-sm text-white font-medium">{a.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      {reg.members?.length > 0 && (
        <div className="bg-slate-900/80 border border-white/10  p-6">
          <h2 className="font-semibold text-white mb-4">Team Members</h2>
          <div className="space-y-3">
            {reg.members.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">
                    {m.full_name}
                    {m.is_leader && (
                      <span className="ml-2 text-xs text-amber-400 font-bold">Leader</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{m.email}</p>
                  {confirmed && m.phone && (
                    <a href={`tel:${m.phone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200">
                      <Phone size={11} /> {m.phone}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          {confirmed && (
            <p className="mt-4 text-xs text-slate-500">Contact numbers are shared so your team can coordinate.</p>
          )}
        </div>
      )}
    </div>
  )
}