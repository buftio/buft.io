import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  cloud: '#fdfbff',
  lilac: '#bfb8ee',
  whale: '#7f9ef5',
  belly: '#fff1e2',
  cheek: '#ff9fb2',
  apricot: '#ff9a6e',
  peach: '#ffd9bf',
  blush: '#ffd3cf',
  sky: '#bfe4ff',
  coral: '#ff7d6b',
  cream: '#fff4dc',
  mint: '#7dffe6',
  teal: '#16b3a0',
  brass: '#e0a93a',
  gold: '#ffd36b',
  wood: '#b07a52',
  plank: '#d8ad80',
  stone: '#f3ebf4',
  wall: '#dccbe4',
  ink: '#2a1630',
  white: '#ffffff',
  folk: '#5340b2',
}

const TILT = (50 * Math.PI) / 180
export const UP_Y = Math.cos(TILT)
export const UP_Z = Math.sin(TILT)
const PITCH_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))

const tint = new THREE.Color()
const tint2 = new THREE.Color()

export function paint(shape: THREE.BufferGeometry, fn: (x: number, y: number, z: number, out: THREE.Color) => void) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  const pos = g.getAttribute('position')
  const col = new Float32Array(pos.count * 3)
  for (let i = 0; i < pos.count; i++) {
    fn(pos.getX(i), pos.getY(i), pos.getZ(i), tint)
    col.set([tint.r, tint.g, tint.b], i * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return g
}

export function fade(a: string, b: string, t: number, out: THREE.Color) {
  out.set(a).lerp(tint2.set(b), Math.min(1, Math.max(0, t)))
}

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0) {
  const g = paint(shape, (_x, _y, _z, out) => out.set(color))
  g.rotateY(turn)
  g.translate(x, y, z)
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}

export function eye(parts: THREE.BufferGeometry[], x: number, y: number, z: number, r: number, face = 0, fine = 8) {
  const w = part(new THREE.SphereGeometry(r, fine, Math.ceil(fine * 0.7)), C.white)
  const p = part(new THREE.SphereGeometry(r * 0.5, 6, 4), C.ink, 0, -r * 0.3, r * 0.75)
  for (const g of [w, p]) {
    g.rotateY(face)
    g.translate(x, y, z)
    parts.push(g)
  }
}

export function eyes(parts: THREE.BufferGeometry[], x: number, y: number, z: number, gap: number, r: number, face = 0) {
  for (const side of [-1, 1]) eye(parts, x + Math.cos(face) * side * gap, y, z - Math.sin(face) * side * gap, r, face)
}

export function unlift(v: THREE.Vector3): [number, number, number] {
  const h = v.z / UP_Z
  return [v.x, h * UP_Y - v.y, h]
}

export function folk(parts: THREE.BufferGeometry[], x: number, y: number, z: number, s: number, cap = C.teal, face = 0) {
  const own: THREE.BufferGeometry[] = []
  own.push(part(new THREE.SphereGeometry(0.5, 10, 7), C.folk, 0, 0.5, 0))
  own.push(part(new THREE.SphereGeometry(0.42, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2.4), cap, 0, 0.72, -0.04))
  own.push(part(new THREE.TorusGeometry(0.11, 0.035, 3, 8), C.gold, -0.15, 0.93, 0.33))
  own.push(part(new THREE.TorusGeometry(0.11, 0.035, 3, 8), C.gold, 0.15, 0.93, 0.33))
  eyes(own, 0, 0.6, 0.38, 0.16, 0.16)
  for (const g of own) {
    g.rotateY(face)
    g.scale(s, s, s)
    g.translate(x, y, z)
    parts.push(g)
  }
}

const m4 = new THREE.Matrix4()
const v3 = new THREE.Vector3()
const s3 = new THREE.Vector3()
const q4 = new THREE.Quaternion()
const yaw = new THREE.Quaternion()
const roll = new THREE.Quaternion()
const Y = new THREE.Vector3(0, 1, 0)
const X = new THREE.Vector3(1, 0, 0)
const Z = new THREE.Vector3(0, 0, 1)

export function lift(out: THREE.Vector3, dx: number, dy: number, h = 0) {
  return out.set(dx, -dy + h * UP_Y, h * UP_Z)
}

export function heading(vx: number, vy: number) {
  return Math.atan2(-vy / UP_Z, vx)
}

export function pose(dx: number, dy: number, h: number, size: number, turn = 0, bank = 0, nod = 0, sx = 1, sy = 1, sz = 1) {
  yaw.setFromAxisAngle(Y, turn)
  q4.copy(PITCH_Q).multiply(yaw)
  if (bank) q4.multiply(roll.setFromAxisAngle(X, bank))
  if (nod) q4.multiply(roll.setFromAxisAngle(Z, nod))
  return m4.compose(lift(v3, dx, dy, h), q4, s3.set(size * sx, size * sy, size * sz))
}

export function flatAt(dx: number, dy: number, z: number, sx: number, sy: number) {
  q4.identity()
  return m4.compose(v3.set(dx, -dy, z), q4, s3.set(sx, sy, 1))
}

export function stood(model: THREE.BufferGeometry, dx: number, dy: number, size: number, turn = 0, h = 0) {
  model.applyMatrix4(pose(dx, dy, h, size, turn))
  return model
}

export function hash(k: number) {
  const s = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
