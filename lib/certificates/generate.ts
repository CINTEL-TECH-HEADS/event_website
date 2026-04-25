// lib/certificates/generate.ts
//
// Certificate generation using pdf-lib.
// Optionally embeds a QR code linking to CertiMaster's verification backend.
//
// CertiMaster (certimaster.devakhil.com) is 100% client-side — it has no
// generation API. What it DOES have is a Cloudflare Worker verification
// backend that stores certificate records and serves public verify pages.
//
// This file:
//   1. Generates a PDF certificate using pdf-lib
//   2. Draws a QR code on the certificate linking to the verify URL
//   3. Saves the certificate UUID + metadata to CertiMaster's batch-save API
//   4. Uploads the PDF to Supabase Storage
//
// Environment variables needed:
//   CERTIMASTER_WORKER_URL  — e.g. https://my-certimaster.workers.dev
//   CERTIMASTER_API_KEY     — the API_KEY secret you set in the Cloudflare worker
//
// If these are not set, certificates are still generated — just without
// the QR verification feature.

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/server'

interface GenerateCertificateParams {
  registrationId: string
  eventId: string
  attendeeName: string
  eventName: string
  eventDate: string   // ISO string
}

// ── Main export ───────────────────────────────────────────────

export async function generateCertificate(
  params: GenerateCertificateParams
): Promise<string> {
  const { registrationId, eventId, attendeeName, eventName, eventDate } = params

  // Use registrationId as the certificate UUID — already unique
  const certUUID = registrationId

  const admin = createAdminClient()

  // Download template from Supabase Storage
  // Upload your template at: templates/[eventId].pdf
  const templatePath = `templates/${eventId}.pdf`
  const { data: templateFile, error: downloadError } = await admin
    .storage
    .from('uploads')
    .download(templatePath)

  if (downloadError || !templateFile) {
    throw new Error(
      `Certificate template not found at ${templatePath}. ` +
      `Upload a PDF template to the uploads bucket first.`
    )
  }

  const templateBytes = await templateFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(templateBytes)
  const pages = pdfDoc.getPages()
  const firstPage = pages[0]
  const { width, height } = firstPage.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── Draw attendee name ───────────────────────────────────────
  const nameSize = 32
  const nameWidth = font.widthOfTextAtSize(attendeeName, nameSize)
  firstPage.drawText(attendeeName, {
    x: (width - nameWidth) / 2,
    y: height * 0.52,     // adjust y to match your template design
    size: nameSize,
    font,
    color: rgb(0.1, 0.1, 0.1),
  })

  // ── Draw event name ──────────────────────────────────────────
  const eventSize = 18
  const eventWidth = font.widthOfTextAtSize(eventName, eventSize)
  firstPage.drawText(eventName, {
    x: (width - eventWidth) / 2,
    y: height * 0.42,
    size: eventSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  })

  // ── Draw date ────────────────────────────────────────────────
  const dateSize = 14
  const dateWidth = font.widthOfTextAtSize(formattedDate, dateSize)
  firstPage.drawText(formattedDate, {
    x: (width - dateWidth) / 2,
    y: height * 0.35,
    size: dateSize,
    font,
    color: rgb(0.4, 0.4, 0.4),
  })

  // ── Draw QR code (if CertiMaster worker URL is configured) ───
  const workerUrl = process.env.CERTIMASTER_WORKER_URL
  if (workerUrl) {
    try {
      const verifyUrl = `${workerUrl}/verify/${certUUID}`

      // Generate QR code as PNG buffer
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 80,
        margin: 1,
        color: { dark: '#1a1a1a', light: '#ffffff' },
      })

      // Embed QR image into PDF
      const qrImage = await pdfDoc.embedPng(qrBuffer)
      const qrSize = 60   // px on the PDF

      // Place in bottom-right corner
      firstPage.drawImage(qrImage, {
        x: width - qrSize - 20,
        y: 20,
        width: qrSize,
        height: qrSize,
      })

      // Small label under the QR
      const verifyFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const labelText = 'Scan to verify'
      const labelSize = 7
      const labelWidth = verifyFont.widthOfTextAtSize(labelText, labelSize)
      firstPage.drawText(labelText, {
        x: width - qrSize - 20 + (qrSize - labelWidth) / 2,
        y: 14,
        size: labelSize,
        font: verifyFont,
        color: rgb(0.5, 0.5, 0.5),
      })
    } catch (qrErr) {
      // QR drawing failed — still save the cert without QR
      console.warn('[generateCertificate] QR drawing failed:', qrErr)
    }
  }

  // ── Save PDF to Supabase Storage ─────────────────────────────
  const pdfBytes = await pdfDoc.save()
  const outputPath = `generated/${eventId}/${registrationId}.pdf`

  const { error: uploadError } = await admin
    .storage
    .from('certificates')
    .upload(outputPath, pdfBytes, {
      contentType: 'application/pdf',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload certificate: ${uploadError.message}`)
  }

  // ── Save record to CertiMaster verification backend ──────────
  // This is what makes QR scanning work.
  // The Cloudflare Worker stores {id, name, event, date} and serves
  // a public verify page at /verify/<uuid> when the QR is scanned.
  if (workerUrl && process.env.CERTIMASTER_API_KEY) {
    try {
      await saveToCertiMaster({
        workerUrl,
        apiKey: process.env.CERTIMASTER_API_KEY,
        records: [{
          id: certUUID,
          name: attendeeName,
          event: eventName,
          date: formattedDate,
        }],
      })
    } catch (saveErr) {
      // Non-fatal — PDF is already saved, verification just won't work
      console.warn('[generateCertificate] CertiMaster save failed:', saveErr)
    }
  }

  return outputPath
}

// ── CertiMaster batch-save helper ────────────────────────────
// Sends certificate records to the Cloudflare Worker verification backend.
// POST /api/batch-save
// Headers: Authorization: Bearer <API_KEY>
// Body: [{ id, name, event, date }]

interface CertiMasterRecord {
  id: string
  name: string
  event: string
  date: string
}

async function saveToCertiMaster(params: {
  workerUrl: string
  apiKey: string
  records: CertiMasterRecord[]
}) {
  const { workerUrl, apiKey, records } = params

  const response = await fetch(`${workerUrl}/api/batch-save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(records),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`CertiMaster batch-save failed: ${response.status} — ${text}`)
  }

  return await response.json()  // { success: true, saved: n }
}

// ── Batch generate for POST /api/certificates ─────────────────
// Generates PDFs for all attendees and saves all records to
// CertiMaster in a single batch-save call (more efficient).

export async function batchGenerateCertificates(params: {
  attendees: Array<{
    registrationId: string
    attendeeName: string
  }>
  eventId: string
  eventName: string
  eventDate: string
}): Promise<{ succeeded: number; failed: number; errors: string[] }> {
  const { attendees, eventId, eventName, eventDate } = params
  const results = { succeeded: 0, failed: 0, errors: [] as string[] }
  const certiMasterRecords: CertiMasterRecord[] = []

  const formattedDate = new Date(eventDate).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  for (const attendee of attendees) {
    try {
      await generateCertificate({
        registrationId: attendee.registrationId,
        eventId,
        attendeeName: attendee.attendeeName,
        eventName,
        eventDate,
      })

      certiMasterRecords.push({
        id: attendee.registrationId,
        name: attendee.attendeeName,
        event: eventName,
        date: formattedDate,
      })

      results.succeeded++
    } catch (err: any) {
      results.failed++
      results.errors.push(`${attendee.attendeeName}: ${err.message}`)
    }
  }

  // Single batch call to CertiMaster for all records
  const workerUrl = process.env.CERTIMASTER_WORKER_URL
  const apiKey = process.env.CERTIMASTER_API_KEY

  if (workerUrl && apiKey && certiMasterRecords.length > 0) {
    try {
      const saved = await saveToCertiMaster({ workerUrl, apiKey, records: certiMasterRecords })
      console.log(`[batchGenerate] CertiMaster saved: ${saved.saved} records`)
    } catch (err) {
      console.warn('[batchGenerate] CertiMaster batch save failed:', err)
    }
  }

  return results
}
