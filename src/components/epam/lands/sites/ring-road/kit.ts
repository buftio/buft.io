import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export const C = {
  stone: '#f3ebf4',
  wall: '#dccbe4',
  teal: '#16b3a0',
  mint: '#7dffe6',
  ink: '#2a1630',
  white: '#ffffff',
  folk: '#4a33a6',
  road: '#cf7c4c',
  crown: '#dc9160',
  dust: '#f4cfa0',
  rut: '#94502e',
  wood: '#8a5236',
  plank: '#c58a5a',
  canvas: '#fff3dc',
  lard: '#fffaf0',
  band: '#ffb33a',
  red: '#e8404f',
  roof: '#c8563c',
  glow: '#ffb347',
}

export const SIN = Math.sin(PITCH.x)
export const TILT = new THREE.Quaternion().setFromEuler(PITCH)

export function rand(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (shape !== g) shape.dispose()
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

export function place(o: THREE.Object3D, dx: number, dy: number, s: number, turn = 0, lift = 0) {
  o.position.set(dx, -dy, 0)
  o.quaternion.setFromAxisAngle(yAxis, turn).premultiply(TILT)
  o.scale.setScalar(s)
  if (lift) o.translateY(lift / s)
  o.updateMatrix()
}

export function heading(dx: number, dy: number) {
  const t = Math.atan2(-dy / SIN, dx)
  if (Math.cos(t) >= 0) return t * 0.6
  return Math.PI + (t > 0 ? t - Math.PI : t + Math.PI) * 0.6
}

export function eyes(p: THREE.BufferGeometry[], y: number, z: number, gap: number, r: number, x = 0) {
  for (const side of [-1, 1]) {
    const big = r > 15
    p.push(part(new THREE.SphereGeometry(r, big ? 18 : 7, big ? 12 : 5), C.white, x + side * gap, y, z))
    p.push(part(new THREE.SphereGeometry(r * 0.5, big ? 12 : 5, big ? 8 : 3), C.ink, x + side * gap * 0.93, y - r * (big ? 0.08 : 0.3), z + r * (big ? 0.86 : 0.8)))
  }
}

export function folk(p: THREE.BufferGeometry[], x: number, y: number, z: number, s: number, body = C.folk) {
  p.push(part(new THREE.SphereGeometry(s, 8, 6).scale(1, 1.1, 1), body, x, y + s * 1.1, z))
  eyes(p, y + s * 1.35, z + s * 0.72, s * 0.36, s * 0.33, x)
}

export type Pt = { x: number; y: number; dx: number; dy: number }

export function path(points: [number, number][]) {
  const segs: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    segs.push(segs[i - 1] + Math.hypot(bx - ax, by - ay))
  }
  const length = segs[segs.length - 1]
  const at = (s: number, out: Pt) => {
    let i = 1
    while (i < segs.length - 1 && segs[i] < s) i++
    const [ax, ay] = points[i - 1]
    const [bx, by] = points[i]
    const k = Math.min(1, Math.max(0, (s - segs[i - 1]) / (segs[i] - segs[i - 1] || 1)))
    out.x = ax + (bx - ax) * k
    out.y = ay + (by - ay) * k
    const l = Math.hypot(bx - ax, by - ay) || 1
    out.dx = (bx - ax) / l
    out.dy = (by - ay) / l
    return out
  }
  return { length, at }
}

export function smooth(points: [number, number][], n = 8): [number, number][] {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)))
  return curve.getSpacedPoints(points.length * n).map((p) => [p.x, p.y])
}

export function glowDisc() {
  const g = new THREE.CircleGeometry(1, 32)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  rgb.set([1, 1, 1], 0)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}
