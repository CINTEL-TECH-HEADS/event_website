// Owner: BE2
// Generates a QR code from a registration UUID and uploads it to Supabase Storage
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/server'

// Returns a base64 PNG data URL — useful for embedding directly in emails
export async function generateQrDataUrl(registrationId: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const content = `${appUrl}/checkin/${registrationId}` // what the QR encodes

  return QRCode.toDataURL(content, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: { dark: '#1a1a1a', light: '#ffffff' },
  })
}

// Uploads QR image to Supabase Storage and returns the public path
// Storage bucket: 'qrcodes' (private — served via signed URL)
export async function uploadQrToStorage(
  registrationId: string,
  eventId: string
): Promise<string> {
  const supabase = createAdminClient()
  const dataUrl = await generateQrDataUrl(registrationId)

  // Convert base64 data URL to buffer
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')

  const path = `${eventId}/${registrationId}.png`

  const { error } = await supabase.storage
    .from('qrcodes')
    .upload(path, buffer, {
      contentType: 'image/png',
      upsert: true,
    })

  if (error) throw new Error(`QR upload failed: ${error.message}`)

  // Return the storage path — signed URLs generated on demand
  return path
}

// Generate a signed URL for serving the QR to the attendee (expires in 1 hour)
export async function getQrSignedUrl(path: string): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.storage
    .from('qrcodes')
    .createSignedUrl(path, 3600)

  if (error || !data) throw new Error('Could not generate signed URL for QR code')
  return data.signedUrl
}
