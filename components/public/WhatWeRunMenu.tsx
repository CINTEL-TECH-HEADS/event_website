'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import InfiniteMenu, { type MenuItem } from '@/components/reactbits/InfiniteMenu'
import { FLAGSHIP_EVENTS } from '@/lib/club'
import { optimizedImage } from '@/lib/image'

// Square poster tile for a flagship event that has no photo yet, drawn in
// the site's display font so the sphere never shows an empty face.
async function posterTile(title: string, kind: string): Promise<string> {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  const css = getComputedStyle(document.documentElement)
  const display = css.getPropertyValue('--font-bungee').trim() || 'sans-serif'
  const mono = css.getPropertyValue('--font-space-mono').trim() || 'monospace'
  await Promise.all([document.fonts.load(`80px ${display}`), document.fonts.load(`bold 22px ${mono}`)]).catch(() => {})

  ctx.fillStyle = '#161412'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#2c2925'
  for (let y = 7; y < size; y += 14) for (let x = 7; x < size; x += 14) ctx.fillRect(x, y, 2, 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `bold 22px ${mono}`
  const pill = kind.toUpperCase()
  const pw = ctx.measureText(pill).width + 36
  ctx.fillStyle = '#F2C230'
  ctx.beginPath()
  ctx.roundRect((size - pw) / 2, 120, pw, 44, 22)
  ctx.fill()
  ctx.fillStyle = '#161412'
  ctx.fillText(pill, size / 2, 143)

  ctx.font = `80px ${display}`
  ctx.lineWidth = 10
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#161412'
  ctx.fillStyle = '#F2C230'
  const words = title.toUpperCase().split(' ')
  const lines: string[] = []
  for (const w of words) {
    const last = lines[lines.length - 1]
    if (last && ctx.measureText(`${last} ${w}`).width < size - 80) lines[lines.length - 1] = `${last} ${w}`
    else lines.push(w)
  }
  lines.forEach((line, i) => {
    const y = size / 2 + 50 + (i - (lines.length - 1) / 2) * 84
    ctx.fillStyle = '#D6294C'
    ctx.fillText(line, size / 2 + 6, y + 6)
    ctx.fillStyle = '#F2C230'
    ctx.strokeText(line, size / 2, y)
    ctx.fillText(line, size / 2, y)
  })
  return canvas.toDataURL('image/png')
}

// "What we run": the flagship events on a draggable sphere. The button on
// the facing tile opens /events filtered to that kind of event.
export function WhatWeRunMenu() {
  const router = useRouter()
  const [items, setItems] = useState<MenuItem[] | null>(null)

  useEffect(() => {
    let active = true
    Promise.all(
      FLAGSHIP_EVENTS.map(async (e) => ({
        image: e.photo ? optimizedImage(e.photo, 640) : await posterTile(e.title, e.kind),
        link: `/events?type=${e.type}`,
        title: e.title,
        description: e.text,
      }))
    ).then((list) => active && setItems(list))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="relative h-[480px] overflow-hidden rounded-[22px] border-[3px] border-[#161412] bg-[#161412] [box-shadow:6px_6px_0_#D6294C] sm:h-[600px]">
      {items && <InfiniteMenu items={items} backgroundColor="#161412" onNavigate={(link) => router.push(link)} />}
      <p className="pointer-events-none absolute right-5 top-5 hidden font-tech text-[11px] font-bold tracking-[0.2em] text-[#8F877A] md:block">
        DRAG TO SPIN ↻
      </p>
    </div>
  )
}
