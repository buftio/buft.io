export type XY = [number, number]

export const TILT = (50 * Math.PI) / 180
export const C = Math.cos(TILT)
export const S = Math.sin(TILT)

export const SPOOL: XY = [-1060, -140]
export const NEEDLE: XY = [1480, -170]
export const BEACH: XY = [-1580, -150]
export const SAG_POST: XY = [-60, 40]
export const LEAN = (22 * Math.PI) / 180
export const EYE_AT = 592
export const PIN_H = 330
export const SPOOL_H = 300
export const WRAP = 120
export const GAP = 45

export const PINS: XY[] = [
  [-700, -50],
  [-270, -150],
  [190, -70],
  [610, -140],
  [1000, -200],
]
export const PIN_TONES = ['#ffc23a', '#16b3a0', '#ff4fa3', '#7dffe6', '#ffc23a']

export const KIDS: [number, number, number, number][] = [
  [-664, 212, 120, 0],
  [12, 184, 150, 1.7],
  [376, -452, 100, 3.1],
  [-556, -400, 130, 4.4],
]

export const UMBRELLAS: [number, number][] = [
  [0, -170],
  [-60, 40],
  [40, 230],
]

export const RIVER: XY[] = [
  [-1300, 1480],
  [-800, 1500],
  [-400, 1580],
  [0, 1590],
  [400, 1490],
  [800, 1560],
  [1300, 1540],
]

export function riverX(dy: number) {
  for (let i = 1; i < RIVER.length; i++) {
    const [y0, x0] = RIVER[i - 1]
    const [y1, x1] = RIVER[i]
    if (dy <= y1) return x0 + ((x1 - x0) * Math.max(0, dy - y0)) / (y1 - y0)
  }
  return RIVER[RIVER.length - 1][1]
}

export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 31.7) * 43758.5453
  return x - Math.floor(x)
}

export function world(out: { x: number; y: number; z: number }, gx: number, gy: number, mx: number, my: number, mz: number) {
  out.x = gx + mx
  out.y = -gy + my * C - mz * S
  out.z = my * S + mz * C
  return out
}

type Node = { gx: number; gy: number; h: number; mz: number }
const STEP = 6

function span(out: Node[], a: Node, b: Node, sag: number) {
  const len = Math.hypot(b.gx - a.gx, b.gy - a.gy)
  const n = Math.max(2, Math.ceil(len / STEP))
  for (let i = 1; i <= n; i++) {
    const u = i / n
    out.push({
      gx: a.gx + (b.gx - a.gx) * u,
      gy: a.gy + (b.gy - a.gy) * u,
      h: a.h + (b.h - a.h) * u - sag * len * 4 * u * (1 - u),
      mz: a.mz + (b.mz - a.mz) * u,
    })
  }
}

const SAG = [0.05, 0.07, 0.42, 0.07, 0.07, 0.05]

export const EYE: Node = { gx: NEEDLE[0] + EYE_AT * Math.sin(LEAN), gy: NEEDLE[1], h: EYE_AT * Math.cos(LEAN), mz: 0 }

function nodes() {
  const t0 = Math.asin(GAP / WRAP)
  const tan = WRAP * Math.cos(t0)
  const east: Node = { gx: SPOOL[0] + tan, gy: SPOOL[1], h: SPOOL_H, mz: -GAP }
  const west: Node = { gx: SPOOL[0] + tan, gy: SPOOL[1], h: SPOOL_H, mz: GAP }
  const out: Node[] = [east]
  const stops = { load: 0, eye: 0, unload: 0 }
  let prev = east
  PINS.forEach(([x, y], i) => {
    const next = { gx: x, gy: y, h: PIN_H - 12, mz: -GAP }
    span(out, prev, next, SAG[i])
    prev = next
  })
  span(out, prev, EYE, SAG[5])
  stops.eye = out.length - 1
  prev = EYE
  for (let i = PINS.length - 1; i >= 0; i--) {
    const next = { gx: PINS[i][0], gy: PINS[i][1], h: PIN_H - 12, mz: GAP }
    span(out, prev, next, SAG[i + 1])
    prev = next
  }
  span(out, prev, west, SAG[0])
  stops.unload = out.length - 1
  const arc = Math.PI * 2 - t0 * 2
  const n = Math.ceil((arc * WRAP) / STEP)
  for (let i = 1; i < n; i++) {
    const a = t0 + (arc * i) / n
    out.push({ gx: SPOOL[0] + WRAP * Math.cos(a), gy: SPOOL[1], h: SPOOL_H, mz: WRAP * Math.sin(a) })
  }
  return { out, stops }
}

export type Path = {
  n: number
  x: Float32Array
  y: Float32Array
  z: Float32Array
  h: Float32Array
  gx: Float32Array
  fy: Float32Array
  speed: Float32Array
  len: number
  step: number
  stops: number[]
  east: [number, number]
}

const tmp = { x: 0, y: 0, z: 0 }

export function buildPath(): Path {
  const { out, stops } = nodes()
  const raw = out.map((p) => {
    world(tmp, p.gx, p.gy, 0, p.h, p.mz)
    return { ...tmp, h: p.h, gx: p.gx, fy: -p.gy - p.mz * S }
  })
  const cum = [0]
  for (let i = 1; i <= raw.length; i++) {
    const a = raw[i - 1]
    const b = raw[i % raw.length]
    cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z))
  }
  const len = cum[raw.length]
  const step = 8
  const n = Math.floor(len / step)
  const p: Path = {
    n,
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
    h: new Float32Array(n),
    gx: new Float32Array(n),
    fy: new Float32Array(n),
    speed: new Float32Array(n),
    len: n * step,
    step,
    stops: [],
    east: [0, 0],
  }
  let j = 0
  const fix = Object.values(stops).map((k) => cum[k])
  for (let i = 0; i < n; i++) {
    const s = (i / n) * len
    while (cum[j + 1] < s) j++
    const a = raw[j]
    const b = raw[(j + 1) % raw.length]
    const u = (s - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j])
    p.x[i] = a.x + (b.x - a.x) * u
    p.y[i] = a.y + (b.y - a.y) * u
    p.z[i] = a.z + (b.z - a.z) * u
    p.h[i] = a.h + (b.h - a.h) * u
    p.gx[i] = a.gx + (b.gx - a.gx) * u
    p.fy[i] = a.fy + (b.fy - a.fy) * u
  }
  for (let i = 0; i < n; i++) {
    const slope = (p.h[(i + 2) % n] - p.h[(i - 2 + n) % n]) / (step * 4)
    p.speed[i] = Math.min(2.8, Math.max(0.32, 1 - 2.4 * slope))
  }
  p.stops = [Math.round((fix[0] / len) * n) + 7, Math.round((fix[1] / len) * n) - 2, Math.round((fix[2] / len) * n) - 6]
  p.east = [p.stops[0], Math.round((fix[1] / len) * n)]
  return p
}
