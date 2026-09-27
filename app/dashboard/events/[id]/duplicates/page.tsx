// Owner: FE2 - Duplicate Review page
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  Trash2,
  ShieldAlert,
} from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

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
      <div className="text-sm font-medium text-foreground-soft">
        Loading duplicate flags...
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <DashboardPageHeader
        icon={ShieldAlert}
        kicker="Duplicates"
        title="Possible duplicate registrations"
        description={'Registrations flagged as likely duplicates. Dismiss false positives or remove the extra entry.'}
      />

      {/* Empty */}
      {duplicates.length ===
      0 ? (
        <div className="app-alert-success">
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
                className="rounded-2xl border-2 border-brand border-l-8 bg-panel p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 md:border-4 md:border-l-8"
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                  {/* Left */}
                  <div className="space-y-4">

                    <div>

                      <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
                        {duplicate
                          .registration
                          ?.leader_name ||
                          'Unknown'}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-accent">
                        {duplicate
                          .registration
                          ?.leader_email ||
                          'No email'}
                      </p>

                    </div>

                    <div className="flex flex-wrap gap-2">

                      <span className="app-badge app-badge-danger">
                        {duplicate.reason ===
                        'same_name_phone'
                          ? 'Same Name & Phone'
                          : 'Rapid Submission'}
                      </span>

                      <span className="app-badge app-badge-neutral">
                        Flagged{' '}
                        {new Date(
                          duplicate.created_at
                        ).toLocaleDateString(
                          'en-IN'
                        )}
                      </span>

                    </div>

                    {duplicate.registration && (
                      <div className="grid gap-3 rounded-xl border-2 border-border bg-panel-muted p-4 text-sm font-medium text-foreground-soft sm:grid-cols-2">

                        <div>
                          Registration ID
                          <div className="font-bold text-foreground">
                            {
                              duplicate
                                .registration
                                .display_id
                            }
                          </div>
                        </div>

                        <div>
                          Type
                          <div className="font-bold text-foreground">
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
                          <div className="font-bold capitalize text-foreground">
                            {
                              duplicate
                                .registration
                                .status
                            }
                          </div>
                        </div>

                        <div>
                          Registered
                          <div className="font-bold text-foreground">
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
                      className="app-button-success"
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
                      className="app-button-danger"
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
      <div className="app-alert-info">
        Dismiss marks a flag
        as reviewed. Delete
        permanently removes
        the duplicate
        registration.
      </div>

    </div>
  )
}