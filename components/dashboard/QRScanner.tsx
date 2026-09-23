// Owner: FE2
'use client'

import { useEffect, useRef } from 'react'
import { ScanLine, Camera } from 'lucide-react'

interface Props {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<any>(null)
  // Keep the latest callbacks in refs so the start effect can run ONCE on mount
  // without re-creating the camera instance every time the parent re-renders
  // (which was the source of the "scanner breaking" crashes).
  const onScanRef = useRef(onScan)
  const onErrorRef = useRef(onError)
  onScanRef.current = onScan
  onErrorRef.current = onError
  // Dedupe: the camera decodes ~10x/sec, so ignore the same code within a
  // cooldown → one physical scan fires one check-in.
  const lastScanRef = useRef<{ text: string; at: number }>({ text: '', at: 0 })

  useEffect(() => {
    let cancelled = false
    let scanner: any = null

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return
      scanner = new Html5Qrcode('qr-reader-container')
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            const now = Date.now()
            const last = lastScanRef.current
            if (decodedText === last.text && now - last.at < 3000) return
            lastScanRef.current = { text: decodedText, at: now }
            onScanRef.current(decodedText)
          },
          () => {} // per-frame decode failures are noise — ignore
        )
        .catch((error: Error) => {
          if (!cancelled) onErrorRef.current?.(error?.message ?? 'Camera access denied')
        })
    })

    return () => {
      cancelled = true
      const s = scannerRef.current
      if (s) {
        // Stop then clear; both are best-effort during teardown.
        s.stop()
          .then(() => s.clear())
          .catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-panel sm:border-4">
        <div className="flex items-center gap-3 border-b-2 border-border px-5 py-4 sm:border-b-4">
          <span className="rounded-xl border-2 border-border bg-panel-muted p-3 text-brand">
            <ScanLine size={18} />
          </span>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-foreground">QR Attendance Scanner</h3>
            <p className="text-xs font-medium text-foreground-soft">Scan participant QR codes quickly</p>
          </div>
        </div>

        <div className="p-5">
          {/* Viewfinder frame with corner ticks */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-border bg-black p-3 shadow-lg">
            <div id="qr-reader-container" className="overflow-hidden rounded-lg" />

            {/* Corner brackets */}
            <span className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-primary-yellow" />
            <span className="pointer-events-none absolute right-1 top-1 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-primary-red" />
            <span className="pointer-events-none absolute bottom-1 left-1 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-primary-red" />
            <span className="pointer-events-none absolute bottom-1 right-1 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-primary-yellow" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-foreground-soft">
            <Camera size={16} className="text-brand" />
            Point camera at a participant QR code
          </div>
        </div>
      </div>
    </div>
  )
}
