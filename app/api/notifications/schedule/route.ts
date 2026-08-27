// app/api/notifications/schedule/route.ts
// Reminder scheduling is INACTIVE while the Notification Center / email delivery
// is disabled. The pg_cron scheduling implementation is preserved in git history.

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { data: null, error: 'Notifications are currently disabled.' },
    { status: 503 }
  )
}
