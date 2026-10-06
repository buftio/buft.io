import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { PITCH } from '../../stand'

export const C = {
  ink: '#2a1630',
  white: '#ffffff',
  stone: '#f3ebf4',
  teal: '#16b3a0',
  mint: '#7dffe6',
  folk: '#4b35a8',
  folk2: '#5b3fb8',
  drift: '#a08a6e',
  driftD: '#6f5a47',
  driftL: '#d9c9ad',
  fresh: '#f0c27a',
  freshD: '#d39a52',
  rope: '#c99a5b',
  sail: '#fbf3e2',
  coral: '#ff6a55',
  crab: '#ff5a4a',
  crabD: '#d93a30',
  gold: '#ffd36b',
  rind: '#e0a93a',
  glass: '#9fe3d3',
  glassD: '#4fb9a8',
  copper: '#5fb3a3',
  hat: '#f6b73c',
  sand: '#efd9ab',
}

export function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function part(
  shape: THREE.BufferGeometry,
  color: string,
  x = 0,
  y = 0,
  z = 0,
  ry = 0,
  rz = 0,
  rx = 0,
) {
  const g = shape.index ? shape.toNonIndexed() : shape
  if (rx) g.rotateX(rx)
  if (rz) g.rotateZ(rz)
  if (ry) g.rotateY(ry)
  g.translate(x, y, z)
  if (g.getAttribute('uv')) g.deleteAttribute('uv')
  paint(g, color)
  return g
}

export function paint(g: THREE.BufferGeometry, color: string) {
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

const TILT = new THREE.Matrix4().makeRotationFromEuler(PITCH)

export function bake(
  g: THREE.BufferGeometry,
  dx: number,
  dy: number,
  s = 1,
  turn = 0,
) {
  g.scale(s, s, s)
  g.rotateY(turn)
  g.applyMatrix4(TILT)
  g.translate(dx, -dy, 0)
  return g
}

export function eyes(
  parts: THREE.BufferGeometry[],
  y: number,
  z: number,
  gap = 5,
  r = 4.5,
  x = 0,
) {
  for (const side of [-1, 1]) {
    parts.push(
      part(new THREE.SphereGeometry(r, 7, 5), C.white, x + side * gap, y, z),
    )
    parts.push(
      part(
        new THREE.SphereGeometry(r * 0.5, 5, 4),
        C.ink,
        x + side * gap * 0.9,
        y - r * 0.3,
        z + r * 0.75,
      ),
    )
  }
}

export function folk(
  parts: THREE.BufferGeometry[],
  x = 0,
  y = 0,
  z = 0,
  hat = C.hat,
  r = 15,
  body = C.folk,
) {
  parts.push(part(new THREE.SphereGeometry(r, 9, 7), body, x, y + r, z))
  eyes(parts, y + r * 1.15, z + r * 0.8, r * 0.36, r * 0.32, x)
  if (!hat) return
  parts.push(
    part(
      new THREE.CylinderGeometry(r * 1.05, r * 1.15, r * 0.12, 9),
      hat,
      x,
      y + r * 1.72,
      z - r * 0.1,
      0,
      0,
      -0.2,
    ),
  )
  parts.push(
    part(
      new THREE.SphereGeometry(r * 0.66, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      hat,
      x,
      y + r * 1.72,
      z - r * 0.15,
    ),
  )
}

export function salvager() {
  const parts: THREE.BufferGeometry[] = []
  for (const s of [-1, 1])
    parts.push(part(new THREE.BoxGeometry(8, 5, 11), C.ink, s * 6, 2.5, 2))
  folk(parts, 0, 3, 0)
  return merged(parts)
}

export function plank() {
  const parts = [
    part(new THREE.BoxGeometry(74, 6, 11), C.fresh, 0, 0, 0, 0, 0.08),
    part(new THREE.BoxGeometry(70, 1.5, 11.4), C.freshD, 0, 1, 0, 0, 0.08),
  ]
  return merged(parts)
}

export function crab(s = 1) {
  const parts: THREE.BufferGeometry[] = []
  const body = new THREE.SphereGeometry(16 * s, 10, 6)
  body.scale(1.2, 0.62, 0.85)
  parts.push(part(body, C.crab, 0, 10 * s, 0))
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      const z = (k - 1) * 8 * s
      parts.push(
        part(
          new THREE.BoxGeometry(16 * s, 3 * s, 3 * s),
          C.crabD,
          side * 22 * s,
          6 * s,
          z,
          side * (k - 1) * 0.35,
          side * -0.55,
        ),
      )
    }
    parts.push(
      part(
        new THREE.BoxGeometry(4 * s, 14 * s, 4 * s),
        C.crabD,
        side * 14 * s,
        16 * s,
        9 * s,
        0,
        side * 0.5,
      ),
    )
    const claw = new THREE.SphereGeometry(7 * s, 7, 5)
    claw.scale(1, 1.25, 0.8)
    parts.push(part(claw, C.crab, side * 19 * s, 24 * s, 10 * s))
    parts.push(
      part(
        new THREE.BoxGeometry(2 * s, 8 * s, 2 * s),
        C.crabD,
        side * 5 * s,
        20 * s,
        8 * s,
      ),
    )
  }
  eyes(parts, 25 * s, 9 * s, 5 * s, 4.2 * s)
  return merged(parts)
}

export function ring(r = 9, tube = 3.6) {
  return part(new THREE.TorusGeometry(r, tube, 6, 14), C.gold)
}

export function smoothstep(a: number, b: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export function softDisc(color: string, alpha: number, seg = 32) {
  const g = new THREE.CircleGeometry(1, seg)
  g.deleteAttribute('uv')
  const c = new THREE.Color(color)
  const p = g.getAttribute('position')
  const rgba = new Float32Array(p.count * 4)
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getY(i))
    rgba.set([c.r, c.g, c.b, alpha * (1 - r)], i * 4)
  }
  g.setAttribute('color', new THREE.BufferAttribute(rgba, 4))
  return g
}
