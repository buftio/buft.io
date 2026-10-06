import type { P } from './layout'
import type { Comb } from './state'

export type Bee = { phase: number; t: number; dur: number; cell: number; x: number; y: number; ax: number; ay: number; cx: number; cy: number; bx: number; by: number; yaw: number; seed: number; cargo: boolean }
type Swarm = { comb: Comb; alarm: number; hub: P; door: [number, number, number]; rnd: () => number }

export const swarm = (n: number, hub: P, rnd: () => number): Bee[] =>
  Array.from({ length: n }, (_, k) => ({ phase: 0, t: rnd() * 4, dur: 0, cell: -1, x: hub[0], y: hub[1], ax: 0, ay: 0, cx: 0, cy: 0, bx: 0, by: 0, yaw: 0, seed: k / n, cargo: false }))

export function bee(h: Swarm, b: Bee, t: number, dt: number) {
  const comb = h.comb
  const [hx, hy] = h.hub
  if (h.alarm > 0.5 && b.phase !== 4) {
    b.phase = 3
    b.cargo = false
    if (b.cell >= 0) comb.busy[b.cell] = 0
    b.cell = -1
  }
  if (b.phase === 0) {
    const a = b.seed * Math.PI * 2 + t * (0.45 + b.seed * 0.5)
    const r = 210 + 90 * Math.sin(t * 0.7 + b.seed * 20)
    b.x = hx + Math.cos(a) * r
    b.y = hy + Math.sin(a) * r * 0.55
    b.yaw = Math.atan2(-Math.cos(a) * 0.55, -Math.sin(a))
    if (t > b.t) {
      const i = comb.any((k) => comb.open(k), h.rnd)
      b.t = t + 2 + h.rnd() * 3
      if (i >= 0) fly(h, b, comb.list[i].x, comb.list[i].y, 1, t, i)
    }
  } else if (b.phase === 1 || b.phase === 3) {
    const k = Math.min(1, (t - b.t) / b.dur)
    const s = 1 - k
    const nx = s * s * b.ax + 2 * s * k * b.cx + k * k * b.bx
    const ny = s * s * b.ay + 2 * s * k * b.cy + k * k * b.by
    b.yaw = Math.atan2(-(ny - b.y), nx - b.x)
    b.x = nx
    b.y = ny
    if (k >= 1 && b.phase === 1) {
      b.phase = 2
      b.t = t
      b.dur = 1.1 + h.rnd() * 0.8
    } else if (k >= 1) {
      b.phase = h.alarm > 0.5 ? 4 : 0
      b.cargo = false
      b.t = t + 1 + h.rnd() * 3
    }
  } else if (b.phase === 2) {
    const c = comb.list[b.cell]
    b.x = c.x + Math.sin(t * 5 + b.seed * 9) * 14
    b.y = c.y + Math.cos(t * 4 + b.seed * 7) * 10
    b.yaw += dt * 3
    if (t - b.t > b.dur) {
      if (comb.ct[b.cell] === 0) comb.setLevel(b.cell, Math.max(0, Math.round((comb.level(b.cell, t) - 0.34) * 100) / 100), t)
      if (comb.lt[b.cell] < 0.05) comb.setLevel(b.cell, 0, t)
      b.cargo = true
      fly(h, b, h.door[0], h.door[1] - 20, 3, t, -1)
    }
  } else if (b.phase === 4 && h.alarm < 0.3) b.phase = 0
}

function fly(h: Swarm, b: Bee, x: number, y: number, phase: number, t: number, cell: number) {
  b.ax = b.x
  b.ay = b.y
  b.bx = x
  b.by = y
  const d = Math.hypot(x - b.x, y - b.y)
  const side = (h.rnd() - 0.5) * d * 0.6
  b.cx = (b.x + x) / 2 + ((y - b.y) / Math.max(d, 1)) * side
  b.cy = (b.y + y) / 2 - ((x - b.x) / Math.max(d, 1)) * side - d * 0.15
  b.dur = 0.4 + d / (260 + b.seed * 120)
  b.phase = phase
  b.t = t
  b.cell = cell
}
