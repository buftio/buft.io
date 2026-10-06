'use client'

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type RefObject,
} from 'react'

const COLS = 3
const ROWS = 2
const SNAP = 34
const sideTabs = [
  [1, -1],
  [-1, 1],
]
const bottomTabs = [[-1, 1, -1]]
const scatter: [number, number, number][] = [
  [0.02, 0.3, -9],
  [0.62, 0.05, 7],
  [0.03, 0.64, 5],
  [0.6, 0.62, -6],
  [0.27, 0.7, 8],
  [0.4, 0.04, -5],
]
const wide: [number, number][] = [
  [0, 0.52],
  [0.74, 0.04],
  [0.19, 0.56],
  [0.84, 0.54],
  [0.74, 0.58],
  [0.85, 0.08],
]
const deal = [4, 0, 5, 2, 3, 1]
const PHONE = '(max-width: 700px), (max-height: 500px)'

function edge(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  sign: number,
  tab: number,
) {
  if (!sign) return `L ${x1} ${y1}`
  const ux = x1 - x0
  const uy = y1 - y0
  const length = Math.hypot(ux, uy)
  const nx = (uy / length) * tab * sign
  const ny = (-ux / length) * tab * sign
  const p = (a: number, b: number) =>
    `${x0 + ux * a + nx * b} ${y0 + uy * a + ny * b}`
  return [
    `L ${p(0.36, 0)}`,
    `C ${p(0.44, 0)} ${p(0.3, 1)} ${p(0.5, 1)}`,
    `C ${p(0.7, 1)} ${p(0.56, 0)} ${p(0.64, 0)}`,
    `L ${x1} ${y1}`,
  ].join(' ')
}

function outline(col: number, row: number, w: number, h: number, tab: number) {
  const top = row === 0 ? 0 : -bottomTabs[row - 1][col]
  const bottom = row === ROWS - 1 ? 0 : bottomTabs[row][col]
  const left = col === 0 ? 0 : -sideTabs[row][col - 1]
  const rightSide = col === COLS - 1 ? 0 : sideTabs[row][col]
  const [a, b, c, d] = [tab, tab + w, tab + h, tab]
  return [
    `M ${a} ${d}`,
    edge(a, d, b, d, top, tab),
    edge(b, d, b, c, rightSide, tab),
    edge(b, c, a, c, bottom, tab),
    edge(a, c, a, d, left, tab),
    'Z',
  ].join(' ')
}

function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])
  return size
}

export function Sparks({
  count = 24,
  reach = 160,
}: {
  count?: number
  reach?: number
}) {
  return (
    <span className="q-sparks" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <i
          key={i}
          style={
            {
              '--a': `${(i / count) * 360 + (i % 3) * 9}deg`,
              '--d': `${reach * (0.55 + ((i * 37) % 45) / 100)}px`,
              '--s': `${0.6 + ((i * 53) % 70) / 100}`,
              animationDelay: `${(i % 6) * 45}ms`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  )
}

export function Page() {
  return (
    <div className="q-page">
      <span>Research notes · 70+ researchers</span>
      <p>Scattered research, put together, so the answer was easier to find.</p>
      <svg viewBox="0 0 120 50" aria-hidden="true">
        <path d="M10 30 L30 18 L50 30 L70 18 L90 30 L110 18" />
        {[10, 30, 50, 70, 90, 110].map((x, i) => (
          <circle key={x} cx={x} cy={i % 2 ? 18 : 30} r="5" />
        ))}
      </svg>
      <i />
      <i />
      <i />
    </div>
  )
}

export function Jigsaw({ onSolved }: { onSolved: () => void }) {
  const stage = useRef<HTMLDivElement>(null)
  const { width, height } = useSize(stage)
  const [pieces, setPieces] = useState(() =>
    scatter.map(([fx, fy, tilt]) => ({
      fx,
      fy,
      tilt,
      z: 0,
      locked: false,
      moved: false,
    })),
  )
  const [drag, setDrag] = useState<{
    index: number
    dx: number
    dy: number
  } | null>(null)
  const solved = pieces.every((piece) => piece.locked)
  useEffect(() => {
    if (!solved) return
    const timer = setTimeout(onSolved, 1100)
    return () => clearTimeout(timer)
  }, [solved, onSolved])
  const phone = width > 0 && matchMedia(PHONE).matches
  const tall = phone && height > width
  const boardW = tall
    ? width * 0.86
    : phone
      ? Math.min(width * 0.46, 520, height)
      : Math.min(width * 0.46, 520)
  const boardH = boardW * 0.6
  const w = boardW / COLS
  const h = boardH / ROWS
  const tab = Math.min(w, h) * 0.22
  const boardX = tall
    ? (width - boardW) / 2
    : width * (phone ? 0.58 : 0.42) - boardW / 2
  const boardY = tall ? Math.max(height * 0.2, 140) : (height - boardH) / 2
  const pw = (w + tab * 2) / width
  const ph = (h + tab * 2) / height
  const below = (boardY + boardH + 12) / height
  const spot = (index: number) => {
    const piece = pieces[index]
    if (piece.moved || !phone) return { fx: piece.fx, fy: piece.fy }
    if (!tall)
      return {
        fx: Math.min(wide[index][0], 1 - pw),
        fy: Math.min(wide[index][1], 1 - ph),
      }
    const slot = deal[index]
    return {
      fx: [0.01, (1 - pw) / 2, 0.99 - pw][slot % COLS],
      fy: slot < COLS ? below : Math.max(below, 0.99 - ph),
    }
  }
  const home = (index: number) => ({
    x: boardX + (index % COLS) * w - tab,
    y: boardY + Math.floor(index / COLS) * h - tab,
  })
  const lock = (index: number) =>
    setPieces((list) =>
      list.map((piece, i) =>
        i === index ? { ...piece, locked: true } : piece,
      ),
    )
  const grab = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    if (pieces[index].locked) return
    if (event.currentTarget.hasPointerCapture?.(event.pointerId) === false)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* Synthetic pointers cannot be captured; dragging still works while over the piece. */
      }
    const rect = stage.current!.getBoundingClientRect()
    const { fx, fy } = spot(index)
    setDrag({
      index,
      dx: event.clientX - rect.left - fx * width,
      dy: event.clientY - rect.top - fy * height,
    })
    const z = Math.max(...pieces.map((piece) => piece.z)) + 1
    setPieces((list) =>
      list.map((piece, i) => (i === index ? { ...piece, z } : piece)),
    )
  }
  const move = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return
    const rect = stage.current!.getBoundingClientRect()
    const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v))
    const fx = clamp(
      (event.clientX - rect.left - drag.dx) / width,
      1 - (w + tab * 2) / width,
    )
    const fy = clamp(
      (event.clientY - rect.top - drag.dy) / height,
      1 - (h + tab * 2) / height,
    )
    setPieces((list) =>
      list.map((piece, i) =>
        i === drag.index ? { ...piece, fx, fy, moved: true } : piece,
      ),
    )
  }
  const up = () => {
    if (!drag) return
    const { fx, fy } = spot(drag.index)
    const target = home(drag.index)
    if (Math.hypot(fx * width - target.x, fy * height - target.y) < SNAP)
      lock(drag.index)
    setDrag(null)
  }
  return (
    <div ref={stage} className={`q-jigsaw${solved ? ' is-solved' : ''}`}>
      {width > 0 && (
        <>
          <div
            className="q-board"
            style={{ left: boardX, top: boardY, width: boardW, height: boardH }}
          >
            {solved && <Sparks count={28} reach={boardW * 0.55} />}
          </div>
          {pieces.map((piece, index) => {
            const col = index % COLS
            const row = Math.floor(index / COLS)
            const { fx, fy } = spot(index)
            const at = piece.locked
              ? home(index)
              : { x: fx * width, y: fy * height }
            return (
              <button
                key={index}
                className={`q-piece${piece.locked ? ' is-locked' : ''}`}
                style={{
                  left: at.x,
                  top: at.y,
                  width: w + tab * 2,
                  height: h + tab * 2,
                  zIndex: piece.locked ? 0 : piece.z + 1,
                  rotate:
                    piece.locked || drag?.index === index
                      ? '0deg'
                      : `${piece.tilt}deg`,
                }}
                aria-label={`Paper piece ${index + 1} of 6${piece.locked ? ', placed' : '. Drag it into place, or press Enter.'}`}
                onPointerDown={(event) => grab(index, event)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={up}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    lock(index)
                  }
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    clipPath: `path('${outline(col, row, w, h, tab)}')`,
                  }}
                >
                  <span
                    className="q-page-frame"
                    style={{
                      left: tab - col * w,
                      top: tab - row * h,
                      width: boardW,
                      height: boardH,
                      fontSize: boardW / 22,
                    }}
                  >
                    <Page />
                  </span>
                </span>
              </button>
            )
          })}
        </>
      )}
    </div>
  )
}
