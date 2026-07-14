// app/api/certificates/download/route.ts
// GET /api/certificates/download?email=xxx&event_id=xxx
//
// Public route — attendee enters their email to get their certificate.
// Checks they actually attended before returning a signed URL.
// Signed URL expires in 7 days.

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser, requireOrganizerRole } from '@/lib/auth/get-session'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const email = searchParams.get('email')
    const event_id = searchParams.get('event_id')

    if (!event_id) {
      return NextResponse.json(
        { data: null, error: 'event_id is required' },
        { status: 400 }
      )
    }

    // Must be signed in. Participants can only fetch their OWN certificate
    // (their session email); organizers of the event may fetch any attendee's.
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json(
        { data: null, error: 'Please sign in to download your certificate.' },
        { status: 401 }
      )
    }

    const orgCheck = await requireOrganizerRole(event_id, ['owner', 'sub_admin', 'judge'])
    const isOrganizer = !('error' in orgCheck)

    const lookupEmail =
      isOrganizer && email ? email.toLowerCase().trim() : user.email!.toLowerCase().trim()

    const admin = createAdminClient() as any

    // Find registration by email
    const { data: registration } = await admin
      .from('registrations')
      .select('id, leader_name, status')
      .eq('leader_email', lookupEmail)
      .eq('event_id', event_id)
      .single()

    if (!registration) {
      return NextResponse.json(
        { data: null, error: 'No registration found for this email and event.' },
        { status: 404 }
      )
    }

    // Check they actually attended
    const { data: attendance } = await admin
      .from('attendance')
      .select('id')
      .eq('registration_id', registration.id)
      .single()

    if (!attendance) {
      return NextResponse.json(
        { data: null, error: 'No attendance record found. Certificates are only available for attendees.' },
        { status: 403 }
      )
    }

    // Get the certificate record
    const { data: certificate } = await admin
      .from('certificates')
      .select('certificate_url')
      .eq('registration_id', registration.id)
      .single()

    if (!certificate) {
      return NextResponse.json(
        { data: null, error: 'Certificate not generated yet. Check back later.' },
        { status: 404 }
      )
    }

    // Generate signed URL — 7 day expiry
    const { data: signedUrl, error: signedError } = await admin
      .storage
      .from('certificates')
      .createSignedUrl(certificate.certificate_url, 60 * 60 * 24 * 7)

    if (signedError || !signedUrl) {
      console.error('[GET /api/certificates/download]', signedError)
      return NextResponse.json(
        { data: null, error: 'Failed to generate download link' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: {
        name: registration.leader_name,
        downloadUrl: signedUrl.signedUrl,
        expiresIn: '7 days',
      },
      error: null,
    })
  } catch (err) {
    console.error('[GET /api/certificates/download]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}