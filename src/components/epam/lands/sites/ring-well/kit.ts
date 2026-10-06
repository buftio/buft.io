import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export const C = {
  stone: '#f3ebf4',
  wall: '#dccbe4',
  roof: '#16b3a0',
  flag: '#7dffe6',
  ink: '#2a1630',
  white: '#ffffff',
  gold: '#ffd36b',
  deep: '#ffb800',
  wood: '#8a5a44',
  folk: '#4a33a6',
}

export const TILT = new THREE.Quaternion().setFromEuler(PITCH)
export const UP = new THREE.Vector3(0, 1, 0).applyQuaternion(TILT)

export function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  g.rotateY(turn)
  g.translate(x, y, z)
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

const m4 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const v = new THREE.Vector3()
const s3 = new THREE.Vector3()

export function stand(g: THREE.BufferGeometry, dx: number, dy: number, s = 1, turn = 0) {
  q.setFromAxisAngle(yAxis, turn).premultiply(TILT)
  return g.applyMatrix4(m4.compose(v.set(dx, -dy, 0), q, s3.set(s, s, s)))
}

export function top(dx: number, dy: number, h: number): THREE.Vector3 {
  return new THREE.Vector3(dx, -dy, 0).addScaledVector(UP, h)
}

export function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = v.subVectors(b, a)
  const g = part(new THREE.CylinderGeometry(r, r, d.length(), 5, 1, true), color)
  q.setFromUnitVectors(yAxis, d.normalize())
  return g.applyMatrix4(m4.compose(s3.addVectors(a, b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)))
}

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap: number, r: number) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 7, 5), C.white, side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 5, 3), C.ink, side * gap * 0.93, y - r * 0.3, z + r * 0.8))
  }
}

export function glowDisc() {
  const g = new THREE.CircleGeometry(1, 40)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  rgb.set([1, 1, 1], 0)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function path(points: [number, number][]) {
  const segs: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    segs.push(segs[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const length = segs[segs.length - 1]
  const at = (s: number, out: { x: number; y: number; dx: number; dy: number }) => {
    let i = 1
    while (i < segs.length - 1 && segs[i] < s) i++
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const k = Math.min(1, Math.max(0, (s - segs[i - 1]) / (segs[i] - segs[i - 1] || 1)))
    out.x = ax + (bx - ax) * k
    out.y = ay + (by - ay) * k
    out.dx = bx - ax
    out.dy = by - ay
    return out
  }
  return { length, at }
}

export function glowRing(inner: number, outer: number) {
  const g = new THREE.RingGeometry(inner, outer, 96, 2)
  const pos = g.getAttribute('position')
  const rgba = new Float32Array(pos.count * 4)
  const mid = (inner + outer) / 2
  for (let i = 0; i < pos.count; i++) {
    const k = Math.max(0, 1 - Math.abs(Math.hypot(pos.getX(i), pos.getY(i)) - mid) / ((outer - inner) / 2 - 1e-3))
    rgba.set([1, 1, 1, Math.min(1, k * 1.6)], i * 4)
  }
  g.setAttribute('color', new THREE.BufferAttribute(rgba, 4))
  return g
}
