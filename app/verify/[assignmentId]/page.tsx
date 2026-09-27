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
import { PosterHeading } from '@/components/brand/PosterHeading'
import { Starburst, Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

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
  Winner: '#F0C020',
  'Runner Up': '#1040C0',
  '2nd Runner Up': '#1B8A4A',
  Participation: '#6B6B6B',
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>
}) {
  const { assignmentId } = await params
  const result = await fetchVerification(assignmentId)

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Poster corner accents */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full border-4 border-border opacity-[0.08]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-primary-red opacity-[0.08]" />
      <RockShape variant={2} fill="#D6294C" className="pointer-events-none absolute left-6 bottom-10 hidden h-16 w-16 rotate-[-12deg] opacity-[0.15] sm:block" />
      <Sparkle className="pointer-events-none absolute right-10 top-16 h-4 w-4 text-primary-yellow opacity-60" />

      <div className="relative w-full max-w-lg z-10">
        {/* CINTEL header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-primary-yellow px-4 py-2 font-tech text-xs font-black uppercase tracking-[.18em] text-[#14120F] shadow-sm">
            <Shield size={14} />
            CINTEL Certificate Verification
          </span>
        </div>

        {result.status === 'verified' ? (
          /* ── 1. VERIFIED CERTIFICATE ─────────────────────────────────── */
          <div className="rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg p-8 text-center space-y-6">
            {/* Verified status badge — big pass circle with a starburst behind it */}
            <div className="relative flex flex-col items-center">
              <Starburst rings color="#3F8F52" className="pointer-events-none absolute -top-6 h-36 w-36 opacity-30" />
              <span className="relative mb-3 flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-success shadow-md">
                <CheckCircle2 size={46} className="text-white" strokeWidth={2.5} />
              </span>
              <span className="relative inline-flex items-center gap-1.5 rounded-full border-2 border-border bg-success text-white px-4 py-1.5 font-tech text-xs font-black uppercase tracking-[.2em]">
                Status: Verified
              </span>
            </div>

            {/* Participant Name */}
            <div>
              <p className="font-tech text-[11px] font-black uppercase tracking-widest text-foreground-soft">Participant Name</p>
              <PosterHeading as="h1" fillClassName="text-brand" className="mt-1 text-3xl">
                {result.participantName}
              </PosterHeading>
            </div>

            {/* Certificate Type */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 rounded-full border-2 border-border px-5 py-2 font-tech text-sm font-black uppercase tracking-widest text-white shadow-sm"
                style={{
                  background: CERT_TYPE_COLORS[result.certificateType ?? ''] ?? '#F0C020',
                }}
              >
                <Award size={16} />
                {result.certificateType}
              </span>
            </div>

            {/* Details Table Grid */}
            <div className="border-t-2 border-b-2 border-border py-4 grid grid-cols-2 gap-4 text-left text-xs">
              <div>
                <p className="font-tech uppercase tracking-widest text-foreground-soft font-black">Event Name</p>
                <p className="mt-1 font-bold text-foreground">{result.eventName}</p>
              </div>

              <div>
                <p className="font-tech uppercase tracking-widest text-foreground-soft font-black">Registration Type</p>
                <p className="mt-1 font-bold text-foreground flex items-center gap-1">
                  {result.registrationType === 'team' ? (
                    <>
                      <Users size={12} className="text-brand" /> Team Registration
                    </>
                  ) : (
                    <>
                      <User size={12} className="text-brand" /> Solo Registration
                    </>
                  )}
                </p>
              </div>

              {result.teamName && (
                <div>
                  <p className="font-tech uppercase tracking-widest text-foreground-soft font-black">Team Name</p>
                  <p className="mt-1 font-bold text-brand">{result.teamName}</p>
                </div>
              )}

              {result.issueDate && (
                <div>
                  <p className="font-tech uppercase tracking-widest text-foreground-soft font-black">Issue Date</p>
                  <p className="mt-1 font-bold text-foreground flex items-center gap-1">
                    <Calendar size={12} className="text-foreground-soft" /> {result.issueDate}
                  </p>
                </div>
              )}
            </div>

            {/* Footer / ID */}
            <div>
              <p className="text-xs leading-relaxed text-foreground-soft">
                This official certificate was issued by <span className="font-black text-foreground">CINTEL</span>, SRM Institute of Science and Technology.
              </p>
              <p className="mt-3 font-mono text-[10px] text-foreground-soft">
                Assignment ID: {result.assignmentId}
              </p>
            </div>
          </div>
        ) : result.status === 'unreleased' ? (
          /* ── 2. UNRELEASED CERTIFICATES ────────────────────────────── */
          <div className="rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-warning shadow-md">
                <Clock size={40} className="text-[#14120F]" strokeWidth={2.5} />
              </span>
            </div>

            <p className="font-tech text-xs font-black uppercase tracking-[.2em] text-warning">
              Certificates Not Released Yet
            </p>

            <p className="mt-4 text-sm leading-relaxed text-foreground-soft">
              Certificates for this event have not been released by the event organizer yet.
            </p>

            {result.eventName && (
              <p className="mt-2 text-xs font-bold text-foreground-soft">
                Event: {result.eventName}
              </p>
            )}

            <div className="mt-6 border-t-2 border-border pt-5">
              <p className="text-xs text-foreground-soft">
                Please check back once the organizer posts official certificates.
              </p>
            </div>
          </div>
        ) : result.status === 'unavailable' ? (
          /* ── 3. SERVICE UNAVAILABLE ────────────────────────────────── */
          <div className="rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-warning shadow-md">
                <AlertTriangle size={40} className="text-[#14120F]" strokeWidth={2.5} />
              </span>
            </div>

            <p className="font-tech text-xs font-black uppercase tracking-[.2em] text-warning">
              Verification Service Unavailable
            </p>

            <p className="mt-4 text-sm leading-relaxed text-foreground-soft">
              We couldn’t load this certificate right now. Please try again in a moment.
              <br />
              Please refresh or check back in a few moments.
            </p>
          </div>
        ) : (
          /* ── 4. INVALID / NOT FOUND — big fail circle ────────────────── */
          <div className="rounded-poster border-2 sm:border-4 border-border bg-panel shadow-lg p-8 text-center">
            <div className="mb-6 flex justify-center">
              <span className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-border bg-danger shadow-md">
                <XCircle size={40} className="text-white" strokeWidth={2.5} />
              </span>
            </div>

            <p className="font-tech text-xs font-black uppercase tracking-[.2em] text-danger">
              Certificate Not Found or Invalid
            </p>

            <p className="mt-4 text-sm leading-relaxed text-foreground-soft">
              This certificate could not be verified.
              <br />
              It may have been revoked or the verification link is invalid.
            </p>

            <div className="mt-6 border-t-2 border-border pt-5">
              <p className="text-xs text-foreground-soft">
                If you believe this is an error, contact your event organizer.
              </p>
            </div>
          </div>
        )}

        {/* Bottom CINTEL branding */}
        <div className="mt-6 text-center">
          <p className="font-tech text-[10px] font-bold uppercase tracking-[.22em] text-foreground-soft">
            CINTEL · SRM Institute of Science &amp; Technology
          </p>
        </div>
      </div>
    </main>
  )
}
