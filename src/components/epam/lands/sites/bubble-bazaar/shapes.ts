import * as THREE from 'three'
import { BERRY, BUTTER, CORAL, CREAM, eyes, INK, LILAC, merged, MINT, part, TEAL } from './kit'

const WOOD = '#c98f5e'
const DECK = '#ecd2ab'
const LEAF = '#7ccf5a'

type Look = { main: string; alt: string; counter: string; post: string }

const LOOKS: Look[] = [
  { main: CORAL, alt: CREAM, counter: CREAM, post: WOOD },
  { main: TEAL, alt: CREAM, counter: CREAM, post: WOOD },
  { main: LILAC, alt: BUTTER, counter: CREAM, post: WOOD },
]

function bolt(c: string, x: number, y: number, z: number) {
  const g = new THREE.CylinderGeometry(0.065, 0.065, 0.32, 10)
  g.rotateZ(Math.PI / 2)
  return part(g, c, x, y, z)
}

function goods(P: THREE.BufferGeometry[], kind: number) {
  if (kind === 0)
    for (let k = 0; k < 9; k++) {
      const c = [CORAL, BUTTER, LEAF, BERRY][k % 4]
      const row = Math.floor(k / 5)
      P.push(part(new THREE.SphereGeometry(0.075, 6, 4), c, -0.5 + (k % 5) * 0.25 + row * 0.12, 0.38 + row * 0.08, 0.42 - row * 0.1))
    }
  if (kind === 1) {
    for (let k = 0; k < 5; k++) {
      P.push(part(new THREE.CylinderGeometry(0.07, 0.07, 0.14, 10), BUTTER, -0.5 + k * 0.25, 0.38, 0.42))
      P.push(part(new THREE.CylinderGeometry(0.08, 0.08, 0.03, 10), TEAL, -0.5 + k * 0.25, 0.465, 0.42))
    }
    P.push(part(new THREE.CylinderGeometry(0.26, 0.28, 0.18, 14), BUTTER, 0.95, 0.16, 0.5))
    P.push(part(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 14), '#ffe9a8', 0.95, 0.27, 0.5))
  }
  if (kind === 2) {
    ;[TEAL, CORAL, MINT, BERRY].forEach((c, k) => P.push(bolt(c, -0.51 + k * 0.34, 0.375, 0.42)))
    ;[BUTTER, LILAC, TEAL].forEach((c, k) => P.push(bolt(c, -0.34 + k * 0.34, 0.49, 0.38)))
  }
}

function booth(look: Look, kind: number, ragged = false) {
  const P: THREE.BufferGeometry[] = []
  P.push(part(new THREE.CylinderGeometry(0.98, 1, 0.07, 22), ragged ? '#4a3348' : DECK, 0, 0.035, 0.05))
  P.push(part(new THREE.BoxGeometry(1.5, 0.24, 0.5), look.counter, 0, 0.19, 0.3))
  P.push(part(new THREE.BoxGeometry(1.53, 0.08, 0.53), look.main, 0, 0.27, 0.3))
  P.push(part(new THREE.BoxGeometry(0.34, 0.12, 0.26), look.post, 0.4, 0.13, -0.12))
  for (const x of [-0.72, 0.72])
    for (const [z, h] of [[-0.38, 1.5], [0.22, 1.16]]) P.push(part(new THREE.CylinderGeometry(0.03, 0.03, h, 6), look.post, x, h / 2, z))
  const tip = Math.atan2(0.32, 0.6)
  for (let k = 0; k < 6; k++) {
    const x = -0.67 + k * 0.268
    const sag = ragged && k % 2 ? -0.05 : 0
    P.push(part(new THREE.BoxGeometry(0.27, 0.035, 0.72), k % 2 ? look.alt : look.main, x, 1.34 + sag, -0.08, 0, tip))
    const flap = new THREE.CircleGeometry(ragged ? 0.1 : 0.135, 8, Math.PI, Math.PI)
    P.push(part(flap, k % 2 ? look.main : look.alt, x, 1.17, 0.26))
  }
  P.push(part(new THREE.BoxGeometry(1.48, 0.5, 0.03), look.alt, 0, 1.0, -0.4))
  P.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 5), INK, 0, 1.68, -0.38))
  const pennant = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.3, -0.07), new THREE.Vector2(0, -0.15)])
  P.push(part(new THREE.ShapeGeometry(pennant), look.main, 0.02, 1.88, -0.38))
  goods(P, kind)
  return P
}

function dome() {
  const P: THREE.BufferGeometry[] = []
  const Z = -0.3
  P.push(part(new THREE.CylinderGeometry(0.98, 1, 0.07, 22), DECK, 0, 0.035, 0.05))
  P.push(part(new THREE.CylinderGeometry(0.6, 0.62, 0.4, 16), CREAM, 0, 0.27, Z))
  for (let k = 0; k < 12; k++) {
    const wedge = new THREE.SphereGeometry(0.64, 2, 6, (k * Math.PI) / 6, Math.PI / 6, 0, Math.PI / 2)
    P.push(part(wedge, k % 2 ? CREAM : BERRY, 0, 0.46, Z))
  }
  for (let k = 0; k < 12; k++) {
    const flap = new THREE.CircleGeometry(0.09, 6, Math.PI, Math.PI)
    const a = (k / 12) * Math.PI * 2
    P.push(part(flap, k % 2 ? BERRY : CREAM, Math.sin(a) * 0.645, 0.45, Z + Math.cos(a) * 0.645, a))
  }
  P.push(part(new THREE.CylinderGeometry(0.17, 0.17, 0.34, 10, 1, false, -Math.PI / 2, Math.PI), INK, 0.25, 0.24, Z + 0.52))
  P.push(part(new THREE.SphereGeometry(0.1, 10, 8), BUTTER, 0, 1.18, Z))
  P.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.16, 5), INK, 0, 1.1, Z))
  P.push(part(new THREE.CylinderGeometry(0.2, 0.16, 0.24, 10), WOOD, -0.3, 0.19, 0.74))
  P.push(part(new THREE.SphereGeometry(0.13, 12, 10), '#ff9ec2', -0.3, 0.43, 0.74))
  return P
}

export function stallGeometry(kind: number) {
  return merged(kind === 3 ? dome() : booth(LOOKS[kind], kind))
}

export function shadyGeometry() {
  const P = booth({ main: '#3a2147', alt: '#6b3a6e', counter: '#5a3f52', post: '#3a2a33' }, -1, true)
  P.push(part(new THREE.CylinderGeometry(0.015, 0.015, 0.25, 4), INK, 0.62, 0.92, 0.66))
  P.push(part(new THREE.SphereGeometry(0.08, 8, 6), '#c8ff3a', 0.62, 0.76, 0.66))
  P.push(part(new THREE.BoxGeometry(0.22, 0.16, 0.2), '#5a3f52', -0.5, 0.45, 0.3))
  P.push(part(new THREE.BoxGeometry(0.2, 0.02, 0.18), '#6b3a6e', -0.5, 0.54, 0.3, 0, -0.5))
  return merged(P)
}

export function folkGeometry() {
  const P: THREE.BufferGeometry[] = []
  const body = new THREE.SphereGeometry(0.5, 10, 7)
  body.scale(1, 0.92, 0.9)
  P.push(part(body, '#4b36a6', 0, 0.48, 0))
  for (const side of [-1, 1]) P.push(part(new THREE.SphereGeometry(0.14, 5, 3), '#2f2170', side * 0.22, 0.06, 0.08))
  eyes(P, 0.62, 0.33, 0.17, 0.17)
  return merged(P)
}

export function hatGeometry() {
  return merged([
    part(new THREE.ConeGeometry(0.32, 0.42, 10), '#ffffff', 0, 1.06, -0.04, 0, -0.15),
    part(new THREE.SphereGeometry(0.08, 6, 4), '#ffffff', 0, 1.3, -0.07),
  ])
}

export function topHatGeometry() {
  return merged([
    part(new THREE.CylinderGeometry(0.42, 0.42, 0.04, 14), INK, 0, 0.9, 0),
    part(new THREE.CylinderGeometry(0.26, 0.28, 0.55, 14), INK, 0, 1.18, 0),
    part(new THREE.CylinderGeometry(0.285, 0.285, 0.08, 14), '#c8ff3a', 0, 0.98, 0),
  ])
}

export function blobGeometry() {
  const P: THREE.BufferGeometry[] = []
  const goo = new THREE.SphereGeometry(0.5, 12, 9)
  goo.scale(1, 0.85, 1)
  P.push(part(goo, '#1c2410', 0, 0.42, 0))
  for (const side of [-1, 1]) {
    P.push(part(new THREE.SphereGeometry(0.13, 8, 6), '#c8ff3a', side * 0.17, 0.55, 0.36))
    P.push(part(new THREE.SphereGeometry(0.05, 6, 4), INK, side * 0.15, 0.53, 0.47))
  }
  return merged(P)
}

export function podiumGeometry() {
  const P: THREE.BufferGeometry[] = []
  for (let k = 0; k < 16; k++) {
    const wedge = new THREE.CylinderGeometry(1, 1.05, 0.22, 2, 1, false, (k * Math.PI) / 8, Math.PI / 8)
    P.push(part(wedge, k % 2 ? CREAM : TEAL, 0, 0.11, 0))
  }
  P.push(part(new THREE.CylinderGeometry(0.85, 0.85, 0.04, 24), BUTTER, 0, 0.24, 0))
  return merged(P)
}
