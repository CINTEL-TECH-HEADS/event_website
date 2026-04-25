// Owner: FE1 — QR Display (Premium UI)

type Props = {
  qrCodeUrl: string
}

export function QRDisplay({ qrCodeUrl }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-center space-y-4">
      
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          Check-in QR Code
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Present this at the event entrance
        </p>
      </div>

      {/* QR Image */}
      <div className="flex justify-center">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR Code"
            className="w-52 h-52 object-contain rounded-xl border"
          />
        ) : (
          <div className="w-52 h-52 flex items-center justify-center bg-gray-50 border rounded-xl text-gray-400 text-sm">
            Generating QR...
          </div>
        )}
      </div>

      {/* Footer hint */}
      <p className="text-xs text-gray-400">
        Keep this page or screenshot for quick access
      </p>
    </div>
  )
}
