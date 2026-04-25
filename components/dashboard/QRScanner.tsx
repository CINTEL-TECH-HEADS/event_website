// Owner: FE2
'use client'
import { useEffect, useRef } from 'react'

interface Props {
  onScan: (decodedText: string) => void
  onError?: (error: string) => void
}

export default function QRScanner({ onScan, onError }: Props) {
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('qr-reader-container')
      scannerRef.current = scanner

      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            onScan(decodedText)
            scanner.stop().catch(() => {})
          },
          () => {}
        )
        .catch((error: Error) => {
          onError?.(error.message ?? 'Camera access denied')
        })
    })

    return () => {
      scannerRef.current?.stop().catch(() => {})
    }
  }, [onError, onScan])

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-[1.75rem] border border-blue-100 bg-[linear-gradient(180deg,rgba(239,246,255,0.88),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_50px_rgba(37,99,235,0.08)]">
        <div className="rounded-[1.4rem] border border-white/70 bg-slate-950/95 p-3">
          <div id="qr-reader-container" className="overflow-hidden rounded-[1.1rem]" />
        </div>
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        Point the camera at a participant&apos;s QR code.
      </p>
    </div>
  )
}
