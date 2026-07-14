// Owner: FE2 - Certificates page
'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Check,
  Loader2,
  Mail,
  Upload,
  Award,
} from 'lucide-react'

export default function CertificatesPage() {
  const { id } =
    useParams<{ id: string }>()

  const fileInputRef =
    useRef<HTMLInputElement>(
      null
    )

  const [uploading, setUploading] =
    useState(false)

  const [
    templateUploaded,
    setTemplateUploaded,
  ] = useState(false)

  const [
    generating,
    setGenerating,
  ] = useState(false)

  const [
    releasing,
    setReleasing,
  ] = useState(false)

  const [
    generatedCount,
    setGeneratedCount,
  ] = useState(0)

  async function handleUploadTemplate(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0]

    if (!file) return

    setUploading(true)

    try {
      const formData =
        new FormData()

      formData.append(
        'file',
        file
      )

      formData.append(
        'event_id',
        id
      )

      const res = await fetch(
        '/api/certificates/upload-template',
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!res.ok)
        throw new Error()

      setTemplateUploaded(
        true
      )
    } catch {
      alert(
        'Failed to upload template.'
      )
    } finally {
      setUploading(false)

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          ''
      }
    }
  }

  async function handleGenerateCertificates() {
    if (
      !confirm(
        'Generate certificates for all attendees?'
      )
    )
      return

    setGenerating(true)

    try {
      const res = await fetch(
        '/api/certificates/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            {
              event_id:
                id,
            }
          ),
        }
      )

      const { count } =
        await res.json()

      setGeneratedCount(
        count || 0
      )
    } catch {
      alert(
        'Failed to generate certificates.'
      )
    } finally {
      setGenerating(false)
    }
  }

  async function handleReleaseCertificates() {
    if (
      !confirm(
        'Send certificates to all attendees?'
      )
    )
      return

    setReleasing(true)

    try {
      await fetch(
        '/api/certificates/release',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(
            {
              event_id:
                id,
            }
          ),
        }
      )
    } catch {
      alert(
        'Failed to release certificates.'
      )
    } finally {
      setReleasing(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Hero */}
      <section className="app-panel  px-6 py-7  sm:px-8">

        <span className="inline-flex items-center gap-2 rounded-full bg-[#0B1736] px-4 py-2 text-xs font-semibold uppercase tracking-widest text-[#F5E62D]">
          <Award size={14} />
          Certificates
        </span>

        <h1 className="mt-5 text-3xl font-bold text-white">
          Template, generate,
          release.
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          Deliver certificates
          in one clean workflow
          after attendance
          completion.
        </p>

      </section>

      {/* Step 1 */}
      <section className=" border border-[#243B72] bg-[#10224A] p-6  transition-all duration-300 hover:-translate-y-1">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-[#F5E62D]">
              Step 1
            </span>

            <h2 className="mt-3 text-lg font-semibold text-white">
              Upload Certificate
              Template
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Upload your PDF
              design template.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".pdf"
              onChange={
                handleUploadTemplate
              }
              className="hidden"
            />

            <button
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={
                uploading
              }
              className="inline-flex items-center gap-2  bg-[#F5E62D] px-5 py-3 text-sm font-semibold text-[#0B1736] hover:bg-[#FFF27A]"
            >
              {uploading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Upload size={16} />
              )}

              {uploading
                ? 'Uploading...'
                : 'Choose PDF'}
            </button>

            {templateUploaded && (
              <span className="rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400">
                <Check
                  size={14}
                  className="mr-1 inline"
                />
                Ready
              </span>
            )}

          </div>

        </div>

      </section>

      {/* Step 2 */}
      <section className=" border border-[#243B72] bg-[#10224A] p-6  transition-all duration-300 hover:-translate-y-1">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
              Step 2
            </span>

            <h2 className="mt-3 text-lg font-semibold text-white">
              Generate
              Certificates
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Creates
              certificates for
              all attendees.
            </p>

          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              onClick={
                handleGenerateCertificates
              }
              disabled={
                generating ||
                !templateUploaded
              }
              className="inline-flex items-center gap-2  bg-green-500 px-5 py-3 text-sm font-semibold text-white hover:bg-green-400 disabled:opacity-50"
            >
              {generating && (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              )}

              {generating
                ? 'Generating...'
                : 'Generate Now'}
            </button>

            {generatedCount >
              0 && (
              <span className="rounded-full bg-[#0B1736] px-4 py-2 text-sm font-semibold text-[#F5E62D]">
                {
                  generatedCount
                }{' '}
                Generated
              </span>
            )}

          </div>

        </div>

      </section>

      {/* Step 3 */}
      <section className=" border border-[#243B72] bg-[#10224A] p-6  transition-all duration-300 hover:-translate-y-1">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <span className="rounded-full bg-[#0B1736] px-3 py-1 text-xs font-semibold text-[#93C5FD]">
              Step 3
            </span>

            <h2 className="mt-3 text-lg font-semibold text-white">
              Release by Email
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Send generated
              certificates to
              attendees.
            </p>

          </div>

          <button
            onClick={
              handleReleaseCertificates
            }
            disabled={
              releasing ||
              generatedCount ===
                0
            }
            className="inline-flex items-center gap-2  bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2563EB] disabled:opacity-50"
          >
            {releasing ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Mail size={16} />
            )}

            {releasing
              ? 'Sending...'
              : 'Send Certificates'}
          </button>

        </div>

      </section>

      {/* Note */}
      <div className=" border border-[#243B72] bg-[#10224A] px-5 py-4 text-sm text-slate-300">
        Ensure all eligible
        participants are marked
        attended before
        generating certificates.
      </div>

    </div>
  )
}