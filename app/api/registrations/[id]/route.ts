import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/utils'
import { createAdminClient } from '@/lib/supabase/server'
import { getQrSignedUrl } from '@/lib/qr/generate'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        display_id,
        leader_name,
        status,
        qr_code_url
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) return apiError(error.message, 500)
    if (!data) return apiError('Registration not found', 404)

    let qrUrl = null

    if (data.qr_code_url) {
      try {
        qrUrl = await getQrSignedUrl(data.qr_code_url)
      } catch {
        qrUrl = null
      }
    }

    return apiSuccess({
      ...data,
      qr_code_url: qrUrl,
    })
  } catch {
    return apiError(
      'Unable to load confirmation details.',
      500
    )
  }
}