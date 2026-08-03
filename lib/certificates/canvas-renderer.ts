// lib/certificates/canvas-renderer.ts
//
// Reusable Browser-Side Canvas Certificate Renderer.
// Unified rendering engine used for BOTH editor preview and final PNG generation.

'use client'

export interface TextLayerConfig {
  x: number          // 0..1 fraction of image width
  y: number          // 0..1 fraction of image height
  fontSize: number   // px at full resolution
  fontFamily: string
  fontWeight: string
  fontStyle?: 'normal' | 'italic'
  textAlign: 'left' | 'center' | 'right'
  maxWidth: number   // 0..1 fraction of image width (max text block width)
  color?: string     // CSS colour string, default '#1a1a1a'
}

export interface QrLayerConfig {
  x: number    // 0..1 fraction of image width (center of QR)
  y: number    // 0..1 fraction of image height
  size: number // px at full resolution
}

export interface LayoutConfig {
  name: TextLayerConfig
  teamName?: TextLayerConfig
  qr: QrLayerConfig
}

export interface GenerateCertificateParams {
  templateImageUrl?: string | null
  layoutConfig?: LayoutConfig | null
  participantName: string
  teamName: string | null
  verificationUrl: string
  eventName?: string
  certificateType?: string
}

export const GOOGLE_FONTS = [
  'Great Vibes',
  'Playfair Display',
  'Cormorant Garamond',
  'Libre Baskerville',
  'EB Garamond',
  'Lora',
  'Cinzel',
  'Montserrat',
  'Poppins',
  'Inter',
] as const

export const STANDARD_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Courier New',
] as const

const loadedGoogleFonts = new Set<string>()

// ── Google Font Loader ────────────────────────────────────────────────────────

export async function ensureFontLoaded(fontFamily: string): Promise<void> {
  if (typeof window === 'undefined') return

  if (GOOGLE_FONTS.includes(fontFamily as any) && !loadedGoogleFonts.has(fontFamily)) {
    const formatted = fontFamily.replace(/\s+/g, '+')
    const href = `https://fonts.googleapis.com/css2?family=${formatted}:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&display=swap`

    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      document.head.appendChild(link)
    }

    loadedGoogleFonts.add(fontFamily)
  }

  // Wait for font loading if API is available
  if ('fonts' in document) {
    try {
      await document.fonts.ready
      await document.fonts.load(`16px "${fontFamily}"`)
    } catch {
      // Graceful fallback
    }
  }
}

// ── Custom Font File Loader (.ttf, .otf, .woff, .woff2) ───────────────────────

export async function loadCustomFontFromFile(file: File): Promise<string> {
  const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
  const fontName = `Custom_${nameWithoutExt}`

  const buffer = await file.arrayBuffer()
  const fontFace = new FontFace(fontName, buffer)
  const loadedFace = await fontFace.load()
  document.fonts.add(loadedFace)

  return fontName
}

// ── System Fonts Loader ───────────────────────────────────────────────────────

export async function querySystemFonts(): Promise<string[]> {
  if (typeof window === 'undefined' || !('queryLocalFonts' in window)) {
    return []
  }
  try {
    const localFonts = await (window as any).queryLocalFonts()
    const fontFamilies = new Set<string>()
    for (const font of localFonts) {
      if (font.family) fontFamilies.add(font.family)
    }
    return Array.from(fontFamilies).sort()
  } catch {
    return []
  }
}

// ── Fallback Default Certificate Canvas Generator ──────────────────────────────

export async function generateDefaultCertificateBlob(
  params: GenerateCertificateParams
): Promise<Blob> {
  const W = 1920
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background gradient: Elegant Deep Navy to Midnight Blue
  const bgGrad = ctx.createLinearGradient(0, 0, W, H)
  bgGrad.addColorStop(0, '#070E1E')
  bgGrad.addColorStop(0.5, '#0B1736')
  bgGrad.addColorStop(1, '#10224A')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Outer Gold Border
  ctx.strokeStyle = '#F5E62D'
  ctx.lineWidth = 12
  ctx.strokeRect(40, 40, W - 80, H - 80)

  // Inner Thin Accent Border
  ctx.strokeStyle = 'rgba(245, 230, 45, 0.4)'
  ctx.lineWidth = 2
  ctx.strokeRect(55, 55, W - 110, H - 110)

  // Header: CINTEL EVENTS
  ctx.textAlign = 'center'
  ctx.fillStyle = '#F5E62D'
  ctx.font = 'bold 36px Arial, sans-serif'
  ctx.fillText('CINTEL EVENTS', W / 2, 160)

  // Subheader / Certificate Title
  const title = (params.certificateType ?? 'PARTICIPATION').toUpperCase()
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 48px Georgia, serif'
  ctx.fillText(`CERTIFICATE OF ${title}`, W / 2, 240)

  // Presentation text
  ctx.fillStyle = '#94A3B8'
  ctx.font = 'normal 24px Arial, sans-serif'
  ctx.fillText('THIS IS PROUDLY PRESENTED TO', W / 2, 340)

  // Participant Name
  ctx.fillStyle = '#F5E62D'
  ctx.font = 'bold 64px Georgia, serif'
  ctx.fillText(params.participantName, W / 2, 440)

  // Team Name if present
  let currentY = 510
  if (params.teamName) {
    ctx.fillStyle = '#CBD5E1'
    ctx.font = 'bold 28px Arial, sans-serif'
    ctx.fillText(`Team: ${params.teamName}`, W / 2, currentY)
    currentY += 60
  }

  // Event Details Text
  ctx.fillStyle = '#94A3B8'
  ctx.font = 'normal 24px Arial, sans-serif'
  ctx.fillText('for successful participation in', W / 2, currentY)
  currentY += 50

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 36px Arial, sans-serif'
  ctx.fillText(params.eventName ?? 'Official CINTEL Event', W / 2, currentY)

  // Bottom QR Code
  if (params.verificationUrl) {
    try {
      const qrDataUrl = await generateQrDataUrl(params.verificationUrl, 140)
      const qrImg = await loadImage(qrDataUrl)
      ctx.drawImage(qrImg, W - 240, H - 240, 140, 140)

      ctx.textAlign = 'right'
      ctx.fillStyle = '#64748B'
      ctx.font = '14px Arial, sans-serif'
      ctx.fillText('Scan to Verify', W - 100, H - 85)
    } catch (_e) {}
  }

  // Verified Badge on Bottom Left
  ctx.textAlign = 'left'
  ctx.fillStyle = '#10B981'
  ctx.font = 'bold 18px Arial, sans-serif'
  ctx.fillText('✓ OFFICIAL CINTEL CERTIFICATE', 100, H - 120)

  ctx.fillStyle = '#64748B'
  ctx.font = '14px Arial, sans-serif'
  ctx.fillText(`Issued: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, 100, H - 90)

  return await canvasToBlob(canvas)
}

// ── Public Main Renderer Function ─────────────────────────────────────────────

export async function generateCertificateBlob(
  params: GenerateCertificateParams
): Promise<Blob> {
  const { templateImageUrl, layoutConfig, participantName, teamName, verificationUrl } = params

  // If no admin template image was uploaded, render default canvas design
  if (!templateImageUrl) {
    return await generateDefaultCertificateBlob(params)
  }

  // Provide sensible fallback layout overlay on top of admin's uploaded template image
  const effectiveLayout: LayoutConfig = {
    name: layoutConfig?.name ?? {
      x: 0.5,
      y: 0.52,
      fontSize: 54,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      textAlign: 'center',
      maxWidth: 0.7,
      color: '#1a1a1a',
    },
    teamName: layoutConfig?.teamName ?? {
      x: 0.5,
      y: 0.62,
      fontSize: 30,
      fontFamily: 'Arial',
      fontWeight: 'normal',
      textAlign: 'center',
      maxWidth: 0.6,
      color: '#333333',
    },
    qr: layoutConfig?.qr ?? {
      x: 0.82,
      y: 0.75,
      size: 130,
    },
  }

  try {
    // 1. Ensure required fonts are loaded into document before drawing
    if (effectiveLayout.name?.fontFamily) {
      await ensureFontLoaded(effectiveLayout.name.fontFamily)
    }
    if (effectiveLayout.teamName?.fontFamily) {
      await ensureFontLoaded(effectiveLayout.teamName.fontFamily)
    }

    // 2. Load admin template image at full resolution
    const img = await loadImage(templateImageUrl)
    const W = img.naturalWidth
    const H = img.naturalHeight

    // 3. Create canvas at original dimensions
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')!

    // 4. Draw admin's uploaded template image
    ctx.drawImage(img, 0, 0, W, H)

    // 5. Draw participant name
    if (effectiveLayout.name) {
      drawText(ctx, participantName, effectiveLayout.name, W, H)
    }

    // 6. Draw team name (only if teamName provided AND config exists)
    if (teamName && effectiveLayout.teamName) {
      drawText(ctx, teamName, effectiveLayout.teamName, W, H)
    }

    // 7. Generate + draw QR code
    if (effectiveLayout.qr) {
      const qrDataUrl = await generateQrDataUrl(verificationUrl, effectiveLayout.qr.size)
      await drawQr(ctx, qrDataUrl, effectiveLayout.qr, W, H)
    }

    // 8. Export as PNG blob
    return await canvasToBlob(canvas)
  } catch (err) {
    console.warn('[generateCertificateBlob] Admin template image render failed, falling back to default:', err)
    return await generateDefaultCertificateBlob(params)
  }
}

// ── Rendering Helpers ─────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

function buildFontCssString(
  fontStyle: string | undefined,
  fontWeight: string,
  fontSize: number,
  fontFamily: string
): string {
  const style = fontStyle === 'italic' ? 'italic' : 'normal'
  const weight = fontWeight || 'normal'
  return `${style} ${weight} ${fontSize}px "${fontFamily}", sans-serif`
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  config: TextLayerConfig,
  W: number,
  H: number
) {
  const maxPx = (config.maxWidth ?? 0.7) * W
  const color = config.color ?? '#1a1a1a'

  let fontSize = config.fontSize
  const MIN_FONT = 8

  ctx.textAlign = config.textAlign ?? 'center'
  ctx.textBaseline = 'middle'

  // Fit font size so text does not exceed maxWidth
  while (fontSize > MIN_FONT) {
    ctx.font = buildFontCssString(config.fontStyle, config.fontWeight, fontSize, config.fontFamily)
    const measured = ctx.measureText(text).width
    if (measured <= maxPx) break
    fontSize -= 1
  }

  ctx.fillStyle = color
  ctx.font = buildFontCssString(config.fontStyle, config.fontWeight, fontSize, config.fontFamily)

  // Anchor point: x, y are normalized fractions (0..1)
  const x = config.x * W
  const y = config.y * H

  ctx.fillText(text, x, y, maxPx)
}

async function generateQrDataUrl(url: string, size: number): Promise<string> {
  const QRCode = (await import('qrcode')).default
  return QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: '#1a1a1a', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}

async function drawQr(
  ctx: CanvasRenderingContext2D,
  qrDataUrl: string,
  config: QrLayerConfig,
  W: number,
  H: number
) {
  const qrImg = await loadImage(qrDataUrl)
  // config.x, config.y represents the top-left of QR box
  const x = config.x * W
  const y = config.y * H
  ctx.drawImage(qrImg, x, y, config.size, config.size)
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      },
      'image/png',
      1.0
    )
  })
}

export function makeSafeFilename(name: string, certType: string, index?: number): string {
  const safe = (s: string) =>
    s
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 60)

  const base = `${safe(name)}_${safe(certType)}.png`
  if (index !== undefined) {
    return `${safe(name)}_${safe(certType)}_${index}.png`
  }
  return base
}
