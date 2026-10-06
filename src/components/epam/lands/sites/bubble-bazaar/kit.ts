import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))
export const UP = new THREE.Vector3(0, 1, 0).applyQuaternion(TILT)
export const INK = '#2a1630'
export const CREAM = '#fff4e6'
export const CORAL = '#ff6f61'
export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const BUTTER = '#ffd36b'
export const LILAC = '#b98cff'
export const BERRY = '#e8457a'

export type Mood = { t: number; zoom: number }

export const boost = (zoom: number) => Math.min(1, Math.max(0, (0.14 - zoom) / 0.06))

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0, tip = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (shape !== g) shape.dispose()
  g.rotateX(tip)
  g.rotateY(turn)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const rgb = [c.r, c.g, c.b]
  const n = g.getAttribute('position').count
  g.setAttribute('color', new THREE.BufferAttribute(Float32Array.from({ length: n * 3 }, (_, i) => rgb[i % 3]), 3))
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, r = 0.12, gap = 0.14, seg = 7) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, seg, seg - 2), '#ffffff', side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 5, 3), INK, side * gap * 0.93, y - r * 0.3, z + r * 0.8))
  }
}

const yaw = new THREE.Quaternion()
const AXIS = new THREE.Vector3(0, 1, 0)
const off = new THREE.Vector3()
const turned = new THREE.Quaternion()
const at = new THREE.Vector3()
const size = new THREE.Vector3()

export function lift(out: THREE.Vector3, dx: number, dy: number, mx: number, my: number, mz: number) {
  off.set(mx, my, mz).applyQuaternion(TILT)
  return out.set(dx + off.x, -dy + off.y, off.z)
}

export function pose(out: THREE.Matrix4, dx: number, dy: number, h: number, s: number, turn = 0, sy = 1, mz = 0) {
  lift(at, dx, dy, 0, h, mz)
  turned.copy(TILT).multiply(yaw.setFromAxisAngle(AXIS, turn))
  return out.compose(at, turned, size.set(s / Math.sqrt(sy), s * sy, s / Math.sqrt(sy)))
}

export const hash = (k: number) => {
  const v = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return v - Math.floor(v)
}

export const kickAt = (t: number) => {
  const u = t % 5.3
  return u > 4.4 ? Math.sin(((u - 4.4) / 0.9) * Math.PI) : 0
}
