import type { ArchivedEvent } from '@/lib/club'

// A past event from the association's archive (not a database event): photo,
// year · kind, title, one line and a couple of facts.
export function ArchiveCard({ event }: { event: ArchivedEvent }) {
  return (
    <article className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border-[3px] border-[#161412] bg-panel [box-shadow:6px_6px_0_#161412]">
      <div className="relative aspect-[16/10] overflow-hidden border-b-[3px] border-[#161412] bg-[#161412]">
        {event.photo && <img src={event.photo} alt={event.alt} loading="lazy" className="h-full w-full object-cover" />}
        <span className="absolute left-3 top-3 rounded-full border-2 border-[#161412] bg-primary-yellow px-3 py-1 font-tech text-[10px] font-bold uppercase tracking-[0.16em] text-[#161412]">
          {event.year} · {event.kind}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="font-display text-xl uppercase leading-tight text-foreground">{event.title}</h3>
        <p className="text-[15px] leading-[1.55] text-foreground-soft">{event.text}</p>
        <ul className="mt-auto flex flex-wrap gap-2 pt-2">
          {event.facts.map((f) => (
            <li key={f} className="rounded-full border-2 border-border px-3 py-1 font-tech text-[11px] font-bold uppercase tracking-[0.12em] text-foreground">
              {f}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
