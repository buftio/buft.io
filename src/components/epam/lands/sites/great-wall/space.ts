import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const TILT = (50 * Math.PI) / 180
export const C = Math.cos(TILT)
export const S = Math.sin(TILT)
export const SHEAR = new THREE.Matrix4().set(1, 0, 0, 0, 0, C, -1, 0, 0, S, 0, 0, 0, 0, 0, 1)
export const PITCH = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT)
export const UP = new THREE.Vector3(0, 1, 0)

export const H = 200
export const T = 150
export const INK = '#2a1630'
export const WHITE = '#ffffff'

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  g.rotateY(turn)
  g.translate(x, y, z)
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = [c.r, c.g, c.b]
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => rgb[i % 3]), 3))
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function eyes(parts: THREE.BufferGeometry[], r: number, x: number, y: number, z: number, gap: number, look = [0, -0.25], seg = 10) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, seg, Math.ceil(seg * 0.8)), WHITE, x + side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.52, Math.ceil(seg * 0.7), Math.ceil(seg * 0.5)), INK, x + side * gap + look[0] * r, y + look[1] * r, z + r * 0.72))
  }
}

const PTS: [number, number][] = [
  [-2000, -380], [-1500, -260], [-1100, -150], [-700, 10], [-300, 250], [0, 420],
  [300, 620], [700, 860], [1000, 1060], [1300, 1270], [1600, 1500],
]
const N = 640
const curve = new THREE.CatmullRomCurve3(PTS.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal')
const spaced = curve.getSpacedPoints(N)
const PX = Float32Array.from(spaced, (p) => p.x)
const PZ = Float32Array.from(spaced, (p) => p.z)
export const LEN = curve.getLength()

export type Frame = { x: number; z: number; tx: number; tz: number; nx: number; nz: number; turn: number }
export const here: Frame = { x: 0, z: 0, tx: 1, tz: 0, nx: 0, nz: -1, turn: 0 }

export function along(u: number, out: Frame = here) {
  const f = Math.min(N - 1e-4, Math.max(0, u * N))
  const i = Math.floor(f)
  const k = f - i
  const dx = PX[i + 1] - PX[i]
  const dz = PZ[i + 1] - PZ[i]
  const l = Math.hypot(dx, dz) || 1
  out.x = PX[i] + dx * k
  out.z = PZ[i] + dz * k
  out.tx = dx / l
  out.tz = dz / l
  out.nx = out.tz
  out.nz = -out.tx
  out.turn = Math.atan2(-out.tz, out.tx)
  return out
}

export const frame = (u: number) => along(u, { ...here })

export function uOf(x: number) {
  let i = 0
  while (i < N && PX[i] < x) i++
  return i / N
}

export function pop(x: number, y: number, z: number, v: THREE.Vector3) {
  return v.set(x, C * y - z, S * y)
}

export const SITES = {
  t0: uOf(-1830),
  t1: uOf(-1080),
  gate: uOf(-270),
  t2: uOf(390),
  kitchen: uOf(1010),
  t3: uOf(1480),
}

export const BEACONS = [
  { u: SITES.t3, r: 150, h: 450 },
  { u: SITES.t2, r: 122, h: 420 },
  { u: SITES.t1, r: 122, h: 400 },
  { u: SITES.t0, r: 150, h: 450 },
]

export const KITCHEN = { r: 175, h: 260 }

export const TURRET = { at: 200, r: 66, h: 470, dome: 175 }

export const BEADS: [number, number][] = [
  [0, -95], [15, -75], [55, -50], [105, -25], [145, -5], [190, 20],
  [255, 50], [390, 110], [425, 150], [505, 175], [585, 220],
]

export function rand(seed: number) {
  const s = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export type Mood = { alarm: number; q: number; next: number }

export const spin = (a: number, b: number, k: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * Math.min(1, Math.max(0, k))

export const clock = (t: number, reduced: boolean) => (reduced ? t * 0.06 : t)

export const GATE_D = T + 80

export type Flag = { x: number; y: number; z: number; base: number; size: number }

function flags(): Flag[] {
  const out: Flag[] = []
  for (const b of BEACONS) {
    const f = frame(b.u)
    out.push({ x: f.x - f.nx * b.r * 0.55, y: b.h + 150, z: f.z - f.nz * b.r * 0.55, base: b.h + 30, size: 70 })
  }
  const g = frame(SITES.gate)
  const top = TURRET.h + TURRET.dome + 12
  for (const side of [-1, 1]) out.push({ x: g.x + g.tx * side * TURRET.at, y: top + 70, z: g.z + g.tz * side * TURRET.at, base: top, size: 74 })
  const k = frame(SITES.kitchen)
  out.push({ x: k.x + k.tx * 120 + k.nx * 60, y: KITCHEN.h + 170, z: k.z + k.tz * 120 + k.nz * 60, base: KITCHEN.h + 170, size: 60 })
  const skip = [SITES.gate, ...BEACONS.map((b) => b.u), SITES.kitchen]
  for (let u = 0.03; u < 0.99; u += 330 / LEN) {
    if (skip.some((s) => Math.abs(s - u) < 260 / LEN)) continue
    const f = frame(u)
    out.push({ x: f.x - f.nx * (T / 2 - 8), y: H + 120, z: f.z - f.nz * (T / 2 - 8), base: H + 30, size: 46 })
  }
  return out
}

export const FLAGS = flags()

export const PIER: [number, number][] = [[300, 80], [420, -165]]
export const SCOPE: [number, number] = [415, -150]

export const LAMPS = Array.from({ length: 26 }, (_, k) => (k + 0.5) / 26).filter(
  (u) => ![SITES.gate, SITES.kitchen, ...BEACONS.map((b) => b.u)].some((x) => Math.abs(x - u) < 230 / LEN),
)

export function heapAt() {
  const g = frame(SITES.gate)
  const o = -(GATE_D / 2 + 70)
  return [g.x - g.tx * 105 + g.nx * o, g.z - g.tz * 105 + g.nz * o] as const
}
