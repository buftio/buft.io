import * as THREE from 'three'
import { eyes, FOLK, GOLD, INK, merged, MINT, paint, part, TEAL, WHITE, CORAL } from './kit'

export function bodyShape() {
  const lit = '#ffe39a'
  const dark = '#4b3260'
  const parts = [part(new THREE.BoxGeometry(1, 1, 1), WHITE, [0, 0.5, 0])]
  const win = (x: number, y: number, c: string) =>
    parts.push(part(new THREE.PlaneGeometry(0.2, 0.17), c, [x, y, 0.505]))
  win(-0.24, 0.72, lit)
  win(0.24, 0.72, dark)
  win(-0.24, 0.42, dark)
  win(0.24, 0.42, lit)
  parts.push(part(new THREE.PlaneGeometry(0.2, 0.26), '#7c4a5a', [0, 0.13, 0.505]))
  return merged(parts)
}

export function gableShape() {
  const tri = new THREE.Shape([new THREE.Vector2(-0.6, 0), new THREE.Vector2(0.6, 0), new THREE.Vector2(0, 1)])
  return merged([
    part(new THREE.ExtrudeGeometry(tri, { depth: 1.12, bevelEnabled: false }), WHITE, [0, 0, -0.56]),
    part(new THREE.BoxGeometry(0.14, 0.5, 0.14), '#b98a8a', [0.3, 0.55, -0.18]),
  ])
}

export function hipShape() {
  return merged([part(new THREE.ConeGeometry(0.78, 1, 4), WHITE, [0, 0.5, 0], [0, Math.PI / 4, 0])])
}

export function folkShape() {
  const parts = [part(new THREE.SphereGeometry(0.5, 7, 5), FOLK, [0, 0.46, 0], [0, 0.2, 0], [1, 0.92, 1])]
  eyes(parts, 0.19, 0.6, 0.45, 0.18, [0, -0.2], 7)
  return merged(parts)
}

export function helmetShape() {
  return merged([
    part(new THREE.SphereGeometry(0.37, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, [0, 0.78, -0.03]),
    part(new THREE.ConeGeometry(0.08, 0.3, 5), MINT, [0, 1.25, -0.03]),
  ])
}

export function flagShape() {
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.5, -0.13), new THREE.Vector2(0, -0.27)])
  return merged([
    part(new THREE.BoxGeometry(0.04, 1.4, 0.04), INK, [0.5, 0.8, 0.12]),
    part(new THREE.ShapeGeometry(tri), MINT, [0.52, 1.48, 0.12]),
  ])
}

export function tubaShape() {
  return merged([
    part(new THREE.TorusGeometry(0.2, 0.06, 5, 10), GOLD, [0.36, 0.42, 0.34]),
    part(new THREE.CylinderGeometry(0.26, 0.05, 0.42, 10, 1, true), GOLD, [0.5, 0.82, 0.3], [0, 0, -0.3]),
    part(new THREE.CylinderGeometry(0.2, 0.22, 0.34, 8), CORAL, [0, 1.0, -0.03]),
    part(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 8), GOLD, [0, 0.85, -0.03]),
  ])
}

export function catShape() {
  return merged([
    part(new THREE.SphereGeometry(0.5, 8, 6), WHITE, [0, 0.38, 0], [0, 0, 0], [0.72, 0.78, 0.6]),
    part(new THREE.SphereGeometry(0.3, 8, 6), WHITE, [0, 0.92, 0.1]),
    part(new THREE.ConeGeometry(0.1, 0.22, 4), WHITE, [-0.17, 1.2, 0.08], [0, 0, 0.25]),
    part(new THREE.ConeGeometry(0.1, 0.22, 4), WHITE, [0.17, 1.2, 0.08], [0, 0, -0.25]),
    part(new THREE.TorusGeometry(0.3, 0.06, 4, 8, Math.PI * 1.2), WHITE, [0.32, 0.4, -0.05], [0, 0, -0.5]),
  ])
}

export function catEyeShape() {
  const parts: THREE.BufferGeometry[] = []
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.CircleGeometry(0.075, 8), '#d8ff5a', [side * 0.11, 0.96, 0.38]))
    parts.push(part(new THREE.PlaneGeometry(0.03, 0.11), INK, [side * 0.11, 0.96, 0.386]))
  }
  parts.push(part(new THREE.CircleGeometry(0.04, 5), '#ff8fb0', [0, 0.86, 0.4]))
  return merged(parts)
}

const CLOTH: [number, number][][] = [
  [[-0.5, 0], [0.5, 0], [0.5, -0.32], [0.3, -0.32], [0.3, -1], [-0.3, -1], [-0.3, -0.32], [-0.5, -0.32]],
  [[-0.4, 0], [0.4, 0], [0.44, -1], [0.1, -1], [0, -0.35], [-0.1, -1], [-0.44, -1]],
  [[-0.25, 0], [0.25, 0], [0.25, -0.62], [0.55, -0.72], [0.55, -1], [-0.25, -1]],
]

export function clothShape(kind: number) {
  const s = new THREE.Shape(CLOTH[kind].map(([x, y]) => new THREE.Vector2(x, y)))
  return merged([part(new THREE.ShapeGeometry(s), WHITE), part(new THREE.PlaneGeometry(0.08, 0.1), '#c9a27a', [0, -0.03, 0.01])])
}

export function puffShape() {
  return merged([
    part(new THREE.CircleGeometry(0.62, 8), '#e9def0', [0.05, -0.08, 0]),
    part(new THREE.CircleGeometry(0.55, 8), WHITE, [-0.38, 0, 0.01]),
    part(new THREE.CircleGeometry(0.7, 9), WHITE, [0.12, 0.18, 0.02]),
    part(new THREE.CircleGeometry(0.45, 7), WHITE, [0.6, -0.02, 0.03]),
  ])
}

export function confettiShape() {
  return paint(new THREE.PlaneGeometry(1, 0.6), WHITE)
}
