// Owner: FE2 - Notifications page (currently INACTIVE).
// Email delivery is disabled pending a real integration, so the compose/send UI
// is turned off. The send endpoints return 503. Re-enable by restoring the email
// client (lib/email/resend.ts) and this page's compose form from git history.
'use client'

import { BellOff } from 'lucide-react'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <section className="app-panel px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <BellOff size={14} />
          Notifications
        </span>
        <h1 className="app-heading mt-5">Notification Center is inactive.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Email delivery is currently disabled, so participant notifications and reminders can&apos;t be
          sent from here right now.
        </p>
      </section>

      <section className="app-panel p-8">
        <div className="app-empty-state mx-auto max-w-md p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-foreground">Notifications are turned off</p>
          <p className="mt-2 text-sm font-medium text-foreground-soft">
            This feature is paused until email integration is set up. Participants can view their pass,
            payment status, and updates in their own portal in the meantime.
          </p>
        </div>
      </section>
    </div>
  )
}
