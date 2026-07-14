import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { generateCertificate } from '@/lib/certificates/generate'
import { sendCertificateReadyEmail } from '@/lib/email/send'
import { logAction } from '@/lib/audit/log'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    const admin = createAdminClient() as any

    // ── ACTION: upload (multipart/form-data) ─────────────────────
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const action = formData.get('action') as string | null
      const file = formData.get('file') as File | null
      const event_id = formData.get('event_id') as string | null

      if (action !== 'upload') {
        return NextResponse.json({ data: null, error: 'Invalid action for form-data' }, { status: 400 })
      }

      if (!file || !event_id) {
        return NextResponse.json({ data: null, error: 'Missing file or event_id' }, { status: 400 })
      }

      if (file.type !== 'application/pdf') {
        return NextResponse.json({ data: null, error: 'Template must be a PDF file' }, { status: 400 })
      }

      const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
      if ('error' in auth) {
        return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const path = `templates/${event_id}.pdf`

      const { error } = await admin.storage
        .from('uploads')
        .upload(path, buffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (error) {
        return NextResponse.json({ data: null, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data: { message: 'Template uploaded successfully' }, error: null })
    }

    // ── ACTION: generate / release (application/json) ────────────
    const body = await req.json()
    const { action, event_id } = body

    if (!['generate', 'release'].includes(action) || !event_id) {
      return NextResponse.json({ data: null, error: 'Invalid action or missing event_id' }, { status: 400 })
    }

    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json({ data: null, error: auth.error }, { status: auth.status })
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: `certificate.${action}`,
      targetType: 'event',
      targetId: event_id,
      eventId: event_id,
    })

    const { data: event } = await admin
      .from('events')
      .select('title, starts_at')
      .eq('id', event_id)
      .single()

    if (!event) {
      return NextResponse.json({ data: null, error: 'Event not found' }, { status: 404 })
    }

    // Fetch all confirmed and attended registrations
    const { data: attended } = await admin
      .from('attendance')
      .select(`
        registration_id,
        registrations!inner (
          id, leader_name, leader_email, status
        )
      `)
      .eq('event_id', event_id)
      .eq('registrations.status', 'confirmed')

    if (!attended || attended.length === 0) {
      return NextResponse.json({ data: null, error: 'No eligible attendees found.' }, { status: 404 })
    }

    const results = { total: attended.length, generated: 0, emailed: 0, failed: 0 }

    for (const record of attended) {
      const reg = record.registrations as any
      if (!reg) continue

      try {
        let certUrl = null

        // Try to find existing certificate
        const { data: existingCert } = await admin
          .from('certificates')
          .select('certificate_url')
          .eq('registration_id', reg.id)
          .eq('event_id', event_id)
          .order('generated_at', { ascending: false })
          .limit(1)
          .single()

        if (existingCert) {
          certUrl = existingCert.certificate_url
        }

        // Generate if missing or if action is explicitly 'generate'
        if (!existingCert || action === 'generate') {
          certUrl = await generateCertificate({
            registrationId: reg.id,
            eventId: event_id,
            attendeeName: reg.leader_name,
            eventName: event.title,
            eventDate: event.starts_at,
          })

          // Save/Update record in DB
          if (certUrl) {
            await admin.from('certificates').delete().eq('registration_id', reg.id).eq('event_id', event_id)
            await admin.from('certificates').insert({
              event_id: event_id,
              registration_id: reg.id,
              certificate_url: certUrl,
              template_version: 1,
            })
            results.generated++
          }
        }

        // Send email if action is 'release'
        if (action === 'release' && certUrl) {
          const { data: signedUrl } = await admin
            .storage
            .from('certificates')
            .createSignedUrl(certUrl, 60 * 60 * 24 * 7)

          if (signedUrl?.signedUrl) {
            await sendCertificateReadyEmail({
              to: reg.leader_email,
              leaderName: reg.leader_name,
              eventTitle: event.title,
              certificateUrl: signedUrl.signedUrl,
            })
            results.emailed++
          } else {
            results.failed++
          }
        }
      } catch (err: any) {
        console.error(`Error processing registration ${reg.id}:`, err)
        results.failed++
      }
    }

    return NextResponse.json({ data: results, error: null })
  } catch (err: any) {
    console.error('[POST /api/certificates]', err)
    return NextResponse.json({ data: null, error: err.message || 'Internal server error' }, { status: 500 })
  }
}