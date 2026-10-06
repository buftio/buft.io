import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  ink: '#2a1630',
  white: '#ffffff',
  teal: '#16b3a0',
  mint: '#7dffe6',
  bone: '#f6ecd2',
  ivory: '#fff8e6',
  shade: '#d9c7a0',
  sand: '#d9a75b',
  ochre: '#b9822f',
  terra: '#c4643a',
  rust: '#9b3b22',
  wood: '#8a5a33',
  bark: '#5a3620',
  body: '#4a36aa',
  lard: '#fff1c4',
  fat: '#ffd36b',
}

export type V3 = [number, number, number]
type Opt = { at?: V3; rot?: V3; size?: V3 }

const m4 = new THREE.Matrix4()
const qt = new THREE.Quaternion()
const eu = new THREE.Euler()
const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const tint = new THREE.Color()
const TILT = (50 * Math.PI) / 180

export function paint(g: THREE.BufferGeometry, color: string) {
  tint.set(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([tint.r, tint.g, tint.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function part(shape: THREE.BufferGeometry, color: string, { at = [0, 0, 0], rot = [0, 0, 0], size = [1, 1, 1] }: Opt = {}) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  if (g.getAttribute('normal')) g.deleteAttribute('normal')
  g.applyMatrix4(m4.compose(v1.set(...at), qt.setFromEuler(eu.set(...rot)), v2.set(...size)))
  return paint(g, color)
}

export function stripes(g: THREE.BufferGeometry, a: string, b: string, n: number) {
  const pos = g.getAttribute('position')
  const col = g.getAttribute('color')
  const ca = new THREE.Color(a)
  const cb = new THREE.Color(b)
  for (let i = 0; i < pos.count; i += 3) {
    const x = (pos.getX(i) + pos.getX(i + 1) + pos.getX(i + 2)) / 3
    const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3
    const k = Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * n) % 2
    for (let j = 0; j < 3; j++) col.setXYZ(i + j, ...((k ? ca : cb).toArray() as V3))
  }
  return g
}

export function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  g.computeVertexNormals()
  return g
}

export function placed(g: THREE.BufferGeometry, dx: number, dy: number, size: number, turn = 0) {
  g.applyMatrix4(m4.makeScale(size, size, size))
  g.applyMatrix4(m4.makeRotationY(turn))
  g.applyMatrix4(m4.makeRotationX(TILT))
  g.applyMatrix4(m4.makeTranslation(dx, -dy, 0))
  return g
}

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap: number, r: number) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 7, 5), C.white, { at: [side * gap, y, z] }))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 6, 4), C.ink, { at: [side * gap * 0.92, y - r * 0.25, z + r * 0.75] }))
  }
}

export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 31.7) * 43758.5453
  return x - Math.floor(x)
}
