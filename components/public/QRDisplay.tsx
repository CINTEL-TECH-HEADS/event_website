export function QRDisplay({ qrCodeUrl }: { qrCodeUrl: string }) {
  return (
    <div className="inline-block rounded-3xl border border-white/10 bg-[#101b33] p-5">
      <div className="rounded-[1.35rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.16),transparent_55%),rgba(255,255,255,0.98)] p-3">
        <img src={qrCodeUrl} alt="Check-in QR" className="h-52 w-52 rounded-2xl border border-slate-200 bg-white object-contain" />
      </div>
    </div>
  )
}
