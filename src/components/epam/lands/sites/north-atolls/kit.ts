import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  stone: '#f3ebf4',
  wall: '#dccbe4',
  teal: '#16b3a0',
  mint: '#7dffe6',
  ink: '#2a1630',
  white: '#ffffff',
  folk: '#4a35a8',
  red: '#d42a45',
  deep: '#9c1530',
  blush: '#ff6f86',
  wood: '#a5714f',
  plank: '#c99a6e',
  sand: '#f6dcc8',
  gold: '#ffd36b',
  amber: '#ffb800',
  leaf: '#1fa58c',
}

const TILT = (50 * Math.PI) / 180
export const UP_Y = Math.cos(TILT)
export const UP_Z = Math.sin(TILT)
export const PITCH_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  g.rotateY(turn)
  g.translate(x, y, z)
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
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

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap = 0.14, r = 0.12) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 10, 7), C.white, side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 7, 5), C.ink, side * gap * 0.93, y - r * 0.3, z + r * 0.8))
  }
}

const m4 = new THREE.Matrix4()
const v3 = new THREE.Vector3()
const s3 = new THREE.Vector3()
const q4 = new THREE.Quaternion()
const yaw = new THREE.Quaternion()
const Y = new THREE.Vector3(0, 1, 0)

export function stood(model: THREE.BufferGeometry, dx: number, dy: number, size: number, turn = 0, h = 0) {
  yaw.setFromAxisAngle(Y, turn)
  q4.copy(PITCH_Q).multiply(yaw)
  model.applyMatrix4(m4.compose(lift(v3, dx, dy, h), q4, s3.set(size, size, size)))
  return model
}

export function lift(out: THREE.Vector3, dx: number, dy: number, h = 0) {
  return out.set(dx, -dy + h * UP_Y, h * UP_Z)
}

export function standQ(out: THREE.Quaternion, turn: number, roll = 0) {
  yaw.setFromAxisAngle(Y, turn)
  out.copy(PITCH_Q).multiply(yaw)
  if (roll) out.multiply(q4.setFromAxisAngle(v3.set(1, 0, 0), roll))
  return out
}

export function folkParts(parts: THREE.BufferGeometry[], x = 0, y = 0, z = 0, hat = C.teal) {
  parts.push(part(new THREE.SphereGeometry(0.5, 12, 8), C.folk, x, y + 0.5, z))
  parts.push(part(new THREE.ConeGeometry(0.36, 0.34, 8), hat, x, y + 1.05, z))
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(0.17, 8, 6), C.white, x + side * 0.17, y + 0.62, z + 0.38))
    parts.push(part(new THREE.SphereGeometry(0.085, 6, 4), C.ink, x + side * 0.16, y + 0.58, z + 0.52))
  }
}

export function flat(pts: [number, number][], colors: [number, number, number, number][], z: number) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(([x, y]) => [x, -y, z]), 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors.flat(), 4))
  return g
}

export function rgba(hex: string, a: number): [number, number, number, number] {
  const c = new THREE.Color(hex)
  return [c.r, c.g, c.b, a]
}
