import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export const C = {
  ink: '#2a1630',
  white: '#ffffff',
  stone: '#f3ebf4',
  wall: '#dccbe4',
  teal: '#16b3a0',
  mint: '#7dffe6',
  navy: '#1d4a6b',
  sail: '#fffaf0',
  sand: '#f2d9a0',
  thatch: '#e3b862',
  leaf: '#2cbf6e',
  leaf2: '#1f9a5a',
  trunk: '#9b6a42',
  wood: '#c08a55',
  coral: '#ff6b5e',
  gold: '#ffd36b',
  rind: '#e0a93a',
  folk: '#4b35a8',
  case: '#8a4f2a',
}

export const LAMP = 220

const TILT = new THREE.Matrix4().makeRotationFromEuler(PITCH)

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, ry = 0, rz = 0, rx = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (rx) g.rotateX(rx)
  if (rz) g.rotateZ(rz)
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

export function merged(parts: THREE.BufferGeometry[]) {
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return shape
}

export function bake(g: THREE.BufferGeometry, dx: number, dy: number, s = 1, turn = 0) {
  g.scale(s, s, s)
  g.rotateY(turn)
  g.applyMatrix4(TILT)
  g.translate(dx, -dy, 0)
  return g
}

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, gap = 5, r = 4.5, x = 0) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, 6, 4), C.white, x + side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, 4, 3), C.ink, x + side * gap * 0.9, y - r * 0.3, z + r * 0.75))
  }
}

export function folk(parts: THREE.BufferGeometry[], x = 0, y = 0, z = 0, hat = C.teal, r = 15) {
  parts.push(part(new THREE.SphereGeometry(r, 8, 6), C.folk, x, y + r, z))
  eyes(parts, y + r * 1.15, z + r * 0.8, r * 0.36, r * 0.32, x)
  if (hat) parts.push(part(new THREE.CylinderGeometry(r * 0.55, r * 0.75, r * 0.5, 7), hat, x, y + r * 2, z))
}

export function palm(parts: THREE.BufferGeometry[], x: number, z: number, h: number, lean: number) {
  const seg = 3
  let px = x
  let py = 0
  for (let k = 0; k < seg; k++) {
    const a = lean * (k + 1) * 0.35
    const l = h / seg
    parts.push(part(new THREE.CylinderGeometry(3.2, 4.2, l, 5), C.trunk, px + Math.sin(a) * l * 0.5, py + Math.cos(a) * l * 0.5, z, 0, -a))
    px += Math.sin(a) * l
    py += Math.cos(a) * l
  }
  for (let k = 0; k < 5; k++) {
    const t = (k / 5) * Math.PI * 2 + lean
    const leaf = new THREE.ConeGeometry(7, 40, 3)
    leaf.scale(1, 1, 0.35)
    leaf.translate(0, 20, 0)
    leaf.rotateZ(-1.95)
    parts.push(part(leaf, k % 2 ? C.leaf : C.leaf2, px, py, z, t))
  }
  parts.push(part(new THREE.IcosahedronGeometry(4, 0), C.trunk, px + 3, py - 4, z + 3))
}

export function hut(parts: THREE.BufferGeometry[], x: number, z: number, s = 1, roof = C.thatch) {
  parts.push(part(new THREE.CylinderGeometry(22 * s, 24 * s, 26 * s, 8), C.stone, x, 13 * s, z))
  parts.push(part(new THREE.ConeGeometry(34 * s, 30 * s, 8), roof, x, 40 * s, z))
  parts.push(part(new THREE.BoxGeometry(10 * s, 15 * s, 2), C.ink, x, 7.5 * s, z + 23 * s))
  eyes(parts, 19 * s, z + 21 * s, 9 * s, 3.6 * s, x)
}

export function barrel(parts: THREE.BufferGeometry[], x: number, y: number, z: number, s = 1) {
  parts.push(part(new THREE.CylinderGeometry(8 * s, 8 * s, 16 * s, 8), C.gold, x, y + 8 * s, z))
  parts.push(part(new THREE.CylinderGeometry(8.6 * s, 8.6 * s, 2.4 * s, 8), C.rind, x, y + 4 * s, z))
  parts.push(part(new THREE.CylinderGeometry(8.6 * s, 8.6 * s, 2.4 * s, 8), C.rind, x, y + 12 * s, z))
}

export function umbrella(parts: THREE.BufferGeometry[], x: number, z: number, color: string) {
  parts.push(part(new THREE.CylinderGeometry(1.4, 1.4, 44, 4), C.stone, x, 22, z))
  parts.push(part(new THREE.ConeGeometry(28, 12, 8), color, x, 44, z))
}

export function lighthouse() {
  const parts: THREE.BufferGeometry[] = []
  parts.push(part(new THREE.CylinderGeometry(52, 60, 22, 9), C.wall, 0, 11, 0))
  const bands = 5
  for (let k = 0; k < bands; k++) {
    const r0 = 34 - k * 3.6
    parts.push(part(new THREE.CylinderGeometry(r0 - 3.6, r0, 36, 12), k % 2 ? C.teal : C.white, 0, 22 + 18 + k * 36, 0))
  }
  const top = 22 + bands * 36
  parts.push(part(new THREE.CylinderGeometry(27, 27, 6, 12), C.ink, 0, top + 3, 0))
  parts.push(part(new THREE.CylinderGeometry(15, 15, 6, 10), C.ink, 0, top + 34, 0))
  parts.push(part(new THREE.ConeGeometry(21, 26, 10), C.coral, 0, top + 50, 0))
  parts.push(part(new THREE.SphereGeometry(4, 6, 4), C.gold, 0, top + 65, 0))
  parts.push(part(new THREE.BoxGeometry(14, 22, 2), C.ink, 0, 11 + 22, 32))
  eyes(parts, 22 + 36 * 2.4, 27, 10, 7)
  return merged(parts)
}

export function boat() {
  const parts: THREE.BufferGeometry[] = []
  const side = new THREE.Shape([
    new THREE.Vector2(-78, 34),
    new THREE.Vector2(92, 40),
    new THREE.Vector2(62, 12),
    new THREE.Vector2(-52, 10),
    new THREE.Vector2(-70, 20),
  ])
  const hull = new THREE.ExtrudeGeometry(side, { depth: 38, bevelEnabled: false })
  hull.translate(0, 0, -19)
  parts.push(part(hull, C.navy))
  const band = new THREE.Shape([
    new THREE.Vector2(-77, 30),
    new THREE.Vector2(88, 36),
    new THREE.Vector2(84, 31),
    new THREE.Vector2(-75, 26),
  ])
  const stripe = new THREE.ExtrudeGeometry(band, { depth: 39.5, bevelEnabled: false })
  stripe.translate(0, 0, -19.75)
  parts.push(part(stripe, C.white))
  parts.push(part(new THREE.BoxGeometry(150, 3, 34), C.wood, 4, 36, 0))
  parts.push(part(new THREE.CylinderGeometry(2.2, 2.6, 140, 5), C.trunk, 8, 104, 0))
  const main = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(4, 168), new THREE.Vector2(4, 46), new THREE.Vector2(-66, 46)]))
  parts.push(part(main, C.sail, 0, 0, 0))
  const mark = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(4, 120), new THREE.Vector2(4, 100), new THREE.Vector2(-28, 94), new THREE.Vector2(-34, 82)]))
  parts.push(part(mark, C.teal, 0, 0, 0.6))
  const jib = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(13, 160), new THREE.Vector2(13, 46), new THREE.Vector2(76, 44)]))
  parts.push(part(jib, C.sail, 0, 0, 0))
  const flag = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(8, 176), new THREE.Vector2(36, 170), new THREE.Vector2(8, 164)]))
  parts.push(part(flag, C.coral))
  parts.push(part(new THREE.TorusGeometry(7, 2.6, 4, 10), C.coral, -46, 22, 20))
  barrel(parts, -50, 38, -4)
  barrel(parts, -32, 38, 6)
  folk(parts, 42, 37, 4, '', 11)
  folk(parts, 62, 37, -3, C.coral, 10)
  return merged(parts)
}

export function hands(head: boolean) {
  const parts: THREE.BufferGeometry[] = []
  for (const s of [-1, 1]) {
    parts.push(part(new THREE.CylinderGeometry(2.6, 2.6, 24, 4, 1, true), C.folk, s * 11, 18, 0, 0, -s * 0.38))
    parts.push(part(new THREE.OctahedronGeometry(6.5, 0), C.white, s * 15.5, 30, 0))
  }
  if (!head) parts.push(part(new THREE.CircleGeometry(17, 8), C.white, 0, 1, 0, 0, 0, -Math.PI / 2))
  if (head) {
    parts.push(part(new THREE.SphereGeometry(13, 6, 5), C.folk, 0, 4, 0))
    eyes(parts, 7, 10, 4.8, 4)
  }
  return merged(parts)
}

export function walker() {
  const parts: THREE.BufferGeometry[] = []
  for (const s of [-1, 1]) parts.push(part(new THREE.BoxGeometry(8, 4, 10), C.ink, s * 6, 2, 2))
  folk(parts, 0, 2, 0, C.teal, 14)
  return merged(parts)
}

export function gull() {
  const parts: THREE.BufferGeometry[] = []
  for (const s of [-1, 1]) {
    parts.push(part(new THREE.BoxGeometry(16, 2.5, 13), C.white, s * 8, 4, 0, 0, s * 0.55))
    parts.push(part(new THREE.BoxGeometry(14, 2.5, 9), C.white, s * 20.5, 7, -1, 0, -s * 0.3))
    parts.push(part(new THREE.BoxGeometry(5, 2.8, 8), C.ink, s * 27, 5.2, -1.5, 0, -s * 0.3))
  }
  parts.push(part(new THREE.SphereGeometry(4.5, 5, 4), C.white, 0, 0, 2))
  parts.push(part(new THREE.ConeGeometry(1.8, 6, 4), C.gold, 0, -1, 8, 0, 0, Math.PI / 2))
  return merged(parts)
}
