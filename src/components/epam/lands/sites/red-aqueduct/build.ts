import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  ACROSS, ALONG, ARC_N, COS, SIN, ARC_T0, ARC_T1, DAM_LEN, GATE_X, H1, H2, MILLS, SEG, SEGS, WHEEL_R, WHEEL_Z,
  RIVER_T0, RIVER_T1, craneAt, damAt, loadAt, millAt, offset, river, road, spot, standMatrix,
} from './layout'

export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const INK = '#2a1630'
export const WOOD = '#7a4a5c'
export const PLASTER = '#fbf3e6'
export const CRIMSON = '#e01f4c'
const WHITE = '#ffffff'
const LOW = '#ecc8da'
const HIGH = '#f8f0f6'
const TRIM = '#c7a6d2'
const DAM = '#d9c3e0'
const KEY = '#e0457a'

type Parts = THREE.BufferGeometry[]

function paint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const a = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(a, 3))
  return g
}

function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  g.rotateX(rx)
  g.rotateY(ry)
  g.rotateZ(rz)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  return paint(g, color)
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)

function merged(parts: Parts) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

const m4 = new THREE.Matrix4()

function place(out: Parts, parts: Parts, at: [number, number], turn: number, s = 1) {
  standMatrix(at, turn, s, m4)
  for (const p of parts) out.push(p.applyMatrix4(m4))
}

function eyes(parts: Parts, x: number, y: number, z: number, r: number, gap: number, turn: number) {
  const d = new THREE.Vector3(0, SIN, COS).applyAxisAngle(new THREE.Vector3(0, 1, 0), -turn).multiplyScalar(r * 0.72)
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 12, 8), WHITE, x + side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.48, 8, 6), INK, x + side * gap * 0.92 + d.x, y + d.y - r * 0.28, z + d.z))
  }
}

function extrude(shape: THREE.Shape, depth: number, color: string, y = 0) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 7 })
  return part(g, color, 0, y, -depth / 2)
}

function lowerTier(L: number) {
  const r = L / 2 - 18
  const s = 62
  const sh = new THREE.Shape()
  sh.moveTo(-L / 2, 0)
  sh.lineTo(-r, 0)
  sh.lineTo(-r, s)
  sh.absarc(0, s, r, Math.PI, 0, true)
  sh.lineTo(r, 0)
  sh.lineTo(L / 2, 0)
  sh.lineTo(L / 2, H1)
  sh.lineTo(-L / 2, H1)
  sh.closePath()
  return sh
}

function upperTier(L: number) {
  const r = L / 4 - 11
  const s = H1 + 12
  const sh = new THREE.Shape()
  sh.moveTo(-L / 2, H1)
  for (const c of [-L / 4, L / 4]) {
    sh.lineTo(c - r, H1)
    sh.lineTo(c - r, s)
    sh.absarc(c, s, r, Math.PI, 0, true)
    sh.lineTo(c + r, H1)
  }
  sh.lineTo(L / 2, H1)
  sh.lineTo(L / 2, H2)
  sh.lineTo(-L / 2, H2)
  sh.closePath()
  return sh
}

function segment(k: number) {
  const L = SEG
  const p: Parts = [extrude(lowerTier(L), 60, LOW), extrude(upperTier(L), 54, HIGH)]
  p.push(part(box(L + 2, 9, 68), TRIM, 0, H1 - 2, 0))
  p.push(part(box(L, 8, 96), TRIM, 0, H2, 15))
  for (const z of [-27, 27]) p.push(part(box(L, 22, 7), '#cdb6d6', 0, H2 + 15, z))
  p.push(part(box(L, 4, 48), CRIMSON, 0, H2 + 6, 0))
  p.push(part(box(16, 20, 5), KEY, 0, 62 + L / 2 - 18 + 6, 31))
  p.push(part(box(L, 3, 4), WOOD, 0, H2 + 16, 62))
  if (k % 2 === 1) {
    const flag = new THREE.Shape([new THREE.Vector2(-14, 0), new THREE.Vector2(14, 0), new THREE.Vector2(14, -40), new THREE.Vector2(0, -52), new THREE.Vector2(-14, -40)])
    p.push(part(new THREE.ShapeGeometry(flag), k % 4 === 1 ? TEAL : MINT, L / 4, H1 + 52, 29))
  }
  return p
}

function mill(k: number) {
  const y0 = H2 + 4
  const zb = -20
  const p: Parts = [part(box(110, 100, 84), PLASTER, 0, y0 + 50, zb - 6)]
  for (const x of [-53, 53]) p.push(part(box(6, 100, 3), WOOD, x, y0 + 50, zb + 37))
  p.push(part(box(112, 6, 3), WOOD, 0, y0 + 64, zb + 37))
  p.push(part(box(26, 42, 3), INK, -24, y0 + 21, zb + 37))
  p.push(part(box(20, 20, 3), '#ffd36b', 26, y0 + 32, zb + 37))
  const gable = new THREE.Shape([new THREE.Vector2(-55, 0), new THREE.Vector2(55, 0), new THREE.Vector2(0, 70)])
  p.push(part(new THREE.ShapeGeometry(gable), PLASTER, 0, y0 + 100, zb + 36.5))
  eyes(p, 0, y0 + 124, zb + 38, 13, 20, 0)
  const roof = k === 1 ? '#0f9484' : TEAL
  const len = Math.hypot(64, 82)
  const ang = Math.atan2(82, 64)
  p.push(part(box(len, 9, 96), roof, -32, y0 + 141, zb - 6, 0, 0, ang))
  p.push(part(box(len, 9, 96), roof, 32, y0 + 141, zb - 6, 0, 0, -ang))
  p.push(part(box(14, 10, 98), MINT, 0, y0 + 184, zb - 6))
  p.push(part(box(22, 34, 22), PLASTER, 30, y0 + 172, zb - 20))
  p.push(part(new THREE.ConeGeometry(18, 18, 4), MINT, 30, y0 + 198, zb - 20, 0, Math.PI / 4))
  if (k === 1) {
    p.push(part(new THREE.CylinderGeometry(2, 2, 80, 5), INK, -30, y0 + 220, zb - 20))
    const pen = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(44, -10), new THREE.Vector2(0, -20)])
    p.push(part(new THREE.ShapeGeometry(pen), MINT, -30, y0 + 258, zb - 20))
  }
  return p
}

function wheelStatic() {
  const y = WHEEL_R + 4
  const p: Parts = [part(box(10, 10, WHEEL_Z + 2), WOOD, 0, y, 26 + (WHEEL_Z + 2) / 2)]
  const len = Math.hypot(WHEEL_Z - 10, 44)
  p.push(part(box(30, 6, len), WOOD, 0, H2 - 6, 10 + (WHEEL_Z - 10) / 2, Math.atan2(44, WHEEL_Z - 10)))
  for (const z of [-24, 24]) p.push(part(box(8, y + 8, 8), WOOD, 0, (y + 8) / 2, WHEEL_Z + z))
  return p
}

function dam() {
  const L = DAM_LEN
  const sh = new THREE.Shape()
  sh.moveTo(-L / 2, 0)
  sh.lineTo(GATE_X - 64, 0)
  sh.lineTo(GATE_X - 64, 124)
  sh.lineTo(GATE_X + 64, 124)
  sh.lineTo(GATE_X + 64, 0)
  sh.lineTo(L / 2, 0)
  sh.lineTo(L / 2, 170)
  sh.lineTo(-L / 2, 170)
  sh.closePath()
  const p: Parts = [extrude(sh, 84, DAM)]
  for (let x = -L / 2 + 14; x < L / 2; x += 46) p.push(part(box(22, 20, 88), TRIM, x, 180, 0))
  for (const x of [-L / 2 + 40, -L / 4, L / 2 - 30]) p.push(part(box(34, 130, 30), TRIM, x, 65, 52))
  for (const side of [-1, 1]) {
    const x = GATE_X + side * 102
    p.push(part(new THREE.CylinderGeometry(36, 40, 250, 12), HIGH, x, 125, 6))
    p.push(part(new THREE.CylinderGeometry(44, 44, 14, 12), TRIM, x, 254, 6))
    p.push(part(new THREE.ConeGeometry(50, 78, 12), TEAL, x, 300, 6))
  }
  p.push(part(box(10, 140, 10), INK, GATE_X - 70, 70, 46))
  p.push(part(box(10, 140, 10), INK, GATE_X + 70, 70, 46))
  p.push(part(new THREE.CylinderGeometry(3, 3, 120, 5), INK, GATE_X - 102, 384, 6))
  return p
}

function crane() {
  const p: Parts = []
  for (const x of [-26, 26]) p.push(part(box(10, H2 + 120, 10), WOOD, x, (H2 + 120) / 2, 20))
  p.push(part(box(64, 10, 10), WOOD, 0, H2 + 116, 20))
  p.push(part(box(10, 10, 80), WOOD, 0, H2 + 112, 56))
  p.push(part(box(2, H2 + 100, 2), INK, 0, (H2 + 100) / 2 + 10, 92))
  p.push(part(new THREE.CylinderGeometry(16, 16, 12, 12), INK, 0, H2 + 124, 20, 0, 0, Math.PI / 2))
  return p
}

function chute() {
  const p: Parts = []
  const len = Math.hypot(H2, 110)
  p.push(part(box(26, 6, len), WOOD, 0, H2 / 2 + 4, 55, Math.atan2(H2, 110)))
  p.push(part(box(60, 8, 60), WOOD, 0, 4, 130))
  return p
}

export function staticGeometry() {
  const out: Parts = []
  for (let k = 0; k < SEGS; k++) {
    const t = ARC_T0 + ((k + 0.5) * (ARC_T1 - ARC_T0)) / SEGS
    place(out, segment(k), spot(t, ARC_N), ALONG)
  }
  MILLS.forEach((_, k) => {
    place(out, mill(k), millAt(k), 0)
    place(out, wheelStatic(), millAt(k), ALONG)
  })
  place(out, dam(), damAt(), ACROSS)
  const face: Parts = []
  eyes(face, 0, 248, 0, 30, 36, 0)
  place(out, face, offset(damAt(), ACROSS, GATE_X - 10, 44), 0)
  place(out, crane(), craneAt(), ALONG)
  place(out, chute(), spot(ARC_T0 + 40, ARC_N), ALONG)
  const stones: Parts = []
  for (let k = 0; k < 40; k++) {
    const [x, y] = road(k / 39)
    stones.push(part(new THREE.CylinderGeometry(9, 10, 3, 7), k % 3 ? '#e9dcea' : '#cdb6d6', x, -y, 2, Math.PI / 2))
  }
  const pile: Parts = []
  for (let k = 0; k < 9; k++) pile.push(part(new THREE.SphereGeometry(13, 8, 6), k % 4 ? PLASTER : '#efe2cc', (k % 4) * 22 - 33 + (k > 3 ? 11 : 0), 12 + Math.floor(k / 4) * 18, 30 - Math.floor(k / 4) * 6))
  place(out, pile, offset(loadAt(), ALONG, -90, 10), 0)
  const jetty = [part(box(220, 8, 60), WOOD, 0, 14, 10), ...[-100, 0, 100].map((x) => part(box(8, 14, 8), INK, x, 7, 36))]
  place(out, jetty, spot(-330, -255), ALONG)
  return merged([...out, ...stones])
}

export function wheelGeometry() {
  const R = WHEEL_R
  const p: Parts = []
  for (const z of [-16, 16]) {
    p.push(part(new THREE.TorusGeometry(R, 5, 4, 28), WOOD, 0, 0, z))
    for (let k = 0; k < 4; k++) p.push(part(box(2 * R - 6, 7, 5), WOOD, 0, 0, z, 0, 0, (k * Math.PI) / 4))
  }
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    p.push(part(box(28, 7, 42), k % 2 ? MINT : TEAL, Math.cos(a) * (R - 6), Math.sin(a) * (R - 6), 0, 0, 0, a))
  }
  p.push(part(new THREE.CylinderGeometry(14, 14, 50, 10), INK, 0, 0, 0, Math.PI / 2))
  return merged(p)
}

export function gateGeometry() {
  const p: Parts = [part(box(124, 122, 12), TEAL, 0, 0, 0)]
  for (const y of [-40, 0, 40]) p.push(part(box(126, 8, 14), INK, 0, y, 0))
  p.push(part(box(8, 120, 4), MINT, 0, 0, 8))
  return merged(p)
}

export function folkGeometry() {
  const p: Parts = [part(new THREE.SphereGeometry(0.5, 12, 9), '#4b36a8', 0, 0.5, 0)]
  p.push(part(new THREE.CylinderGeometry(0.28, 0.36, 0.16, 10), TEAL, 0, 0.98, -0.04))
  for (const side of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.1, 6, 5), INK, side * 0.22, 0.04, 0.12))
  for (const side of [-1, 1]) {
    p.push(part(new THREE.SphereGeometry(0.19, 10, 8), WHITE, side * 0.17, 0.64, 0.34))
    p.push(part(new THREE.SphereGeometry(0.09, 8, 6), INK, side * 0.15, 0.6, 0.51))
  }
  return merged(p)
}

export function cartGeometry() {
  const p: Parts = [part(box(1.6, 0.34, 0.9), WOOD, 0, 0.42, 0)]
  for (const x of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) p.push(part(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 10), INK, x, 0.26, z, Math.PI / 2))
  for (const x of [-0.42, 0, 0.42]) p.push(part(new THREE.SphereGeometry(0.3, 8, 6), PLASTER, x, 0.78, 0))
  p.push(part(box(0.06, 0.06, 0.9), INK, 0.95, 0.5, 0, 0, 0.5))
  return merged(p)
}

export function boatGeometry() {
  const p: Parts = [part(new THREE.SphereGeometry(0.75, 14, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2).scale(1, 0.6, 1), TEAL, 0, 0.45, 0)]
  p.push(part(new THREE.TorusGeometry(0.74, 0.07, 4, 18), INK, 0, 0.45, 0, Math.PI / 2))
  p.push(part(new THREE.CylinderGeometry(0.025, 0.035, 1.9, 4), WOOD, 0.75, 1.2, 0.1, 0, 0, -0.75))
  p.push(part(box(0.012, 1.2, 0.012), INK, 1.42, 1.0, 0.1))
  p.push(part(new THREE.SphereGeometry(0.08, 6, 4), '#ff2d55', 1.42, 0.38, 0.1))
  return merged(p)
}

export const beadGeometry = () => new THREE.TorusGeometry(9.5, 6, 4, 9)

export function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(255,150,175,1)')
  r.addColorStop(0.35, 'rgba(240,60,100,0.5)')
  r.addColorStop(1, 'rgba(255,40,90,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, 'rgba(42,22,48,0.9)')
  r.addColorStop(0.6, 'rgba(42,22,48,0.45)')
  r.addColorStop(1, 'rgba(42,22,48,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

const BANDS: [number, number, string][] = [[-6, 18, INK], [18, 58, '#f3ebf4'], [58, 74, INK]]

export function quayGeometry() {
  const loop: [number, number][] = []
  const A = RIVER_T0 - 30
  const B = RIVER_T1 - 30
  const bank = (t: number, side: number) => {
    const [c, h] = river(Math.min(B, Math.max(A, t)))
    const u = t < A ? (A - t) / (h + 10) : t > B ? (t - B) / (h + 10) : 0
    return spot(t, c + side * h * Math.sqrt(Math.max(0, 1 - u * u)))
  }
  const ends = (t: number) => river(t)[1] + 10
  for (let t = A - ends(A); t <= B + ends(B); t += 15) loop.push(bank(t, 1))
  for (let t = B + ends(B) - 15; t > A - ends(A); t -= 15) loop.push(bank(t, -1))
  const n = loop.length
  const out: [number, number][] = loop.map((_, k) => {
    const a = loop[(k + n - 1) % n]
    const b = loop[(k + 1) % n]
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const l = Math.hypot(dx, dy) || 1
    return [dy / l, -dx / l]
  })
  const area = loop.reduce((acc, p, k) => acc + p[0] * loop[(k + 1) % n][1] - loop[(k + 1) % n][0] * p[1], 0)
  const sign = area > 0 ? -1 : 1
  const pos: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  for (const [a, b, tone] of BANDS) {
    c.set(tone)
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n
      const q = [k, j].flatMap((i) => [a, b].map((d) => [loop[i][0] + sign * out[i][0] * d, -(loop[i][1] + sign * out[i][1] * d)]))
      for (const v of [q[0], q[2], q[1], q[1], q[2], q[3]]) {
        pos.push(v[0], v[1], 3)
        col.push(c.r, c.g, c.b, 1)
      }
    }
  }
  const fill = new THREE.ShapeGeometry(new THREE.Shape(loop.map(([x, y]) => new THREE.Vector2(x, -y)))).toNonIndexed()
  const fp = fill.getAttribute('position')
  c.set(CRIMSON)
  for (let k = 0; k < fp.count; k++) {
    pos.push(fp.getX(k), fp.getY(k), 2)
    col.push(c.r, c.g, c.b, 0.5)
  }
  fill.dispose()
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return g
}
