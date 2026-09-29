// Event poster: shown on the home page, the events page and the event's own page.
//   PosterPicker — create form: pick a file now, it's uploaded once the event exists.
//   EventPoster  — edit page: upload, replace or remove straight away.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2 } from 'lucide-react'

const TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function posterProblem(file: File): string | null {
  if (!TYPES.includes(file.type)) return 'The poster must be a JPG, PNG or WebP image.'
  if (file.size > MAX_BYTES) return 'The poster must be 5 MB or smaller.'
  return null
}

export async function uploadPoster(eventId: string, file: File): Promise<{ url?: string; error?: string }> {
  const body = new FormData()
  body.append('file', file)
  const res = await fetch(`/api/events/${eventId}/banner`, { method: 'POST', body })
  const json = await res.json().catch(() => null)
  if (!res.ok) return { error: json?.error ?? 'Could not upload the poster.' }
  return { url: json?.data?.banner_url }
}

const labelCls = 'mb-2 block font-tech text-xs font-bold uppercase tracking-widest text-foreground-soft'
const hint = 'JPG, PNG or WebP, up to 5 MB. Cards show a 16:9 crop; the event page shows the whole poster.'

function Preview({ src }: { src: string }) {
  return (
    <div className="overflow-hidden rounded-xl border-2 border-border bg-[#14120F]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Event poster preview" className="mx-auto max-h-72 w-auto object-contain" />
    </div>
  )
}

export function PosterPicker({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  // Free the preview's memory when the file changes or the form goes away.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
  }, [preview])

  return (
    <div>
      <label className={labelCls}>Poster (optional)</label>
      {preview && <Preview src={preview} />}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => input.current?.click()} className="app-button-secondary">
          <ImagePlus size={16} /> {file ? 'Choose another' : 'Choose poster'}
        </button>
        {file && (
          <button type="button" onClick={() => onChange(null)} className="text-sm font-bold text-brand hover:underline">
            Remove
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0] ?? null
          e.target.value = ''
          if (!picked) return
          const why = posterProblem(picked)
          setProblem(why)
          if (!why) onChange(picked)
        }}
      />
      <p className={`mt-2 text-xs font-medium ${problem ? 'text-danger' : 'text-foreground-soft'}`}>{problem ?? hint}</p>
    </div>
  )
}

export function EventPoster({
  eventId,
  url,
  onChange,
}: {
  eventId: string
  url: string | null | undefined
  onChange: (url: string | null) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function upload(file: File) {
    const why = posterProblem(file)
    setProblem(why)
    if (why) return
    setBusy(true)
    const { url: next, error } = await uploadPoster(eventId, file)
    setBusy(false)
    if (error) setProblem(error)
    else onChange(next ?? null)
  }

  async function remove() {
    if (!confirm('Remove the poster?')) return
    setBusy(true)
    const res = await fetch(`/api/events/${eventId}/banner`, { method: 'DELETE' })
    const json = await res.json().catch(() => null)
    setBusy(false)
    if (!res.ok) setProblem(json?.error ?? 'Could not remove the poster.')
    else {
      setProblem(null)
      onChange(null)
    }
  }

  return (
    <div>
      <label className={labelCls}>Poster</label>
      {url ? <Preview src={url} /> : (
        <div className="app-empty-state">No poster yet. Events without one show their type instead.</div>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="app-button-secondary disabled:opacity-60">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {url ? 'Replace poster' : 'Upload poster'}
        </button>
        {url && (
          <button type="button" disabled={busy} onClick={remove} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline disabled:opacity-60">
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0]
          e.target.value = ''
          if (picked) upload(picked)
        }}
      />
      <p className={`mt-2 text-xs font-medium ${problem ? 'text-danger' : 'text-foreground-soft'}`}>{problem ?? hint}</p>
    </div>
  )
}
