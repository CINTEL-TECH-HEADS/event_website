// Owner: FE2 - Certificates page
'use client'
import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, FileBadge2, Loader2, Mail, Upload } from 'lucide-react'

export default function CertificatesPage() {
  const { id } = useParams<{ id: string }>()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [templateUploaded, setTemplateUploaded] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [generatedCount, setGeneratedCount] = useState(0)

  const handleUploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('action', 'upload')
      formData.append('file', file)
      formData.append('event_id', id)

      const res = await fetch('/api/certificates', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        throw new Error('Failed to upload template')
      }

      setTemplateUploaded(true)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload template. Please check the file format.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleGenerateCertificates = async () => {
    if (!confirm('Generate certificates for all attendees?')) {
      return
    }

    setGenerating(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', event_id: id }),
      })

      if (!res.ok) {
        throw new Error('Failed to generate certificates')
      }

      const responseBody = await res.json()
      if (responseBody.error) {
        throw new Error(responseBody.error)
      }

      const generated = responseBody.data?.generated || 0
      setGeneratedCount(generated)
    } catch (error: any) {
      console.error('Generation failed:', error)
      alert('Failed to generate certificates: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleReleaseCertificates = async () => {
    if (!confirm('Send certificates to all attendees via email?')) {
      return
    }

    setReleasing(true)
    try {
      const res = await fetch('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'release', event_id: id }),
      })

      if (!res.ok) {
        throw new Error('Failed to release certificates')
      }

      await res.json()
    } catch (error) {
      console.error('Release failed:', error)
      alert('Failed to release certificates.')
    } finally {
      setReleasing(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="app-panel rounded-[2rem] px-6 py-7 sm:px-8">
        <span className="app-kicker">
          <FileBadge2 size={14} />
          Certificates
        </span>
        <h1 className="app-heading mt-4">Template, generate, release.</h1>
        <p className="app-subheading mt-3 max-w-2xl">
          Move attendees from completed check-in to finished certificate delivery with one clean
          workflow.
        </p>
      </section>

      <div className="grid gap-4">
        <section className="app-panel rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="app-badge app-badge-brand">Step 1</span>
              <h2 className="mt-3 text-lg font-semibold text-white">Upload a PDF template</h2>
              <p className="mt-2 text-sm text-slate-500">
                This template will be used for every generated certificate.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleUploadTemplate}
                disabled={uploading}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="app-button-primary"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {uploading ? 'Uploading...' : 'Choose PDF'}
              </button>
              {templateUploaded && (
                <span className="app-badge app-badge-success">
                  <Check size={14} />
                  Template ready
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="app-badge app-badge-success">Step 2</span>
              <h2 className="mt-3 text-lg font-semibold text-white">Generate certificates</h2>
              <p className="mt-2 text-sm text-slate-500">
                Certificates are generated only for attendees marked as present.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleGenerateCertificates}
                disabled={generating || !templateUploaded}
                className="app-button-success"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : null}
                {generating ? 'Generating...' : 'Generate Now'}
              </button>
              {generatedCount > 0 && (
                <span className="app-badge app-badge-brand">{generatedCount} generated</span>
              )}
            </div>
          </div>
        </section>

        <section className="app-panel rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="app-badge app-badge-warning">Step 3</span>
              <h2 className="mt-3 text-lg font-semibold text-white">Release by email</h2>
              <p className="mt-2 text-sm text-slate-500">
                Send generated certificates to attendees when you&apos;re ready.
              </p>
            </div>
            <button
              onClick={handleReleaseCertificates}
              disabled={releasing || generatedCount === 0}
              className="app-button-primary"
            >
              {releasing ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              {releasing ? 'Sending...' : 'Send Certificates'}
            </button>
          </div>
        </section>
      </div>

      <div className="app-alert-warning">
        Make sure everyone who needs a certificate has been marked as attended before generating.
      </div>
    </div>
  )
}
