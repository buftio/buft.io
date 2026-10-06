import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const C = {
  stone: '#f3ebf4',
  wall: '#dccbe4',
  ink: '#2a1630',
  white: '#ffffff',
  teal: '#16b3a0',
  mint: '#7dffe6',
  folk: '#4a35a6',
  pip: '#6a52c9',
  navy: '#1c2466',
  night: '#2e3a8c',
  moon: '#fff1b8',
  cream: '#fff7d6',
  jar: '#bff4ff',
  fat: '#ffd36b',
  rind: '#e0a93a',
  wood: '#7a5a8c',
}

type G = THREE.BufferGeometry

export function part(shape: G, color: string, x = 0, y = 0, z = 0, turn = 0, tilt = 0) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (tilt) g.rotateZ(tilt)
  if (turn) g.rotateY(turn)
  g.translate(x, y, z)
  g.deleteAttribute('uv')
  if (!g.getAttribute('normal')) g.computeVertexNormals()
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

const sphere = (r: number, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h)
const cyl = (a: number, b: number, h: number, n = 10) => new THREE.CylinderGeometry(a, b, h, n)
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z)

export function eyes(parts: G[], y: number, z: number, gap = 0.17, r = 0.15, x = 0) {
  for (const side of [-1, 1]) {
    parts.push(part(sphere(r, 12, 9), C.white, x + side * gap, y, z))
    parts.push(part(sphere(r * 0.5, 8, 6), C.ink, x + side * gap * 0.92, y - r * 0.25, z + r * 0.75))
  }
}

export function body(parts: G[], color: string, x = 0, z = 0, s = 1) {
  parts.push(part(sphere(0.5 * s, 14, 10), color, x, 0.55 * s, z))
  parts.push(part(sphere(0.13 * s, 8, 6), C.ink, x - 0.2 * s, 0.08 * s, z + 0.1 * s))
  parts.push(part(sphere(0.13 * s, 8, 6), C.ink, x + 0.2 * s, 0.08 * s, z + 0.1 * s))
  eyes(parts, 0.66 * s, z + 0.4 * s, 0.17 * s, 0.15 * s, x)
}

export function starShape(r = 0.5, k = 0.45) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const q = i % 2 ? r * k : r
    if (i) s.lineTo(Math.cos(a) * q, Math.sin(a) * q)
    else s.moveTo(Math.cos(a) * q, Math.sin(a) * q)
  }
  return s
}

export function starGeometry() {
  const g = new THREE.ExtrudeGeometry(starShape(), { depth: 0.16, bevelEnabled: false })
  g.translate(0, 0, -0.08)
  return g
}

function crescent() {
  const s = new THREE.Shape()
  const a0 = Math.atan2(0.314, -0.949)
  const a1 = Math.PI * 2 + Math.atan2(0.314, 0.949)
  for (let i = 0; i <= 24; i++) {
    const t = a0 + (i / 24) * (a1 - a0)
    if (i) s.lineTo(Math.cos(t), Math.sin(t))
    else s.moveTo(Math.cos(t), Math.sin(t))
  }
  const b0 = Math.atan2(-0.036, 0.949) + Math.PI * 2
  const b1 = Math.PI + Math.atan2(0.036, 0.949)
  for (let i = 1; i < 24; i++) {
    const t = b0 + (i / 24) * (b1 - b0)
    s.lineTo(Math.cos(t) * 0.95, 0.35 + Math.sin(t) * 0.95)
  }
  return s
}

export function moonGeometry(depth = 0.3) {
  const g = new THREE.ExtrudeGeometry(crescent(), { depth, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 1, curveSegments: 4 })
  g.translate(0, 0, -depth / 2)
  return g
}

export function hullGeometry() {
  const hull = moonGeometry(0.44)
  hull.scale(1, 0.8, 1)
  hull.translate(0, 0.8, 0)
  const parts = [
    part(hull, C.moon),
    part(box(0.9, 0.04, 0.34), C.wood, 0, 0.36, 0),
    part(cyl(0.025, 0.025, 1.1, 6), C.ink, -0.45, 0.9, 0),
    part(box(0.3, 0.03, 0.03), C.ink, -0.36, 1.42, 0),
  ]
  return merged(parts)
}

export function boatmanGeometry() {
  const parts: G[] = []
  body(parts, C.folk, 0, 0, 0.5)
  parts.push(part(cyl(0.2, 0.22, 0.08, 12), C.teal, 0, 0.56, 0))
  parts.push(part(cyl(0.12, 0.17, 0.12, 12), C.teal, 0, 0.62, -0.02))
  parts.push(part(cyl(0.018, 0.018, 1.8, 5), C.ink, 0.22, 0.35, 0.1, 0, -0.35))
  return merged(parts)
}

export function jarsGeometry() {
  const parts: G[] = []
  for (const [x, z, h] of [[-0.22, -0.04, 0.3], [0.0, 0.06, 0.24], [-0.08, -0.12, 0.2]]) {
    parts.push(part(cyl(0.1, 0.1, h, 10), C.jar, x, 0.38 + h / 2, z))
    parts.push(part(cyl(0.11, 0.11, 0.05, 10), C.ink, x, 0.38 + h + 0.02, z))
  }
  return merged(parts)
}

export function barrelsGeometry() {
  const parts: G[] = []
  for (const [x, z] of [[-0.25, 0], [0.02, 0.05]]) {
    parts.push(part(cyl(0.13, 0.13, 0.28, 10), C.fat, x, 0.52, z))
    parts.push(part(cyl(0.14, 0.14, 0.04, 10), C.rind, x, 0.54, z))
  }
  return merged(parts)
}

export const LAMP_H = 1.32

export function postGeometry() {
  const parts = [
    part(cyl(0.16, 0.2, 0.1, 10), C.ink, 0, 0.05, 0),
    part(cyl(0.035, 0.045, 1.2, 6), C.ink, 0, 0.65, 0),
    part(box(0.36, 0.035, 0.035), C.ink, 0, 1.12, 0),
    part(new THREE.ConeGeometry(0.2, 0.18, 6), C.ink, 0, 1.6, 0),
    part(cyl(0.15, 0.15, 0.03, 6), C.ink, 0, 1.5, 0),
    part(cyl(0.11, 0.13, 0.04, 6), C.ink, 0, 1.15, 0),
    part(sphere(0.045, 6, 4), C.moon, 0, 1.72, 0),
  ]
  for (const a of [0, 1, 2, 3]) parts.push(part(box(0.02, 0.34, 0.02), C.ink, Math.cos(a * 1.57 + 0.78) * 0.13, LAMP_H, Math.sin(a * 1.57 + 0.78) * 0.13))
  return merged(parts)
}

export function keeperGeometry() {
  const parts: G[] = []
  body(parts, '#3d2c94')
  parts.push(part(cyl(0.38, 0.38, 0.04, 14), C.ink, 0, 1.02, -0.02))
  parts.push(part(cyl(0.25, 0.27, 0.6, 14), C.ink, 0, 1.32, -0.02))
  parts.push(part(cyl(0.275, 0.275, 0.09, 14), C.teal, 0, 1.1, -0.02))
  parts.push(part(box(0.5, 0.06, 0.06), C.wall, 0, 0.4, 0.46))
  parts.push(part(cyl(0.03, 0.03, 0.34, 6), C.wall, 0.12, 0.18, 0.3))
  return merged(parts)
}

export const WAND = 3.0

export function wandGeometry() {
  const parts = [
    part(cyl(0.025, 0.03, WAND, 6), C.ink, 0, WAND / 2, 0),
    part(box(0.08, 0.14, 0.08), C.wall, 0, WAND, 0),
  ]
  return merged(parts)
}

export function pipGeometry() {
  const parts: G[] = []
  body(parts, C.pip)
  const cap = new THREE.ConeGeometry(0.4, 0.95, 12)
  cap.rotateZ(0.9)
  parts.push(part(cap, C.mint, 0.2, 1.12, 0))
  parts.push(part(sphere(0.12, 8, 6), C.white, 0.6, 1.25, 0))
  parts.push(part(cyl(0.02, 0.02, 1.0, 5), C.ink, -0.48, 0.75, 0.15, 0, 0.5))
  const snuff = new THREE.ConeGeometry(0.13, 0.2, 8, 1, true)
  parts.push(part(snuff, C.ink, -0.72, 1.18, 0.15, 0, 0.5 + Math.PI))
  return merged(parts)
}

export function moonhouseGeometry() {
  const parts: G[] = [
    part(cyl(0.62, 0.7, 0.16, 18), C.wall, 0, 0.08, 0),
    part(cyl(0.38, 0.46, 1.5, 16), C.stone, 0, 0.9, 0),
    part(cyl(0.52, 0.52, 0.08, 16), C.wall, 0, 1.68, 0),
    part(cyl(0.42, 0.42, 0.32, 16), C.night, 0, 1.88, 0),
    part(new THREE.ConeGeometry(0.52, 0.55, 16), C.navy, 0, 2.3, 0),
    part(cyl(0.02, 0.02, 0.5, 5), C.ink, 0, 2.7, 0),
    part(box(0.26, 0.4, 0.04), C.teal, 0, 0.36, 0.45),
    part(box(0.3, 0.05, 0.05), C.ink, 0, 0.58, 0.45),
  ]
  for (const a of [-0.9, -0.3, 0.3, 0.9]) parts.push(part(box(0.1, 0.16, 0.03), C.moon, Math.sin(a) * 0.43, 1.9, Math.cos(a) * 0.43, a))
  eyes(parts, 1.12, 0.46, 0.15, 0.12)
  for (let i = 0; i < 5; i++) {
    parts.push(part(cyl(0.07, 0.07, 0.16, 8), C.jar, 0.55 + (i % 3) * 0.16, 0.08 + Math.floor(i / 3) * 0.17, 0.3))
  }
  parts.push(part(box(0.55, 0.03, 0.18), C.wood, 0.71, 0.17, 0.3))
  for (const [x, z] of [[-0.62, 0.3], [-0.85, 0.2], [-0.72, 0.05]]) parts.push(part(cyl(0.12, 0.12, 0.26, 10), C.fat, x, 0.13, z))
  body(parts, C.folk, -0.4, 0.62, 0.32)
  return merged(parts)
}

export function wharfGeometry() {
  const parts: G[] = [part(box(2.2, 0.08, 0.7), C.wood, 0, 0.12, 0)]
  for (const x of [-1, -0.33, 0.33, 1]) parts.push(part(cyl(0.05, 0.05, 0.3, 6), C.ink, x, 0.0, 0.33))
  parts.push(part(cyl(0.035, 0.04, 1.3, 6), C.ink, 0.7, 0.8, -0.2))
  parts.push(part(box(0.9, 0.04, 0.04), C.ink, 1.1, 1.44, -0.2))
  parts.push(part(cyl(0.006, 0.006, 0.5, 4), C.ink, 1.45, 1.18, -0.2))
  parts.push(part(cyl(0.1, 0.1, 0.18, 8), C.jar, 1.45, 0.86, -0.2))
  for (let i = 0; i < 7; i++) parts.push(part(cyl(0.08, 0.08, 0.18, 8), C.jar, -0.85 + (i % 4) * 0.18, 0.25 + Math.floor(i / 4) * 0.19, -0.1 + (i % 2) * 0.05))
  for (const [x, z] of [[0.32, 0.1], [0.56, 0.05], [0.44, -0.16]]) parts.push(part(cyl(0.11, 0.11, 0.22, 10), C.fat, x, 0.27, z))
  body(parts, C.folk, -0.04, 0.16, 0.36)
  parts.push(part(box(0.2, 0.14, 0.02), C.stone, 0.08, 0.3, 0.34, 0, -0.3))
  return merged(parts)
}

export function skiffGeometry() {
  const hull = moonGeometry(0.5)
  hull.scale(0.7, 0.4, 1)
  hull.translate(0, 0.3, 0)
  const parts: G[] = [part(hull, '#3b2a6f')]
  const man: G[] = []
  body(man, C.folk, 0, 0, 0.6)
  man.forEach((g) => g.translate(-0.12, 0.3, 0.05))
  parts.push(...man)
  parts.push(part(new THREE.ConeGeometry(0.26, 0.2, 12), C.fat, -0.12, 0.95, 0.05))
  parts.push(part(cyl(0.02, 0.02, 1.5, 5), C.ink, 0.4, 1.2, 0, 0, -0.55))
  parts.push(part(cyl(0.08, 0.08, 0.16, 8), C.jar, 0.32, 0.38, 0.12))
  return merged(parts)
}

export const ROD = { x: 0.82, y: 1.84 }
