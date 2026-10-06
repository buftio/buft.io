import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export type G = THREE.BufferGeometry
export type V3 = [number, number, number]

export const INK = '#2a1630'
export const WHITE = '#ffffff'
export const STONE = '#f3ebf4'
export const TEAL = '#16b3a0'
export const MINT = '#7dffe6'
export const HAZARD = '#ff7a1a'
export const TIMBER = '#7a4a35'
export const PLANK = '#c08a5c'
export const CANVAS = '#fff0d4'
export const SACK = '#f1c66a'
export const GOLD = '#ffb800'
export const BODY = '#4b37a6'
export const IRON = '#4a3b55'

export const PQ = new THREE.Quaternion().setFromEuler(PITCH)
const UP = new THREE.Vector3(0, 1, 0)

export function part(shape: G, color: string, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], sc: V3 = [1, 1, 1]) {
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

export function merged(parts: G[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

const m4 = new THREE.Matrix4()
const q1 = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const v1 = new THREE.Vector3()
const s1 = new THREE.Vector3()

export function stand(g: G, dx: number, dy: number, size = 1, turn = 0) {
  q1.copy(PQ).multiply(q2.setFromAxisAngle(UP, turn))
  g.applyMatrix4(m4.compose(v1.set(dx, -dy, 0), q1, s1.set(size, size, size)))
  return g
}

export function upright(out: THREE.Quaternion, turn: number, lean = 0) {
  out.setFromAxisAngle(UP, turn)
  if (lean) out.premultiply(q2.setFromAxisAngle(v1.set(0, 0, 1), lean))
  return out.premultiply(PQ)
}

export function beam(a: V3, b: V3, r: number, color: string, seg = 5) {
  const d = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2])
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, d.clone().normalize()))
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
  return part(g, color)
}

export function eyes(p: G[], y: number, z: number, gap: number, size: number, pupils = true, seg = 10) {
  for (const s of [-1, 1]) {
    p.push(part(new THREE.SphereGeometry(size, seg, seg - 2), WHITE, [s * gap, y, z]))
    if (pupils) p.push(part(new THREE.SphereGeometry(size / 2, seg - 2, seg - 4), INK, [s * gap * 0.92, y - size * 0.25, z + size * 0.8]))
  }
}

function body(p: G[], color = BODY) {
  p.push(part(new THREE.SphereGeometry(1, 10, 7), color, [0, 1, 0], [0, 0, 0], [1, 0.92, 1]))
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.28, 5, 3), INK, [s * 0.45, 0.14, 0.2], [0, 0, 0], [1, 0.6, 1.3]))
  eyes(p, 1.28, 0.74, 0.34, 0.34, true, 7)
}

export function folk() {
  const p: G[] = []
  body(p)
  p.push(part(new THREE.TorusGeometry(0.72, 0.16, 3, 10), TEAL, [0, 0.62, 0], [Math.PI / 2 - 0.15, 0, 0]))
  p.push(part(new THREE.SphereGeometry(0.55, 6, 4), CANVAS, [0, 1.2, -0.85], [0, 0, 0], [1, 1, 0.8]))
  p.push(part(new THREE.SphereGeometry(0.16, 4, 3), HAZARD, [0, 1.62, -0.75]))
  return merged(p)
}

export function guard() {
  const p: G[] = []
  body(p, '#3d2b93')
  p.push(part(new THREE.SphereGeometry(0.82, 9, 4, 0, Math.PI * 2, 0, Math.PI / 2), HAZARD, [0, 1.55, 0]))
  p.push(part(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 9, 1, true), INK, [0, 1.56, 0]))
  p.push(part(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 4, 1, true), PLANK, [1.15, 1.6, 0.2]))
  p.push(part(new THREE.ConeGeometry(0.2, 0.55, 4), STONE, [1.15, 3.65, 0.2]))
  p.push(part(new THREE.ConeGeometry(0.22, 0.3, 4), HAZARD, [1.15, 3.2, 0.2], [Math.PI, 0, 0]))
  return merged(p)
}

export function cart() {
  const p: G[] = [part(new THREE.BoxGeometry(4.2, 0.6, 2.8), PLANK, [0, 1.9, 0])]
  for (const s of [-1, 1]) {
    p.push(part(new THREE.BoxGeometry(4.2, 0.7, 0.18), TIMBER, [0, 2.4, s * 1.35]))
    p.push(part(new THREE.CylinderGeometry(1.25, 1.25, 0.3, 10), TIMBER, [-0.3, 1.25, s * 1.6], [Math.PI / 2, 0, 0]))
    p.push(part(new THREE.CylinderGeometry(0.4, 0.4, 0.34, 5), HAZARD, [-0.3, 1.25, s * 1.62], [Math.PI / 2, 0, 0]))
    p.push(beam([2, 2, s * 1.1], [4.4, 1.3, s * 0.9], 0.11, TIMBER, 3))
  }
  return merged(p)
}

export function cargo() {
  const p: G[] = [
    part(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 8), SACK, [-1, 3.0, 0.4]),
    part(new THREE.CylinderGeometry(0.84, 0.84, 0.16, 8, 1, true), INK, [-1, 3.3, 0.4]),
    part(new THREE.CylinderGeometry(0.84, 0.84, 0.16, 8, 1, true), INK, [-1, 2.7, 0.4]),
    part(new THREE.SphereGeometry(1, 7, 4), TEAL, [0.8, 2.9, -0.2], [0, 0, 0], [1.1, 0.8, 1]),
    part(new THREE.SphereGeometry(0.75, 6, 4), CANVAS, [0.4, 3.7, 0.5], [0, 0, 0], [1, 0.7, 1]),
    part(new THREE.BoxGeometry(0.9, 1.2, 0.9), '#e85d8a', [-0.8, 4.3, -0.4], [0, 0.4, 0.15]),
  ]
  return merged(p)
}

export function stake() {
  const p: G[] = []
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(0.16, 0.16, 0.3, 5, 1, true), k % 2 ? INK : HAZARD, [0, 0.15 + k * 0.3, 0]))
  p.push(part(new THREE.ConeGeometry(0.16, 0.45, 5, 1, true), STONE, [0, 1.72, 0]))
  return merged(p)
}

export function sack() {
  return merged([
    part(new THREE.SphereGeometry(1, 7, 4), WHITE, [0, 0.5, 0], [0, 0, 0], [1, 0.55, 0.7]),
    part(new THREE.CylinderGeometry(0.15, 0.3, 0.3, 4, 1, true), '#c99a3f', [0.95, 0.55, 0], [0, 0, Math.PI / 2]),
  ])
}

export function flame() {
  return merged([
    part(new THREE.ConeGeometry(0.85, 2.7, 6), '#ff4a12', [0, 1.35, -0.2]),
    part(new THREE.ConeGeometry(0.5, 1.9, 5), HAZARD, [-0.62, 0.95, 0.1], [0, 0, 0.32]),
    part(new THREE.ConeGeometry(0.45, 1.6, 5), HAZARD, [0.6, 0.8, 0.15], [0, 0, -0.35]),
    part(new THREE.ConeGeometry(0.55, 1.7, 6), '#ffd36b', [0.05, 0.85, 0.55]),
    part(new THREE.ConeGeometry(0.26, 0.8, 5), '#fff6d8', [0, 0.4, 0.95]),
  ])
}

export function zee() {
  const s = new THREE.Shape([
    new THREE.Vector2(-0.5, 0.5),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.5, 0.32),
    new THREE.Vector2(-0.18, -0.32),
    new THREE.Vector2(0.5, -0.32),
    new THREE.Vector2(0.5, -0.5),
    new THREE.Vector2(-0.5, -0.5),
    new THREE.Vector2(-0.5, -0.32),
    new THREE.Vector2(0.18, 0.32),
    new THREE.Vector2(-0.5, 0.32),
  ])
  return new THREE.ShapeGeometry(s)
}

export function halo() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.3, 'rgba(255,255,255,0.4)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(c)
}
