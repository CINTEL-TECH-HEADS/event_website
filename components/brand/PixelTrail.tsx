'use client'

import { useEffect, useRef } from 'react'
import './PixelTrail.css'

function GooeyFilter({ id = 'goo-filter', strength = 10 }: { id?: string; strength?: number }) {
  return (
    <svg className="goo-filter-container">
      <defs>
        <filter id={id}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={strength} result="blur" />
          <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </defs>
    </svg>
  )
}

type Point = { gx: number; gy: number; age: number }

type PixelTrailProps = {
  gridSize?: number
  trailSize?: number
  maxAge?: number
  interpolate?: number
  gooeyFilter?: { id?: string; strength?: number }
  color?: string
  className?: string
}

/**
 * A gooey, theme-colored pixel trail that follows the pointer — a lightweight
 * canvas-2D reimplementation of the React Bits PixelTrail component (the
 * original ships on @react-three/fiber, which has a known incompatibility
 * with React 18.3.x's internals and crashes on mount; this keeps the same
 * look — a grid of glowing cells merged by an SVG goo filter — with no 3D
 * dependency). Needs a positioned ancestor with an explicit size.
 */
export default function PixelTrail({
  gridSize = 40,
  trailSize = 0.1,
  maxAge = 250,
  interpolate = 5,
  gooeyFilter,
  color = '#ffffff',
  className = '',
}: PixelTrailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef<Point[]>([])
  const lastRef = useRef<{ gx: number; gy: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return
    const ctx = ctx2d

    let raf = 0
    let lastTime = performance.now()
    let width = 0
    let height = 0

    const resize = () => {
      const rect = parent.getBoundingClientRect()
      width = canvas.width = Math.max(1, Math.round(rect.width))
      height = canvas.height = Math.max(1, Math.round(rect.height))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(parent)

    const cellW = () => width / gridSize
    const cellH = () => height / gridSize

    function addPoint(gx: number, gy: number) {
      const last = lastRef.current
      if (last && interpolate > 0) {
        const dx = gx - last.gx
        const dy = gy - last.gy
        const dist = Math.hypot(dx, dy)
        const steps = Math.min(20, Math.ceil((dist * gridSize) / Math.max(1, 6 - interpolate)))
        for (let i = 1; i <= steps; i++) {
          pointsRef.current.push({ gx: last.gx + (dx * i) / (steps + 1), gy: last.gy + (dy * i) / (steps + 1), age: 0 })
        }
      }
      pointsRef.current.push({ gx, gy, age: 0 })
      lastRef.current = { gx, gy }
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = parent.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height
      if (x < 0 || x > 1 || y < 0 || y > 1) return
      addPoint(Math.floor(x * gridSize), Math.floor(y * gridSize))
    }
    parent.addEventListener('pointermove', onPointerMove)

    const radiusCells = Math.max(0.6, trailSize * gridSize)

    function frame(now: number) {
      const delta = now - lastTime
      lastTime = now

      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = color

      const cw = cellW()
      const ch = cellH()

      pointsRef.current = pointsRef.current.filter((p) => {
        p.age += delta
        return p.age < maxAge
      })

      for (const p of pointsRef.current) {
        const t = p.age / maxAge
        const opacity = 1 - t
        const size = radiusCells * (0.5 + 0.5 * opacity)
        ctx.globalAlpha = Math.max(0, opacity)
        ctx.beginPath()
        ctx.arc((p.gx + 0.5) * cw, (p.gy + 0.5) * ch, size * Math.min(cw, ch), 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      parent.removeEventListener('pointermove', onPointerMove)
    }
  }, [gridSize, trailSize, maxAge, interpolate, color])

  return (
    <>
      {gooeyFilter && <GooeyFilter id={gooeyFilter.id} strength={gooeyFilter.strength} />}
      <canvas
        ref={canvasRef}
        className={`pixel-canvas ${className}`}
        style={{ width: '100%', height: '100%', ...(gooeyFilter ? { filter: `url(#${gooeyFilter.id})` } : {}) }}
      />
    </>
  )
}
