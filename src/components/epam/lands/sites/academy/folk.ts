import * as THREE from 'three'
import { C, eyes, hash, merged, part } from './kit'

function body(p: THREE.BufferGeometry[], r: number, color: string, seg = 12) {
  const b = new THREE.SphereGeometry(r, seg, seg - 4)
  b.scale(1, 0.92, 1)
  p.push(part(b, color, 0, r * 0.95, 0))
  for (const s of [-1, 1]) {
    const f = new THREE.SphereGeometry(r * 0.28, 5, 3)
    f.scale(1, 0.5, 1.4)
    p.push(part(f, C.ink, s * r * 0.4, r * 0.08, r * 0.2))
  }
}

function post(p: THREE.BufferGeometry[], h: number) {
  p.push(part(new THREE.CylinderGeometry(0.28, 0.32, 0.08, 12), C.wood, 0, 0.04, 0))
  p.push(part(new THREE.CylinderGeometry(0.045, 0.05, h, 8), C.wood, 0, h / 2, 0))
}

export function cadetGeometry() {
  const p: THREE.BufferGeometry[] = []
  body(p, 0.42, C.folk)
  const tunic = new THREE.SphereGeometry(0.445, 12, 3, 0, Math.PI * 2, Math.PI * 0.53, Math.PI * 0.47)
  tunic.scale(1, 0.92, 1)
  p.push(part(tunic, C.chalk, 0, 0.4, 0))
  p.push(part(new THREE.TorusGeometry(0.435, 0.035, 3, 12), C.teal, 0, 0.36, 0, 0, Math.PI / 2))
  p.push(part(new THREE.TorusGeometry(0.33, 0.04, 3, 12), C.teal, 0, 0.67, 0, 0, Math.PI / 2))
  p.push(part(new THREE.BoxGeometry(0.06, 0.22, 0.04), C.mint, 0.07, 0.58, -0.36, 0, 0.5))
  p.push(part(new THREE.BoxGeometry(0.06, 0.22, 0.04), C.mint, -0.07, 0.58, -0.36, 0, -0.5))
  eyes(p, 0.53, 0.39, 0.15, 0.135)
  return merged(p)
}

function elder(p: THREE.BufferGeometry[]) {
  body(p, 0.5, C.elder, 16)
  eyes(p, 0.6, 0.38, 0.16, 0.12, 12)
}

export function professorGeometry() {
  const p: THREE.BufferGeometry[] = []
  elder(p)
  for (const s of [-1, 1]) p.push(part(new THREE.TorusGeometry(0.13, 0.018, 4, 12), C.ink, s * 0.16, 0.6, 0.47))
  const beard = new THREE.ConeGeometry(0.2, 0.42, 8)
  beard.rotateX(Math.PI)
  p.push(part(beard, C.chalk, 0, 0.3, 0.42))
  p.push(part(new THREE.CylinderGeometry(0.3, 0.32, 0.12, 12), C.ink, 0, 0.96, 0))
  p.push(part(new THREE.BoxGeometry(0.85, 0.04, 0.85), C.ink, 0, 1.04, 0, Math.PI / 4))
  p.push(part(new THREE.ConeGeometry(0.05, 0.25, 6), C.mint, 0.5, 0.92, 0.1))
  const stick = new THREE.CylinderGeometry(0.018, 0.025, 0.95, 6)
  stick.rotateZ(-0.9)
  p.push(part(stick, C.oak, 0.75, 0.75, 0.15))
  return merged(p)
}

export function sergeantGeometry() {
  const p: THREE.BufferGeometry[] = []
  elder(p)
  p.push(part(new THREE.CylinderGeometry(0.4, 0.36, 0.2, 14), C.teal, 0, 0.92, 0))
  p.push(part(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14, 1, false, -Math.PI / 2, Math.PI), C.ink, 0, 0.83, 0.1))
  p.push(part(new THREE.BoxGeometry(0.18, 0.08, 0.04), C.mint, 0, 0.92, 0.39))
  for (const s of [-1, 1]) {
    const m = new THREE.SphereGeometry(0.15, 8, 6)
    m.scale(1.4, 0.55, 0.7)
    p.push(part(m, C.ink, s * 0.16, 0.42, 0.45, 0, 0))
  }
  p.push(part(new THREE.CylinderGeometry(0.03, 0.03, 0.18, 6), C.mint, 0.12, 0.36, 0.5, 0, Math.PI / 2))
  return merged(p)
}

export function deanGeometry() {
  const p: THREE.BufferGeometry[] = []
  elder(p)
  for (const s of [-1, 1]) {
    const brow = new THREE.SphereGeometry(0.11, 6, 4)
    brow.scale(1.5, 0.5, 0.6)
    p.push(part(brow, C.chalk, s * 0.17, 0.77, 0.46))
  }
  p.push(part(new THREE.CylinderGeometry(0.3, 0.32, 0.3, 12), C.ink, 0, 1.05, 0))
  p.push(part(new THREE.BoxGeometry(0.9, 0.05, 0.9), C.ink, 0, 1.22, 0, Math.PI / 4))
  p.push(part(new THREE.SphereGeometry(0.07, 6, 4), C.sun, 0, 1.27, 0))
  p.push(part(new THREE.ConeGeometry(0.06, 0.3, 6), C.sun, -0.55, 1.1, 0.2))
  const scroll = new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8)
  scroll.rotateZ(Math.PI / 2.4)
  p.push(part(scroll, C.chalk, 0.5, 0.45, 0.3))
  p.push(part(new THREE.TorusGeometry(0.065, 0.02, 4, 8), C.red, 0.5, 0.45, 0.3, Math.PI / 2))
  return merged(p)
}

function lumpy(r: number) {
  const b = new THREE.IcosahedronGeometry(r, 2)
  const v = new THREE.Vector3()
  const pos = b.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const n = v.clone().normalize()
    const lump = 1 + 0.22 * Math.sin(n.x * 5.1 + 1) * Math.sin(n.y * 4.3) + 0.12 * Math.sin(n.z * 7 + n.x * 3)
    v.copy(n).multiplyScalar(r * lump)
    pos.setXYZ(i, v.x, v.y * 0.9, v.z)
  }
  b.computeVertexNormals()
  return b
}

function crossEyes(p: THREE.BufferGeometry[], y: number, z: number) {
  for (const s of [-1, 1])
    for (const t of [-1, 1]) {
      const x = new THREE.BoxGeometry(0.2, 0.045, 0.04)
      x.rotateZ((t * Math.PI) / 4)
      p.push(part(x, C.white, s * 0.18, y, z))
    }
}

export function costumeGeometry() {
  const p = [part(lumpy(0.55), C.blob, 0, 0.62, 0)]
  crossEyes(p, 0.85, 0.55)
  p.push(part(new THREE.TorusGeometry(0.55, 0.025, 4, 20), C.seam, 0, 0.6, 0, 0, Math.PI / 2 - 0.1))
  const hole = new THREE.CircleGeometry(0.2, 14)
  hole.scale(1.3, 0.62, 1)
  p.push(part(hole, C.ink, 0, 0.52, 0.56))
  eyes(p, 0.53, 0.55, 0.1, 0.075)
  for (const s of [-1, 1]) {
    const f = new THREE.SphereGeometry(0.12, 6, 4)
    f.scale(1, 0.5, 1.4)
    p.push(part(f, C.ink, s * 0.17, 0.04, 0.1))
  }
  for (const k of [0, 1, 2]) p.push(part(new THREE.SphereGeometry(0.06 + k * 0.01, 5, 4), C.sick, -0.4 + k * 0.35, 0.9 - k * 0.12, 0.35))
  return merged(p)
}

export function bubbleGeometry() {
  const d = new THREE.CircleGeometry(0.5, 20)
  const tail = new THREE.Shape([new THREE.Vector2(-0.12, -0.4), new THREE.Vector2(0.1, -0.42), new THREE.Vector2(-0.25, -0.75)])
  return merged([
    part(d, C.white, 0, 0, 0),
    part(new THREE.ShapeGeometry(tail), C.white, 0, 0, 0),
    part(new THREE.PlaneGeometry(0.13, 0.42), C.red, 0, 0.08, 0.01),
    part(new THREE.CircleGeometry(0.075, 10), C.red, 0, -0.25, 0.01),
  ])
}

export function dummyGeometry() {
  const p = [part(lumpy(0.5), C.blob, 0, 1.1, 0)]
  post(p, 0.7)
  p.push(part(new THREE.TorusGeometry(0.5, 0.025, 4, 20), C.seam, 0, 1.05, 0, 0, Math.PI / 2 + 0.15))
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.4
    const spot = new THREE.SphereGeometry(0.07 + hash(k) * 0.06, 6, 4)
    p.push(part(spot, C.sick, Math.cos(a) * 0.48, 1.15 + Math.sin(k * 2.3) * 0.18, Math.sin(a) * 0.48))
  }
  crossEyes(p, 1.2, 0.52)
  p.push(part(new THREE.BoxGeometry(0.34, 0.035, 0.04), C.seam, 0, 0.95, 0.53))
  for (let k = -2; k <= 2; k++) p.push(part(new THREE.BoxGeometry(0.02, 0.09, 0.04), C.seam, k * 0.07, 0.95, 0.54))
  return merged(p)
}

export function hatGeometry() {
  return merged([
    part(new THREE.CylinderGeometry(0.28, 0.3, 0.14, 12), C.ink, 0, 0.07, 0),
    part(new THREE.BoxGeometry(0.78, 0.035, 0.78), C.ink, 0, 0.15, 0, Math.PI / 4),
    part(new THREE.SphereGeometry(0.04, 6, 4), C.mint, 0, 0.18, 0),
    part(new THREE.ConeGeometry(0.05, 0.22, 6), C.mint, 0.5, 0.06, 0),
  ])
}

function disc(r: number, color: string, x: number, y: number, z: number, back = false, sy = 1) {
  const g = new THREE.CircleGeometry(r, 18)
  g.scale(1, sy, 1)
  return part(g, color, x, y, z, back ? Math.PI : 0)
}

export function targetGeometry() {
  const p: THREE.BufferGeometry[] = []
  const y = 1.25
  post(p, 0.8)
  p.push(part(new THREE.TorusGeometry(0.46, 0.05, 4, 20), C.wood, 0, y, 0))
  p.push(disc(0.45, C.chalk, 0, y, 0.005))
  p.push(disc(0.3, C.folk, 0, y - 0.04, 0.012))
  p.push(disc(0.08, C.white, -0.1, y, 0.02), disc(0.08, C.white, 0.1, y, 0.02))
  p.push(disc(0.04, C.ink, -0.09, y - 0.02, 0.026), disc(0.04, C.ink, 0.11, y - 0.02, 0.026))
  p.push(disc(0.3, C.teal, 0, y + 0.08, 0.016, false, 0.2))
  p.push(disc(0.45, C.slate, 0, y, -0.005, true))
  const blob = new THREE.Shape()
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * Math.PI * 2
    const r = 0.3 + 0.07 * Math.sin(a * 5) + 0.03 * Math.sin(a * 3 + 1)
    if (k) blob.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    else blob.moveTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  p.push(part(new THREE.ShapeGeometry(blob), C.blob, 0, y, -0.012, Math.PI))
  for (const s of [-1, 1])
    for (const t of [-1, 1]) {
      const x = new THREE.PlaneGeometry(0.14, 0.035)
      x.rotateZ((t * Math.PI) / 4)
      p.push(part(x, C.white, s * 0.1, y + 0.04, -0.02, Math.PI))
    }
  return merged(p)
}

export function tasselGeometry() {
  const cord = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 5)
  return merged([
    part(cord, C.mint, 0, -0.25, 0),
    part(new THREE.SphereGeometry(0.05, 6, 4), C.mint, 0, -0.5, 0),
    part(new THREE.ConeGeometry(0.11, 0.32, 8), C.mint, 0, -0.66, 0, 0, Math.PI),
  ])
}
