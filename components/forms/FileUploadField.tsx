// Owner: SHARED — coordinate FE1 + FE2 before modifying
// Handles file upload to Supabase Storage before form submission
// TODO: Implement upload logic using supabase.storage.from('uploads').upload(...)
'use client'
import { useState } from 'react'
import { UploadCloud } from 'lucide-react'

interface Props {
  fieldId: string
  label: string
  allowedTypes?: string[]
  maxSizeMb?: number
  onUploadComplete: (path: string) => void
}

export function FileUploadField({ fieldId, label, allowedTypes, maxSizeMb = 10, onUploadComplete }: Props) {
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setError(`File must be under ${maxSizeMb}MB`); return
    }

    setStatus('uploading')
    // TODO: Upload to Supabase Storage, call onUploadComplete(path) on success
    setStatus('done')
  }

  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-foreground-soft">{label}</label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-border bg-panel-muted px-4 py-6 text-center transition duration-200 hover:border-brand">
        <UploadCloud className="h-6 w-6 text-foreground-soft" strokeWidth={2.5} />
        <span className="text-xs font-bold uppercase tracking-widest text-foreground-soft">
          Click to choose a file
        </span>
        <input
          type="file"
          onChange={handleChange}
          accept={allowedTypes?.join(',') ?? '*'}
          className="hidden"
        />
      </label>
      {status === 'uploading' && <p className="mt-1 text-xs font-medium text-foreground-soft">Uploading...</p>}
      {status === 'done'      && <p className="mt-1 text-xs font-medium text-success">Uploaded</p>}
      {error                  && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
    </div>
  )
}
