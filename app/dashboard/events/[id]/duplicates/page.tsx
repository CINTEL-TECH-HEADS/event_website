// Owner: FE2 - Duplicate Review page
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  Trash2,
  ShieldAlert,
} from 'lucide-react'

import {
  DuplicateFlag,
  RegistrationWithDetails,
} from '@/types'

interface DuplicateWithRegistration
  extends DuplicateFlag {
  registration?: RegistrationWithDetails
}

export default function DuplicateReviewPage() {
  const { id } =
    useParams<{ id: string }>()

  const [duplicates, setDuplicates] =
    useState<
      DuplicateWithRegistration[]
    >([])

  const [loading, setLoading] =
    useState(true)

  const [processing, setProcessing] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadDuplicates() {
      try {
        const res = await fetch(
          `/api/duplicates?event_id=${id}`
        )

        const { data } =
          await res.json()

        setDuplicates(
          (data || []).filter(
            (
              item: DuplicateFlag
            ) =>
              !item.reviewed
          )
        )
      } catch (error) {
        console.error(
          'Failed to load duplicates:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadDuplicates()
  }, [id])

  async function handleDismiss(
    duplicateId: string
  ) {
    setProcessing(
      duplicateId
    )

    try {
      const res = await fetch(
        `/api/duplicates/${duplicateId}/dismiss`,
        {
          method: 'POST',
        }
      )

      if (!res.ok)
        throw new Error()

      setDuplicates(
        duplicates.filter(
          (
            duplicate
          ) =>
            duplicate.id !==
            duplicateId
        )
      )
    } catch {
      alert(
        'Failed to dismiss duplicate'
      )
    } finally {
      setProcessing(null)
    }
  }

  async function handleDelete(
    duplicateId: string,
    registrationId: string
  ) {
    if (
      !confirm(
        'Delete this registration permanently?'
      )
    )
      return

    setProcessing(
      duplicateId
    )

    try {
      const res = await fetch(
        `/api/duplicates/${duplicateId}/delete`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            registration_id:
              registrationId,
          }),
        }
      )

      if (!res.ok)
        throw new Error()

      setDuplicates(
        duplicates.filter(
          (
            duplicate
          ) =>
            duplicate.id !==
            duplicateId
        )
      )
    } catch {
      alert(
        'Failed to delete registration'
      )
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="text-sm text-slate-400">
        Loading duplicate flags...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel rounded-[2rem] px-6 py-7 shadow-xl sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <ShieldAlert size={14} />
          Duplicate Review
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Keep registrations
          clean and trusted.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Review suspicious
          submissions, dismiss
          false positives, or
          remove duplicate
          entries.
        </p>

      </section>

      {/* Empty */}
      {duplicates.length ===
      0 ? (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-5 py-4 text-sm font-medium text-green-400">
          No duplicate
          registrations
          require review.
        </div>
      ) : (
        <div className="space-y-4">

          {duplicates.map(
            (
              duplicate
            ) => (
              <section
                key={
                  duplicate.id
                }
                className="rounded-[1.8rem] border border-[#243B72] bg-[#10224A] p-6 shadow-xl transition-all duration-300 hover:-translate-y-1"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* Left */}
                  <div className="space-y-4">

                    <div>

                      <h2 className="text-lg font-semibold text-white">
                        {duplicate
                          .registration
                          ?.leader_name ||
                          'Unknown'}
                      </h2>

                      <p className="mt-1 text-sm text-[#93C5FD]">
                        {duplicate
                          .registration
                          ?.leader_email ||
                          'No email'}
                      </p>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-[#F5E62D]">
                        {duplicate.reason ===
                        'same_name_phone'
                          ? 'Same Name & Phone'
                          : 'Rapid Submission'}
                      </span>

                      <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-slate-300">
                        Flagged{' '}
                        {new Date(
                          duplicate.created_at
                        ).toLocaleDateString(
                          'en-IN'
                        )}
                      </span>

                    </div>

                    {duplicate.registration && (
                      <div className="grid gap-3 rounded-[1.3rem] border border-[#243B72] bg-[#0B1736] p-4 text-sm text-slate-300 sm:grid-cols-2">

                        <div>
                          Registration ID
                          <div className="font-semibold text-white">
                            {
                              duplicate
                                .registration
                                .display_id
                            }
                          </div>
                        </div>

                        <div>
                          Type
                          <div className="font-semibold text-white">
                            {duplicate
                              .registration
                              .registration_type ===
                            'solo'
                              ? 'Solo'
                              : 'Team'}
                          </div>
                        </div>

                        <div>
                          Status
                          <div className="font-semibold capitalize text-white">
                            {
                              duplicate
                                .registration
                                .status
                            }
                          </div>
                        </div>

                        <div>
                          Registered
                          <div className="font-semibold text-white">
                            {new Date(
                              duplicate
                                .registration
                                .registered_at
                            ).toLocaleString(
                              'en-IN'
                            )}
                          </div>
                        </div>

                      </div>
                    )}

                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">

                    <button
                      onClick={() =>
                        handleDismiss(
                          duplicate.id
                        )
                      }
                      disabled={
                        processing ===
                        duplicate.id
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50"
                    >
                      <Check size={16} />
                      Dismiss
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          duplicate.id,
                          duplicate.registration_id
                        )
                      }
                      disabled={
                        processing ===
                        duplicate.id
                      }
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>

                  </div>

                </div>

              </section>
            )
          )}

        </div>
      )}

      {/* Footer */}
      <div className="rounded-2xl border border-[#243B72] bg-[#10224A] px-5 py-4 text-sm text-slate-300">
        Dismiss marks a flag
        as reviewed. Delete
        permanently removes
        the duplicate
        registration.
      </div>

    </div>
  )
}