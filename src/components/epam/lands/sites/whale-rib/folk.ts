import * as THREE from 'three'
import { C, eyes, merge, part } from './kit'

function base(parts: THREE.BufferGeometry[], body = C.body) {
  parts.push(part(new THREE.SphereGeometry(0.5, 10, 7), body, { at: [0, 0.5, 0], size: [1, 0.95, 1] }))
  for (const side of [-1, 1]) parts.push(part(new THREE.SphereGeometry(0.14, 6, 4), C.ink, { at: [side * 0.22, 0.06, 0.12], size: [1, 0.6, 1.3] }))
  eyes(parts, 0.64, 0.36, 0.17, 0.15)
}

function helmet(parts: THREE.BufferGeometry[]) {
  parts.push(part(new THREE.SphereGeometry(0.28, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), C.sand, { at: [0, 0.93, -0.12] }))
  parts.push(part(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 14), C.ochre, { at: [0, 0.95, -0.12] }))
  parts.push(part(new THREE.TorusGeometry(0.42, 0.05, 4, 12), C.teal, { at: [0, 0.32, 0], rot: [Math.PI / 2, 0, 0] }))
}

export function diggerGeometry() {
  const parts: THREE.BufferGeometry[] = []
  base(parts)
  helmet(parts)
  parts.push(part(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 5), C.wood, { at: [0.52, 0.55, 0.28], rot: [0.2, 0, -0.35] }))
  parts.push(part(new THREE.BoxGeometry(0.26, 0.3, 0.05), '#8f8697', { at: [0.72, 0.05, 0.38], rot: [0.2, 0, -0.35] }))
  return merge(parts)
}

export function workerGeometry() {
  const parts: THREE.BufferGeometry[] = []
  base(parts)
  helmet(parts)
  return merge(parts)
}

export function pilgrimGeometry() {
  const parts: THREE.BufferGeometry[] = []
  base(parts, '#5b3fb8')
  parts.push(part(new THREE.CylinderGeometry(0.5, 0.58, 0.42, 12, 1, true), C.ivory, { at: [0, 0.21, 0] }))
  parts.push(part(new THREE.ConeGeometry(0.44, 0.62, 10), C.ivory, { at: [0, 1.12, -0.06] }))
  parts.push(part(new THREE.TorusGeometry(0.36, 0.06, 4, 12), C.bone, { at: [0, 0.86, 0.02], rot: [Math.PI / 2 - 0.2, 0, 0] }))
  parts.push(part(new THREE.CylinderGeometry(0.06, 0.06, 0.28, 6), C.white, { at: [0.3, 0.42, 0.46] }))
  parts.push(part(new THREE.ConeGeometry(0.16, 0.34, 8), C.ivory, { at: [0, 1.5, -0.12], rot: [-0.3, 0, 0] }))
  parts.push(part(new THREE.ConeGeometry(0.05, 0.12, 5), C.fat, { at: [0.3, 0.62, 0.46] }))
  return merge(parts)
}

export function touristGeometry() {
  const parts: THREE.BufferGeometry[] = []
  base(parts, '#3b2a8f')
  parts.push(part(new THREE.CylinderGeometry(0.6, 0.6, 0.04, 14), C.teal, { at: [0, 0.94, 0] }))
  parts.push(part(new THREE.CylinderGeometry(0.28, 0.32, 0.26, 12), C.mint, { at: [0, 1.06, 0] }))
  parts.push(part(new THREE.BoxGeometry(0.34, 0.2, 0.16), C.ink, { at: [0, 0.32, 0.48] }))
  parts.push(part(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), C.fat, { at: [0, 0.32, 0.58], rot: [Math.PI / 2, 0, 0] }))
  return merge(parts)
}

export function puffGeometry() {
  return merge([part(new THREE.IcosahedronGeometry(0.5, 0), C.white)])
}

function outline() {
  const s = new THREE.Shape()
  s.moveTo(1.32, 0)
  s.bezierCurveTo(1.3, 0.3, 0.9, 0.46, 0.4, 0.44)
  s.bezierCurveTo(-0.3, 0.42, -0.8, 0.2, -1.12, 0.07)
  s.bezierCurveTo(-1.3, 0.2, -1.42, 0.42, -1.6, 0.5)
  s.bezierCurveTo(-1.55, 0.22, -1.42, 0.08, -1.36, 0)
  s.bezierCurveTo(-1.42, -0.08, -1.55, -0.22, -1.6, -0.5)
  s.bezierCurveTo(-1.42, -0.42, -1.3, -0.2, -1.12, -0.07)
  s.bezierCurveTo(-0.8, -0.2, -0.3, -0.42, 0.4, -0.44)
  s.bezierCurveTo(0.9, -0.46, 1.3, -0.3, 1.32, 0)
  return s
}

function flipper(side: number) {
  const s = new THREE.Shape()
  s.moveTo(0.55, side * 0.3)
  s.bezierCurveTo(0.4, side * 0.75, 0.05, side * 0.95, -0.1, side * 0.9)
  s.bezierCurveTo(0.05, side * 0.65, 0.2, side * 0.45, 0.25, side * 0.32)
  return s
}

function rib(x: number) {
  const h = (0.44 - Math.max(0, -x - 0.1) * 0.3) * 0.8
  const s = new THREE.Shape()
  s.moveTo(x - 0.035, -h)
  s.quadraticCurveTo(x + 0.09, 0, x - 0.035, h)
  s.lineTo(x + 0.035, h)
  s.quadraticCurveTo(x + 0.16, 0, x + 0.035, -h)
  return s
}

export function whaleGeometry() {
  const bone = '#6f6f6f'
  const parts = [part(new THREE.ShapeGeometry(outline(), 10), C.white), part(new THREE.ShapeGeometry(flipper(1), 8), C.white), part(new THREE.ShapeGeometry(flipper(-1), 8), C.white)]
  parts.push(part(new THREE.PlaneGeometry(2.0, 0.06), bone, { at: [-0.18, 0, 0.001] }))
  parts.push(part(new THREE.CircleGeometry(0.2, 12), bone, { at: [0.98, 0, 0.001], size: [1.5, 1, 1] }))
  for (let i = 0; i < 7; i++) if (i !== 4) parts.push(part(new THREE.ShapeGeometry(rib(-0.62 + i * 0.19), 6), bone, { at: [0, 0, 0.001] }))
  return merge(parts)
}
