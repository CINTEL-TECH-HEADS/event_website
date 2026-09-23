// app/verify/[assignmentId]/page.tsx
//
// PUBLIC certificate verification page.
// Accessible without any login.
// Route: /verify/<assignment-id>
//
// Displays:
//   1. ✓ CERTIFICATE VERIFIED (Participant Name, Event Name, Certificate Type, Registration Type, Team Name, Issue Date, Status Verified)
//   2. ⏳ CERTIFICATES NOT RELEASED YET
//   3. ✗ CERTIFICATE NOT FOUND / INVALID CERTIFICATE
//   4. ⚠ VERIFICATION SERVICE UNAVAILABLE

import { Metadata } from 'next'
import { CheckCircle2, XCircle, Shield, Award, AlertTriangle, Clock, Users, User, Calendar } from 'lucide-react'

interface VerifyResult {
  status: 'verified' | 'unreleased' | 'not_found' | 'unavailable'
  valid: boolean
  participantName?: string
  teamName?: string | null
  certificateType?: string
  registrationType?: 'solo' | 'team'
  eventName?: string
  issueDate?: string
  assignmentId?: string
  error?: string
}

async function fetchVerification(assignmentId: string): Promise<VerifyResult> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/verify/${assignmentId}`, { cache: 'no-store' })
    const json = await res.json()
    if (res.status === 200 && json.data?.valid) {
      return json.data
    } else if (res.status === 403 || json.data?.status === 'unreleased') {
      return { status: 'unreleased', valid: false, eventName: json.data?.eventName }
    } else if (res.status === 404) {
      return { status: 'not_found', valid: false }
    } else if (res.status >= 500 || json.data?.status === 'unavailable') {
      return { status: 'unavailable', valid: false, error: json.error }
    }
    return json.data ?? { status: 'not_found', valid: false }
  } catch {
    return { status: 'unavailable', valid: false }
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ assignmentId: string }> }
): Promise<Metadata> {
  const { assignmentId } = await params
  const result = await fetchVerification(assignmentId)

  if (result.status === 'verified' && result.participantName) {
    return {
      title: `Certificate Verified — ${result.participantName} | CINTEL`,
      description: `${result.certificateType} certificate for ${result.participantName} at ${result.eventName}`,
    }
  } else if (result.status === 'unreleased') {
    return {
      title: 'Certificates Not Released Yet | CINTEL',
      description: 'Certificates for this event have not been released yet.',
    }
  } else if (result.status === 'unavailable') {
    return {
      title: 'Verification Service Unavailable | CINTEL',
      description: 'Verification service is temporarily unavailable.',
    }
  }
  return {
    title: 'Certificate Not Found | CINTEL',
    description: 'This certificate could not be verified.',
  }
}

const CERT_TYPE_COLORS: Record<string, string> = {
  Winner: '#F5E62D',
  'Runner Up': '#93C5FD',
  '2nd Runner Up': '#86EFAC',
  Participation: '#CBD5E1',
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const result = await fetchVerification(assignmentId)

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#070E1E] via-[#0B1736] to-[#070E1E] p-4">
      {/* Grid overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.03) 1px,transparent 1px)',
          backgroundSize: '36px 36px',
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* CINTEL header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 border border-[rgba(245,230,45,.35)] bg-[rgba(245,230,45,.08)] px-4 py-2 text-xs font-extrabold uppercase tracking-[.18em] text-[#F5E62D]">
            <Shield size={14} />
            CINTEL Certificate Verification
          </span>
        </div>

        {result.status === 'verified' ? (
          /* ── 1. VERIFIED CERTIFICATE ─────────────────────────────────── */
          <div className="border border-[#243B72] bg-[#0E1F4A] p-8 text-center shadow-[0_0_60px_rgba(245,230,45,.06)] space-y-6">
            {/* Verified status badge */}
            <div className="flex flex-col items-center">
              <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/10">
                <CheckCircle2 size={42} className="text-emerald-400" />
              </span>
              <span className="inline-flex items-center gap-1.5 border border-emerald-400/40 bg-emerald-500/10 px-4 py-1.5 text-xs font-extrabold uppercase tracking-[.2em] text-emerald-400">
                Status: Verified
              </span>
            </div>

            {/* Participant Name */}
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Participant Name</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                {result.participantName}
              </h1>
            </div>

            {/* Certificate Type */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 border px-5 py-2 text-sm font-extrabold uppercase tracking-widest"
                style={{
                  borderColor: `${CERT_TYPE_COLORS[result.certificateType ?? ''] ?? '#F5E62D'}55`,
                  color: CERT_TYPE_COLORS[result.certificateType ?? ''] ?? '#F5E62D',
                  background: `${CERT_TYPE_COLORS[result.certificateType ?? ''] ?? '#F5E62D'}12`,
                }}
              >
                <Award size={16} />
                {result.certificateType}
              </span>
            </div>

            {/* Details Table Grid */}
            <div className="border-t border-b border-[#243B72] py-4 grid grid-cols-2 gap-4 text-left text-xs">
              <div>
                <p className="uppercase tracking-widest text-slate-500 font-bold">Event Name</p>
                <p className="mt-1 font-semibold text-slate-200">{result.eventName}</p>
              </div>

              <div>
                <p className="uppercase tracking-widest text-slate-500 font-bold">Registration Type</p>
                <p className="mt-1 font-semibold text-slate-200 flex items-center gap-1">
                  {result.registrationType === 'team' ? (
                    <>
                      <Users size={12} className="text-amber-400" /> Team Registration
                    </>
                  ) : (
                    <>
                      <User size={12} className="text-amber-400" /> Solo Registration
                    </>
                  )}
                </p>
              </div>

              {result.teamName && (
                <div>
                  <p className="uppercase tracking-widest text-slate-500 font-bold">Team Name</p>
                  <p className="mt-1 font-semibold text-amber-300">{result.teamName}</p>
                </div>
              )}

              {result.issueDate && (
                <div>
                  <p className="uppercase tracking-widest text-slate-500 font-bold">Issue Date</p>
                  <p className="mt-1 font-semibold text-slate-200 flex items-center gap-1">
                    <Calendar size={12} className="text-slate-400" /> {result.issueDate}
                  </p>
                </div>
              )}
            </div>

            {/* Footer / ID */}
            <div>
              <p className="text-xs leading-relaxed text-slate-400">
                This official certificate was issued by <span className="font-bold text-white">CINTEL</span>, SRM Institute of Science and Technology.
              </p>
              <p className="mt-3 font-mono text-[10px] text-slate-500">
                Assignment ID: {result.assignmentId}
              </p>
            </div>
          </div>
        ) : result.status === 'unreleased' ? (
          /* ── 2. UNRELEASED CERTIFICATES ────────────────────────────── */
          <div className="border border-amber-500/40 bg-[#0E1F4A] p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-500/10">
                <Clock size={40} className="text-amber-400" />
              </span>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-400">
              Certificates Not Released Yet
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Certificates for this event have not been released by the event organizer yet.
            </p>

            {result.eventName && (
              <p className="mt-2 text-xs font-semibold text-slate-400">
                Event: {result.eventName}
              </p>
            )}

            <div className="mt-6 border-t border-[#243B72] pt-5">
              <p className="text-xs text-slate-500">
                Please check back once the organizer posts official certificates.
              </p>
            </div>
          </div>
        ) : result.status === 'unavailable' ? (
          /* ── 3. SERVICE UNAVAILABLE ────────────────────────────────── */
          <div className="border border-amber-500/40 bg-[#0E1F4A] p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-500/10">
                <AlertTriangle size={40} className="text-amber-400" />
              </span>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-400">
              Verification Service Unavailable
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              The verification system is currently experiencing temporary connection issues.
              <br />
              Please refresh or check back in a few moments.
            </p>
          </div>
        ) : (
          /* ── 4. INVALID / NOT FOUND ────────────────────────────────── */
          <div className="border border-[#243B72] bg-[#0E1F4A] p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-red-400/40 bg-red-500/10">
                <XCircle size={40} className="text-red-400" />
              </span>
            </div>

            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-red-400">
              Certificate Not Found or Invalid
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              This certificate could not be verified.
              <br />
              It may have been revoked or the verification link is invalid.
            </p>

            <div className="mt-6 border-t border-[#243B72] pt-5">
              <p className="text-xs text-slate-600">
                If you believe this is an error, contact your event organizer.
              </p>
            </div>
          </div>
        )}

        {/* Bottom CINTEL branding */}
        <div className="mt-6 text-center">
          <p className="text-[10px] uppercase tracking-[.22em] text-slate-600">
            CINTEL · SRM Institute of Science &amp; Technology
          </p>
        </div>
      </div>
    </main>
  )
}
