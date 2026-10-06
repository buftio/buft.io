import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

type G = THREE.BufferGeometry
type V3 = [number, number, number]

const INK = '#2a1630'
const WHITE = '#ffffff'
const HONEY = '#f4b437'
const STRAW = '#c98322'
const WAX = '#fff0c4'
const WOOD = '#8a5532'
const COPPER = '#c8693a'
const FOLK = '#4a34a6'
const HAT = '#ffc21a'
const TEAL = '#16b3a0'
const MINT = '#7dffe6'
const WING = '#fff8e8'
const TIN = '#b8aec8'
const BLUSH = '#ff9fc4'
const TAU = Math.PI * 2

function part(shape: G, color: string, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], sc: V3 = [1, 1, 1]) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (g !== shape) shape.dispose()
  g.scale(...sc)
  g.rotateX(rot[0])
  g.rotateY(rot[1])
  g.rotateZ(rot[2])
  g.translate(...at)
  g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set([c.r, c.g, c.b], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g
}

function merged(parts: G[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

function eyes(p: G[], y: number, z: number, gap: number, size: number, seg = 10) {
  for (const s of [-1, 1]) {
    p.push(part(new THREE.SphereGeometry(size, seg, seg - 2), WHITE, [s * gap, y, z]))
    p.push(part(new THREE.SphereGeometry(size / 2, seg - 2, seg - 4), INK, [s * gap * 0.92, y - size * 0.3, z + size * 0.8]))
  }
}

const SKEP_H = 1.75
export const skepRadius = (y: number) => 1.02 * Math.pow(Math.max(0.02, 1 - (y / SKEP_H) ** 2), 0.55)

export function skep() {
  const p: G[] = [part(new THREE.SphereGeometry(1, 20, 10, 0, TAU, 0, Math.PI / 2), STRAW, [0, 0, 0], [0, 0, 0], [0.97, SKEP_H * 0.98, 0.97])]
  for (let k = 0; k < 9; k++) {
    const y = 0.1 + k * 0.19
    p.push(part(new THREE.TorusGeometry(skepRadius(y), 0.12 - k * 0.005, 6, 28), k % 2 ? STRAW : HONEY, [0, y, 0], [Math.PI / 2, 0, 0]))
  }
  p.push(part(new THREE.SphereGeometry(0.16, 10, 8), HONEY, [0, SKEP_H + 0.02, 0]))
  p.push(part(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 14, 1, false, Math.PI / 2, Math.PI), INK, [0, 0.04, skepRadius(0.12) + 0.02], [Math.PI / 2, 0, 0], [1, 1, 1.6]))
  p.push(part(new THREE.BoxGeometry(0.9, 0.05, 0.34), WOOD, [0, 0.03, skepRadius(0.05) + 0.12]))
  p.push(part(new THREE.TorusGeometry(0.33, 0.04, 5, 14, Math.PI), TEAL, [0, 0.04, skepRadius(0.12) + 0.06], [0, 0, 0], [1, 1.3, 1]))
  eyes(p, 0.92, skepRadius(0.92) - 0.02, 0.24, 0.19, 12)
  p.push(part(new THREE.TorusGeometry(0.2, 0.04, 4, 12, Math.PI), INK, [0, 0.7, skepRadius(0.7) + 0.1], [0.5, 0, Math.PI]))
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.09, 8, 5), BLUSH, [s * 0.44, 0.74, skepRadius(0.74) + 0.06], [0, s * 0.4, 0], [1.4, 0.9, 0.5]))
  p.push(part(new THREE.CylinderGeometry(0.17, 0.17, 0.05, 6), HAT, [0, 1.3, skepRadius(1.3) + 0.02], [Math.PI / 2, 0, 0]))
  p.push(part(new THREE.CylinderGeometry(0.1, 0.12, 0.55, 10), COPPER, [0.42, 1.55, -0.1]))
  p.push(part(new THREE.CylinderGeometry(0.15, 0.13, 0.08, 10), COPPER, [0.42, 1.83, -0.1]))
  for (const s of [-1, 1]) p.push(part(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 10), COPPER, [s * 1.05, 0.14, 0.1], [0, 0, Math.PI / 2]))
  p.push(part(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 4), INK, [-0.25, 1.85, 0]))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.32, -0.08), new THREE.Vector2(0, -0.16)])), MINT, [-0.24, 2.08, 0]))
  return merged(p)
}

export function wheel() {
  const p: G[] = [part(new THREE.TorusGeometry(0.42, 0.035, 5, 20), WOOD)]
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU
    p.push(part(new THREE.BoxGeometry(0.03, 0.84, 0.03), WOOD, [0, 0, 0], [0, 0, a]))
    p.push(part(new THREE.BoxGeometry(0.06, 0.18, 0.16), HONEY, [Math.cos(a) * 0.47, Math.sin(a) * 0.47, 0], [0, 0, a]))
  }
  p.push(part(new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8), COPPER, [0, 0, 0], [Math.PI / 2, 0, 0]))
  return merged(p)
}

export function press() {
  const p: G[] = [
    part(new THREE.CylinderGeometry(0.95, 1.02, 0.42, 22), WOOD, [0, 0.21, 0]),
    part(new THREE.CylinderGeometry(0.86, 0.86, 0.03, 22), HAT, [0, 0.42, 0]),
    part(new THREE.TorusGeometry(0.99, 0.035, 4, 24), COPPER, [0, 0.08, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.TorusGeometry(0.97, 0.035, 4, 24), COPPER, [0, 0.34, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.BoxGeometry(3.7, 0.22, 0.24), WOOD, [0, 2.45, 0]),
    part(new THREE.BoxGeometry(0.5, 0.06, 0.3), WAX, [0, 2.6, 0]),
    part(new THREE.CylinderGeometry(0.12, 0.14, 0.3, 8), COPPER, [1.0, 0.18, 0.3], [0, 0, Math.PI / 2]),
  ]
  for (const s of [-1, 1]) {
    p.push(part(new THREE.BoxGeometry(0.18, 2.5, 0.18), WOOD, [s * 1.75, 1.22, 0]))
    p.push(part(new THREE.BoxGeometry(0.5, 0.1, 0.5), WOOD, [s * 1.75, 0.05, 0]))
    p.push(part(new THREE.ConeGeometry(0.2, 0.3, 4), TEAL, [s * 1.75, 2.72, 0], [0, Math.PI / 4, 0]))
  }
  eyes(p, 2.45, 0.14, 0.5, 0.13)
  return merged(p)
}

export function screw() {
  const p: G[] = [
    part(new THREE.CylinderGeometry(0.09, 0.09, 1.95, 8), COPPER, [0, 1.45, 0]),
    part(new THREE.CylinderGeometry(0.72, 0.72, 0.08, 20), WAX, [0, 0.5, 0]),
  ]
  for (let k = 0; k < 22; k++) {
    const a = k * 0.9
    p.push(part(new THREE.BoxGeometry(0.1, 0.05, 0.08), STRAW, [Math.cos(a) * 0.12, 0.7 + k * 0.075, Math.sin(a) * 0.12], [0, -a, 0.3]))
  }
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU
    p.push(part(new THREE.BoxGeometry(1.25, 0.07, 0.07), WOOD, [Math.cos(a) * 0.62, 0.78, Math.sin(a) * 0.62], [0, -a, 0]))
  }
  return merged(p)
}

export function folk() {
  const p: G[] = [
    part(new THREE.SphereGeometry(0.5, 10, 7), FOLK, [0, 0.47, 0], [0, 0, 0], [1, 0.92, 1]),
    part(new THREE.TorusGeometry(0.46, 0.07, 3, 12), TEAL, [0, 0.3, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.TorusGeometry(0.36, 0.06, 3, 12), INK, [0, 0.17, 0], [Math.PI / 2, 0, 0]),
    part(new THREE.SphereGeometry(0.3, 8, 4, 0, TAU, 0, Math.PI / 2), HAT, [0, 0.84, -0.08], [-0.35, 0, 0]),
    part(new THREE.CircleGeometry(0.36, 12), HAT, [0, 0.86, -0.06], [-Math.PI / 2 - 0.35, 0, 0]),
    part(new THREE.SphereGeometry(0.07, 4, 3), MINT, [0, 1.12, -0.12]),
  ]
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.24, 5, 3), WING, [s * 0.3, 0.72, -0.36], [0, 0, s * 0.6], [0.55, 1, 0.12]))
  eyes(p, 0.58, 0.36, 0.19, 0.19, 8)
  return merged(p)
}

export const HAND: V3 = [0.5, 0.42, 0.22]
export const BOWL: V3 = [0, 0.95, 0]

export function bucket() {
  return merged([
    part(new THREE.CylinderGeometry(0.17, 0.13, 0.24, 8, 1, true), TIN, [0, -0.12, 0]),
    part(new THREE.CircleGeometry(0.15, 8), INK, [0, -0.02, 0], [-Math.PI / 2, 0, 0]),
    part(new THREE.TorusGeometry(0.16, 0.015, 3, 8, Math.PI), INK, [0, 0, 0]),
  ])
}

export function ladle() {
  return merged([
    part(new THREE.CylinderGeometry(0.025, 0.025, 0.9, 5), WOOD, [0, 0.45, 0]),
    part(new THREE.SphereGeometry(0.15, 9, 5, 0, TAU, Math.PI / 2, Math.PI / 2), COPPER, [0, 0.95, 0]),
  ])
}

export function paddle() {
  return merged([
    part(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 5), WOOD, [0, 0.37, 0]),
    part(new THREE.BoxGeometry(0.36, 0.22, 0.03), WAX, [0, 0.82, 0]),
  ])
}

export function bee() {
  const g = new THREE.SphereGeometry(0.5, 10, 6)
  g.scale(1.5, 1, 0.9)
  const body = part(g, HONEY)
  const pos = body.getAttribute('position')
  const col = body.getAttribute('color')
  const ink = new THREE.Color(INK)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    if (x > 0.45 || Math.sin(x * 9 + 1) > 0.35) col.setXYZ(i, ink.r, ink.g, ink.b)
  }
  const p = [body]
  for (const s of [-1, 1]) {
    p.push(part(new THREE.SphereGeometry(0.15, 5, 3), WHITE, [0.62, s * 0.2, 0.3]))
    p.push(part(new THREE.SphereGeometry(0.07, 4, 2), INK, [0.7, s * 0.2, 0.42]))
  }
  return merged(p)
}

export function wings() {
  return merged(
    [-1, 1].map((s) => part(new THREE.SphereGeometry(0.5, 6, 3), WING, [-0.1, s * 0.62, 0.45], [0, 0, s * 0.35], [0.55, 1.1, 0.06])),
  )
}

export function clamp() {
  return part(new THREE.TorusGeometry(1, 0.22, 4, 10), COPPER)
}

const ROYAL = '#5b3fb8'
export const QUEEN_EYE: V3 = [0.24, 0.92, 0.66]
export const QUEEN_MOUTH: V3 = [0.05, 0.72, 0.72]

export function queen() {
  const p: G[] = [
    part(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), WAX, [0, 0, 0], [0, 0, 0], [1.7, 0.28, 1.25]),
    part(new THREE.TorusGeometry(1.45, 0.1, 5, 24), HONEY, [0, 0.04, 0], [Math.PI / 2, 0, 0], [1.15, 0.85, 1]),
    part(new THREE.SphereGeometry(0.7, 18, 12), ROYAL, [0, 0.75, 0], [0, 0, 0], [1.15, 0.92, 1]),
    part(new THREE.TorusGeometry(0.72, 0.09, 5, 22), HONEY, [0, 0.52, 0], [Math.PI / 2, 0, 0], [1.08, 1.08, 1]),
    part(new THREE.TorusGeometry(0.6, 0.08, 5, 22), INK, [0, 0.33, 0], [Math.PI / 2, 0, 0], [1.1, 1.1, 1]),
    part(new THREE.CylinderGeometry(0.32, 0.27, 0.2, 10, 1, true), HAT, [0, 1.48, -0.05]),
    part(new THREE.SphereGeometry(0.06, 6, 4), BLUSH, [0.43, 0.76, 0.56], [0, 0, 0], [1.6, 1, 0.6]),
    part(new THREE.SphereGeometry(0.06, 6, 4), BLUSH, [-0.43, 0.76, 0.56], [0, 0, 0], [1.6, 1, 0.6]),
    part(new THREE.SphereGeometry(0.06, 8, 6), INK, QUEEN_MOUTH, [0, 0, 0], [1, 1.2, 0.6]),
  ]
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU + 0.3
    p.push(part(new THREE.ConeGeometry(0.07, 0.2, 5), HAT, [Math.cos(a) * 0.3, 1.66, -0.05 + Math.sin(a) * 0.3]))
    p.push(part(new THREE.SphereGeometry(0.045, 6, 4), k % 2 ? TEAL : MINT, [Math.cos(a) * 0.3, 1.5, -0.05 + Math.sin(a) * 0.3]))
  }
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.4, 8, 6), WING, [s * 0.62, 1.12, -0.5], [0, 0, s * 0.7], [0.55, 1, 0.1]))
  return merged(p)
}

export function queenAsleep() {
  return merged(
    [-1, 1].map((s) => part(new THREE.TorusGeometry(0.12, 0.025, 4, 10, Math.PI), INK, [s * QUEEN_EYE[0], QUEEN_EYE[1], QUEEN_EYE[2]], [0, 0, Math.PI], [1, 0.7, 1])),
  )
}

export function queenAwake() {
  const p: G[] = []
  eyes(p, QUEEN_EYE[1], QUEEN_EYE[2] - 0.07, QUEEN_EYE[0], 0.16, 12)
  return merged(p)
}

export function zed() {
  const pts = [[0, 1], [1, 1], [1, 0.78], [0.38, 0.22], [1, 0.22], [1, 0], [0, 0], [0, 0.22], [0.62, 0.78], [0, 0.78]]
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x - 0.5, y - 0.5))))
  return g
}
