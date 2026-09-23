import { Sparkle } from '@/components/brand/Starburst'
import { RockShape } from '@/components/brand/RockShape'

export function QRDisplay({ qrCodeUrl }: { qrCodeUrl: string }) {
  return (
    <div className="relative inline-block rounded-poster border-4 border-border bg-panel p-5 shadow-lg">
      <RockShape variant={2} fill="#D6294C" className="absolute -left-3 -top-3 h-7 w-7 rotate-[-10deg]" />
      <Sparkle className="absolute -right-2 -top-2 h-5 w-5 text-primary-yellow" />
      <div className="rounded-xl border-2 border-border bg-white p-3">
        <img src={qrCodeUrl} alt="Check-in QR" className="h-52 w-52 object-contain" />
      </div>
    </div>
  )
}
