'use client'
// components/certificates/CertificateTemplates.tsx
//
// Template management panel.
// For each of the 4 eligible certificate types, shows separate upload slots
// for Solo and Team templates (8 total upload slots).

import { useRef, useState } from 'react'
import { Upload, Settings, CheckCircle2, AlertCircle, Loader2, Trash2, User, Users } from 'lucide-react'
import { CERT_TYPES, TemplateConfig, TEMPLATE_TYPES } from './types'
import type { CertType, TemplateType } from './types'

interface Props {
  eventId: string
  templates: TemplateConfig[]
  onTemplatesChange: (templates: TemplateConfig[]) => void
  onEditTemplate: (template: TemplateConfig) => void
}

const ELIGIBLE_TYPES = CERT_TYPES.filter((t) => t !== 'Not Eligible')

export function CertificateTemplates({ eventId, templates, onTemplatesChange, onEditTemplate }: Props) {
  const [uploading, setUploading] = useState<string | null>(null) // key: `${templateType}:${certType}`
  const [deleting, setDeleting] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  function getTemplate(certType: string, templateType: string): TemplateConfig | undefined {
    return templates.find((t) => t.certificate_type === certType && t.template_type === templateType)
  }

  function getUploadKey(templateType: string, certType: string): string {
    return `${templateType}:${certType}`
  }

  async function handleUpload(certType: CertType, templateType: TemplateType, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const uploadKey = getUploadKey(templateType, certType)
    setUploading(uploadKey)
    try {
      const fd = new FormData()
      fd.append('event_id', eventId)
      fd.append('certificate_type', certType)
      fd.append('template_type', templateType)
      fd.append('name', `${templateType === 'solo' ? 'Solo' : 'Team'} ${certType}`)
      fd.append('file', file)

      const res = await fetch('/api/certificates/templates', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Upload failed')

      // Merge into templates list
      const existing = templates.find(
        (t) => t.certificate_type === certType && t.template_type === templateType
      )
      onTemplatesChange(
        existing
          ? templates.map((t) => (t.id === json.data.id ? json.data : t))
          : [...templates, json.data]
      )
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploading(null)
    }
  }

  async function handleDelete(tmpl: TemplateConfig) {
    const label = `${tmpl.template_type === 'solo' ? 'Solo' : 'Team'} ${tmpl.certificate_type}`
    if (!confirm(`Remove the ${label} template?`)) return
    setDeleting(tmpl.id)
    try {
      const res = await fetch(`/api/certificates/templates/${tmpl.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Delete failed')
      onTemplatesChange(templates.filter((t) => t.id !== tmpl.id))
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`)
    } finally {
      setDeleting(null)
    }
  }

  function renderTemplateSection(sectionType: TemplateType) {
    const sectionLabel = sectionType === 'solo' ? 'Solo Templates' : 'Team Templates'
    const sectionIcon = sectionType === 'solo' ? <User size={14} /> : <Users size={14} />
    const sectionColor = sectionType === 'solo' ? 'text-[#93C5FD]' : 'text-[#86EFAC]'
    const sectionBorder = sectionType === 'solo' ? 'border-[#93C5FD]/30' : 'border-[#86EFAC]/30'

    return (
      <div className="space-y-3">
        <div className={`flex items-center gap-2 border-b ${sectionBorder} pb-3`}>
          <span className={sectionColor}>{sectionIcon}</span>
          <h3 className={`text-sm font-bold uppercase tracking-wider ${sectionColor}`}>
            {sectionLabel}
          </h3>
          <span className="ml-auto text-[10px] text-slate-500">PNG · JPG · JPEG</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(ELIGIBLE_TYPES as readonly string[]).map((certType) => {
            const tmpl = getTemplate(certType, sectionType)
            const uploadKey = getUploadKey(sectionType, certType)
            const isUploading = uploading === uploadKey
            const isDeleting = deleting === tmpl?.id

            return (
              <div
                key={uploadKey}
                className="flex flex-col gap-3 border border-[#243B72] bg-[#0B1736] p-4 transition-colors hover:border-[#F5E62D]/30"
              >
                {/* Status row */}
                <div className="flex items-center gap-2">
                  {tmpl ? (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                  ) : (
                    <AlertCircle size={14} className="shrink-0 text-slate-500" />
                  )}
                  <span className="flex-1 text-sm font-semibold text-white">{certType}</span>
                  {tmpl && (
                    <span className="rounded-none bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Configured
                    </span>
                  )}
                </div>

                {/* Template preview thumbnail */}
                {tmpl?.previewUrl && (
                  <div className="overflow-hidden border border-[#243B72]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmpl.previewUrl}
                      alt={`${sectionLabel} ${certType}`}
                      className="h-20 w-full object-cover"
                    />
                  </div>
                )}

                {/* Layout config status */}
                {tmpl && (
                  <p className="text-[11px] text-slate-500">
                    Layout: {tmpl.layout_config ? 'Configured ✓' : 'Not configured yet'}
                  </p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {/* Upload / re-upload */}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    ref={(el) => { fileRefs.current[uploadKey] = el }}
                    onChange={(e) => handleUpload(certType as CertType, sectionType, e)}
                  />
                  <button
                    onClick={() => fileRefs.current[uploadKey]?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1.5 border border-[#243B72] bg-[#10224A] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-[#F5E62D]/50 hover:text-white disabled:opacity-50"
                  >
                    {isUploading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Upload size={12} />
                    )}
                    {tmpl ? 'Replace' : 'Upload'}
                  </button>

                  {/* Edit layout */}
                  {tmpl && (
                    <button
                      onClick={() => onEditTemplate(tmpl)}
                      className="inline-flex items-center gap-1.5 border border-[#243B72] bg-[#10224A] px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-[#F5E62D]/50 hover:text-white"
                    >
                      <Settings size={12} />
                      Layout
                    </button>
                  )}

                  {/* Delete */}
                  {tmpl && (
                    <button
                      onClick={() => handleDelete(tmpl)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 border border-red-900/40 bg-red-900/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:border-red-600/50 hover:text-red-300 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3 border-b border-[#243B72] pb-4">
        <h2 className="text-base font-bold uppercase tracking-widest text-white">
          Certificate Templates
        </h2>
      </div>

      {/* Solo Templates Section */}
      {renderTemplateSection('solo')}

      {/* Team Templates Section */}
      {renderTemplateSection('team')}
    </section>
  )
}
