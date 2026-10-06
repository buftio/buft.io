import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export const C = {
  chalk: '#f7f3ec',
  stone: '#f3ebf4',
  wall: '#dccbe4',
  shade: '#b9a6c9',
  slate: '#26362f',
  ink: '#1c1528',
  wood: '#8a5a3c',
  oak: '#b07a4f',
  teal: '#16b3a0',
  mint: '#7dffe6',
  white: '#ffffff',
  folk: '#4a36a8',
  elder: '#5b3fb8',
  blob: '#3a2238',
  seam: '#c7b3c9',
  sick: '#8fa86a',
  red: '#e2475a',
  pink: '#ff9ec7',
  sun: '#ffe48a',
  sky: '#9fd8ff',
}

export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn = 0, tilt = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (shape.index) shape.dispose()
  if (tilt) g.rotateX(tilt)
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

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap = 0.14, r = 0.12, seg = 8) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, seg, seg - 2), C.white, side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, seg - 2, seg - 4), C.ink, side * gap * 0.93, y - r * 0.3, z + r * 0.8))
  }
}

const stand = new THREE.Matrix4()
const spin = new THREE.Matrix4()
const scale = new THREE.Matrix4()
const tip = new THREE.Matrix4()
export const UPRIGHT = (28 * Math.PI) / 180

export function stood(g: THREE.BufferGeometry, dx: number, dy: number, size: number, turn = 0, tilt = PITCH.x) {
  stand.makeTranslation(dx, -dy, 0).multiply(tip.makeRotationX(tilt)).multiply(scale.makeScale(size, size, size)).multiply(spin.makeRotationY(turn))
  g.applyMatrix4(stand)
  return g
}

export function flat(shape: THREE.BufferGeometry, color: string, dx: number, dy: number, lift = 2, turn = 0) {
  const g = part(shape, color)
  g.rotateZ(turn)
  g.translate(dx, -dy, lift)
  return g
}
