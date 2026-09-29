'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Save, Loader2, Type, Users, QrCode, Upload,
  Italic, AlignLeft, AlignCenter, AlignRight, Cpu
} from 'lucide-react'
import { TemplateConfig, LayoutConfig, TextLayerConfig, QrLayerConfig } from './types'
import {
  GOOGLE_FONTS,
  STANDARD_FONTS,
  ensureFontLoaded,
  loadCustomFontFromFile,
  querySystemFonts,
} from '@/lib/certificates/canvas-renderer'

interface Props {
  template: TemplateConfig
  // All templates of the event — used to offer "apply to all solo/team templates".
  otherTemplates: TemplateConfig[]
  onSave: (updated: TemplateConfig[]) => void
  onClose: () => void
}

type SampleLength = 'short' | 'medium' | 'long'

const SAMPLE_NAMES: Record<SampleLength, string> = {
  short: 'Ria',
  medium: 'Jayashrii Shankar',
  long: 'Venkata Subramanian Krishnamurthy Raghavendran',
}

const SAMPLE_TEAM_NAMES: Record<SampleLength, string> = {
  short: 'Byte',
  medium: 'Team Alpha Coders',
  long: 'The Quantum Neural Network Innovators Collective',
}

const DEFAULT_LAYOUT: LayoutConfig = {
  name: {
    x: 0.5,
    y: 0.46,
    fontSize: 54,
    fontFamily: 'Playfair Display',
    fontWeight: 'bold',
    fontStyle: 'normal',
    textAlign: 'center',
    maxWidth: 0.75,
    color: '#1a1a1a',
  },
  teamName: {
    x: 0.5,
    y: 0.56,
    fontSize: 28,
    fontFamily: 'Montserrat',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    maxWidth: 0.65,
    color: '#333333',
  },
  qr: {
    x: 0.82,
    y: 0.78,
    size: 120,
  },
}

export function TemplateEditor({ template, otherTemplates, onSave, onClose }: Props) {
  // Detect template type (solo vs team) from template metadata.
  // Solo templates only expose Name + QR; Team templates also expose Team Name.
  const isTeamTemplate = template.template_type === 'team'

  const [layout, setLayout] = useState<LayoutConfig>(() => {
    const initial = template.layout_config ?? DEFAULT_LAYOUT
    if (!isTeamTemplate) {
      // Solo templates must never include Team Name layout config
      const { teamName: _ignored, ...rest } = initial
      return rest
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'name' | 'teamName' | 'qr'>('name')

  // Sample text length shown in the preview, so the layout can be checked
  // against short, typical and very long names.
  const [sampleLength, setSampleLength] = useState<SampleLength>('medium')
  const sampleName = SAMPLE_NAMES[sampleLength]
  const sampleTeam = SAMPLE_TEAM_NAMES[sampleLength]

  // Other templates of the same kind (solo/team) that can share this layout.
  const siblingTemplates = otherTemplates.filter(
    (t) => t.id !== template.id && t.template_type === template.template_type
  )
  const [applyToSiblings, setApplyToSiblings] = useState(siblingTemplates.length > 0)

  // Font options state
  const [customFonts, setCustomFonts] = useState<string[]>([])
  const [systemFonts, setSystemFonts] = useState<string[]>([])
  const [loadingSystemFonts, setLoadingSystemFonts] = useState(false)
  const [uploadingFont, setUploadingFont] = useState(false)

  // Image & Canvas refs
  const [imgDim, setImgDim] = useState<{ w: number; h: number }>({ w: 1, h: 1 })
  const [previewCanvasUrl, setPreviewCanvasUrl] = useState<string | null>(null)
  const [renderingPreview, setRenderingPreview] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const fontFileInputRef = useRef<HTMLInputElement>(null)

  // Dragging state
  const [isDragging, setIsDragging] = useState(false)
  const dragTargetRef = useRef<'name' | 'teamName' | 'qr' | null>(null)

  // Load natural dimensions of template image
  useEffect(() => {
    if (template.previewUrl) {
      const img = new Image()
      img.src = template.previewUrl
      img.onload = () => {
        setImgDim({ w: img.naturalWidth, h: img.naturalHeight })
      }
    }
  }, [template.previewUrl])

  // Load Google Fonts on demand whenever layout fontFamily changes
  useEffect(() => {
    if (layout.name?.fontFamily) ensureFontLoaded(layout.name.fontFamily)
    if (layout.teamName?.fontFamily) ensureFontLoaded(layout.teamName.fontFamily)
  }, [layout.name?.fontFamily, layout.teamName?.fontFamily])

  // Live unified canvas preview rendering function
  const renderLivePreview = useCallback(async () => {
    if (!template.previewUrl || imgDim.w <= 1) return

    setRenderingPreview(true)
    try {
      // Create offscreen canvas at natural dimensions
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = template.previewUrl
      await new Promise((res) => { img.onload = res })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!

      // 1. Draw template image
      ctx.drawImage(img, 0, 0)

      const W = img.naturalWidth
      const H = img.naturalHeight

      // Helper to build font string
      const getFontStr = (cfg: TextLayerConfig, size: number) => {
        const style = cfg.fontStyle === 'italic' ? 'italic' : 'normal'
        const weight = cfg.fontWeight || 'normal'
        return `${style} ${weight} ${size}px "${cfg.fontFamily}", sans-serif`
      }

      // 2. Draw sample Participant Name
      if (layout.name) {
        const cfg = layout.name
        await ensureFontLoaded(cfg.fontFamily)

        let fontSize = cfg.fontSize
        const maxPx = (cfg.maxWidth ?? 0.75) * W
        ctx.textAlign = cfg.textAlign ?? 'center'
        ctx.textBaseline = 'middle'

        while (fontSize > 8) {
          ctx.font = getFontStr(cfg, fontSize)
          if (ctx.measureText(sampleName).width <= maxPx) break
          fontSize -= 1
        }

        ctx.fillStyle = cfg.color ?? '#1a1a1a'
        ctx.font = getFontStr(cfg, fontSize)
        ctx.fillText(sampleName, cfg.x * W, cfg.y * H, maxPx)
      }

      // 3. Draw sample Team Name
      if (layout.teamName) {
        const cfg = layout.teamName
        await ensureFontLoaded(cfg.fontFamily)

        let fontSize = cfg.fontSize
        const maxPx = (cfg.maxWidth ?? 0.65) * W
        ctx.textAlign = cfg.textAlign ?? 'center'
        ctx.textBaseline = 'middle'

        while (fontSize > 8) {
          ctx.font = getFontStr(cfg, fontSize)
          if (ctx.measureText(sampleTeam).width <= maxPx) break
          fontSize -= 1
        }

        ctx.fillStyle = cfg.color ?? '#333333'
        ctx.font = getFontStr(cfg, fontSize)
        ctx.fillText(sampleTeam, cfg.x * W, cfg.y * H, maxPx)
      }

      // 4. Draw sample QR Code
      if (layout.qr) {
        const QRCode = (await import('qrcode')).default
        const qrDataUrl = await QRCode.toDataURL('https://cintel.app/verify/sample-qr', {
          width: layout.qr.size,
          margin: 1,
          color: { dark: '#1a1a1a', light: '#ffffff' },
        })

        const qrImg = new Image()
        qrImg.src = qrDataUrl
        await new Promise((res) => { qrImg.onload = res })

        ctx.drawImage(qrImg, layout.qr.x * W, layout.qr.y * H, layout.qr.size, layout.qr.size)
      }

      const url = canvas.toDataURL('image/png')
      setPreviewCanvasUrl(url)
    } catch (err) {
      console.error('Editor preview render error:', err)
    } finally {
      setRenderingPreview(false)
    }
  }, [template.previewUrl, imgDim, layout, sampleName, sampleTeam])

  // Re-render live preview whenever layout changes
  useEffect(() => {
    renderLivePreview()
  }, [renderLivePreview])

  // Direct Pointer Drag Handler (Mouse / Touch)
  const handlePointerDown = (e: React.PointerEvent, target: 'name' | 'teamName' | 'qr') => {
    e.stopPropagation()
    e.preventDefault()
    setActiveTab(target)
    dragTargetRef.current = target
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragTargetRef.current || !containerRef.current) return
    e.preventDefault()

    const rect = containerRef.current.getBoundingClientRect()
    // Calculate relative normalized coordinates (0..1)
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))

    const target = dragTargetRef.current
    if (target === 'name' || target === 'teamName') {
      setLayout((prev) => ({
        ...prev,
        [target]: {
          ...(prev[target] ?? DEFAULT_LAYOUT[target]!),
          x: Math.round(relX * 1000) / 1000,
          y: Math.round(relY * 1000) / 1000,
        },
      }))
    } else if (target === 'qr') {
      setLayout((prev) => ({
        ...prev,
        qr: {
          ...prev.qr,
          x: Math.round(relX * 1000) / 1000,
          y: Math.round(relY * 1000) / 1000,
        },
      }))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false)
      dragTargetRef.current = null
      try {
        ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      } catch {}
    }
  }

  // Load System Fonts button handler
  const handleLoadSystemFonts = async () => {
    setLoadingSystemFonts(true)
    try {
      const fonts = await querySystemFonts()
      if (fonts.length > 0) {
        setSystemFonts(fonts)
      } else {
        alert('System fonts access not supported by browser or permission was declined.')
      }
    } catch {
      alert('Could not load system fonts.')
    } finally {
      setLoadingSystemFonts(false)
    }
  }

  // Upload custom font file handler (.ttf, .otf, .woff, .woff2)
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setUploadingFont(true)
    try {
      const fontName = await loadCustomFontFromFile(file)
      setCustomFonts((prev) => Array.from(new Set([...prev, fontName])))

      // Apply font to active tab immediately
      if (activeTab === 'name' || activeTab === 'teamName') {
        updateText(activeTab, 'fontFamily', fontName)
      }
    } catch (err: any) {
      alert(`Font upload failed: ${err.message}`)
    } finally {
      setUploadingFont(false)
    }
  }

  // Save layout config to backend
  async function handleSave() {
    setSaving(true)
    try {
      // Solo templates must never save Team Name layout config
      const layoutToSave = isTeamTemplate
        ? layout
        : (() => {
            const { teamName: _ignored, ...rest } = layout
            return rest
          })()

      const targets = applyToSiblings ? [template, ...siblingTemplates] : [template]
      const saved = await Promise.all(
        targets.map(async (t) => {
          const res = await fetch(`/api/certificates/templates/${t.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout_config: layoutToSave }),
          })
          const json = await res.json()
          if (!res.ok || json.error) {
            throw new Error(`${t.certificate_type ?? t.name}: ${json.error ?? 'Save failed'}`)
          }
          return json.data as TemplateConfig
        })
      )
      onSave(saved)
      alert(
        targets.length > 1
          ? `Layout saved to all ${targets.length} ${isTeamTemplate ? 'Team' : 'Solo'} templates.`
          : 'Template layout saved successfully!'
      )
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Transparent drag handle covering the area the text is drawn in:
  // maxWidth wide, about one line tall, anchored like the canvas text.
  const textBoxStyle = (cfg: TextLayerConfig): React.CSSProperties => ({
    left: `${cfg.x * 100}%`,
    top: `${cfg.y * 100}%`,
    width: `${(cfg.maxWidth ?? 0.7) * 100}%`,
    height: `${Math.max((cfg.fontSize * 1.3) / imgDim.h, 0.02) * 100}%`,
    transform:
      cfg.textAlign === 'center'
        ? 'translate(-50%, -50%)'
        : cfg.textAlign === 'right'
        ? 'translate(-100%, -50%)'
        : 'translate(0, -50%)',
  })

  const updateText = (key: 'name' | 'teamName', field: keyof TextLayerConfig, val: any) => {
    setLayout((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? DEFAULT_LAYOUT[key]!),
        [field]: val,
      },
    }))
  }

  const updateQr = (field: keyof QrLayerConfig, val: any) => {
    setLayout((prev) => ({
      ...prev,
      qr: {
        ...prev.qr,
        [field]: val,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-panel-muted px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground-soft transition active:translate-x-[2px] active:translate-y-[2px] hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to Templates
          </button>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-foreground">
              Template Layout Editor: {template.certificate_type ?? template.name}
              <span className="app-badge app-badge-warning ml-2">
                {isTeamTemplate ? 'Team' : 'Solo'}
              </span>
            </h2>
            <p className="text-xs font-medium text-foreground-soft">
              Directly drag elements on preview or use precision controls below. Output resolution: {imgDim.w} × {imgDim.h} px
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="app-button-primary text-sm disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Layout Configuration
          </button>
          {siblingTemplates.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground-soft">
              <input
                type="checkbox"
                checked={applyToSiblings}
                onChange={(e) => setApplyToSiblings(e.target.checked)}
                className="accent-warning"
              />
              Also apply to all other {isTeamTemplate ? 'Team' : 'Solo'} templates (
              {siblingTemplates.map((t) => t.certificate_type ?? t.name).join(', ')})
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* INTERACTIVE DRAGGABLE PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-soft">
              Interactive Preview (Click &amp; Drag Elements Directly)
            </span>
            {renderingPreview && (
              <span className="text-[10px] text-warning flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Updating preview...
              </span>
            )}
          </div>

          {/* Sample name length — check the layout fits short and long names */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold uppercase tracking-wider text-foreground-soft">Sample name:</span>
            {(['short', 'medium', 'long'] as const).map((len) => (
              <button
                key={len}
                onClick={() => setSampleLength(len)}
                title={isTeamTemplate ? `${SAMPLE_NAMES[len]} · ${SAMPLE_TEAM_NAMES[len]}` : SAMPLE_NAMES[len]}
                className={`rounded-full border-2 px-3 py-1 font-bold capitalize transition-colors ${
                  sampleLength === len
                    ? 'border-warning bg-warning/15 text-warning'
                    : 'border-border bg-panel-muted text-foreground-soft hover:text-foreground'
                }`}
              >
                {len}
              </button>
            ))}
            <span className="truncate font-medium text-foreground-soft">“{sampleName}”</span>
          </div>

          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full overflow-hidden rounded-2xl border-4 border-border bg-panel-muted shadow-lg select-none touch-none"
          >
            {/* Background Canvas Preview (Rendered by Canvas Renderer) */}
            {previewCanvasUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewCanvasUrl}
                alt="Certificate Canvas Preview"
                className="w-full h-auto block pointer-events-none"
              />
            ) : (
              <div className="p-16 text-center text-sm font-medium text-foreground-soft flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-warning" />
                Rendering template preview...
              </div>
            )}

            {/* EDITOR-ONLY INTERACTIVE BOUNDING BOXES FOR DIRECT DRAGGING */}

            {/* Participant Name Bounding Box */}
            {layout.name && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'name')}
                title={`Participant name (${Math.round(layout.name.x * 100)}%, ${Math.round(layout.name.y * 100)}%) — drag to move`}
                className={`absolute cursor-grab active:cursor-grabbing border ${
                  activeTab === 'name'
                    ? 'border-warning z-20'
                    : 'border-dashed border-foreground/50 hover:border-warning'
                }`}
                style={textBoxStyle(layout.name)}
              />
            )}

            {/* Team Name Bounding Box (Team templates only) */}
            {isTeamTemplate && layout.teamName && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'teamName')}
                title={`Team name (${Math.round(layout.teamName.x * 100)}%, ${Math.round(layout.teamName.y * 100)}%) — drag to move`}
                className={`absolute cursor-grab active:cursor-grabbing border ${
                  activeTab === 'teamName'
                    ? 'border-accent z-20'
                    : 'border-dashed border-foreground/50 hover:border-accent'
                }`}
                style={textBoxStyle(layout.teamName)}
              />
            )}

            {/* QR Code Bounding Box */}
            {layout.qr && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'qr')}
                title={`QR code (${Math.round(layout.qr.x * 100)}%, ${Math.round(layout.qr.y * 100)}%) — drag to move`}
                className={`absolute cursor-grab active:cursor-grabbing border ${
                  activeTab === 'qr'
                    ? 'border-success z-20'
                    : 'border-dashed border-foreground/50 hover:border-success'
                }`}
                // Same size/position the renderer draws the QR at (top-left anchored).
                style={{
                  left: `${layout.qr.x * 100}%`,
                  top: `${layout.qr.y * 100}%`,
                  width: `${(layout.qr.size / imgDim.w) * 100}%`,
                  height: `${(layout.qr.size / imgDim.h) * 100}%`,
                }}
              />
            )}
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div className="app-panel-muted p-5 space-y-5">
          {/* Layer tabs */}
          <div className="flex border-b-2 border-border">
            <button
              onClick={() => setActiveTab('name')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'name'
                  ? 'border-warning text-warning'
                  : 'border-transparent text-foreground-soft hover:text-foreground'
              }`}
            >
              <Type size={12} className="inline mr-1" />
              Name
            </button>
            {isTeamTemplate && (
              <button
                onClick={() => setActiveTab('teamName')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'teamName'
                    ? 'border-accent text-accent'
                    : 'border-transparent text-foreground-soft hover:text-foreground'
                }`}
              >
                <Users size={12} className="inline mr-1" />
                Team
              </button>
            )}
            <button
              onClick={() => setActiveTab('qr')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'qr'
                  ? 'border-success text-success'
                  : 'border-transparent text-foreground-soft hover:text-foreground'
              }`}
            >
              <QrCode size={12} className="inline mr-1" />
              QR
            </button>
          </div>

          {/* NAME / TEAM TEXT CONTROLS */}
          {(activeTab === 'name' || activeTab === 'teamName') && (
            <div className="space-y-4">
              {/* X Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                    X Position (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round((layout[activeTab]?.x ?? 0.5) * 100)}
                      onChange={(e) =>
                        updateText(activeTab, 'x', (parseFloat(e.target.value) || 0) / 100)
                      }
                      className="w-16 app-input text-xs py-0.5 text-right font-mono"
                    />
                    <span className="text-xs font-medium text-foreground-soft">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout[activeTab]?.x ?? 0.5}
                  onChange={(e) => updateText(activeTab, 'x', parseFloat(e.target.value))}
                  className="w-full accent-warning"
                />
              </div>

              {/* Y Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
                    Y Position (%)
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round((layout[activeTab]?.y ?? 0.5) * 100)}
                      onChange={(e) =>
                        updateText(activeTab, 'y', (parseFloat(e.target.value) || 0) / 100)
                      }
                      className="w-16 app-input text-xs py-0.5 text-right font-mono"
                    />
                    <span className="text-xs font-medium text-foreground-soft">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout[activeTab]?.y ?? 0.5}
                  onChange={(e) => updateText(activeTab, 'y', parseFloat(e.target.value))}
                  className="w-full accent-warning"
                />
              </div>

              {/* FONT FAMILY DROPDOWN & ACTIONS */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block">Font Family</label>
                <select
                  value={layout[activeTab]?.fontFamily ?? 'Playfair Display'}
                  onChange={(e) => updateText(activeTab, 'fontFamily', e.target.value)}
                  className="app-select text-xs py-1.5"
                >
                  <optgroup label="Certificate Google Fonts">
                    {GOOGLE_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Standard Fonts">
                    {STANDARD_FONTS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </optgroup>
                  {customFonts.length > 0 && (
                    <optgroup label="Uploaded Custom Fonts">
                      {customFonts.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {systemFonts.length > 0 && (
                    <optgroup label="System Fonts">
                      {systemFonts.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleLoadSystemFonts}
                    disabled={loadingSystemFonts}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border-2 border-border bg-panel py-1 text-[11px] font-bold uppercase tracking-wider text-foreground-soft hover:text-foreground disabled:opacity-50"
                  >
                    {loadingSystemFonts ? <Loader2 size={10} className="animate-spin" /> : <Cpu size={10} />}
                    System Fonts
                  </button>

                  <input
                    ref={fontFileInputRef}
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2"
                    className="hidden"
                    onChange={handleFontUpload}
                  />
                  <button
                    onClick={() => fontFileInputRef.current?.click()}
                    disabled={uploadingFont}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-full border-2 border-border bg-panel py-1 text-[11px] font-bold uppercase tracking-wider text-foreground-soft hover:text-foreground disabled:opacity-50"
                  >
                    {uploadingFont ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    Upload Font
                  </button>
                </div>
              </div>

              {/* FONT SIZE & TEXT ALIGN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    value={layout[activeTab]?.fontSize ?? 48}
                    onChange={(e) => updateText(activeTab, 'fontSize', parseInt(e.target.value) || 20)}
                    className="app-input text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block mb-1">Text Alignment</label>
                  <div className="flex overflow-hidden rounded-full border-2 border-border">
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'left')}
                      className={`flex-1 py-1.5 flex justify-center transition-colors ${
                        layout[activeTab]?.textAlign === 'left' ? 'bg-warning text-foreground' : 'bg-panel text-foreground-soft'
                      }`}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'center')}
                      className={`flex-1 py-1.5 flex justify-center transition-colors ${
                        layout[activeTab]?.textAlign === 'center' ? 'bg-warning text-foreground' : 'bg-panel text-foreground-soft'
                      }`}
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'right')}
                      className={`flex-1 py-1.5 flex justify-center transition-colors ${
                        layout[activeTab]?.textAlign === 'right' ? 'bg-warning text-foreground' : 'bg-panel text-foreground-soft'
                      }`}
                    >
                      <AlignRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* FONT WEIGHT & ITALIC TOGGLE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block mb-1">Font Weight</label>
                  <select
                    value={layout[activeTab]?.fontWeight ?? 'bold'}
                    onChange={(e) => updateText(activeTab, 'fontWeight', e.target.value)}
                    className="app-select text-xs py-1.5"
                  >
                    <option value="normal">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">Semi Bold (600)</option>
                    <option value="bold">Bold (700)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block mb-1">Italic Style</label>
                  <button
                    onClick={() =>
                      updateText(
                        activeTab,
                        'fontStyle',
                        layout[activeTab]?.fontStyle === 'italic' ? 'normal' : 'italic'
                      )
                    }
                    className={`w-full py-1.5 px-3 flex items-center justify-center gap-2 rounded-full border-2 text-xs font-bold uppercase tracking-wider transition-all ${
                      layout[activeTab]?.fontStyle === 'italic'
                        ? 'bg-warning text-foreground border-warning'
                        : 'bg-panel text-foreground-soft border-border hover:text-foreground'
                    }`}
                  >
                    <Italic size={14} />
                    {layout[activeTab]?.fontStyle === 'italic' ? 'Italic Active' : 'Normal'}
                  </button>
                </div>
              </div>

              {/* COLOR & MAX WIDTH */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft block mb-1">Color</label>
                  <div className="flex items-center gap-2 rounded-lg border-2 border-border bg-panel p-1">
                    <input
                      type="color"
                      value={layout[activeTab]?.color ?? '#1a1a1a'}
                      onChange={(e) => updateText(activeTab, 'color', e.target.value)}
                      className="h-6 w-8 cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[11px] font-mono font-medium text-foreground-soft uppercase">
                      {layout[activeTab]?.color ?? '#1a1a1a'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Max Width (%)</label>
                    <span className="text-xs font-mono font-medium text-foreground-soft">
                      {Math.round((layout[activeTab]?.maxWidth ?? 0.75) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={layout[activeTab]?.maxWidth ?? 0.75}
                    onChange={(e) => updateText(activeTab, 'maxWidth', parseFloat(e.target.value))}
                    className="w-full accent-warning"
                  />
                </div>
              </div>
            </div>
          )}

          {/* QR CONTROLS */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              {/* X Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">X Position (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round((layout.qr?.x ?? 0.82) * 100)}
                      onChange={(e) => updateQr('x', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-16 app-input text-xs py-0.5 text-right font-mono"
                    />
                    <span className="text-xs font-medium text-foreground-soft">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout.qr?.x ?? 0.82}
                  onChange={(e) => updateQr('x', parseFloat(e.target.value))}
                  className="w-full accent-success"
                />
              </div>

              {/* Y Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">Y Position (%)</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={Math.round((layout.qr?.y ?? 0.78) * 100)}
                      onChange={(e) => updateQr('y', (parseFloat(e.target.value) || 0) / 100)}
                      className="w-16 app-input text-xs py-0.5 text-right font-mono"
                    />
                    <span className="text-xs font-medium text-foreground-soft">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout.qr?.y ?? 0.78}
                  onChange={(e) => updateQr('y', parseFloat(e.target.value))}
                  className="w-full accent-success"
                />
              </div>

              {/* Size Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-foreground-soft">QR Size (px)</label>
                  <span className="text-xs font-mono text-success">{layout.qr?.size ?? 120} px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="400"
                  step="5"
                  value={layout.qr?.size ?? 120}
                  onChange={(e) => updateQr('size', parseInt(e.target.value) || 120)}
                  className="w-full accent-success"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
