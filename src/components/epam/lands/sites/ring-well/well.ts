import * as THREE from 'three'
import { C, eyes, merged, part } from './kit'
import { WELL } from './place'

const EAVE = 640
const SLOPE = 0.52
const SPAN = WELL.post + 80
const RIDGE = EAVE + SPAN * Math.tan(SLOPE)
const DEEP = 230

function roof(p: THREE.BufferGeometry[]) {
  const len = SPAN / Math.cos(SLOPE) + 40
  for (const s of [-1, 1]) {
    const slab = new THREE.BoxGeometry(len, 24, DEEP + 40).rotateZ(-s * SLOPE)
    p.push(part(slab, C.roof, (s * SPAN) / 2, EAVE + (SPAN / 2) * Math.tan(SLOPE) + 4))
    for (let k = 1; k <= 4; k++) {
      const d = (k / 4.2) * SPAN
      const strip = new THREE.BoxGeometry(14, 8, DEEP + 46).rotateZ(-s * SLOPE)
      p.push(part(strip, k === 4 ? C.gold : '#0f8a7c', s * d, RIDGE - d * Math.tan(SLOPE) + 18))
    }
  }
  p.push(part(new THREE.CylinderGeometry(20, 20, DEEP + 60, 8).rotateX(Math.PI / 2), C.gold, 0, RIDGE + 14))
  const tri = new THREE.Shape([new THREE.Vector2(-SPAN + 40, 0), new THREE.Vector2(SPAN - 40, 0), new THREE.Vector2(0, RIDGE - EAVE - 28)])
  for (const z of [-DEEP / 2, DEEP / 2]) p.push(part(new THREE.ShapeGeometry(tri), '#fff1d2', 0, EAVE + 6, z))
  p.push(part(new THREE.BoxGeometry(SPAN * 2 - 60, 22, 20), C.wall, 0, EAVE + 2, DEEP / 2))
  p.push(part(new THREE.CylinderGeometry(78, 78, 16, 24).rotateX(Math.PI / 2), C.gold, 0, RIDGE + 96, 0))
  p.push(part(new THREE.CylinderGeometry(64, 64, 18, 24).rotateX(Math.PI / 2), C.deep, 0, RIDGE + 96, 0))
  p.push(part(new THREE.CylinderGeometry(9, 9, 60, 6), C.ink, 0, RIDGE + 34, 0))
  eyes(p, RIDGE + 100, 12, 26, 22)
}

export function wellGeometry() {
  const { post, axle, bucket } = WELL
  const p: THREE.BufferGeometry[] = []
  for (const sx of [-post, post]) {
    p.push(part(new THREE.CylinderGeometry(30, 38, EAVE, 8), C.stone, sx, EAVE / 2))
    p.push(part(new THREE.CylinderGeometry(50, 50, 24, 8), C.wall, sx, 12))
    p.push(part(new THREE.BoxGeometry(90, 20, 90), C.wall, sx, EAVE - 10))
    for (let y = 120; y < EAVE - 60; y += 130) p.push(part(new THREE.TorusGeometry(33, 6, 4, 12).rotateX(Math.PI / 2), C.gold, sx, y))
  }
  p.push(part(new THREE.CylinderGeometry(14, 14, post * 2 + 220, 8).rotateZ(Math.PI / 2), C.wood, -90, axle))
  p.push(part(new THREE.CylinderGeometry(40, 40, 110, 12).rotateZ(Math.PI / 2), '#e9d3b0', bucket, axle))
  roof(p)
  p.push(part(new THREE.BoxGeometry(70, 46, 50), C.wood, post + 80, 23, 30))
  p.push(part(new THREE.BoxGeometry(74, 10, 54), C.gold, post + 80, 50, 30))
  return merged(p)
}

export const WHEEL = { r: 190, x: -WELL.post - 230 }

export function wheelGeometry() {
  const { r } = WHEEL
  const p: THREE.BufferGeometry[] = []
  for (const sz of [-30, 30]) {
    p.push(part(new THREE.TorusGeometry(r, 10, 5, 36), C.wood, 0, 0, sz))
    for (let k = 0; k < 4; k++) p.push(part(new THREE.BoxGeometry(7, r * 2, 7).rotateZ((k * Math.PI) / 4), '#6e4434', 0, 0, sz))
  }
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2
    p.push(part(new THREE.CylinderGeometry(6, 6, 66, 4).rotateX(Math.PI / 2), k % 3 ? C.wood : C.gold, Math.cos(a) * r, Math.sin(a) * r))
  }
  p.push(part(new THREE.CylinderGeometry(26, 26, 90, 10).rotateX(Math.PI / 2), C.gold))
  return merged(p)
}

export function frameGeometry() {
  const { r, x } = WHEEL
  const p: THREE.BufferGeometry[] = []
  for (const s of [-1, 1]) {
    const leg = new THREE.CylinderGeometry(14, 18, WELL.axle + 40, 6).rotateZ(s * 0.32)
    p.push(part(leg, C.wall, x + s * 95, (WELL.axle + 40) / 2 - 20, -44))
  }
  p.push(part(new THREE.BoxGeometry(90, 70, 70), C.wall, x + r * 0.3 + 140, WELL.axle, 0))
  p.push(part(new THREE.CylinderGeometry(14, 14, 230, 8).rotateZ(Math.PI / 2), C.wood, x + 115, WELL.axle, -44))
  return merged(p)
}

export function plaque() {
  return { y: EAVE + 92, z: DEEP / 2 + 6, tilt: 0 }
}

export function bucketGeometry() {
  const p = [
    part(new THREE.CylinderGeometry(44, 36, 58, 12), C.wood, 0, -29),
    part(new THREE.TorusGeometry(44, 4, 4, 14).rotateX(Math.PI / 2), C.ink, 0, -4),
    part(new THREE.TorusGeometry(38, 4, 4, 14).rotateX(Math.PI / 2), C.ink, 0, -44),
    part(new THREE.TorusGeometry(40, 3, 4, 12, Math.PI), C.ink, 0, 0),
  ]
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(12, 12, 4, 10), C.gold, -18 + k * 9, 2 + (k % 2) * 4, (k % 3) * 8 - 8))
  eyes(p, -26, 40, 14, 9)
  return merged(p)
}

export function ropeGeometry() {
  return part(new THREE.CylinderGeometry(3.5, 3.5, 1, 5, 1, true).translate(0, -0.5, 0), '#e9d3b0')
}

export const RIG = { ridge: RIDGE }
