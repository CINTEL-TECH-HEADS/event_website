// Owner: FE2 - Notifications page
'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, Mail, MessageSquare, Send } from 'lucide-react'

type NotificationType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'venue_change'
  | 'time_change'
  | 'cancellation'
type Channel = 'email' | 'whatsapp'

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'confirmation', label: 'Confirmation Email' },
  { value: 'reminder_24h', label: '24-Hour Reminder' },
  { value: 'reminder_1h', label: '1-Hour Reminder' },
  { value: 'venue_change', label: 'Venue Change Alert' },
  { value: 'time_change', label: 'Time Change Alert' },
  { value: 'cancellation', label: 'Cancellation Notice' },
]

const CHANNELS: { value: Channel; label: string; icon: typeof Mail }[] = [
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
]

export default function NotificationsPage() {
  const { id } = useParams<{ id: string }>()
  const [notificationType, setNotificationType] = useState<NotificationType>('confirmation')
  const [channel, setChannel] = useState<Channel>('email')
  const [customMessage, setCustomMessage] = useState('')
  const [selectedRegistrations, setSelectedRegistrations] = useState<'all' | 'custom'>('all')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState<number | null>(null)

  const handleSendNotification = async () => {
    if (!confirm(`Send ${channel} notification to selected participants?`)) {
      return
    }

    setSending(true)
    setSentCount(null)

    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: id,
          type: notificationType,
          channel,
          ...(customMessage && { custom_message: customMessage }),
          target: selectedRegistrations === 'all' ? 'all_confirmed' : 'custom',
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to send notifications')
      }

      const { sent_count } = await res.json()
      setSentCount(sent_count || 0)
      setCustomMessage('')
    } catch (error) {
      console.error('Failed to send notifications:', error)
      alert('Failed to send notifications. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <Send size={14} />
          Manual Notifications
        </span>
        <h1 className="app-heading mt-4">Reach participants with more confidence and less clutter.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Choose the message type, delivery channel, and audience, then send a clean operational
          update immediately.
        </p>
      </section>

      <section className="app-panel rounded-[1.8rem] p-6">
        <div className="grid gap-6">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">Notification Type</label>
            <div className="grid gap-3 md:grid-cols-2">
              {NOTIFICATION_TYPES.map((type) => (
                <label
                  key={type.value}
                  className={`cursor-pointer rounded-xl border px-4 py-4 transition-all ${
                    notificationType === type.value
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-white/5 bg-black/40 text-slate-400 hover:border-amber-500/20 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="notificationType"
                    value={type.value}
                    checked={notificationType === type.value}
                    onChange={(e) => setNotificationType(e.target.value as NotificationType)}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">Channel</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {CHANNELS.map((item) => {
                const Icon = item.icon
                return (
                  <label
                    key={item.value}
                    className={`cursor-pointer rounded-xl border px-4 py-4 transition-all ${
                      channel === item.value
                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                        : 'border-white/5 bg-black/40 text-slate-400 hover:border-amber-500/20 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={item.value}
                      checked={channel === item.value}
                      onChange={(e) => setChannel(e.target.value as Channel)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2">
                      <Icon size={16} />
                      <span className="text-sm font-semibold">{item.label}</span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-700">Recipients</label>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: 'all', label: 'All confirmed registrations' },
                { value: 'custom', label: 'Custom selection from registrations page' },
              ].map((item) => (
                <label
                  key={item.value}
                  className={`cursor-pointer rounded-xl border px-4 py-4 transition-all ${
                    selectedRegistrations === item.value
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      : 'border-white/5 bg-black/40 text-slate-400 hover:border-amber-500/20 hover:text-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="recipients"
                    value={item.value}
                    checked={selectedRegistrations === item.value}
                    onChange={(e) =>
                      setSelectedRegistrations(e.target.value as 'all' | 'custom')
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Custom Message</label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add optional context for the recipients..."
              maxLength={500}
              rows={5}
              className="app-textarea"
            />
            <p className="mt-2 text-xs text-slate-400">{customMessage.length}/500 characters</p>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200/70 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button onClick={handleSendNotification} disabled={sending} className="app-button-primary">
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {sending ? 'Sending...' : 'Send Notification'}
            </button>

            {sentCount !== null && (
              <span className="app-badge app-badge-success">
                Sent to {sentCount} {sentCount === 1 ? 'participant' : 'participants'}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="app-alert-info">
        Notifications are sent immediately, so double-check content before sending.
      </div>
    </div>
  )
}
