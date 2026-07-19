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

const QRScanner = dynamic(
  () =>
    import('./QRScanner'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[26rem] items-center justify-center  border border-[#243B72] bg-[#10224A] text-sm text-slate-400">
        Loading camera...
      </div>
    ),
  }
)

interface CheckInResult {
  leader_name: string
  team_name: string | null
  registration_type:
    | 'solo'
    | 'team'
  members: {
    full_name: string
    email: string
  }[]
  checked_in_at: string
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
  | 'success'
  | 'error'

export function CheckInPanel({
  eventId,
  organizerId,
  onCheckIn,
}: Props) {
  const [status, setStatus] =
    useState<Status>('idle')

  const [result, setResult] =
    useState<CheckInResult | null>(
      null
    )

  const [errorMsg, setErrorMsg] =
    useState<string | null>(
      null
    )

  const [scannerKey, setScannerKey] =
    useState(0)

  function resetScanner() {
    setTimeout(() => {
      setStatus('idle')
      setResult(null)
      setErrorMsg(null)

      setScannerKey(
        (
          current
        ) =>
          current + 1
      )
    }, 2800)
  }

  const handleScan =
    useCallback(
      async (
        decodedText: string
      ) => {
        const registrationId =
          parseUuidFromQr(
            decodedText
          )

        if (
          !registrationId
        ) {
          setStatus(
            'error'
          )

          setErrorMsg(
            'Invalid QR code.'
          )

          resetScanner()
          return
        }

        setStatus(
          'loading'
        )

        try {
          const res =
            await fetch(
              '/api/attendance',
              {
                method:
                  'POST',
                headers:
                  {
                    'Content-Type':
                      'application/json',
                  },
                body: JSON.stringify(
                  {
                    registration_id:
                      registrationId,
                    event_id:
                      eventId,
                    organizer_id:
                      organizerId,
                  }
                ),
              }
            )

          const {
            data,
            error,
          } =
            await res.json()

          if (error) {
            setStatus(
              'error'
            )

            setErrorMsg(
              error
            )
          } else {
            setStatus(
              'success'
            )

            setResult(
              data
            )

            onCheckIn?.()
          }
        } catch {
          setStatus(
            'error'
          )

          setErrorMsg(
            'Check-in failed.'
          )
        }

        resetScanner()
      },
      [
        eventId,
        organizerId,
        onCheckIn,
      ]
    )

  return (
    <div className="space-y-5">

      <div className=" border border-[#243B72] bg-[#10224A] p-5 ">

        {/* Header */}
        <div className="mb-5 flex items-center gap-3">

          <span className=" bg-[#0B1736] p-3 text-[#F5E62D]">
            <ScanLine
              size={18}
            />
          </span>

          <div>

            <h2 className="text-lg font-semibold text-white">
              Live Scanner
            </h2>

            <p className="text-sm text-slate-400">
              Scan one QR code
              at a time.
            </p>

          </div>

        </div>

        {/* Idle */}
        {status ===
          'idle' && (
          <QRScanner
            key={
              scannerKey
            }
            onScan={
              handleScan
            }
          />
        )}

        {/* Loading */}
        {status ===
          'loading' && (
          <div className="flex h-[26rem] flex-col items-center justify-center gap-3  border border-[#243B72] bg-[#0B1736]">

            <Loader2
              size={30}
              className="animate-spin text-[#F5E62D]"
            />

            <p className="text-sm font-medium text-[#F5E62D]">
              Verifying
              participant...
            </p>

          </div>
        )}

        {/* Success */}
        {status ===
          'success' &&
          result && (
            <div className=" border border-green-500/20 bg-green-500/10 p-6 text-center">

              <div className="mx-auto mb-4 inline-flex rounded-full bg-[#0B1736] p-3 text-green-400 ">

                <CheckCircle2
                  size={28}
                />

              </div>

              <p className="text-2xl font-semibold text-white">
                {
                  result.leader_name
                }
              </p>

              {result.team_name && (
                <p className="mt-2 text-sm text-slate-300">
                  Team:{' '}
                  {
                    result.team_name
                  }
                </p>
              )}

              {result.registration_type ===
                'team' &&
                result.members
                  .length >
                  0 && (
                  <div className="mx-auto mt-5 max-w-md  border border-[#243B72] bg-[#10224A] p-4 text-left">

                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">

                      <Users
                        size={
                          15
                        }
                        className="text-[#F5E62D]"
                      />

                      Team Members

                    </div>

                    <div className="space-y-2">

                      {result.members.map(
                        (
                          member
                        ) => (
                          <div
                            key={
                              member.email
                            }
                            className=" bg-[#0B1736] px-3 py-2 text-sm text-slate-300"
                          >
                            {
                              member.full_name
                            }
                          </div>
                        )
                      )}

                    </div>

                  </div>
                )}

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-green-400">
                Checked in at{' '}
                {new Date(
                  result.checked_in_at
                ).toLocaleTimeString(
                  'en-IN'
                )}
              </p>

            </div>
          )}

        {/* Error */}
        {status ===
          'error' && (
          <div className=" border border-red-500/20 bg-red-500/10 p-6 text-center">

            <div className="mx-auto mb-4 inline-flex rounded-full bg-[#0B1736] p-3 text-red-400 ">

              <AlertCircle
                size={28}
              />

            </div>

            <p className="text-lg font-semibold text-red-300">
              {
                errorMsg
              }
            </p>

          </div>
        )}

      </div>

    </div>
  )
}