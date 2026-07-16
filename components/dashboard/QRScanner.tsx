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
      <div className="overflow-hidden border border-[#243B72] bg-[#10224A]">
        <div className="flex items-center gap-3 border-b border-[#243B72] px-5 py-4">
          <span className="bg-[#0B1736] p-3 text-[#F5E62D]">
            <ScanLine size={18} />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">QR Attendance Scanner</h3>
            <p className="text-xs text-slate-400">Scan participant QR codes quickly</p>
          </div>
        </div>

        <div className="p-5">
          <div className="border border-[#243B72] bg-black p-3">
            <div id="qr-reader-container" className="overflow-hidden" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Camera size={16} className="text-[#F5E62D]" />
            Point camera at a participant QR code
          </div>
        </div>
      </div>
    </div>
  )
}
