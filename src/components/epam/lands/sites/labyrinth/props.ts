import * as THREE from 'three'
import { board, BRASS, envelope, eyes, folk, INK, IVORY, merged, PARCH, part, SEAL, SHADE, TEAL, WHITE } from './kit'
import { BOX, CHUTES, GATE, type P, SLING, SPIRE, stood, TURNSTILE, wallGeometry, WELL, rim } from './maze'

const SPIRE_S = 150

function spire(parts: THREE.BufferGeometry[]) {
  const p: THREE.BufferGeometry[] = [
    part(new THREE.CylinderGeometry(1.35, 1.5, 0.35, 20), PARCH, 0, 0.17, 0),
    part(new THREE.CylinderGeometry(0.6, 0.78, 4.2, 18), IVORY, 0, 2.45, 0),
    part(new THREE.BoxGeometry(0.42, 0.66, 0.06), INK, 0, 0.68, 0.76),
    part(new THREE.CylinderGeometry(1.0, 1.0, 0.12, 22), PARCH, 0, 4.55, 0),
    part(new THREE.CylinderGeometry(0.98, 0.98, 0.08, 22), INK, 0, 5.38, 0),
    part(new THREE.ConeGeometry(1.08, 1.6, 18), SEAL, 0, 6.22, 0),
    part(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), INK, 0, 7.3, 0),
  ]
  for (let i = 0; i < 30; i++) {
    const a = i * 0.46
    p.push(part(new THREE.BoxGeometry(0.36, 0.07, 0.22), PARCH, Math.sin(a) * 0.86, 0.45 + i * 0.118, Math.cos(a) * 0.86, a))
  }
  for (const [x, y] of [[-0.3, 1.7], [0.32, 2.4], [-0.25, 3.6]]) p.push(part(new THREE.BoxGeometry(0.16, 0.26, 0.05), INK, x, y, 0.7))
  eyes(p, 3.05, 0.66, 0.2, 0.17)
  const vane: THREE.BufferGeometry[] = []
  envelope(vane, 0.32, 7.45, 0, 0.75)
  p.push(...vane)
  for (const g of p) parts.push(stood(g, SPIRE, SPIRE_S))
}

export function wheelGeometry() {
  const p = [part(new THREE.CylinderGeometry(0.82, 0.82, 0.78, 24), PARCH, 0, 0, 0)]
  for (let row = 0; row < 2; row++)
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + row * 0.22
      const [x, z] = [Math.sin(a) * 0.82, Math.cos(a) * 0.82]
      p.push(part(new THREE.BoxGeometry(0.22, 0.24, 0.05), INK, x, row * 0.34 - 0.17, z, a))
      if ((i * 7 + row * 3) % 5 < 2) p.push(part(new THREE.BoxGeometry(0.18, 0.13, 0.08), IVORY, x * 1.04, row * 0.34 - 0.12, z * 1.04, a))
    }
  return merged(p)
}

export function keeperGeometry() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, { s: 1, color: '#5b3fb8', look: -0.4 })
  p.push(part(new THREE.ConeGeometry(0.32, 0.75, 10), WHITE, 0, 0.18, 0.3, 0, Math.PI))
  p.push(part(new THREE.CylinderGeometry(0.42, 0.42, 0.08, 14), INK, 0, 1.0, 0))
  p.push(part(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 14), INK, 0, 1.28, 0))
  p.push(part(new THREE.TorusGeometry(0.11, 0.025, 6, 12), BRASS, -0.15, 0.62, 0.52))
  p.push(part(new THREE.TorusGeometry(0.11, 0.025, 6, 12), BRASS, 0.15, 0.62, 0.52))
  p.push(part(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 6), BRASS, 0.62, 0.75, 0.15, 0, 0.5))
  p.push(part(new THREE.TorusGeometry(0.17, 0.05, 6, 12), BRASS, 0.62, 1.32, -0.12))
  p.push(part(new THREE.BoxGeometry(0.22, 0.08, 0.06), BRASS, 0.62, 0.3, 0.42))
  return merged(p)
}

export const KEEPER_AT: [number, number, number] = [0.25, 4.6, 1.02]
export const WHEEL_Y = 4.98
export { SPIRE_S }

function pillarBox(parts: THREE.BufferGeometry[]) {
  const p = [
    part(new THREE.CylinderGeometry(0.64, 0.68, 0.16, 16), INK, 0, 0.08, 0),
    part(new THREE.CylinderGeometry(0.52, 0.56, 1.5, 16), SEAL, 0, 0.9, 0),
    part(new THREE.CylinderGeometry(0.58, 0.58, 0.12, 16), INK, 0, 1.6, 0),
    part(new THREE.SphereGeometry(0.56, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), SEAL, 0, 1.64, 0),
    part(new THREE.BoxGeometry(0.5, 0.08, 0.06), INK, 0, 1.32, 0.53),
  ]
  eyes(p, 0.95, 0.5, 0.17, 0.15)
  for (const g of p) parts.push(stood(g, BOX, 70))
}

function well(parts: THREE.BufferGeometry[]) {
  const [at, r] = WELL
  rim(parts, at, r, PARCH)
  parts.push(part(new THREE.CircleGeometry(r * 0.9, 28), '#22304f', at[0], -at[1], 4))
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, { color: '#6c5aa8', cap: TEAL, look: -1 })
  p.push(part(new THREE.ConeGeometry(0.3, 1.1, 10), WHITE, 0, 0.0, 0.32, 0, Math.PI))
  for (const g of p) parts.push(stood(g, [at[0] + r + 36, at[1] + 10], 46))
  const rod = part(new THREE.CylinderGeometry(0.025, 0.04, 3.4, 5), SHADE, 0, 0, 0)
  rod.rotateZ(1.0)
  rod.translate(-1.2, 1.6, 0.3)
  parts.push(stood(rod, [at[0] + r + 36, at[1] + 10], 46))
  const line = part(new THREE.CylinderGeometry(0.012, 0.012, 2.1, 3), INK, -2.63, 1.46, 0.3)
  parts.push(stood(line, [at[0] + r + 36, at[1] + 10], 46))
  pile(parts, [at[0] + 150, at[1] + 120], 9)
  pile(parts, [-1260, -1180], 6)
}

function pile(parts: THREE.BufferGeometry[], at: P, n: number) {
  for (let i = 0; i < n; i++) {
    const p: THREE.BufferGeometry[] = []
    envelope(p, 0, 0, 0, 1)
    const a = i * 2.4
    const d = 18 + (i % 4) * 16
    for (const g of p) {
      g.rotateX(-Math.PI / 2)
      g.rotateY(a)
      g.translate(0, 0.05 + i * 0.07, 0)
      parts.push(stood(g, [at[0] + Math.cos(a) * d, at[1] + Math.sin(a) * d * 0.6], 40))
    }
  }
}

const WOOD = '#a8683a'

function sling(parts: THREE.BufferGeometry[]) {
  const p = [
    part(new THREE.BoxGeometry(0.22, 0.22, 2.0), WOOD, -0.55, 0.36, 0),
    part(new THREE.BoxGeometry(0.22, 0.22, 2.0), WOOD, 0.55, 0.36, 0),
    part(new THREE.BoxGeometry(1.3, 0.16, 0.22), WOOD, 0, 0.36, -0.75),
    part(new THREE.BoxGeometry(1.3, 0.16, 0.22), WOOD, 0, 0.36, 0.75),
    part(new THREE.BoxGeometry(0.16, 1.0, 0.16), WOOD, -0.55, 0.85, 0, 0, 0.2),
    part(new THREE.BoxGeometry(0.16, 1.0, 0.16), WOOD, 0.55, 0.85, 0, 0, 0.2),
    part(new THREE.BoxGeometry(0.16, 1.0, 0.16), WOOD, -0.55, 0.85, -0.2, 0, -0.35),
    part(new THREE.BoxGeometry(0.16, 1.0, 0.16), WOOD, 0.55, 0.85, -0.2, 0, -0.35),
    part(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 6), BRASS, 0, 1.15, 0, 0, 0).rotateZ(Math.PI / 2),
    part(new THREE.BoxGeometry(1.0, 0.18, 0.18), SEAL, 0, 0.52, 0.75),
  ]
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) {
    p.push(part(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12).rotateZ(Math.PI / 2), INK, x, 0.3, z))
    p.push(part(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 8).rotateZ(Math.PI / 2), BRASS, x * 1.05, 0.3, z))
  }
  for (const g of p) parts.push(stood(g, SLING, 60))
}

export function armGeometry() {
  return merged([
    part(new THREE.BoxGeometry(0.16, 0.16, 1.9), PARCH, 0, 0, 0.85),
    part(new THREE.CylinderGeometry(0.34, 0.24, 0.22, 12), TEAL, 0, 0.1, 1.8),
  ])
}

export function gateGeometry() {
  const p = [part(new THREE.BoxGeometry(6.6, 2.2, 0.5), IVORY, 3.3, 1.1, 0), part(new THREE.CylinderGeometry(0.4, 0.4, 2.8, 10), INK, 0, 1.4, 0)]
  for (let i = 0; i < 5; i++) p.push(part(new THREE.BoxGeometry(0.5, 2.24, 0.54), SEAL, 0.9 + i * 1.25, 1.1, 0))
  return merged(p)
}

export function turnstileGeometry() {
  const p = [part(new THREE.CylinderGeometry(0.35, 0.4, 2.6, 10), INK, 0, 1.3, 0), part(new THREE.ConeGeometry(0.5, 0.6, 10), TEAL, 0, 2.9, 0)]
  for (let i = 0; i < 4; i++) p.push(part(new THREE.BoxGeometry(4.2, 1.5, 0.3), i % 2 ? IVORY : PARCH, 2.2, 1.0, 0, (i * Math.PI) / 2))
  return merged(p)
}

const SIGNS: [number, P, number, number][] = [
  [0, [530, 1195], 60, 1.7],
  [1, [-275, 320], 46, 1.9],
  [2, [-1195, 300], 60, 1.7],
  [3, [-660, 560], 60, 1.7],
]

function signPosts(parts: THREE.BufferGeometry[]) {
  for (const [, at, s, h] of SIGNS) parts.push(stood(part(new THREE.CylinderGeometry(0.06, 0.08, h, 6), SHADE, 0, h / 2, 0), at, s))
  parts.push(stood(part(new THREE.CylinderGeometry(0.4, 0.5, 0.3, 10), PARCH, 0, 0.15, 0), [-1195, 300], 60))
}

export function signGeometry() {
  const p = SIGNS.map(([w, at, s, h]) => stood(board(w, 2.8, 0.62).translate(0, h + 0.05, 0.05), at, s))
  p.push(stood(board(5, 0.9, 0.2).translate(0, 1.08, 0.58), BOX, 70))
  for (const g of p) g.deleteAttribute('normal')
  return merged(p)
}

function chutes(parts: THREE.BufferGeometry[]) {
  for (const [at, r] of CHUTES) {
    rim(parts, at, r, BRASS)
    rim(parts, at, r * 0.82, '#b07a2a')
    parts.push(part(new THREE.CircleGeometry(r * 0.8, 28), '#1b2c48', at[0], -at[1], 4))
    parts.push(part(new THREE.RingGeometry(r * 0.5, r * 0.62, 28), '#2f6f88', at[0], -at[1], 4.5))
  }
  for (let i = 0; i < 4; i++) {
    const p: THREE.BufferGeometry[] = []
    folk(p, 0, 0, { cap: TEAL, look: 0.5 })
    for (const g of p) parts.push(stood(g, [-1330 + i * 36, -1150 + i * 22], 32))
  }
}

function clerks(parts: THREE.BufferGeometry[]) {
  const spots: [number, number, number][] = [[-40, 850, 0.6], [30, 905, 0.2], [275, 900, -0.3], [330, 835, -0.7], [-70, 760, 0.9]]
  spots.forEach(([dx, dy, look], k) => {
    const p: THREE.BufferGeometry[] = []
    folk(p, 0, 0, { cap: k % 2 ? TEAL : SEAL, look })
    envelope(p, 0.35, 0.55, 0.42, 0.55, -0.3)
    for (const g of p) parts.push(stood(g, [dx, dy], 36))
  })
}

export function staticGeometry() {
  const parts = wallGeometry()
  spire(parts)
  pillarBox(parts)
  well(parts)
  sling(parts)
  signPosts(parts)
  chutes(parts)
  clerks(parts)
  return merged(parts)
}

export { GATE, TURNSTILE }
