import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { EYE_AT, LEAN, PIN_H, SPOOL_H, UMBRELLAS, WRAP } from './data'

export const INK = '#2a1630'
const WHITE = '#ffffff'
const TEAL = '#16b3a0'
const MINT = '#7dffe6'
const RED = '#d81f3c'
const DEEP = '#a8102c'
const BODY = '#4a36aa'
const FOOT = '#2d2170'
const GOLD = '#ffc23a'
const RIND = '#e0a93a'
const PAPER = '#fff4d6'
const WOOD = '#c98a4b'
const PLANK = '#e3b07a'
const BIRCH = '#f2d3a2'
const STEEL = '#eceef7'
const STONE = '#f3ebf4'
const STRAW = '#ffd36b'
const GAP2 = 112

type V3 = [number, number, number]
type Opt = { at?: V3; rot?: V3; size?: V3 }

const m4 = new THREE.Matrix4()
const qt = new THREE.Quaternion()
const eu = new THREE.Euler()
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const tint = new THREE.Color()

export function part(shape: THREE.BufferGeometry, color: string, { at = [0, 0, 0], rot = [0, 0, 0], size = [1, 1, 1] }: Opt = {}) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  g.deleteAttribute('uv')
  g.applyMatrix4(m4.compose(v1.set(...at), qt.setFromEuler(eu.set(...rot)), v2.set(...size)))
  tint.set(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([tint.r, tint.g, tint.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

function faces(g: THREE.BufferGeometry, pick: (i: number, c: THREE.Vector3) => string | null) {
  const pos = g.getAttribute('position')
  const col = g.getAttribute('color')
  const c = new THREE.Vector3()
  for (let i = 0; i < pos.count; i += 3) {
    c.set(0, 0, 0)
    for (let k = 0; k < 3; k++) c.add(v1.fromBufferAttribute(pos, i + k))
    const hex = pick(i / 3, c.multiplyScalar(1 / 3))
    if (!hex) continue
    tint.set(hex)
    for (let k = 0; k < 3; k++) col.setXYZ(i + k, tint.r, tint.g, tint.b)
  }
  return g
}

function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap: number, r: number, look = 0) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 7, 5), WHITE, { at: [side * gap, y, z] }))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 5, 3), INK, { at: [side * gap * 0.92 + look * r * 0.3, y - r * 0.2, z + r * 0.72] }))
  }
}

function body(parts: THREE.BufferGeometry[]) {
  parts.push(part(new THREE.SphereGeometry(18, 9, 7), BODY, { size: [1, 0.95, 1] }))
  for (const side of [-1, 1]) parts.push(part(new THREE.SphereGeometry(6, 6, 4), FOOT, { at: [side * 8, -16, 4], size: [1, 0.6, 1.3] }))
  eyes(parts, 10, 12.5, 7.5, 7)
}

export function riderGeometry() {
  const parts: THREE.BufferGeometry[] = []
  body(parts)
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.CylinderGeometry(3.4, 3.4, 20, 5), BODY, { at: [side * 17, 15, 0], rot: [0, 0, -side * 0.45] }))
    parts.push(part(new THREE.SphereGeometry(4.5, 6, 4), BODY, { at: [side * 21.5, 24, 0] }))
  }
  const hat: Opt = { rot: [-0.75, 0, 0.15] }
  parts.push(part(new THREE.CylinderGeometry(19, 19, 2.5, 9), STRAW, { ...hat, at: [0, 17, -8] }))
  parts.push(part(new THREE.CylinderGeometry(9, 11, 9, 8), STRAW, { ...hat, at: [0, 20, -12] }))
  parts.push(part(new THREE.CylinderGeometry(11.2, 11.4, 3, 8), RED, { ...hat, at: [0, 18, -10] }))
  return merge(parts)
}

export function workerGeometry() {
  const parts: THREE.BufferGeometry[] = []
  body(parts)
  for (const side of [-1, 1]) parts.push(part(new THREE.SphereGeometry(5, 6, 4), BODY, { at: [side * 18, -3, 3] }))
  parts.push(part(new THREE.SphereGeometry(15, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, { at: [0, 9, -1] }))
  parts.push(part(new THREE.BoxGeometry(18, 2.5, 12), MINT, { at: [0, 10, 14] }))
  parts.push(part(new THREE.SphereGeometry(3.5, 6, 4), RED, { at: [0, 24, -1] }))
  return merge(parts)
}

export function potGeometry() {
  return merge([
    part(new THREE.SphereGeometry(13, 8, 6), GOLD, { at: [0, 11, 0], size: [1, 0.85, 1] }),
    part(new THREE.CylinderGeometry(8, 9, 6, 9), RIND, { at: [0, 21, 0] }),
    part(new THREE.CylinderGeometry(10.5, 10.5, 3, 9), PAPER, { at: [0, 25, 0] }),
    part(new THREE.CylinderGeometry(9.4, 9.4, 1.6, 9), RED, { at: [0, 22.5, 0] }),
  ])
}

export function thimbleGeometry() {
  const cup = part(new THREE.CylinderGeometry(33, 27, 52, 16, 4, true), STEEL, { at: [0, -86, 0] })
  faces(cup, (i, c) => {
    if (c.y > -66) return RED
    const ring = Math.floor((c.y + 112) / 13)
    const col = Math.floor(((Math.atan2(c.z, c.x) + Math.PI) / (Math.PI * 2)) * 16)
    return (ring + col) % 2 ? '#c9cde0' : null
  })
  const parts = [
    cup,
    part(new THREE.SphereGeometry(27, 14, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), STEEL, { at: [0, -112, 0], size: [1, 0.35, 1] }),
    part(new THREE.TorusGeometry(33, 3.5, 5, 18), DEEP, { at: [0, -60, 0], rot: [Math.PI / 2, 0, 0] }),
    part(new THREE.CylinderGeometry(13, 13, 10, 12), TEAL, { rot: [Math.PI / 2, 0, 0] }),
    part(new THREE.CylinderGeometry(5, 5, 12, 6), INK, { rot: [Math.PI / 2, 0, 0] }),
  ]
  for (const side of [-1, 1]) parts.push(part(new THREE.CylinderGeometry(2.2, 2.2, 64, 4), INK, { at: [side * 15, -30, 0], rot: [0, 0, side * 0.5] }))
  return merge(parts)
}

export function pinGeometry() {
  const parts = [
    part(new THREE.CylinderGeometry(6, 6.5, PIN_H, 8), STEEL, { at: [0, PIN_H / 2, 0] }),
    part(new THREE.SphereGeometry(40, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#fbeef4', { size: [1, 0.3, 1] }),
    part(new THREE.BoxGeometry(14, 12, GAP2), TEAL, { at: [0, PIN_H - 12, 0] }),
    part(new THREE.CylinderGeometry(15, 15, 4, 10), MINT, { at: [0, PIN_H + 1, 0] }),
  ]
  for (const side of [-1, 1]) parts.push(part(new THREE.CylinderGeometry(8, 8, 18, 8), INK, { at: [0, PIN_H - 12, side * 52], rot: [0, 0, Math.PI / 2] }))
  eyes(parts, PIN_H + 36, 32, 14, 11)
  return merge(parts)
}

export function headGeometry() {
  return new THREE.SphereGeometry(40, 14, 10)
}

export function barrelGeometry() {
  const g = part(new THREE.CylinderGeometry(116, 116, SPOOL_H * 1.2, 28, 18), RED, { at: [0, 34 + (SPOOL_H * 1.2) / 2, 0] })
  faces(g, (i, c) => {
    const a = Math.floor(((Math.atan2(c.z, c.x) + Math.PI) / (Math.PI * 2)) * 28)
    if (a % 7 === 0) return '#ff6b7d'
    return Math.floor((c.y + a * 1.7) / 20) % 2 ? DEEP : null
  })
  const top = 34 + SPOOL_H * 1.2 + 34
  return merge([
    g,
    part(new THREE.CylinderGeometry(12, 12, 46, 8), WOOD, { at: [0, top + 20, 0] }),
    part(new THREE.BoxGeometry(300, 12, 12), WOOD, { at: [0, top + 34, 0] }),
    part(new THREE.SphereGeometry(10, 6, 4), RED, { at: [150, top + 34, 0] }),
    part(new THREE.SphereGeometry(10, 6, 4), RED, { at: [-150, top + 34, 0] }),
  ])
}

export const SPOOL_TOP = 34 + SPOOL_H * 1.2 + 34

export function spoolGeometry() {
  const top = SPOOL_TOP
  const parts = [
    part(new THREE.CylinderGeometry(152, 156, 34, 28), BIRCH, { at: [0, 17, 0] }),
    part(new THREE.CylinderGeometry(152, 152, 34, 28), BIRCH, { at: [0, top - 17, 0] }),
    part(new THREE.CylinderGeometry(157, 157, 6, 28), WOOD, { at: [0, top - 3, 0] }),
    part(new THREE.CylinderGeometry(157, 157, 6, 28), WOOD, { at: [0, 31, 0] }),
    part(new THREE.CylinderGeometry(118, 118, 1, 28), PAPER, { at: [0, top + 0.5, 0] }),
    part(new THREE.CylinderGeometry(122, 122, 0.8, 28), TEAL, { at: [0, top + 0.3, 0] }),
    part(new THREE.CylinderGeometry(30, 30, 1, 14), '#5e3720', { at: [0, top + 1.2, 0] }),
  ]
  eyes(parts, 18, 150, 30, 16)
  const deck = 170
  parts.push(part(new THREE.BoxGeometry(230, 12, 170), PLANK, { at: [235, deck, 0] }))
  for (let k = 0; k < 6; k++) parts.push(part(new THREE.BoxGeometry(3, 12.5, 170), WOOD, { at: [130 + k * 38, deck + 0.5, 0] }))
  for (const [x, z] of [[130, -75], [340, -75], [130, 75], [340, 75]]) parts.push(part(new THREE.CylinderGeometry(7, 8, deck, 6), WOOD, { at: [x, deck / 2, z] }))
  parts.push(part(new THREE.BoxGeometry(230, 5, 5), TEAL, { at: [235, deck + 34, 84] }))
  for (let k = 0; k < 6; k++) parts.push(part(new THREE.BoxGeometry(4, 34, 4), TEAL, { at: [125 + k * 44, deck + 17, 84] }))
  for (let k = 0; k < 7; k++) parts.push(part(new THREE.BoxGeometry(24, 6, 44), PLANK, { at: [362 + k * 22, deck - 12 - k * 24, 50] }))
  booth(parts, -240, 90)
  stack(parts, -170, -120)
  bunting(parts, [-240, 175, 90], [0, top + 10, 0], 9)
  bunting(parts, [0, top + 10, 0], [330, deck + 80, -60], 9)
  parts.push(part(new THREE.CylinderGeometry(3, 3, 80, 4), INK, { at: [330, deck + 40, -60] }))
  return merge(parts)
}

function booth(parts: THREE.BufferGeometry[], x: number, z: number) {
  parts.push(part(new THREE.BoxGeometry(110, 100, 90), STONE, { at: [x, 50, z] }))
  parts.push(part(new THREE.ConeGeometry(92, 70, 4), TEAL, { at: [x, 135, z], rot: [0, Math.PI / 4, 0] }))
  parts.push(part(new THREE.BoxGeometry(60, 34, 2), INK, { at: [x, 60, z + 46] }))
  parts.push(part(new THREE.BoxGeometry(70, 6, 14), PLANK, { at: [x, 42, z + 50] }))
  parts.push(part(new THREE.CylinderGeometry(2.5, 2.5, 60, 4), INK, { at: [x, 190, z] }))
  parts.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(44, -12), new THREE.Vector2(0, -24)])), RED, { at: [x + 2, 218, z] }))
}

function stack(parts: THREE.BufferGeometry[], x: number, z: number) {
  const pot = potGeometry()
  const rows: [number, number, number][] = [
    [-28, 0, 0], [0, 0, 0], [28, 0, 0], [-14, 26, 0], [14, 26, 0], [0, 52, 0], [-14, 0, 26], [14, 0, 26],
  ]
  for (const [a, b, c] of rows) parts.push(pot.clone().translate(x + a, b, z + c))
  pot.dispose()
}

function bunting(parts: THREE.BufferGeometry[], a: V3, b: V3, n: number) {
  const tones = [RED, WHITE, TEAL, GOLD]
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const x = a[0] + (b[0] - a[0]) * u
    const y = a[1] + (b[1] - a[1]) * u - 40 * 4 * u * (1 - u)
    const z = a[2] + (b[2] - a[2]) * u
    if (i < n) parts.push(part(new THREE.ConeGeometry(7, 20, 3), tones[i % 4], { at: [x + (b[0] - a[0]) / n / 2, y - 12, z], rot: [Math.PI, 0, 0] }))
    parts.push(part(new THREE.SphereGeometry(2.4, 4, 3), INK, { at: [x, y, z] }))
  }
}

export function beachGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const tones = ['#ffb347', '#7dffe6', '#ff8fb8']
  UMBRELLAS.forEach(([x, z], k) => {
    parts.push(part(new THREE.CylinderGeometry(3.5, 3.5, 130, 5), WHITE, { at: [x, 65, z] }))
    const top = part(new THREE.ConeGeometry(84, 34, 10, 1, true), RED, { at: [x, 138, z] })
    faces(top, (i) => (Math.floor(i / 2) % 2 ? WHITE : null))
    parts.push(top)
    parts.push(part(new THREE.SphereGeometry(6, 6, 4), RED, { at: [x, 157, z] }))
    parts.push(part(new THREE.BoxGeometry(50, 3, 96), tones[k], { at: [x + 30, 2, z + 14], rot: [0, 0.12 - k * 0.12, 0] }))
  })
  parts.push(part(new THREE.CylinderGeometry(26, 30, 22, 10), '#fbe3a8', { at: [80, 11, -120] }))
  parts.push(part(new THREE.ConeGeometry(16, 34, 4), RED, { at: [80, 38, -120] }))
  return merge(parts)
}

export function needleGeometry() {
  const parts = [
    part(new THREE.ConeGeometry(32, 130, 12), STEEL, { at: [0, 25, 0], rot: [Math.PI, 0, 0] }),
    part(new THREE.CylinderGeometry(32, 32, EYE_AT - 130, 12), STEEL, { at: [0, 90 + (EYE_AT - 130) / 2 - 2, 0] }),
    part(new THREE.SphereGeometry(32, 12, 6), STEEL, { at: [0, EYE_AT + 52, 0], size: [1, 1.1, 1] }),
  ]
  for (const side of [-1, 1]) parts.push(part(new THREE.CylinderGeometry(11, 11, 100, 6), STEEL, { at: [side * 24, EYE_AT, 0] }))
  for (let k = 0; k < 12; k++) parts.push(part(new THREE.BoxGeometry(44, 4, 4), WOOD, { at: [0, 110 + k * 36, 36] }))
  for (const side of [-1, 1]) parts.push(part(new THREE.BoxGeometry(4, 440, 4), WOOD, { at: [side * 21, 310, 37] }))
  const needle = merge(parts)
  faces(needle, (i, c) => (c.x > 14 ? '#b4b8cc' : c.x < -16 && c.z > 0 ? WHITE : null))
  needle.rotateZ(-LEAN)
  const dock = [
    part(new THREE.BoxGeometry(250, 14, 150), PLANK, { at: [-110, 7, 30] }),
    part(new THREE.BoxGeometry(250, 4, 4), TEAL, { at: [-110, 40, 104] }),
    part(new THREE.CylinderGeometry(6, 6, 150, 6), WOOD, { at: [-300, 75, -30] }),
    part(new THREE.CylinderGeometry(4, 4, 70, 5), INK, { at: [-60, 45, 60], rot: [0, 0, 0.5] }),
    part(new THREE.SphereGeometry(9, 6, 4), RED, { at: [-77, 77, 60] }),
    part(new THREE.CylinderGeometry(22, 22, 8, 12), TEAL, { at: [-60, 12, 60] }),
  ]
  for (let k = 0; k < 4; k++) dock.push(part(new THREE.CylinderGeometry(6, 6, 50, 6), WOOD, { at: [-225 + k * 80, 18, 105] }))
  for (let k = 0; k < 6; k++) dock.push(part(new THREE.BoxGeometry(3, 14.6, 150), WOOD, { at: [-200 + k * 36, 7, 30] }))
  const pot = potGeometry()
  for (const [x, y, z] of [[-150, 14, -10], [-122, 14, -10], [-136, 40, -10]]) dock.push(pot.clone().translate(x, y, z))
  pot.dispose()
  return merge([needle, ...dock])
}

export function sagPostGeometry() {
  return merge([
    part(new THREE.CylinderGeometry(4, 5, 150, 5), WOOD, { at: [0, 75, 0] }),
    part(new THREE.SphereGeometry(30, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#fbeef4', { size: [1, 0.25, 1] }),
  ])
}

export function ringGeometry() {
  return new THREE.RingGeometry(0.82, 1, 28)
}

export function beadGeometry() {
  return merge([
    part(new THREE.CircleGeometry(16, 14), '#e0244a'),
    part(new THREE.CircleGeometry(8, 10), '#a8102c', { at: [1, -1, 0.3] }),
    part(new THREE.CircleGeometry(4, 8), '#ff7a8c', { at: [-8, 7, 0.4] }),
  ])
}

export function ropeGeometry() {
  return part(new THREE.CylinderGeometry(3.5, 3.5, 1, 5), RED, { at: [0, -0.5, 0] })
}

export const WRAP_R = WRAP
