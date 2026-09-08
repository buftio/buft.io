'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import { colorsFor, paintRug, type RugDesign } from './design'

/* Canvas is a little taller than the 56px button so waves and the shadow can breathe without touching the hit box. */
const H = 64
const RUG_Y = 8
const RUG_H = 42
const FRINGE = 12
const STRIP = 3
const SWAY = 3
const CURL = 2.2
const SPEED = 2
const WAVES = 1.3
const TASSELS = 9
const SOURCE_W = 270
const SOURCE_H = 390
const END = 44

type Source = {
  runner: HTMLCanvasElement
  fringe: string
  width: number
  dpr: number
}

function landscapeRug(design: RugDesign) {
  const portrait = document.createElement('canvas')
  portrait.width = SOURCE_W
  portrait.height = SOURCE_H
  paintRug(portrait.getContext('2d')!, design, SOURCE_W, SOURCE_H)
  const landscape = document.createElement('canvas')
  landscape.width = SOURCE_H
  landscape.height = SOURCE_W
  const ctx = landscape.getContext('2d')!
  ctx.translate(0, SOURCE_W)
  ctx.rotate(-Math.PI / 2)
  ctx.drawImage(portrait, 0, 0)
  return landscape
}

/** Lays the rug out as a runner the width of the button: both woven ends kept, the field tiled (mirrored) between them. */
function weaveSource(design: RugDesign, width: number, dpr: number): Source {
  const rug = landscapeRug(design)
  const runner = document.createElement('canvas')
  runner.width = Math.max(1, Math.round((width - FRINGE * 2) * dpr))
  runner.height = Math.round(RUG_H * dpr)
  const ctx = runner.getContext('2d')!
  const scale = runner.height / SOURCE_W
  const endW = END * scale
  const fieldW = (SOURCE_H - END * 2) * scale
  const midW = runner.width - endW * 2
  if (midW > 0) {
    const count = Math.ceil(midW / fieldW)
    let x = endW + (midW - count * fieldW) / 2
    for (let k = 0; k < count; k++, x += fieldW) {
      ctx.save()
      if (k % 2) {
        ctx.translate(x * 2 + fieldW, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(
        rug,
        END,
        0,
        SOURCE_H - END * 2,
        SOURCE_W,
        x,
        0,
        fieldW + 0.5,
        runner.height,
      )
      ctx.restore()
    }
  }
  ctx.drawImage(rug, 0, 0, END, SOURCE_W, 0, 0, endW, runner.height)
  ctx.drawImage(
    rug,
    SOURCE_H - END,
    0,
    END,
    SOURCE_W,
    runner.width - endW,
    0,
    endW,
    runner.height,
  )
  return { runner, fringe: colorsFor(design)[3], width, dpr }
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  { runner, fringe, width, dpr }: Source,
  t: number,
  amp: number,
) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, H)
  const rugW = width - FRINGE * 2
  const phase = (u: number) => t * SPEED - u * Math.PI * 2 * WAVES
  const lift = (u: number) => {
    const edge = Math.abs(u - 0.5) * 2
    return (Math.sin(phase(u)) * SWAY - edge * edge * CURL) * amp
  }
  const slope = (u: number) => Math.cos(phase(u)) * amp

  ctx.fillStyle = `rgba(40, 20, 30, ${0.22 - amp * 0.06})`
  ctx.beginPath()
  ctx.ellipse(
    width / 2,
    RUG_Y + RUG_H + 5 + amp * 2,
    rugW / 2 - amp * 4,
    3 + amp * 1.5,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()

  const strips = Math.max(1, Math.ceil(rugW / STRIP))
  const stripW = rugW / strips
  const sourceStrip = runner.width / strips
  for (let i = 0; i < strips; i++) {
    const u = (i + 0.5) / strips
    const x = FRINGE + i * stripW
    const y = RUG_Y + lift(u)
    ctx.drawImage(
      runner,
      i * sourceStrip,
      0,
      sourceStrip,
      runner.height,
      x,
      y,
      stripW + 0.6,
      RUG_H,
    )
    const fold = slope(u)
    ctx.fillStyle =
      fold > 0
        ? `rgba(255, 244, 214, ${fold * 0.14})`
        : `rgba(25, 14, 33, ${-fold * 0.2})`
    ctx.fillRect(x, y, stripW + 0.6, RUG_H)
  }

  ctx.strokeStyle = fringe
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  for (const side of [-1, 1] as const) {
    const u = side < 0 ? 0 : 1
    const edgeX = side < 0 ? FRINGE : FRINGE + rugW
    const edgeY = RUG_Y + lift(u)
    const lean = slope(u) * 1.6
    for (let k = 0; k < TASSELS; k++) {
      const y = edgeY + 2 + (k / (TASSELS - 1)) * (RUG_H - 4)
      const sway = Math.sin(t * 3 + k * 0.8 + side) * 1.3 * amp
      ctx.beginPath()
      ctx.moveTo(edgeX, y)
      ctx.quadraticCurveTo(
        edgeX + side * 4,
        y + sway * 0.5 + lean * 0.5,
        edgeX + side * 8,
        y + sway + lean,
      )
      ctx.stroke()
    }
  }
}

export function MakeCarpetButton({
  design,
  disabled,
  reduced,
  onClick,
}: {
  design: RugDesign
  disabled: boolean
  reduced: boolean
  onClick: () => void
}) {
  const button = useRef<HTMLButtonElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const source = useRef<Source | null>(null)
  const latestDesign = useRef(design)
  const hovered = useRef(false)
  const motion = useRef({ t: 0, amp: disabled || reduced ? 0 : 1 })

  const paint = () => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !source.current) return
    drawFrame(ctx, source.current, motion.current.t, motion.current.amp)
  }

  const weave = () => {
    const element = canvas.current
    const width = button.current?.clientWidth ?? 0
    if (!element || !width) return
    const dpr = window.devicePixelRatio || 1
    element.width = Math.round(width * dpr)
    element.height = Math.round(H * dpr)
    source.current = weaveSource(latestDesign.current, width, dpr)
    paint()
  }

  useEffect(() => {
    latestDesign.current = design
    weave()
  }, [design])

  useEffect(() => {
    const element = button.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== source.current?.width) weave()
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduced) {
      motion.current.amp = 0
      paint()
      return
    }
    let previous = performance.now()
    let frame: number
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      const state = motion.current
      const target = disabled ? 0 : hovered.current ? 1.4 : 1
      state.amp += (target - state.amp) * Math.min(1, delta * 4)
      const settled = target === 0 && state.amp < 0.004
      if (settled) state.amp = 0
      else state.t += delta
      paint()
      if (!settled) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [disabled, reduced])

  const colors = colorsFor(design)
  const style = {
    '--carpet-ink': colors[0],
    '--carpet-gold': colors[1],
    '--carpet-cream': colors[3],
  } as CSSProperties

  return (
    <button
      ref={button}
      type="button"
      className="make-carpet-button"
      style={style}
      disabled={disabled}
      data-reduced={reduced || undefined}
      onClick={onClick}
      onPointerEnter={() => {
        hovered.current = true
      }}
      onPointerLeave={() => {
        hovered.current = false
      }}
    >
      <canvas
        ref={canvas}
        className="make-carpet-button__rug"
        aria-hidden="true"
      />
      <span className="make-carpet-button__label">
        Make my carpet
        <ArrowRight size={16} aria-hidden="true" />
      </span>
    </button>
  )
}
