// app/api/notifications/route.ts
// Notification Center is currently INACTIVE — participant email delivery is
// disabled pending a real integration, so manual sends are turned off.
// The previous send implementation is preserved in git history; re-enable it
// together with the email client (lib/email/resend.ts).

import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { data: null, error: 'Notifications are currently disabled.' },
    { status: 503 }
  )
}
