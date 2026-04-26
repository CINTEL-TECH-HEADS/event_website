// Owner: FE2 - Notifications page
'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Bell,
} from 'lucide-react'

type NotificationType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'venue_change'
  | 'time_change'
  | 'cancellation'

type Channel =
  | 'email'
  | 'whatsapp'

const NOTIFICATION_TYPES = [
  {
    value: 'confirmation',
    label: 'Confirmation Email',
  },
  {
    value: 'reminder_24h',
    label: '24-Hour Reminder',
  },
  {
    value: 'reminder_1h',
    label: '1-Hour Reminder',
  },
  {
    value: 'venue_change',
    label: 'Venue Change Alert',
  },
  {
    value: 'time_change',
    label: 'Time Change Alert',
  },
  {
    value: 'cancellation',
    label: 'Cancellation Notice',
  },
] as const

const CHANNELS = [
  {
    value: 'email',
    label: 'Email',
    icon: Mail,
  },
  {
    value: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageSquare,
  },
] as const

export default function NotificationsPage() {
  const { id } =
    useParams<{ id: string }>()

  const [
    notificationType,
    setNotificationType,
  ] =
    useState<NotificationType>(
      'confirmation'
    )

  const [channel, setChannel] =
    useState<Channel>('email')

  const [
    customMessage,
    setCustomMessage,
  ] = useState('')

  const [
    selectedRegistrations,
    setSelectedRegistrations,
  ] = useState<
    'all' | 'custom'
  >('all')

  const [sending, setSending] =
    useState(false)

  const [sentCount, setSentCount] =
    useState<number | null>(
      null
    )

  async function handleSendNotification() {
    if (
      !confirm(
        `Send ${channel} notification to selected participants?`
      )
    ) {
      return
    }

    setSending(true)
    setSentCount(null)

    try {
      const res = await fetch(
        '/api/notifications',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            event_id: id,
            type: notificationType,
            channel,
            ...(customMessage && {
              custom_message:
                customMessage,
            }),
            target:
              selectedRegistrations ===
              'all'
                ? 'all_confirmed'
                : 'custom',
          }),
        }
      )

      if (!res.ok) {
        throw new Error()
      }

      const {
        sent_count,
      } =
        await res.json()

      setSentCount(
        sent_count || 0
      )

      setCustomMessage('')
    } catch {
      alert(
        'Failed to send notifications.'
      )
    } finally {
      setSending(false)
    }
  }

  const optionClass = (
    active: boolean
  ) =>
    `cursor-pointer rounded-2xl border px-4 py-4 transition ${
      active
        ? 'border-[#F5E62D] bg-[#0B1736] text-[#F5E62D]'
        : 'border-[#243B72] bg-[#10224A] text-slate-300 hover:border-[#F5E62D] hover:text-white'
    }`

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <Bell size={14} />
          Notifications
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Reach participants
          quickly and clearly.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Send reminders,
          confirmations,
          updates, and urgent
          announcements instantly.
        </p>

      </section>

      {/* Main */}
      <section className="app-panel rounded-[2rem] p-6">

        <div className="grid gap-6">

          {/* Type */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Notification Type
            </label>

            <div className="grid gap-3 md:grid-cols-2">

              {NOTIFICATION_TYPES.map(
                (type) => (
                  <label
                    key={
                      type.value
                    }
                    className={optionClass(
                      notificationType ===
                        type.value
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={
                        notificationType ===
                        type.value
                      }
                      onChange={() =>
                        setNotificationType(
                          type.value
                        )
                      }
                    />

                    <span className="text-sm font-semibold">
                      {
                        type.label
                      }
                    </span>

                  </label>
                )
              )}

            </div>

          </div>

          {/* Channel */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Channel
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              {CHANNELS.map(
                (item) => {
                  const Icon =
                    item.icon

                  return (
                    <label
                      key={
                        item.value
                      }
                      className={optionClass(
                        channel ===
                          item.value
                      )}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        checked={
                          channel ===
                          item.value
                        }
                        onChange={() =>
                          setChannel(
                            item.value
                          )
                        }
                      />

                      <div className="flex items-center gap-2">

                        <Icon
                          size={
                            16
                          }
                        />

                        <span className="text-sm font-semibold">
                          {
                            item.label
                          }
                        </span>

                      </div>

                    </label>
                  )
                }
              )}

            </div>

          </div>

          {/* Recipients */}
          <div>

            <label className="mb-3 block text-sm font-semibold text-slate-300">
              Recipients
            </label>

            <div className="grid gap-3 sm:grid-cols-2">

              {[
                {
                  value:
                    'all',
                  label:
                    'All confirmed registrations',
                },
                {
                  value:
                    'custom',
                  label:
                    'Custom selection from registrations page',
                },
              ].map(
                (item) => (
                  <label
                    key={
                      item.value
                    }
                    className={optionClass(
                      selectedRegistrations ===
                        item.value
                    )}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={
                        selectedRegistrations ===
                        item.value
                      }
                      onChange={() =>
                        setSelectedRegistrations(
                          item.value as
                            | 'all'
                            | 'custom'
                        )
                      }
                    />

                    <span className="text-sm font-semibold">
                      {
                        item.label
                      }
                    </span>

                  </label>
                )
              )}

            </div>

          </div>

          {/* Message */}
          <div>

            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Custom Message
            </label>

            <textarea
              rows={5}
              maxLength={500}
              value={
                customMessage
              }
              onChange={(
                e
              ) =>
                setCustomMessage(
                  e.target
                    .value
                )
              }
              placeholder="Add optional message..."
              className="app-textarea"
            />

            <p className="mt-2 text-xs text-slate-400">
              {
                customMessage.length
              }
              /500 characters
            </p>

          </div>

          {/* Action */}
          <div className="flex flex-col gap-3 border-t border-[#243B72] pt-5 sm:flex-row sm:items-center sm:justify-between">

            <button
              onClick={
                handleSendNotification
              }
              disabled={
                sending
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#F5E62D] px-6 py-3 text-sm font-semibold text-[#0B1736] transition hover:bg-[#FFF27A]"
            >

              {sending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send
                  size={16}
                />
              )}

              {sending
                ? 'Sending...'
                : 'Send Notification'}

            </button>

            {sentCount !==
              null && (
              <span className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
                Sent to{' '}
                {
                  sentCount
                }{' '}
                participant
                {sentCount !==
                1
                  ? 's'
                  : ''}
              </span>
            )}

          </div>

        </div>

      </section>

      {/* Note */}
      <div className="rounded-2xl border border-[#243B72] bg-[#10224A] px-5 py-4 text-sm text-slate-300">
        Notifications are sent
        immediately. Please
        review content before
        sending.
      </div>

    </div>
  )
}