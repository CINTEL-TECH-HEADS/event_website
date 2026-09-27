// Owner: FE2 - Notifications page (currently INACTIVE).
// Email delivery is disabled pending a real integration, so the compose/send UI
// is turned off. The send endpoints return 503. Re-enable by restoring the email
// client (lib/email/resend.ts) and this page's compose form from git history.
'use client'

import { BellOff } from 'lucide-react'
import { DashboardPageHeader } from '@/components/dashboard/DashboardPageHeader'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={BellOff}
        kicker="Notifications"
        title="Notifications are off"
        description={'Outbound email is disabled, so notifications and reminders can’t be sent from here.'}
      />

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
