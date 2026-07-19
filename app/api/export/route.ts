// app/api/export/route.ts
// GET /api/export?event_id=xxx&format=csv|xlsx
// Streams the file directly as a download response.

import { NextRequest, NextResponse } from 'next/server'
import { requireOrganizerRole } from '@/lib/auth/get-session'
import { buildCsv } from '@/lib/export/csv'
import { buildExcel } from '@/lib/export/excel'
import { logAction } from '@/lib/audit/log'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const event_id = searchParams.get('event_id')
    const format = searchParams.get('format') ?? 'csv'

    if (!event_id) {
      return NextResponse.json(
        { data: null, error: 'event_id is required' },
        { status: 400 }
      )
    }

    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { data: null, error: 'format must be csv or xlsx' },
        { status: 400 }
      )
    }

    const auth = await requireOrganizerRole(event_id, ['owner', 'sub_admin'])
    if ('error' in auth) {
      return NextResponse.json(
        { data: null, error: auth.error },
        { status: auth.status }
      )
    }

    await logAction({
      actorId: auth.user.id,
      actorEmail: auth.user.email,
      action: 'export.download',
      targetType: 'event',
      targetId: event_id,
      eventId: event_id,
      metadata: { format },
    })

    const timestamp = new Date().toISOString().slice(0, 10)

    if (format === 'csv') {
      const csv = await buildCsv(event_id)
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="registrations-${timestamp}.csv"`,
        },
      })
    }

    // xlsx
    const buffer = await buildExcel(event_id)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="registrations-${timestamp}.xlsx"`,
      },
    })
  } catch (err) {
    console.error('[GET /api/export]', err)
    return NextResponse.json(
      { data: null, error: 'Internal server error' },
      { status: 500 }
    )
  }
}