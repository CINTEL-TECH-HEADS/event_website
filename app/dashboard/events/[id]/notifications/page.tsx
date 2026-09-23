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
        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <BellOff size={14} />
          Notifications
        </span>
        <h1 className="mt-5 text-3xl font-bold text-white">Notification Center is inactive.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Email delivery is currently disabled, so participant notifications and reminders can&apos;t be
          sent from here right now.
        </p>
      </section>

      <section className="app-panel p-8">
        <div className="mx-auto max-w-md border border-dashed border-[#243B72] bg-[#0B1736] p-10 text-center">
          <p className="text-sm font-semibold text-white">Notifications are turned off</p>
          <p className="mt-2 text-sm text-slate-400">
            This feature is paused until email integration is set up. Participants can view their pass,
            payment status, and updates in their own portal in the meantime.
          </p>
        </div>
      </section>
    </div>
  )
}
