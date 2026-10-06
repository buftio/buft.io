import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  brick: '#b8543a',
  brickD: '#8c3a2b',
  char: '#3b2632',
  brass: '#e0a93a',
  gold: '#ffd36b',
  rind: '#b9782a',
  wood: '#7a4128',
  woodD: '#4d2719',
  cream: '#f3ebf4',
  copper: '#d9692e',
  ember: '#ff7a2a',
  flame: '#ffd36b',
  bead: '#d8352a',
  beadD: '#9a1d1b',
  folk: '#4b36a8',
  teal: '#16b3a0',
  mint: '#7dffe6',
  ink: '#2a1630',
  white: '#ffffff',
  hemp: '#e9cf95',
  smoke: '#d9cbdc',
  red: '#e23a2a',
}

type Turn = [number, number, number]

export function part(shape: THREE.BufferGeometry, color: string, x = 0, y = 0, z = 0, turn: Turn = [0, 0, 0], scale?: Turn) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (shape.index) shape.dispose()
  if (scale) g.scale(...scale)
  g.rotateX(turn[0])
  g.rotateY(turn[1])
  g.rotateZ(turn[2])
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

export function eyes(parts: THREE.BufferGeometry[], y: number, z: number, r: number, gap: number, x = 0, lo = false) {
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.SphereGeometry(r, lo ? 7 : 10, lo ? 5 : 8), C.white, x + side * gap, y, z))
    parts.push(part(new THREE.SphereGeometry(r * 0.5, lo ? 5 : 8, lo ? 4 : 6), C.ink, x + side * gap * 0.92, y - r * 0.3, z + r * 0.82))
  }
}

const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d)
const cyl = (a: number, b: number, h: number, n = 10) => new THREE.CylinderGeometry(a, b, h, n)
const FACE: Turn = [Math.PI / 2, 0, 0]

export function folkGeometry() {
  const parts = [part(new THREE.SphereGeometry(15, 12, 9), C.folk, 0, 16, 0)]
  for (const side of [-1, 1]) parts.push(part(new THREE.SphereGeometry(5, 6, 5), C.ink, side * 7, 3, 3))
  eyes(parts, 20, 10, 5.5, 6)
  return merged(parts)
}

export function hatGeometry() {
  return merged([part(cyl(11, 11, 2, 12), C.white, 0, 0, 0), part(cyl(7, 8, 10, 12), C.white, 0, 6, 0)])
}

export function bargeGeometry() {
  const parts = [
    part(box(38, 18, 60), C.wood, 0, 9, 0),
    part(new THREE.CylinderGeometry(19, 16, 18, 10, 1, false, Math.PI / 2, Math.PI), C.wood, 0, 9, -30),
    part(box(40, 3, 62), C.brass, 0, 19, 0),
    part(box(30, 4, 50), C.woodD, 0, 20, -2),
    part(new THREE.TorusGeometry(12, 5.5, 7, 14), C.bead, 0, 36, -8),
    part(cyl(8, 8, 3, 12), C.beadD, 0, 36, -8, FACE),
    part(cyl(3.5, 4.5, 22, 8), C.char, 13, 32, -22),
    part(cyl(5.5, 4, 4, 8), C.char, 13, 44, -22),
    part(new THREE.SphereGeometry(9, 9, 7), C.folk, -8, 30, 18),
    part(cyl(8, 8, 1.5, 10), C.teal, -8, 38, 18),
    part(cyl(5, 6, 6, 10), C.teal, -8, 41, 18),
    part(box(3, 22, 3), C.woodD, 8, 26, 26, [0.5, 0, 0]),
    part(box(9, 9, 9), C.ember, 12, 26, 27),
  ]
  eyes(parts, 10, 31, 4.5, 8, 0, true)
  eyes(parts, 32, 24, 3.2, 3.6, -8, true)
  return merged(parts)
}

export function campGeometry() {
  const parts: THREE.BufferGeometry[] = []
  for (let k = 0; k < 9; k++) {
    const a = (k / 9) * Math.PI * 2
    parts.push(part(new THREE.DodecahedronGeometry(6.5, 0), C.char, Math.cos(a) * 24, 4, Math.sin(a) * 24))
  }
  parts.push(part(box(40, 6, 6), C.wood, 0, 4, 0, [0, 0.6, 0]))
  parts.push(part(box(40, 6, 6), C.woodD, 0, 5, 0, [0, -0.6, 0]))
  for (const side of [-1, 1]) {
    const len = 52
    parts.push(part(cyl(1.4, 1.4, len, 5), C.woodD, side * 24, 30, 6, [0, 0, side * 1.05]))
    parts.push(part(new THREE.SphereGeometry(7, 8, 6), C.gold, side * 3, 42, 6))
  }
  parts.push(part(box(26, 18, 20), C.wood, 70, 9, -24, [0, 0.4, 0]))
  parts.push(part(new THREE.TorusGeometry(6, 2.6, 5, 10), C.bead, 66, 24, -18))
  parts.push(part(new THREE.TorusGeometry(6, 2.6, 5, 10), C.bead, 78, 22, -22, [0, 0, 0.7]))
  parts.push(part(new THREE.CylinderGeometry(30, 30, 64, 3), C.cream, -10, 15, -64, [-Math.PI / 2, 0, 0]))
  parts.push(part(new THREE.CylinderGeometry(31, 31, 10, 3), C.copper, -10, 15.5, -36, [-Math.PI / 2, 0, 0]))
  parts.push(part(new THREE.ConeGeometry(10, 22, 3), C.ink, -10, 10, -30))
  parts.push(part(cyl(1.2, 1.2, 34, 4), C.char, -10, 56, -64))
  parts.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(18, -5), new THREE.Vector2(0, -10)])), C.ember, -9, 72, -64))
  parts.push(part(cyl(14, 10, 16, 10), C.char, -64, 8, -26))
  parts.push(part(cyl(15, 15, 2, 10), C.brass, -64, 16, -26))
  return merged(parts)
}

export function gateGeometry(w: number, sign: boolean) {
  const parts: THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    const x = (side * w) / 2
    parts.push(part(box(84, 200, 84), C.brick, x, 100, 0))
    parts.push(part(box(92, 14, 92), C.char, x, 205, 0))
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) parts.push(part(box(22, 18, 22), C.brick, x + a * 33, 221, b * 33))
    parts.push(part(cyl(5, 7, 16, 6), C.char, x, 220, 0))
    parts.push(part(cyl(28, 14, 18, 10), C.brass, x, 236, 0))
    parts.push(part(box(28, 44, 2), C.ink, x, 22, 43))
    parts.push(part(box(10, 26, 2), C.ember, x, 140, 43))
    parts.push(part(box(86, 8, 86), C.brickD, x, 60, 0))
  }
  parts.push(part(box(w, 22, 34), C.woodD, 0, 170, 0))
  parts.push(part(box(w, 4, 3), C.brass, 0, 194, 16))
  for (let k = -3; k <= 3; k++) parts.push(part(box(3, 16, 3), C.brass, (k * w) / 8, 186, 16))
  if (sign) {
    for (const side of [-1, 1]) parts.push(part(box(2, 20, 2), C.char, side * 16, 150, 12))
    parts.push(part(cyl(30, 30, 5, 18), C.gold, 0, 118, 12, FACE))
    parts.push(part(new THREE.TorusGeometry(21, 2.5, 6, 18), C.rind, 0, 118, 15))
    parts.push(part(box(5, 22, 2), C.rind, 0, 118, 16))
  }
  return merged(parts)
}

export function tollGeometry() {
  const parts = [
    part(box(96, 66, 70), C.cream, 0, 33, 0),
    part(box(102, 8, 76), C.char, 0, 68, 0),
    part(new THREE.ConeGeometry(70, 58, 4), C.copper, 0, 101, 0, [0, Math.PI / 4, 0]),
    part(box(12, 30, 12), C.brick, 26, 108, -14),
    part(box(22, 36, 2), C.ink, -22, 18, 36),
    part(box(26, 20, 2), C.flame, 20, 40, 36),
    part(box(30, 3, 4), C.char, 20, 29, 37),
    part(cyl(2.5, 2.5, 120, 6), C.char, 64, 60, 22),
    part(cyl(24, 24, 5, 18), C.gold, 64, 128, 22, FACE),
    part(new THREE.TorusGeometry(16, 2.2, 6, 18), C.rind, 64, 128, 25),
    part(box(4, 18, 2), C.rind, 64, 128, 26),
  ]
  eyes(parts, 92, 22, 8, 12)
  return merged(parts)
}

export function leafGeometry() {
  const g = merged([
    part(box(1, 54, 9), C.woodD, 0.5, 27, 0),
    part(box(1, 5, 10), C.brass, 0.5, 44, 0),
    part(box(1, 5, 10), C.brass, 0.5, 12, 0),
  ])
  return g
}

export function capstanGeometry() {
  return merged([
    part(cyl(14, 17, 26, 12), C.brass, 0, 13, 0),
    part(cyl(18, 18, 5, 12), C.char, 0, 28, 0),
    part(box(84, 4, 4), C.wood, 0, 22, 0),
    part(box(4, 4, 84), C.wood, 0, 22, 0),
  ])
}

export function flameGeometry() {
  return merged([
    part(new THREE.ConeGeometry(1, 2.6, 7), C.ember, 0, 1.3, 0),
    part(new THREE.ConeGeometry(0.6, 1.7, 6), C.flame, 0, 0.9, 0.35),
  ])
}

export function bangGeometry(query: boolean) {
  const parts = [part(cyl(12, 12, 2, 16), C.white, 0, 0, 0, FACE), part(new THREE.ConeGeometry(4, 8, 3), C.white, -5, -12, 0, [0, 0, 2.6])]
  const ink = query ? C.ink : C.red
  if (query) {
    parts.push(part(new THREE.TorusGeometry(4, 1.6, 4, 10, Math.PI * 1.3), ink, 0, 3.5, 1.5, [0, 0, -0.6]))
    parts.push(part(box(3, 4, 2), ink, 0, -2, 1.5))
  } else parts.push(part(box(3.4, 10, 2), ink, 0, 2.5, 1.5))
  parts.push(part(new THREE.SphereGeometry(1.9, 6, 4), ink, 0, -6.5, 1.5))
  return merged(parts)
}

export function coinGeometry() {
  const g = new THREE.CylinderGeometry(11, 11, 3, 16)
  g.rotateX(Math.PI / 2)
  return g
}

export function ropeGeometry() {
  const g = new THREE.CylinderGeometry(2.4, 2.4, 1, 5)
  g.rotateZ(-Math.PI / 2).translate(0.5, 0, 0)
  return g
}

export function glowTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
