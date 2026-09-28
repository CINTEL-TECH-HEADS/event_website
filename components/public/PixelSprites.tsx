'use client'

import type { CSSProperties, ReactNode } from 'react'
import { GLYPHS, RUNNER_HEAD, RUNNER_LEGS, RUNNER_PALETTE } from '@/components/threeui/crt/crtScreens'
import './PixelSprites.css'

/* Pixel sprites for the landing page, drawn in the same palette and pixel
   font as the hero's CINTEL level so the page reads as one game. Each sprite
   is a bitmap of palette keys rendered as crisp SVG rects; animation is CSS
   only and stops under prefers-reduced-motion. */

type Palette = Record<string, string>
type Bitmap = readonly string[]
type SpriteProps = { className?: string; style?: CSSProperties; scale?: number }

function Sprite({ rows, palette, scale = 3, className, style }: SpriteProps & { rows: Bitmap; palette: Palette }) {
  const width = Math.max(...rows.map((row) => row.length))
  const rects: ReactNode[] = []
  rows.forEach((line, y) => {
    let x = 0
    while (x < line.length) {
      const fill = palette[line[x]]
      let end = x + 1
      while (end < line.length && line[end] === line[x]) end += 1
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />)
      x = end
    }
  })
  return (
    <svg
      aria-hidden
      width={width * scale}
      height={rows.length * scale}
      viewBox={`0 0 ${width} ${rows.length}`}
      shapeRendering="crispEdges"
      className={className}
      style={style}
    >
      {rects}
    </svg>
  )
}

/* A cloud is a union of discs over a flat base, outlined in the site's ink so
   it holds up on the cream page as well as the dark sections. */
function cloudBitmap(width: number, height: number, discs: readonly (readonly [number, number, number])[]): Bitmap {
  const base = height - 2
  const inside = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y <= base &&
    (discs.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) || (y >= base - 3 && x >= 2 && x < width - 2))
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (!inside(x, y)) return '.'
      if (!inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1)) return '0'
      if (y >= base - 1) return '3'
      if (y >= base - 3) return '2'
      return '1'
    }).join(''),
  )
}

const CLOUD = cloudBitmap(28, 13, [[8, 7.5, 4.6], [14.5, 5.5, 5.6], [21, 7.5, 4.4]])
const CLOUD_SMALL = cloudBitmap(18, 10, [[6, 5.5, 3.6], [11.5, 4.5, 4.2]])
const CLOUD_PALETTE: Palette = { '0': '#161412', '1': '#ffffff', '2': '#e3eaf6', '3': '#a9b8d4' }

const COIN: Bitmap = [
  '..0000..',
  '.011110.',
  '01211130',
  '01211130',
  '01211130',
  '01211130',
  '01211130',
  '01211130',
  '.013330.',
  '..0000..',
]
const COIN_PALETTE: Palette = { '0': '#6e4206', '1': '#f5b316', '2': '#ffe27a', '3': '#c98a0c' }

/* the ? block: a 16px brick with rivets and the hero font's own question mark */
const QBLOCK: Bitmap = (() => {
  const grid = Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => (x === 0 || y === 0 || x === 15 || y === 15 ? '0' : y <= 2 ? '2' : y >= 13 ? '3' : '1')),
  )
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) grid[y][x] = '0'
  const glyph = GLYPHS['?']
  for (let row = 0; row < 7; row += 1)
    for (let column = 0; column < 5; column += 1)
      if (glyph[row * 5 + column] === '#') {
        grid[5 + row][6 + column] = '3'
        grid[4 + row][5 + column] = '0'
      }
  return grid.map((row) => row.join(''))
})()
const QBLOCK_PALETTE: Palette = { '0': '#20140c', '1': '#e0982e', '2': '#f7c865', '3': '#9a5c16' }

const FLAG: Bitmap = (() => {
  const widths = [11, 11, 10, 9, 8, 6, 4, 2]
  return Array.from({ length: 30 }, (_, y) => {
    if (y < 2) return '.44.'.padEnd(14, '.')
    if (y >= 27) return '0000'.padEnd(14, '.')
    const cloth = y - 3 >= 0 && y - 3 < widths.length ? (y - 3 === widths.length - 1 ? '3' : '2').repeat(widths[y - 3]) : ''
    return ('.1' + cloth).padEnd(14, '.')
  })
})()
const FLAG_PALETTE: Palette = { '0': '#161412', '1': '#d9d9d9', '2': '#e0304a', '3': '#a01c30', '4': '#f2c14e' }

const STAR: Bitmap = ['..1..', '.121.', '12221', '.121.', '..1..']
const STAR_PALETTE: Palette = { '1': '#8fa6ff', '2': '#ffffff' }

const GEM: Bitmap = ['.0000.', '012230', '0122230', '.01230', '..020.', '...0..']
const GEM_PALETTE: Palette = { '0': '#161412', '1': '#8ff0ff', '2': '#2ec4e8', '3': '#1479a8' }

/* a round tree like the hero's: a lit canopy over a two-tone trunk */
const TREE: Bitmap = (() => {
  const width = 18, height = 24, canopyBottom = 16
  const discs = [[9, 7.5, 6.5], [5.5, 10.5, 4.5], [12.5, 10.5, 4.5]] as const
  const leaf = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y <= canopyBottom && discs.some(([cx, cy, r]) => (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r)
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (leaf(x, y)) {
        if (!leaf(x - 1, y) || !leaf(x + 1, y) || !leaf(x, y - 1) || !leaf(x, y + 1)) return '0'
        if (y < 7 && x < 10) return '1'
        return y > 12 ? '3' : '2'
      }
      if (y > canopyBottom && (x === 8 || x === 9)) return x === 8 ? '4' : '5'
      return '.'
    }).join(''),
  )
})()
const TREE_PALETTE: Palette = { '0': '#143018', '1': '#62b24c', '2': '#3f8a3a', '3': '#2a6a2e', '4': '#6b3e1c', '5': '#3b2414' }

export function PixelTree(props: SpriteProps) {
  return <Sprite rows={TREE} palette={TREE_PALETTE} {...props} />
}

export function PixelCloud({ small, ...props }: SpriteProps & { small?: boolean }) {
  return <Sprite rows={small ? CLOUD_SMALL : CLOUD} palette={CLOUD_PALETTE} {...props} />
}

export function PixelCoin({ className = '', ...props }: SpriteProps) {
  return <Sprite rows={COIN} palette={COIN_PALETTE} className={`px-coin ${className}`} {...props} />
}

export function PixelFlag(props: SpriteProps) {
  return <Sprite rows={FLAG} palette={FLAG_PALETTE} {...props} />
}

export function PixelStar({ className = '', ...props }: SpriteProps) {
  return <Sprite rows={STAR} palette={STAR_PALETTE} className={`px-twinkle ${className}`} {...props} />
}

export function PixelGem({ className = '', ...props }: SpriteProps) {
  return <Sprite rows={GEM} palette={GEM_PALETTE} className={`px-bob ${className}`} {...props} />
}

/* a ? block that bumps and pops a coin every few seconds */
export function PixelQBlock({ scale = 4, className = '', style }: SpriteProps) {
  return (
    <span aria-hidden className={`relative inline-block ${className}`} style={{ ...style, paddingTop: 12 * scale }}>
      <span className="px-pop absolute left-1/2 top-0 -translate-x-1/2">
        <Sprite rows={COIN} palette={COIN_PALETTE} scale={scale * 0.75} className="px-coin" />
      </span>
      <Sprite rows={QBLOCK} palette={QBLOCK_PALETTE} scale={scale} className="px-bump relative block" />
    </span>
  )
}

/* the hero's runner, alternating its two stride frames */
export function PixelRunner({ scale = 3, className = '', style }: SpriteProps) {
  return (
    <span aria-hidden className={`px-runner relative inline-block ${className}`} style={style}>
      <Sprite rows={[...RUNNER_HEAD, ...RUNNER_LEGS.a]} palette={RUNNER_PALETTE} scale={scale} className="block" />
      <Sprite rows={[...RUNNER_HEAD, ...RUNNER_LEGS.b]} palette={RUNNER_PALETTE} scale={scale} className="px-frame-b absolute left-0 top-0" />
    </span>
  )
}

/* grass over bricks, the hero's ground as a repeating strip */
const GROUND_TILE = (() => {
  const rect = (x: number, y: number, w: number, h: number, fill: string) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' fill='${fill}'/>`
  const parts = [
    rect(0, 0, 12, 12, '#8a4a1c'),
    rect(0, 0, 12, 3, '#4caf3a'),
    rect(0, 0, 1, 1, '#86d957'), rect(3, 0, 1, 1, '#86d957'), rect(6, 0, 1, 1, '#86d957'), rect(9, 0, 1, 1, '#86d957'),
    rect(0, 3, 12, 1, '#2e7a24'),
    rect(0, 4, 12, 1, '#5e2f10'), rect(0, 5, 12, 1, '#a8612a'), rect(0, 4, 1, 6, '#5e2f10'),
    rect(0, 10, 12, 1, '#5e2f10'), rect(0, 11, 12, 1, '#a8612a'), rect(6, 10, 1, 2, '#5e2f10'),
  ]
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' shape-rendering='crispEdges'>${parts.join('')}</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
})()

export function PixelGround({ scale = 3, className = '' }: { scale?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={`px-ground ${className}`}
      style={{ height: 12 * scale, backgroundImage: GROUND_TILE, backgroundSize: `${12 * scale}px ${12 * scale}px` }}
    />
  )
}

/* The night sky behind the whole landing page: stars and faint outlined tiles
   kept to the page's outer edges, where the content columns leave room.
   Positions are percentages of the page's height. */
const NIGHT_TILES: readonly (readonly [number, number])[] = [
  [2.5, 12], [96.5, 21], [2, 31], [97, 40], [2.5, 50], [96, 60], [2, 69], [97, 78], [2.5, 88], [96.5, 95],
]
const NIGHT_STARS: readonly (readonly [number, number])[] = [
  [8, 13], [90, 15], [5, 19], [87, 24], [11, 29], [92, 30], [7, 35], [89, 42], [4, 44], [91, 51], [9, 53], [86, 58], [6, 61], [92, 66], [10, 71], [88, 76], [5, 81], [90, 86], [8, 93], [87, 97],
]

export function PixelNightBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {NIGHT_TILES.map(([left, top]) => (
        <span key={`t${top}`} className="absolute h-7 w-7 border-2 border-[rgba(160,176,220,0.16)]" style={{ left: `${left}%`, top: `${top}%` }} />
      ))}
      {NIGHT_STARS.map(([left, top], i) => (
        <PixelStar key={`s${top}`} scale={2} className="absolute" style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(i % 6) * 0.4}s` }} />
      ))}
    </div>
  )
}

/* moves its child across the full width of the nearest positioned box */
export function PixelTraverse({ seconds, delay = 0, reverse, className = '', children }: { seconds: number; delay?: number; reverse?: boolean; className?: string; children: ReactNode }) {
  return (
    <div aria-hidden className={`px-traverse pointer-events-none absolute inset-x-0 ${className}`}>
      <div
        className={`px-traverse-item ${reverse ? 'px-traverse-reverse' : ''}`}
        style={{ animationDuration: `${seconds}s`, animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    </div>
  )
}
