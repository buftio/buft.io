import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const INK = '#2a1630'
const WHITE = '#ffffff'
const TEAL = '#16b3a0'
const MINT = '#7dffe6'
const PINK = '#ff4fa3'
const LACQUER = '#8c1d45'
const WOOD = '#9a6238'
const BARK = '#5e3720'
const BODY = '#4a36aa'
const STONE = '#f3ebf4'
const GOLD = '#ffc23a'
const BEAD = '#e0244a'

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

function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap: number, r: number) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 8, 6), WHITE, { at: [side * gap, y, z] }))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 6, 4), INK, { at: [side * gap * 0.92, y - r * 0.25, z + r * 0.75] }))
  }
}

export function paperGeometry() {
  const g = part(new THREE.SphereGeometry(0.5, 12, 9), WHITE, { size: [1, 1.2, 1] })
  const pos = g.getAttribute('position')
  const col = g.getAttribute('color')
  const lo = new THREE.Color('#fff7e2')
  const hi = new THREE.Color('#ff9a3c')
  for (let i = 0; i < pos.count; i += 3) {
    const cy = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3
    const row = Math.floor((Math.acos(Math.max(-1, Math.min(1, cy / 0.6))) / Math.PI) * 9)
    const band = row % 2 ? 0.86 : 1
    for (let k = 0; k < 3; k++) {
      const t = Math.min(1, Math.abs(pos.getY(i + k)) / 0.6) ** 1.6
      tint.copy(lo).lerp(hi, t).multiplyScalar(band)
      col.setXYZ(i + k, tint.r, tint.g, tint.b)
    }
  }
  return g
}

export function frameGeometry() {
  const parts = [
    part(new THREE.CylinderGeometry(0.2, 0.27, 0.1, 9), LACQUER, { at: [0, 0.6, 0] }),
    part(new THREE.CylinderGeometry(0.27, 0.2, 0.1, 9), LACQUER, { at: [0, -0.6, 0] }),
    part(new THREE.ConeGeometry(0.09, 0.32, 6), PINK, { at: [0, -0.82, 0], rot: [Math.PI, 0, 0] }),
  ]
  eyes(parts, 0.04, 0.44, 0.15, 0.1)
  return merge(parts)
}

export function folkGeometry() {
  const parts = [
    part(new THREE.SphereGeometry(0.5, 12, 8), BODY, { at: [0, 0.5, 0], size: [1, 0.95, 1] }),
    part(new THREE.ConeGeometry(0.42, 0.34, 12), TEAL, { at: [0, 1.08, -0.06] }),
    part(new THREE.SphereGeometry(0.06, 6, 5), MINT, { at: [0, 1.27, -0.06] }),
  ]
  eyes(parts, 0.62, 0.36, 0.17, 0.15)
  return merge(parts)
}

export const BOW: V3 = [1.12, 0.74, 0]

export function boatGeometry() {
  const parts = [
    part(new THREE.SphereGeometry(0.5, 14, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), WOOD, { size: [2, 0.8, 1] }),
    part(new THREE.CylinderGeometry(0.5, 0.5, 0.2, 20, 1, true), '#b47a48', { at: [0, 0.1, 0], size: [2, 1, 1] }),
    part(new THREE.TorusGeometry(0.5, 0.045, 4, 18), BARK, { at: [0, 0.2, 0], rot: [Math.PI / 2, 0, 0], size: [2, 1, 1] }),
    part(new THREE.CircleGeometry(0.5, 20), BARK, { at: [0, -0.04, 0], rot: [-Math.PI / 2, 0, 0], size: [1.85, 0.9, 1] }),
    part(new THREE.CylinderGeometry(0.025, 0.03, 1.0, 5), BARK, { at: [0.98, 0.45, 0], rot: [0, 0, -0.35] }),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.7, 5), BARK, { at: [-0.85, 0.3, 0] }),
    part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.38, -0.09), new THREE.Vector2(0, -0.18)])), PINK, { at: [-0.85, 0.64, 0] }),
    part(new THREE.CylinderGeometry(0.2, 0.16, 0.2, 10), '#c99a5a', { at: [-0.5, 0.06, 0] }),
  ]
  for (const [x, z] of [[-0.55, 0.04], [-0.45, -0.05], [-0.52, -0.08], [-0.42, 0.06]])
    parts.push(part(new THREE.SphereGeometry(0.07, 5, 3), BEAD, { at: [x, 0.2, z] }))
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(0.09, 6, 4), WHITE, { at: [0.78, 0.08, side * 0.4] }))
    parts.push(part(new THREE.SphereGeometry(0.045, 5, 3), INK, { at: [0.82, 0.07, side * 0.47] }))
  }
  return merge(parts)
}

export function netGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const span = 1.25
  for (const r of [0.35, 0.68, 1]) {
    const seg = 10
    for (let k = 0; k < seg; k++) {
      const a = -span + ((k + 0.5) / seg) * span * 2
      const len = (r * span * 2) / seg
      parts.push(part(new THREE.PlaneGeometry(len * 1.05, 0.03), PINK, { at: [Math.cos(a) * r, Math.sin(a) * r, 0], rot: [0, 0, a + Math.PI / 2] }))
    }
  }
  for (let k = 0; k <= 6; k++) {
    const a = -span + (k / 6) * span * 2
    parts.push(part(new THREE.PlaneGeometry(1, 0.025), PINK, { at: [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0], rot: [0, 0, a] }))
    parts.push(part(new THREE.CircleGeometry(0.05, 8), GOLD, { at: [Math.cos(a), Math.sin(a), 0.01] }))
  }
  const beads = [[0.5, 0.1], [0.62, -0.2], [0.8, 0.3], [0.42, -0.42], [0.75, -0.05], [0.55, 0.45], [0.9, -0.38]]
  for (const [x, y] of beads) parts.push(part(new THREE.CircleGeometry(0.075, 10), BEAD, { at: [x, y, 0.01] }))
  return merge(parts)
}

export function noteGeometry() {
  const parts = [
    part(new THREE.CircleGeometry(0.22, 12), WHITE, { size: [1.25, 0.9, 1], rot: [0, 0, 0.4] }),
    part(new THREE.PlaneGeometry(0.06, 0.8), WHITE, { at: [0.24, 0.4, 0] }),
    part(new THREE.PlaneGeometry(0.3, 0.1), WHITE, { at: [0.36, 0.72, 0], rot: [0, 0, -0.5] }),
  ]
  return merge(parts)
}

export function zedGeometry() {
  const s = new THREE.Shape([
    new THREE.Vector2(-0.4, 0.4), new THREE.Vector2(0.4, 0.4), new THREE.Vector2(0.4, 0.27), new THREE.Vector2(-0.18, -0.27),
    new THREE.Vector2(0.4, -0.27), new THREE.Vector2(0.4, -0.4), new THREE.Vector2(-0.4, -0.4), new THREE.Vector2(-0.4, -0.27),
    new THREE.Vector2(0.18, 0.27), new THREE.Vector2(-0.4, 0.27),
  ])
  return part(new THREE.ShapeGeometry(s), WHITE)
}

export function raftGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let k = 0; k < 6; k++)
    parts.push(part(new THREE.BoxGeometry(2.7, 0.12, 0.3), k % 2 ? WOOD : '#b47a48', { at: [0, 0, -0.8 + k * 0.32] }))
  for (const x of [-1.1, 1.1]) parts.push(part(new THREE.BoxGeometry(0.12, 0.1, 2), BARK, { at: [x, -0.08, 0] }))
  for (const [x, z] of [[-1.25, -0.85], [1.25, -0.85], [-1.25, 0.85], [1.25, 0.85]])
    parts.push(part(new THREE.CylinderGeometry(0.03, 0.035, 1.3, 5), BARK, { at: [x, 0.65, z] }))
  parts.push(part(new THREE.TorusGeometry(0.13, 0.045, 6, 14), GOLD, { at: [0.55, 0.2, -0.12] }))
  parts.push(part(new THREE.ConeGeometry(0.13, 0.3, 10, 1, true), GOLD, { at: [0.72, 0.4, -0.12], rot: [0, 0, -0.5] }))
  parts.push(part(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 12), '#d8344f', { at: [-0.35, 0.16, -0.2] }))
  parts.push(part(new THREE.CylinderGeometry(0.175, 0.175, 0.02, 12), STONE, { at: [-0.35, 0.27, -0.2] }))
  return merge(parts)
}

export function accordionGeometry() {
  const parts = [
    part(new THREE.BoxGeometry(0.4, 0.3, 0.12), TEAL, { at: [-0.32, 0, 0] }),
    part(new THREE.BoxGeometry(0.4, 0.3, 0.12), TEAL, { at: [0.32, 0, 0] }),
  ]
  for (let k = 0; k < 4; k++) parts.push(part(new THREE.BoxGeometry(0.06, 0.3, 0.1), k % 2 ? PINK : STONE, { at: [-0.09 + k * 0.06, 0, 0] }))
  return merge(parts)
}

export function shackGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (const [x, z] of [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6], [-2.2, 0.15], [-3.4, 0.15]])
    parts.push(part(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 5), BARK, { at: [x, 0.0, z] }))
  parts.push(part(new THREE.BoxGeometry(2.2, 0.12, 1.6), WOOD, { at: [0, 0.3, 0] }))
  parts.push(part(new THREE.BoxGeometry(2.6, 0.08, 0.5), '#b47a48', { at: [-2.5, 0.28, 0.2] }))
  parts.push(part(new THREE.BoxGeometry(1.3, 0.95, 1.0), STONE, { at: [0.2, 0.84, -0.15] }))
  parts.push(part(new THREE.ConeGeometry(1.36, 0.06, 4), INK, { at: [0.2, 1.32, -0.15], size: [1, 1, 0.8] }))
  parts.push(part(new THREE.ConeGeometry(1.3, 0.8, 4), '#139f8e', { at: [0.2, 1.74, -0.15], size: [1, 1, 0.8] }))
  parts.push(part(new THREE.SphereGeometry(0.1, 8, 6), MINT, { at: [0.2, 2.14, -0.15] }))
  parts.push(part(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 4), INK, { at: [0.2, 2.3, -0.15] }))
  parts.push(part(new THREE.SphereGeometry(0.11, 8, 6), '#ffb347', { at: [0.2, 2.5, -0.15], size: [1, 1.25, 1] }))
  parts.push(part(new THREE.BoxGeometry(0.3, 0.5, 0.03), INK, { at: [0.2, 0.6, 0.36] }))
  parts.push(part(new THREE.BoxGeometry(0.26, 0.22, 0.03), '#ffd36b', { at: [0.62, 0.95, 0.36] }))
  for (const x of [-0.95, 0.95]) parts.push(part(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 5), BARK, { at: [x, 0.95, 0.6] }))
  parts.push(part(new THREE.CylinderGeometry(0.012, 0.012, 1.9, 4), INK, { at: [0, 1.58, 0.6], rot: [0, 0, Math.PI / 2] }))
  for (let k = 0; k < 5; k++)
    parts.push(part(new THREE.SphereGeometry(0.14, 8, 6), k % 2 ? '#f6e3c6' : '#fde9f2', { at: [-0.76 + k * 0.38, 1.4, 0.6], size: [1, 1.25, 1] }))
  eyes(parts, 1.0, 0.36, 0.22, 0.13)
  return merge(parts)
}

export function postGeometry() {
  return merge([
    part(new THREE.CylinderGeometry(0.06, 0.08, 1, 5), BARK, { at: [0, 0.5, 0] }),
    part(new THREE.SphereGeometry(0.1, 6, 5), PINK, { at: [0, 1.02, 0] }),
  ])
}

export function rippleGeometry() {
  const g = new THREE.RingGeometry(0.94, 1, 40, 2)
  const pos = g.getAttribute('position')
  const rgb = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    const t = (Math.hypot(pos.getX(i), pos.getY(i)) - 0.94) / 0.06
    rgb.fill(Math.sin(t * Math.PI) ** 2, i * 3, i * 3 + 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}
