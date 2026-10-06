import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const ANGLE = (50 * Math.PI) / 180
export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler(ANGLE, 0, 0))
export const UP_Y = Math.cos(ANGLE)
export const UP_Z = Math.sin(ANGLE)

export const INK = '#2a1630'
export const WHITE = '#ffffff'
export const STONE = '#f3ebf4'
export const WALL = '#dccbe4'
export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const GOLD = '#ffd36b'
export const RIND = '#e0a93a'
export const CORAL = '#e8664a'
export const CLAY = '#c9503c'
export const FOLK = '#4a34a3'

export type V3 = [number, number, number]

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function paint(g: THREE.BufferGeometry, color: string) {
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function part(shape: THREE.BufferGeometry, color: string, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], size: V3 = [1, 1, 1]) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  g.scale(size[0], size[1], size[2])
  g.rotateX(rot[0])
  g.rotateY(rot[1])
  g.rotateZ(rot[2])
  g.translate(at[0], at[1], at[2])
  return paint(g, color)
}

export function merged(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function eyes(parts: THREE.BufferGeometry[], gap: number, y: number, z: number, r: number, look: [number, number] = [0, -0.35], seg = 10) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.CircleGeometry(r, seg), WHITE, [side * gap, y, z]))
    parts.push(part(new THREE.CircleGeometry(r * 0.5, seg - 2), INK, [side * gap + look[0] * r, y + look[1] * r, z + r * 0.05]))
  }
}

const q = new THREE.Quaternion()
const e = new THREE.Euler()
const p = new THREE.Vector3()
const s = new THREE.Vector3()

export function stand(m: THREE.Matrix4, dx: number, dy: number, z: number, sx: number, sy = sx, sz = sx, turn = 0, lean = 0) {
  q.setFromEuler(e.set(0, turn, lean)).premultiply(TILT)
  return m.compose(p.set(dx, -dy, z), q, s.set(sx, sy, sz))
}

export function lift(out: THREE.Vector3, dx: number, dy: number, h: number) {
  return out.set(dx, -dy + h * UP_Y, h * UP_Z)
}
