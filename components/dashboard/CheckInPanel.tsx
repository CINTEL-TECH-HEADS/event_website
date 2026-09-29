// Owner: FE2
'use client'

import dynamic from 'next/dynamic'
import {
  useCallback,
  useState,
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ScanLine,
  Users,
} from 'lucide-react'
import { parseUuidFromQr } from '@/lib/qr/parse'
import { TeamCheckInList, type CheckInMember } from './TeamCheckInList'

const QRScanner = dynamic(
  () =>
    import('./QRScanner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[26rem] items-center justify-center rounded-2xl border-2 border-border bg-panel text-sm font-medium text-foreground-soft sm:border-4">
        Loading camera...
      </div>
    ),
  }
)

// What POST /api/attendance returns (lib/attendance/set.ts AttendanceState).
export interface CheckInResult {
  registration_id: string
  leader_name: string
  team_name: string | null
  registration_type: 'solo' | 'team'
  members: CheckInMember[]
  checked_in_at: string | null
  needs_members?: boolean
}

interface Props {
  eventId: string
  organizerId: string
  // Fired after a successful check-in so siblings (e.g. the live counter) refresh.
  onCheckIn?: () => void
}

type Status =
  | 'idle'
  | 'loading'
  | 'members'
  | 'success'
  | 'error'

export function CheckInPanel({
  eventId,
  onCheckIn,
}: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [scannerKey, setScannerKey] = useState(0)

  function scanAgain() {
    setStatus('idle')
    setResult(null)
    setErrorMsg(null)
    setScannerKey((current) => current + 1)
  }

  function resetScanner() {
    setTimeout(scanAgain, 2800)
  }

  const post = useCallback(
    async (registrationId: string, memberIds?: string[]) => {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: registrationId, event_id: eventId, member_ids: memberIds }),
      })
      return res.json() as Promise<{ data: CheckInResult | null; error: string | null }>
    },
    [eventId]
  )

  const handleScan = useCallback(
    async (decodedText: string) => {
      const registrationId = parseUuidFromQr(decodedText)

      if (!registrationId) {
        setStatus('error')
        setErrorMsg('Invalid QR code.')
        resetScanner()
        return
      }

      setStatus('loading')

      try {
        const { data, error } = await post(registrationId)
        if (error || !data) {
          setStatus('error')
          setErrorMsg(error ?? 'Check-in failed.')
        } else if (data.needs_members) {
          // Team pass: ask who is here before recording anything.
          setResult(data)
          setStatus('members')
          return
        } else {
          setStatus('success')
          setResult(data)
          onCheckIn?.()
        }
      } catch {
        setStatus('error')
        setErrorMsg('Check-in failed.')
      }

      resetScanner()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post, onCheckIn]
  )

  async function confirmMembers(presentIds: string[]) {
    if (!result) return
    setSaving(true)
    try {
      const { data, error } = await post(result.registration_id, presentIds)
      if (error || !data) {
        setStatus('error')
        setErrorMsg(error ?? 'Check-in failed.')
      } else {
        setStatus('success')
        setResult(data)
        onCheckIn?.()
      }
    } catch {
      setStatus('error')
      setErrorMsg('Check-in failed.')
    } finally {
      setSaving(false)
    }
    resetScanner()
  }

  const presentMembers = result?.members.filter((m) => m.checked_in_at) ?? []

  return (
    <div className="space-y-5">

      <div className="rounded-2xl border-2 border-border bg-panel p-5 sm:border-4">

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-brand">
            <ScanLine size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
              Live Scanner
            </h2>
            <p className="text-sm font-medium text-foreground-soft">
              Scan one QR code at a time. For a team, tick who is here.
            </p>
          </div>
        </div>

        {/* Idle */}
        {status === 'idle' && (
          <QRScanner key={scannerKey} onScan={handleScan} />
        )}

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex h-[26rem] flex-col items-center justify-center gap-3 rounded-2xl border-4 border-border bg-panel-muted">
            <Loader2 size={30} className="animate-spin text-brand" />
            <p className="text-sm font-bold uppercase tracking-widest text-brand">
              Verifying participant...
            </p>
          </div>
        )}

        {/* Team pass — who is here? */}
        {status === 'members' && result && (
          <div className="rounded-2xl border-4 border-border bg-panel-muted p-4 sm:p-5">
            <div className="mb-4 flex items-start gap-3">
              <span className="rounded-xl border-2 border-border bg-panel p-2.5 text-brand">
                <Users size={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-foreground">
                  {result.team_name ?? result.leader_name}
                </p>
                <p className="text-sm font-medium text-foreground-soft">
                  Tick the members who are here, then confirm.
                </p>
              </div>
            </div>
            <TeamCheckInList
              members={result.members}
              saving={saving}
              requireOne
              confirmLabel="Confirm check-in"
              onConfirm={confirmMembers}
              onCancel={scanAgain}
            />
          </div>
        )}

        {/* Success — full-frame flash overlay */}
        {status === 'success' && result && (
          <div className="flex h-[26rem] flex-col items-center justify-center overflow-y-auto rounded-2xl border-4 border-success bg-success p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 inline-flex rounded-full border-2 border-border bg-panel p-3 text-success">
              <CheckCircle2 size={28} />
            </div>

            <p className="text-2xl font-black text-white">
              {result.leader_name}
            </p>

            {result.team_name && (
              <p className="mt-2 text-sm font-medium text-white/90">
                Team: {result.team_name}
              </p>
            )}

            {result.registration_type === 'team' && result.members.length > 0 && (
              <div className="mx-auto mt-5 w-full max-w-md rounded-xl border-2 border-border bg-panel p-4 text-left">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
                  <Users size={15} className="text-brand" />
                  {presentMembers.length} of {result.members.length} present
                </div>
                <div className="space-y-2">
                  {result.members.map((member) => (
                    <div
                      key={member.id}
                      className={`rounded-lg px-3 py-2 text-sm font-medium ${
                        member.checked_in_at ? 'bg-success/15 text-foreground' : 'bg-panel-muted text-foreground-soft line-through'
                      }`}
                    >
                      {member.full_name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.checked_in_at && (
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-white">
                Checked in at {new Date(result.checked_in_at).toLocaleTimeString('en-IN')}
              </p>
            )}
          </div>
        )}

        {/* Error — full-frame flash overlay */}
        {status === 'error' && (
          <div className="flex h-[26rem] flex-col items-center justify-center rounded-2xl border-4 border-danger bg-danger p-6 text-center shadow-lg">
            <div className="mx-auto mb-4 inline-flex rounded-full border-2 border-border bg-panel p-3 text-danger">
              <AlertCircle size={28} />
            </div>
            <p className="text-lg font-black text-white">
              {errorMsg}
            </p>
          </div>
        )}

      </div>

    </div>
  )
}
