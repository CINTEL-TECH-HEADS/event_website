// app/api/participant/registrations/[id]/certificate/route.ts
// GET — returns the requesting participant's OWN certificate details from certificate_assignments.
// Enforces:
// 1. Session authentication
// 2. Ownership (must be registration leader or team member)
// 3. Release gating (events.certificates_released_at must NOT be null)

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth/get-session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Please sign in to view your certificate.', 401)

    const admin = createAdminClient()
    const lower = user.email!.toLowerCase()

    // 1. Fetch registration with event and team members
    const { data: reg, error: regErr } = await admin
      .from('registrations')
      .select(`
        id, event_id, registration_type, team_name, leader_name, leader_email, participant_id,
        events!inner ( id, title, certificates_released_at, starts_at ),
        members:team_members ( id, full_name, email, participant_id, is_leader, checked_in_at )
      `)
      .eq('id', id)
      .maybeSingle()

    if (regErr || !reg) return apiError('Registration not found', 404)

    const event = reg.events as any
    const members = (reg.members as any[]) ?? []

    // 2. Check ownership (is registration owner/leader or a team member)
    const myMember = members.find(
      (m) => m.participant_id === user.id || m.email?.toLowerCase() === lower
    )
    const isOwner = reg.participant_id === user.id || reg.leader_email?.toLowerCase() === lower
    if (!isOwner && !myMember) return apiError('Forbidden: You can only view your own certificate.', 403)

    // 3. Check release status
    if (!event.certificates_released_at) {
      return apiSuccess({
        released: false,
        message: 'Certificates have not been released yet.',
      })
    }

    // A team member who wasn't marked present at check-in doesn't get one.
    if (reg.registration_type === 'team' && myMember && !myMember.checked_in_at) {
      return apiSuccess({
        released: true,
        eligible: false,
        message: 'No certificate: you were not marked present at check-in.',
      })
    }

    // 4. Query certificate_assignments (the main table)
    const teamMemberId = reg.registration_type === 'team' ? (myMember?.id ?? null) : null
    let assignQuery = admin
      .from('certificate_assignments')
      .select('id, event_id, registration_id, team_member_id, template_id, certificate_type, certificate_file_url, created_at')
      .eq('registration_id', reg.id)
      .eq('event_id', reg.event_id)

    assignQuery = teamMemberId
      ? assignQuery.eq('team_member_id', teamMemberId)
      : assignQuery.is('team_member_id', null)

    const assignResult = await assignQuery.maybeSingle()
    let assignment = assignResult.data
    const assignErr = assignResult.error

    // Fallback: If certificate_file_url column does not exist yet in database schema
    if (assignErr) {
      if (assignErr.message?.includes('certificate_file_url')) {
        let fallbackQuery = admin
          .from('certificate_assignments')
          .select('id, event_id, registration_id, team_member_id, template_id, certificate_type, created_at')
          .eq('registration_id', reg.id)
          .eq('event_id', reg.event_id)

        fallbackQuery = teamMemberId
          ? fallbackQuery.eq('team_member_id', teamMemberId)
          : fallbackQuery.is('team_member_id', null)

        const { data: fallbackData, error: fallbackErr } = await fallbackQuery.maybeSingle()
        if (fallbackErr) {
          console.error('[GET /api/participant/registrations/[id]/certificate] Assignment error:', fallbackErr)
          return apiError(`Failed to fetch certificate assignment: ${fallbackErr.message}`, 500)
        }
        assignment = fallbackData ? { ...fallbackData, certificate_file_url: null } : null
      } else {
        console.error('[GET /api/participant/registrations/[id]/certificate] Assignment error:', assignErr)
        return apiError(`Failed to fetch certificate assignment: ${assignErr.message}`, 500)
      }
    }

    if (!assignment || assignment.certificate_type === 'Not Eligible') {
      return apiSuccess({
        released: true,
        eligible: false,
        message: 'No certificate assigned for this participant.',
      })
    }

    // 5. Fetch template layout for dynamic rendering (exact match by event, certificate_type, and registration_type path)
    const templateType = reg.registration_type // 'solo' or 'team'
    const certType = assignment.certificate_type // 'Participation', 'Winner', etc.
    const pathPrefix = `certificate-templates/${reg.event_id}/${templateType}/`

    // 1. Primary match: event_id, certificate_type AND storage_path matching registration_type (solo/team)
    let { data: template } = await admin
      .from('certificate_templates')
      .select('id, storage_path, layout_config, template_type, certificate_type')
      .eq('event_id', reg.event_id)
      .eq('certificate_type', certType)
      .filter('storage_path', 'like', `${pathPrefix}%`)
      .maybeSingle()

    // 2. Fallback: match by event_id, certificate_type, AND template_type column
    if (!template) {
      const { data: tmplByCert } = await admin
        .from('certificate_templates')
        .select('id, storage_path, layout_config, template_type, certificate_type')
        .eq('event_id', reg.event_id)
        .eq('certificate_type', certType)
        .eq('template_type', templateType)
        .maybeSingle()
      template = tmplByCert
    }

    // 3. Fallback: match by event_id AND certificate_type
    if (!template) {
      const { data: tmplByCertOnly } = await admin
        .from('certificate_templates')
        .select('id, storage_path, layout_config, template_type, certificate_type')
        .eq('event_id', reg.event_id)
        .eq('certificate_type', certType)
        .maybeSingle()
      template = tmplByCertOnly
    }

    // 4. Fallback: match by registration_type path prefix for this event
    if (!template) {
      const { data: tmplByType } = await admin
        .from('certificate_templates')
        .select('id, storage_path, layout_config, template_type, certificate_type')
        .eq('event_id', reg.event_id)
        .filter('storage_path', 'like', `${pathPrefix}%`)
        .limit(1)
        .maybeSingle()
      template = tmplByType
    }

    // 5. Ultimate fallback: match any template for this event
    if (!template) {
      const { data: anyTmpl } = await admin
        .from('certificate_templates')
        .select('id, storage_path, layout_config, template_type, certificate_type')
        .eq('event_id', reg.event_id)
        .limit(1)
        .maybeSingle()
      template = anyTmpl
    }

    let templatePreviewUrl: string | null = null
    if (template?.storage_path) {
      // Create signed URL from 'uploads' bucket where admin uploads templates
      const { data: signedUploads } = await admin.storage
        .from('uploads')
        .createSignedUrl(template.storage_path, 60 * 60 * 24 * 7)

      if (signedUploads?.signedUrl) {
        templatePreviewUrl = signedUploads.signedUrl
      } else {
        const { data: signedCerts } = await admin.storage
          .from('certificates')
          .createSignedUrl(template.storage_path, 60 * 60 * 24 * 7)
        templatePreviewUrl = signedCerts?.signedUrl ?? admin.storage.from('uploads').getPublicUrl(template.storage_path).data.publicUrl
      }
    }

    let downloadUrl: string | null = null
    if (assignment.certificate_file_url) {
      const { data: signed } = await admin.storage
        .from('certificates')
        .createSignedUrl(assignment.certificate_file_url, 60 * 60 * 24 * 7)
      downloadUrl = signed?.signedUrl ?? null
    }

    const participantName = reg.registration_type === 'team' && myMember
      ? myMember.full_name
      : reg.leader_name

    return apiSuccess({
      released: true,
      eligible: true,
      assignmentId: assignment.id,
      certificateType: assignment.certificate_type,
      participantName,
      teamName: reg.registration_type === 'team' ? reg.team_name : null,
      registrationType: reg.registration_type,
      eventName: event.title,
      issueDate: event.certificates_released_at,
      downloadUrl,
      template: template ? {
        id: template.id,
        previewUrl: templatePreviewUrl,
        layoutConfig: template.layout_config,
      } : null,
    })
  } catch (err: any) {
    console.error('[GET /api/participant/registrations/[id]/certificate]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}

// POST — Upload & save generated certificate file into Supabase Storage & Database
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser()
    if (!user) return apiError('Unauthorized', 401)

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const assignmentId = formData.get('assignment_id') as string | null

    if (!file || !assignmentId) {
      return apiError('Missing file or assignment_id', 400)
    }

    const admin = createAdminClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Fetch assignment details
    const { data: assignment, error: assignErr } = await admin
      .from('certificate_assignments')
      .select('id, event_id, registration_id, team_member_id')
      .eq('id', assignmentId)
      .maybeSingle()

    if (assignErr || !assignment) {
      return apiError('Certificate assignment not found', 404)
    }

    const storagePath = `generated/${assignment.event_id}/${assignment.id}.png`

    // 2. Upload blob to certificates storage bucket
    const { error: uploadErr } = await admin.storage
      .from('certificates')
      .upload(storagePath, buffer, {
        contentType: 'image/png',
        upsert: true,
      })

    if (uploadErr) {
      console.error('[POST certificate upload] Storage error:', uploadErr)
      return apiError(`Failed to save certificate file to storage: ${uploadErr.message}`, 500)
    }

    // 3. Update certificate_assignments table
    await admin
      .from('certificate_assignments')
      .update({ certificate_file_url: storagePath })
      .eq('id', assignment.id)

    // 4. Update or insert legacy certificates table for history/compat
    try {
      await admin
        .from('certificates')
        .upsert({
          event_id: assignment.event_id,
          registration_id: assignment.registration_id,
          team_member_id: assignment.team_member_id,
          certificate_url: storagePath,
        }, { onConflict: 'event_id,registration_id,team_member_id' })
    } catch (_e) {
      // Best-effort legacy table insert
    }

    const { data: signed } = await admin.storage
      .from('certificates')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7)

    return apiSuccess({
      storagePath,
      downloadUrl: signed?.signedUrl ?? null,
    })
  } catch (err: any) {
    console.error('[POST /api/participant/registrations/[id]/certificate]', err)
    return apiError(err.message ?? 'Internal server error', 500)
  }
}

