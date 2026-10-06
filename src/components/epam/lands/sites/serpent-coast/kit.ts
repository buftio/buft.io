import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const TILT = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))
export const UP = new THREE.Vector3(0, 1, 0)

const m4 = new THREE.Matrix4()
const q4 = new THREE.Quaternion()
const e4 = new THREE.Euler()
const v4 = new THREE.Vector3()
const s4 = new THREE.Vector3()

export function at(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  return m4.compose(v4.set(x, y, z), q4.setFromEuler(e4.set(rx, ry, rz)), s4.set(sx, sy, sz)).clone()
}

export function stand(dx: number, dy: number, size: number, turn = 0, lift = 0) {
  q4.setFromAxisAngle(UP, turn).premultiply(TILT)
  return m4.compose(v4.set(dx, -dy, lift), q4, s4.set(size, size, size)).clone()
}

export function paint(shape: THREE.BufferGeometry, color: string | [string, string], place?: THREE.Matrix4) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  if (!g.getAttribute('normal')) g.computeVertexNormals()
  const pos = g.getAttribute('position')
  const [lo, hi] = typeof color === 'string' ? [color, color] : color
  const a = new THREE.Color(lo)
  const b = new THREE.Color(hi)
  g.computeBoundingBox()
  const box = g.boundingBox as THREE.Box3
  const span = Math.max(1e-6, box.max.y - box.min.y)
  const c = new THREE.Color()
  const out = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    c.copy(a).lerp(b, (pos.getY(i) - box.min.y) / span)
    out.set([c.r, c.g, c.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(out, 3))
  if (place) g.applyMatrix4(place)
  return g
}

export function merge(parts: THREE.BufferGeometry[], place?: THREE.Matrix4) {
  const g = mergeGeometries(parts) as THREE.BufferGeometry
  parts.forEach((p) => p.dispose())
  if (place) g.applyMatrix4(place)
  return g
}

export type Track = { x: Float32Array; y: Float32Array; len: number; n: number }

export function track(points: [number, number][], closed = false, n = 256): Track {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, -y, 0)),
    closed,
    'centripetal',
  )
  const pts = curve.getSpacedPoints(n)
  return {
    x: Float32Array.from(pts, (p) => p.x),
    y: Float32Array.from(pts, (p) => p.y),
    len: curve.getLength(),
    n,
  }
}

export function sample(t: Track, u: number, out: THREE.Vector3, dir?: THREE.Vector3) {
  const f = Math.min(0.99999, Math.max(0, u)) * t.n
  const i = Math.floor(f)
  const k = f - i
  out.set(t.x[i] + (t.x[i + 1] - t.x[i]) * k, t.y[i] + (t.y[i + 1] - t.y[i]) * k, out.z)
  if (dir) dir.set(t.x[i + 1] - t.x[i], t.y[i + 1] - t.y[i], 0).normalize()
  return out
}

export const wrap = (u: number) => u - Math.floor(u)
export const ease = (a: number) => a * a * (3 - 2 * a)
export const clamp01 = (a: number) => Math.min(1, Math.max(0, a))
