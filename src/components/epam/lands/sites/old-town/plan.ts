import * as THREE from 'three'
import { rng, UP_Y } from './kit'

const ROUTE: [number, number][] = [
  [-1760, 560],
  [-1300, 640],
  [-820, 660],
  [-430, 560],
  [-180, 330],
  [0, 200],
  [40, 520],
  [110, 830],
  [210, 1090],
  [280, 1420],
  [330, 1720],
]

const N = 520
const curve = new THREE.CatmullRomCurve3(
  ROUTE.map(([x, y]) => new THREE.Vector3(x, y, 0)),
  false,
  'centripetal',
)
const pts = curve.getSpacedPoints(N - 1)
export const LENGTH = curve.getLength()
export const PX = Float32Array.from(pts, (p) => p.x)
export const PY = Float32Array.from(pts, (p) => p.y)
export const HALF = 78

export const PLAZA = { x: -10, y: 190, r: 280 }
export const TOWER: [number, number] = [70, -170]
export const BATH: [number, number, number, number] = [330, -1590, 760, -1290]
export const SPRING: [number, number] = [1760, -790]

export type Spot = { x: number; y: number; tx: number; ty: number }

export function along(s: number, out: Spot) {
  const f = (Math.min(Math.max(s, 0), LENGTH) / LENGTH) * (N - 1)
  const i = Math.min(N - 2, Math.floor(f))
  const k = f - i
  out.x = PX[i] + (PX[i + 1] - PX[i]) * k
  out.y = PY[i] + (PY[i + 1] - PY[i]) * k
  const dx = PX[i + 1] - PX[i]
  const dy = PY[i + 1] - PY[i]
  const l = Math.hypot(dx, dy) || 1
  out.tx = dx / l
  out.ty = dy / l
  return out
}

export function near(x: number, y: number) {
  let best = Infinity
  for (let i = 0; i < N; i++) {
    const d = (PX[i] - x) ** 2 + (PY[i] - y) ** 2
    if (d < best) best = d
  }
  return Math.sqrt(best)
}

function seg(x: number, y: number, [ax, ay, bx, by]: [number, number, number, number]) {
  const vx = bx - ax
  const vy = by - ay
  const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)))
  return Math.hypot(x - ax - vx * t, y - ay - vy * t)
}

const GRID = '579999988899765431000002776579988998886553000014543468999888885235300013445688999888887435400002666777788887788755520014664456677777776656654345664334666777775555556663776534677778888875346674877655766788899998535666877545656788999999755667666445677889999999876566456556788898999998876556356457889998899888777556356567899998888765666435346677899999987643355301456545777898877543345300565323555666666543245420565325777764335532244553555226889996312544322245555436899998601566410014223577899999810466432124000377899999940256666556320047899999851024566534751025799999620001466200'
const CELLS = 24

export const crowd = (x: number, y: number) => {
  const c = Math.floor((x + 1800) / 150)
  const r = Math.floor((y + 1800) / 150)
  if (c < 0 || r < 0 || c >= CELLS || r >= CELLS) return 0
  return Number(GRID[r * CELLS + c]) / 9
}

export const follicle = (x: number, y: number) => crowd(x, y) > 0.7

export type House = {
  x: number
  y: number
  w: number
  h: number
  d: number
  rh: number
  lean: number
  turn: number
  hip: boolean
  wall: number
  roof: number
}

function clear(x: number, y: number, top: number) {
  if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r + 60) return false
  if (Math.hypot(x - TOWER[0], y - TOWER[1]) < 170) return false
  if (seg(x, y, BATH) < 190) return false
  if (Math.hypot(x - SPRING[0], y - SPRING[1]) < 200) return false
  if (near(x, y) < HALF + 62) return false
  for (let k = 1; k <= 3; k++) if (near(x, y - (top * k) / 3) < HALF + 14) return false
  return true
}

function plan() {
  const r = rng(91)
  const out: House[] = []
  const step = 112
  for (let row = 0, gy = -1780; gy <= 1780; gy += step, row++)
    for (let gx = -1780 + (row % 2) * (step / 2); gx <= 1780; gx += step) {
      const x = gx + (r() - 0.5) * 46
      const y = gy + (r() - 0.5) * 46
      const far = Math.hypot(x, y)
      if (far > 1730) continue
      const c = crowd(x, y)
      const dense = c > 0.7
      let keep = 0.06 + 0.94 * c ** 1.6
      if (far > 1450) keep *= 0.6
      const roll = r()
      const w = 70 + r() * 42
      const h = ((dense ? 105 : 80) + r() * (dense ? 95 : 45)) * (r() < 0.08 ? 1.6 : 1)
      const rh = w * (0.45 + r() * 0.3)
      const hip = r() < 0.24
      const lean = (r() - 0.5) * 0.14
      const turn = (r() - 0.5) * 0.4
      const wall = Math.floor(r() * 5)
      const roof = Math.floor(r() * 9)
      if (roll > keep) continue
      if (!clear(x, y, (h + rh) * UP_Y)) continue
      out.push({ x, y, w, h, d: 58 + r() * 30, rh, lean, turn, hip, wall, roof })
    }
  return out.sort((a, b) => a.y - b.y)
}

export const HOUSES = plan()

export type Fan = { x: number; y: number; s: number; phase: number; tint: number }

function fans() {
  const r = rng(7)
  const out: Fan[] = []
  for (const side of [-1, 1])
    for (let s = 120; s < LENGTH - 120; s += 34 + r() * 22) {
      const o: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
      along(s, o)
      const lat = side * (HALF + 16 + r() * 22)
      const x = o.x - o.ty * lat
      const y = o.y + o.tx * lat
      if (Math.hypot(x - PLAZA.x, y - PLAZA.y) < PLAZA.r - 10) continue
      if (r() < 0.25) continue
      out.push({ x, y, s: 28 + r() * 8, phase: r() * 10, tint: r() })
    }
  for (let a = 0; a < Math.PI * 2; a += 0.13) {
    const rr = PLAZA.r - 22 - r() * 30
    const x = PLAZA.x + Math.cos(a) * rr
    const y = PLAZA.y + Math.sin(a) * rr
    if (near(x, y) < HALF + 20) continue
    out.push({ x, y, s: 27 + r() * 8, phase: r() * 10, tint: r() })
  }
  return out
}

export const FANS = fans()

export type Kind = 'drum' | 'band' | 'recruit' | 'kid'
export type Marcher = { o: number; lat: number; kind: Kind; s: number; phase: number }

function marchers() {
  const r = rng(3)
  const out: Marcher[] = [{ o: 0, lat: 0, kind: 'drum', s: 36, phase: 0 }]
  for (let row = 0; row < 3; row++)
    for (let col = -1; col <= 1; col++)
      out.push({ o: 80 + row * 46, lat: col * 38, kind: 'band', s: 32, phase: r() * 6 })
  for (let row = 0; row < 9; row++)
    for (let col = -1; col <= 1; col++)
      out.push({ o: GIANT_AT[3] + 260 + row * 42, lat: col * 34, kind: 'recruit', s: 31, phase: row * 0.5 })
  for (let k = 0; k < 6; k++)
    out.push({ o: GIANT_AT[k % 4] + 40, lat: (k % 2 ? 1 : -1) * 60, kind: 'kid', s: 20, phase: r() * 6 })
  return out
}

export const GIANT_AT = [330, 650, 970, 1290]
export const MARCHERS = marchers()
export const TRAIN = GIANT_AT[3] + 260 + 9 * 42
export const LOOP = LENGTH + TRAIN + 500
