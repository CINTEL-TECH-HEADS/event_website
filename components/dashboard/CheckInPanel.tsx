// Owner: FE2
'use client'
import dynamic from 'next/dynamic'
import { useCallback, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, ScanLine } from 'lucide-react'

const QRScanner = dynamic(() => import('./QRScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[26rem] items-center justify-center rounded-[1.75rem] bg-slate-100 text-sm text-slate-400">
      Loading camera...
    </div>
  ),
})

interface CheckInResult {
  leader_name: string
  team_name: string | null
  registration_type: 'solo' | 'team'
  members: { full_name: string; email: string }[]
  checked_in_at: string
}

interface Props {
  eventId: string
  organizerId: string
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function parseUuidFromQr(content: string): string | null {
  const match = content.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  )
  return match ? match[0] : null
}

export function CheckInPanel({ eventId, organizerId }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [scannerKey, setScannerKey] = useState(0)

  const resetScanner = () => {
    setTimeout(() => {
      setStatus('idle')
      setResult(null)
      setErrorMsg(null)
      setScannerKey((current) => current + 1)
    }, 3000)
  }

  const handleScan = useCallback(
    async (decodedText: string) => {
      const registrationId = parseUuidFromQr(decodedText)
      if (!registrationId) {
        setStatus('error')
        setErrorMsg('Invalid QR code. Please try again.')
        resetScanner()
        return
      }

      setStatus('loading')
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          event_id: eventId,
          organizer_id: organizerId,
        }),
      })

      const { data, error } = await res.json()
      if (error) {
        setStatus('error')
        setErrorMsg(error)
      } else {
        setStatus('success')
        setResult(data)
      }

      resetScanner()
    },
    [eventId, organizerId]
  )

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-2xl bg-blue-50 p-3 text-brand-600">
            <ScanLine size={18} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Live scanner</h2>
            <p className="text-sm text-slate-500">Scan one QR at a time for the smoothest flow.</p>
          </div>
        </div>

        {status === 'idle' && <QRScanner key={scannerKey} onScan={handleScan} />}

        {status === 'loading' && (
          <div className="flex h-[26rem] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-blue-100 bg-blue-50/70">
            <Loader2 size={28} className="animate-spin text-brand-600" />
            <p className="text-sm font-medium text-brand-700">Checking participant in...</p>
          </div>
        )}

        {status === 'success' && result && (
          <div className="rounded-[1.75rem] border border-amber-100 bg-amber-50/80 p-6 text-center app-pulse-soft">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-white p-3 text-green-600 shadow-sm">
              <CheckCircle2 size={28} />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-amber-900">
              {result.leader_name}
            </p>
            {result.team_name && (
              <p className="mt-2 text-sm text-amber-700">Team: {result.team_name}</p>
            )}
            {result.registration_type === 'team' && result.members.length > 0 && (
              <div className="mx-auto mt-4 max-w-md space-y-2 rounded-[1.35rem] bg-white/90 p-4 text-left text-sm text-slate-600">
                {result.members.map((member) => (
                  <div key={member.email} className="rounded-2xl bg-slate-50 px-3 py-2">
                    {member.full_name}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-amber-700">
              Checked in at {new Date(result.checked_in_at).toLocaleTimeString('en-IN')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="rounded-[1.75rem] border border-red-100 bg-red-50/80 p-6 text-center">
            <div className="mx-auto mb-4 inline-flex rounded-full bg-white p-3 text-red-500 shadow-sm">
              <AlertCircle size={28} />
            </div>
            <p className="text-lg font-semibold text-red-700">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  )
}
