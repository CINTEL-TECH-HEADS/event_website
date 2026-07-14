// Owner: FE2
'use client'

import { useEffect, useRef } from 'react'
import {
  ScanLine,
  Camera,
} from 'lucide-react'

interface Props {
  onScan: (
    decodedText: string
  ) => void

  onError?: (
    error: string
  ) => void
}

export default function QRScanner({
  onScan,
  onError,
}: Props) {
  const scannerRef =
    useRef<any>(null)

  useEffect(() => {
    import('html5-qrcode').then(
      ({
        Html5Qrcode,
      }) => {
        const scanner =
          new Html5Qrcode(
            'qr-reader-container'
          )

        scannerRef.current =
          scanner

        scanner
          .start(
            {
              facingMode:
                'environment',
            },
            {
              fps: 10,
              qrbox: {
                width: 250,
                height: 250,
              },
            },
            (
              decodedText: string
            ) => {
              onScan(
                decodedText
              )

              scanner
                .stop()
                .catch(
                  () => {}
                )
            },
            () => {}
          )
          .catch(
            (
              error: Error
            ) => {
              onError?.(
                error.message ??
                  'Camera access denied'
              )
            }
          )
      }
    )

    return () => {
      scannerRef.current
        ?.stop()
        .catch(
          () => {}
        )
    }
  }, [onError, onScan])

  return (
    <div className="mx-auto w-full max-w-lg">

      {/* Scanner Card */}
      <div className="overflow-hidden  border border-[#243B72] bg-[#10224A] ">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#243B72] px-5 py-4">

          <span className=" bg-[#0B1736] p-3 text-[#F5E62D]">
            <ScanLine
              size={18}
            />
          </span>

          <div>

            <h3 className="text-sm font-semibold text-white">
              QR Attendance
              Scanner
            </h3>

            <p className="text-xs text-slate-400">
              Scan participant
              QR codes quickly
            </p>

          </div>

        </div>

        {/* Scanner Area */}
        <div className="p-5">

          <div className=" border border-[#243B72] bg-black p-3">

            <div
              id="qr-reader-container"
              className="overflow-hidden "
            />

          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-400">

            <Camera
              size={16}
              className="text-[#F5E62D]"
            />

            Point camera at a
            participant QR code

          </div>

        </div>

      </div>

    </div>
  )
}