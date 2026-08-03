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
  onSave: (updated: TemplateConfig) => void
  onClose: () => void
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

export function TemplateEditor({ template, onSave, onClose }: Props) {
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
          if (ctx.measureText('Jayashrii Shankar').width <= maxPx) break
          fontSize -= 1
        }

        ctx.fillStyle = cfg.color ?? '#1a1a1a'
        ctx.font = getFontStr(cfg, fontSize)
        ctx.fillText('Jayashrii Shankar', cfg.x * W, cfg.y * H, maxPx)
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
          if (ctx.measureText('Team Alpha').width <= maxPx) break
          fontSize -= 1
        }

        ctx.fillStyle = cfg.color ?? '#333333'
        ctx.font = getFontStr(cfg, fontSize)
        ctx.fillText('Team Alpha', cfg.x * W, cfg.y * H, maxPx)
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
  }, [template.previewUrl, imgDim, layout])

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

      const res = await fetch(`/api/certificates/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_config: layoutToSave }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Save failed')
      onSave(json.data)
      alert('Template layout saved successfully!')
    } catch (err: any) {
      alert(`Save failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#243B72] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 border border-[#243B72] bg-[#10224A] px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to Templates
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">
              Template Layout Editor: {template.certificate_type ?? template.name}
              <span className="ml-2 text-xs font-bold uppercase tracking-widest text-[#F5E62D]">
                {isTeamTemplate ? 'Team' : 'Solo'}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Directly drag elements on preview or use precision controls below. Output resolution: {imgDim.w} × {imgDim.h} px
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#F5E62D] px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-[#0B1736] hover:bg-[#FFF27A] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Layout Configuration
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* INTERACTIVE DRAGGABLE PREVIEW */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Interactive Preview (Click &amp; Drag Elements Directly)
            </span>
            {renderingPreview && (
              <span className="text-[10px] text-[#F5E62D] flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> Updating preview...
              </span>
            )}
          </div>

          <div
            ref={containerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative w-full overflow-hidden border border-[#243B72] bg-[#070E1E] select-none touch-none"
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
              <div className="p-16 text-center text-sm text-slate-400 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-[#F5E62D]" />
                Rendering template preview...
              </div>
            )}

            {/* EDITOR-ONLY INTERACTIVE BOUNDING BOXES FOR DIRECT DRAGGING */}

            {/* Participant Name Bounding Box */}
            {layout.name && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'name')}
                className={`absolute transform -translate-y-1/2 cursor-grab active:cursor-grabbing border-2 px-3 py-1 transition-shadow ${
                  activeTab === 'name'
                    ? 'border-[#F5E62D] bg-[#F5E62D]/20 shadow-[0_0_12px_rgba(245,230,45,0.4)] ring-2 ring-[#F5E62D]/50 z-20'
                    : 'border-dashed border-white/60 bg-black/10 hover:border-[#F5E62D]'
                }`}
                style={{
                  left: `${layout.name.x * 100}%`,
                  top: `${layout.name.y * 100}%`,
                  transform:
                    layout.name.textAlign === 'center'
                      ? 'translate(-50%, -50%)'
                      : layout.name.textAlign === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                }}
              >
                <div className="text-[10px] font-mono font-bold text-[#F5E62D] bg-black/80 px-1 py-0.5 whitespace-nowrap pointer-events-none mb-0.5">
                  Participant Name [{Math.round(layout.name.x * 100)}%, {Math.round(layout.name.y * 100)}%]
                </div>
              </div>
            )}

            {/* Team Name Bounding Box (Team templates only) */}
            {isTeamTemplate && layout.teamName && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'teamName')}
                className={`absolute transform -translate-y-1/2 cursor-grab active:cursor-grabbing border-2 px-3 py-1 transition-shadow ${
                  activeTab === 'teamName'
                    ? 'border-[#93C5FD] bg-[#93C5FD]/20 shadow-[0_0_12px_rgba(147,197,253,0.4)] ring-2 ring-[#93C5FD]/50 z-20'
                    : 'border-dashed border-white/60 bg-black/10 hover:border-[#93C5FD]'
                }`}
                style={{
                  left: `${layout.teamName.x * 100}%`,
                  top: `${layout.teamName.y * 100}%`,
                  transform:
                    layout.teamName.textAlign === 'center'
                      ? 'translate(-50%, -50%)'
                      : layout.teamName.textAlign === 'right'
                      ? 'translate(-100%, -50%)'
                      : 'translate(0, -50%)',
                }}
              >
                <div className="text-[10px] font-mono font-bold text-[#93C5FD] bg-black/80 px-1 py-0.5 whitespace-nowrap pointer-events-none mb-0.5">
                  Team Name [{Math.round(layout.teamName.x * 100)}%, {Math.round(layout.teamName.y * 100)}%]
                </div>
              </div>
            )}

            {/* QR Code Bounding Box */}
            {layout.qr && (
              <div
                onPointerDown={(e) => handlePointerDown(e, 'qr')}
                className={`absolute cursor-grab active:cursor-grabbing border-2 flex items-center justify-center transition-shadow ${
                  activeTab === 'qr'
                    ? 'border-[#86EFAC] bg-[#86EFAC]/20 shadow-[0_0_12px_rgba(134,239,172,0.4)] ring-2 ring-[#86EFAC]/50 z-20'
                    : 'border-dashed border-white/60 bg-black/10 hover:border-[#86EFAC]'
                }`}
                style={{
                  left: `${layout.qr.x * 100}%`,
                  top: `${layout.qr.y * 100}%`,
                  width: `clamp(36px, ${layout.qr.size * 0.3}px, 120px)`,
                  height: `clamp(36px, ${layout.qr.size * 0.3}px, 120px)`,
                }}
              >
                <div className="text-[9px] font-mono font-bold text-[#86EFAC] bg-black/80 px-1 py-0.5 pointer-events-none">
                  QR [{Math.round(layout.qr.x * 100)}%, {Math.round(layout.qr.y * 100)}%]
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div className="border border-[#243B72] bg-[#0B1736] p-5 space-y-5">
          {/* Layer tabs */}
          <div className="flex border-b border-[#243B72]">
            <button
              onClick={() => setActiveTab('name')}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'name'
                  ? 'border-[#F5E62D] text-[#F5E62D]'
                  : 'border-transparent text-slate-400 hover:text-white'
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
                    ? 'border-[#93C5FD] text-[#93C5FD]'
                    : 'border-transparent text-slate-400 hover:text-white'
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
                  ? 'border-[#86EFAC] text-[#86EFAC]'
                  : 'border-transparent text-slate-400 hover:text-white'
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
                  <label className="text-xs font-semibold text-slate-300">
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
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout[activeTab]?.x ?? 0.5}
                  onChange={(e) => updateText(activeTab, 'x', parseFloat(e.target.value))}
                  className="w-full accent-[#F5E62D]"
                />
              </div>

              {/* Y Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">
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
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout[activeTab]?.y ?? 0.5}
                  onChange={(e) => updateText(activeTab, 'y', parseFloat(e.target.value))}
                  className="w-full accent-[#F5E62D]"
                />
              </div>

              {/* FONT FAMILY DROPDOWN & ACTIONS */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">Font Family</label>
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
                    className="flex-1 inline-flex items-center justify-center gap-1 border border-[#243B72] bg-[#10224A] py-1 text-[11px] font-semibold text-slate-300 hover:text-white disabled:opacity-50"
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
                    className="flex-1 inline-flex items-center justify-center gap-1 border border-[#243B72] bg-[#10224A] py-1 text-[11px] font-semibold text-slate-300 hover:text-white disabled:opacity-50"
                  >
                    {uploadingFont ? <Loader2 size={10} className="animate-spin" /> : <Upload size={10} />}
                    Upload Font
                  </button>
                </div>
              </div>

              {/* FONT SIZE & TEXT ALIGN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Font Size (px)</label>
                  <input
                    type="number"
                    value={layout[activeTab]?.fontSize ?? 48}
                    onChange={(e) => updateText(activeTab, 'fontSize', parseInt(e.target.value) || 20)}
                    className="app-input text-xs py-1.5"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Text Alignment</label>
                  <div className="flex border border-[#243B72]">
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'left')}
                      className={`flex-1 py-1.5 flex justify-center ${
                        layout[activeTab]?.textAlign === 'left' ? 'bg-[#F5E62D] text-[#0B1736]' : 'bg-[#0B1736] text-slate-400'
                      }`}
                    >
                      <AlignLeft size={14} />
                    </button>
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'center')}
                      className={`flex-1 py-1.5 flex justify-center ${
                        layout[activeTab]?.textAlign === 'center' ? 'bg-[#F5E62D] text-[#0B1736]' : 'bg-[#0B1736] text-slate-400'
                      }`}
                    >
                      <AlignCenter size={14} />
                    </button>
                    <button
                      onClick={() => updateText(activeTab, 'textAlign', 'right')}
                      className={`flex-1 py-1.5 flex justify-center ${
                        layout[activeTab]?.textAlign === 'right' ? 'bg-[#F5E62D] text-[#0B1736]' : 'bg-[#0B1736] text-slate-400'
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Font Weight</label>
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Italic Style</label>
                  <button
                    onClick={() =>
                      updateText(
                        activeTab,
                        'fontStyle',
                        layout[activeTab]?.fontStyle === 'italic' ? 'normal' : 'italic'
                      )
                    }
                    className={`w-full py-1.5 px-3 flex items-center justify-center gap-2 border border-[#243B72] text-xs font-bold transition-all ${
                      layout[activeTab]?.fontStyle === 'italic'
                        ? 'bg-[#F5E62D] text-[#0B1736] border-[#FFF27A]'
                        : 'bg-[#10224A] text-slate-300 hover:text-white'
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
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Color</label>
                  <div className="flex items-center gap-2 border border-[#243B72] bg-[#10224A] p-1">
                    <input
                      type="color"
                      value={layout[activeTab]?.color ?? '#1a1a1a'}
                      onChange={(e) => updateText(activeTab, 'color', e.target.value)}
                      className="h-6 w-8 cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-[11px] font-mono text-slate-300 uppercase">
                      {layout[activeTab]?.color ?? '#1a1a1a'}
                    </span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Max Width (%)</label>
                    <span className="text-xs font-mono text-slate-400">
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
                    className="w-full accent-[#F5E62D]"
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
                  <label className="text-xs font-semibold text-slate-300">X Position (%)</label>
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
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout.qr?.x ?? 0.82}
                  onChange={(e) => updateQr('x', parseFloat(e.target.value))}
                  className="w-full accent-[#86EFAC]"
                />
              </div>

              {/* Y Position Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">Y Position (%)</label>
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
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={layout.qr?.y ?? 0.78}
                  onChange={(e) => updateQr('y', parseFloat(e.target.value))}
                  className="w-full accent-[#86EFAC]"
                />
              </div>

              {/* Size Slider + Numeric Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-300">QR Size (px)</label>
                  <span className="text-xs font-mono text-[#86EFAC]">{layout.qr?.size ?? 120} px</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="400"
                  step="5"
                  value={layout.qr?.size ?? 120}
                  onChange={(e) => updateQr('size', parseInt(e.target.value) || 120)}
                  className="w-full accent-[#86EFAC]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
