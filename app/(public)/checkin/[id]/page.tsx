// Owner: FE2
// This page is what the QR code points to.
// QR encodes: https://cintel.in/checkin/[registration-uuid]
// When organizer scans the QR, this UUID is decoded and sent to POST /api/attendance
// This page is NOT shown to attendees — it's only decoded by the organizer's QR scanner.
// If someone opens this URL manually in a browser, redirect them to the homepage.
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CheckinRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    // This page is meant to be scanned, not visited directly
    router.replace('/')
  }, [router])
  return null
}
