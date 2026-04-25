// Owner: SHARED — coordinate FE1 + FE2 before modifying
// Handles file upload to Supabase Storage before form submission
// TODO: Implement upload logic using supabase.storage.from('uploads').upload(...)
'use client'
import { useState } from 'react'

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
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type="file" onChange={handleChange}
        accept={allowedTypes?.join(',') ?? '*'}
        className="text-sm" />
      {status === 'uploading' && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
      {status === 'done'      && <p className="text-xs text-green-600 mt-1">Uploaded</p>}
      {error                  && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
