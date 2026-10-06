import * as THREE from 'three'
import { C, eyes, merge, part, placed, stripes, type V3 } from './kit'
import { BOOTH, cellAt, CELL, DERRICK, DUG, GATE, GRID, HEAP, LARD, PILE, QUEUE, SHRINE, SKULL, SPINE, TENT } from './plan'

const cyl = (r0: number, r1: number, h: number, n = 8) => new THREE.CylinderGeometry(r0, r1, h, n)
const box = (x: number, y: number, z: number) => new THREE.BoxGeometry(x, y, z)
const ball = (r: number, w = 10, h = 7) => new THREE.SphereGeometry(r, w, h)

function pole(parts: THREE.BufferGeometry[], from: V3, to: V3, r: number, color: string) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const mid = a.clone().add(b).multiplyScalar(0.5)
  const g = cyl(r, r, a.distanceTo(b), 6)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize()))
  parts.push(part(g, color, { at: [mid.x, mid.y, mid.z] }))
}

function pennant(parts: THREE.BufferGeometry[], at: V3, color: string, s = 1) {
  const sh = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.5 * s, -0.12 * s), new THREE.Vector2(0, -0.24 * s)])
  parts.push(part(new THREE.ShapeGeometry(sh), color, { at }))
}

export function vertebra(parts: THREE.BufferGeometry[], at: V3 = [0, 0, 0], s = 1) {
  const [x, y, z] = at
  parts.push(part(cyl(0.4 * s, 0.4 * s, 0.3 * s, 14), C.bone, { at: [x, y + 0.42 * s, z], rot: [Math.PI / 2, 0, 0] }))
  parts.push(part(new THREE.TorusGeometry(0.4 * s, 0.07 * s, 5, 14), C.ivory, { at: [x, y + 0.42 * s, z + 0.15 * s] }))
  parts.push(part(cyl(0.2 * s, 0.2 * s, 0.32 * s, 10), C.shade, { at: [x, y + 0.42 * s, z + 0.01 * s], rot: [Math.PI / 2, 0, 0] }))
  parts.push(part(new THREE.TorusGeometry(0.22 * s, 0.08 * s, 5, 10, Math.PI), C.bone, { at: [x, y + 0.8 * s, z - 0.06 * s] }))
  parts.push(part(new THREE.ConeGeometry(0.11 * s, 0.62 * s, 6), C.bone, { at: [x, y + 1.25 * s, z - 0.12 * s], rot: [-0.25, 0, 0] }))
  parts.push(part(ball(0.09 * s, 6, 4), C.ivory, { at: [x, y + 1.55 * s, z - 0.2 * s] }))
  for (const side of [-1, 1]) {
    parts.push(part(new THREE.ConeGeometry(0.1 * s, 0.62 * s, 6), C.bone, { at: [x + side * 0.6 * s, y + 0.72 * s, z - 0.05 * s], rot: [0, 0, side * (Math.PI / 2 + 0.35)] }))
    parts.push(part(ball(0.08 * s, 6, 4), C.ivory, { at: [x + side * 0.88 * s, y + 0.84 * s, z - 0.05 * s] }))
  }
}

function tent() {
  const parts = [
    stripes(part(cyl(1, 1, 0.75, 20), C.ivory, { at: [0, 0.375, 0] }), C.terra, C.ivory, 20),
    stripes(part(new THREE.ConeGeometry(1.22, 0.95, 20), C.ivory, { at: [0, 1.22, 0] }), C.terra, C.ivory, 20),
    part(new THREE.TorusGeometry(1.15, 0.05, 4, 24), C.rust, { at: [0, 0.76, 0], rot: [Math.PI / 2, 0, 0] }),
    part(box(0.5, 0.62, 0.06), C.ink, { at: [0, 0.31, 1.0] }),
    part(box(0.62, 0.08, 0.1), C.rust, { at: [0, 0.66, 1.0] }),
    part(cyl(0.03, 0.03, 0.55), C.bark, { at: [0, 1.95, 0] }),
  ]
  pennant(parts, [0.02, 2.2, 0], C.mint, 1.1)
  for (const side of [-1, 1]) {
    parts.push(part(cyl(0.025, 0.025, 0.95), C.bark, { at: [side * 0.98, 0.47, 0.45] }))
    parts.push(part(ball(0.07, 6, 4), C.fat, { at: [side * 0.98, 0.98, 0.45] }))
  }
  eyes(parts, 1.28, 0.62, 0.17, 0.14)
  return merge(parts)
}

function booth() {
  const parts = [
    part(box(1, 0.8, 0.7), C.terra, { at: [0, 0.4, 0] }),
    part(box(0.7, 0.36, 0.05), C.ink, { at: [0, 0.52, 0.36] }),
    part(box(1.1, 0.08, 0.3), C.wood, { at: [0, 0.34, 0.48] }),
    stripes(part(new THREE.ConeGeometry(0.85, 0.45, 8), C.ivory, { at: [0, 1.03, 0], rot: [0, Math.PI / 8, 0] }), C.terra, C.ivory, 8),
  ]
  for (const side of [-1, 1]) parts.push(part(ball(0.12, 6, 4), C.fat, { at: [side * 0.3, 0.42, 0.62] }))
  return merge(parts)
}

function derrickBase() {
  const parts = [part(box(1.2, 0.14, 0.8), C.wood, { at: [0, 0.07, 0] }), part(cyl(0.07, 0.09, 1.7), C.wood, { at: [0, 0.98, 0] })]
  pole(parts, [-0.5, 0.1, -0.35], [0, 1.6, 0], 0.045, C.bark)
  pole(parts, [0.5, 0.1, -0.35], [0, 1.6, 0], 0.045, C.bark)
  parts.push(part(cyl(0.16, 0.16, 0.7, 10), C.bark, { at: [0, 0.32, 0.3], rot: [0, 0, Math.PI / 2] }))
  parts.push(part(cyl(0.17, 0.17, 0.5, 10), C.terra, { at: [0, 0.32, 0.3], rot: [0, 0, Math.PI / 2] }))
  for (const side of [-1, 1]) parts.push(part(box(0.06, 0.3, 0.06), C.ink, { at: [side * 0.4, 0.42, 0.3] }))
  pennant(parts, [0, 1.95, 0], C.terra, 0.8)
  parts.push(part(cyl(0.02, 0.02, 0.3), C.bark, { at: [0, 1.85, 0] }))
  return merge(parts)
}

export function boomGeometry() {
  const parts: THREE.BufferGeometry[] = []
  pole(parts, [0, 0, 0], [1.6, 0.25, 0], 0.05, C.wood)
  pole(parts, [-0.4, 0, 0], [0, 0, 0], 0.07, C.bark)
  parts.push(part(box(0.3, 0.3, 0.3), C.ink, { at: [-0.45, -0.05, 0] }))
  parts.push(part(ball(0.07, 6, 4), C.rust, { at: [1.6, 0.25, 0] }))
  return merge(parts)
}

export function loadGeometry() {
  const parts: THREE.BufferGeometry[] = []
  vertebra(parts, [0, -1.45, 0], 1)
  parts.push(part(new THREE.TorusGeometry(0.12, 0.03, 4, 10), C.ink, { at: [0, -0.02, 0] }))
  parts.push(part(cyl(0.015, 0.015, 0.1, 4), C.ink, { at: [0, -0.1, 0] }))
  return merge(parts)
}

export function ropeGeometry() {
  return merge([part(cyl(0.6, 0.6, 1, 4), C.bark, { at: [0, -0.5, 0] })])
}

function shrine() {
  const parts = [part(box(1.6, 0.14, 0.7), C.shade, { at: [0, 0.07, 0] }), part(box(1.2, 0.12, 0.5), C.bone, { at: [0, 0.2, 0] })]
  parts.push(part(new THREE.TorusGeometry(0.62, 0.09, 6, 16, Math.PI), C.bone, { at: [0, 0.26, -0.12] }))
  parts.push(part(new THREE.TorusGeometry(0.45, 0.06, 6, 14, Math.PI), C.ivory, { at: [0, 0.26, -0.1] }))
  for (let i = 0; i < 7; i++) {
    const x = -0.5 + i * (1 / 6)
    const h = 0.16 + ((i * 37) % 5) * 0.035
    parts.push(part(cyl(0.035, 0.035, h, 6), C.ivory, { at: [x, 0.26 + h / 2, 0.15] }))
    parts.push(part(new THREE.ConeGeometry(0.03, 0.08, 5), C.fat, { at: [x, 0.3 + h, 0.15] }))
  }
  for (const [x, c] of [[-0.68, C.terra], [0.68, C.mint], [-0.78, C.fat], [0.76, C.terra]] as const)
    parts.push(part(ball(0.08, 6, 4), c, { at: [x, 0.2, 0.25] }))
  return merge(parts)
}

function gate() {
  const parts = [
    part(new THREE.TorusGeometry(0.8, 0.1, 6, 18, Math.PI), C.bone, { at: [0, 0.05, 0] }),
    part(new THREE.TorusGeometry(0.8, 0.04, 4, 18, Math.PI), C.ivory, { at: [0, 0.05, 0.08] }),
    part(cyl(0.012, 0.012, 0.3, 4), C.ink, { at: [0, 0.7, 0] }),
    part(ball(0.11, 8, 6), C.fat, { at: [0, 0.52, 0] }),
  ]
  for (const side of [-1, 1]) {
    parts.push(part(ball(0.17, 8, 6), C.bone, { at: [side * 0.8, 0.05, 0] }))
    parts.push(part(new THREE.ConeGeometry(0.06, 0.3, 5), C.bone, { at: [side * 0.6, 0.55, 0.05], rot: [0, 0, side * 0.9] }))
  }
  return merge(parts)
}

function lardWhale() {
  const parts = [
    part(box(2.8, 0.32, 1.0), C.terra, { at: [0, 0.16, 0] }),
    part(box(2.9, 0.06, 1.1), C.rust, { at: [0, 0.34, 0] }),
    part(ball(0.5, 16, 10), C.lard, { at: [0.05, 1.32, 0], size: [2.1, 1.0, 0.95] }),
    part(ball(0.42, 12, 8), C.lard, { at: [0.78, 1.36, 0.04], size: [1, 0.95, 1] }),
    part(new THREE.ConeGeometry(0.22, 0.75, 8), C.lard, { at: [-1.2, 1.5, 0], rot: [0, 0, 1.0] }),
    part(box(0.12, 0.42, 0.5), C.lard, { at: [-1.55, 1.85, 0], rot: [0.5, 0, 0.3] }),
    part(box(0.12, 0.42, 0.5), C.lard, { at: [-1.55, 1.85, 0], rot: [-0.5, 0, 0.3] }),
    part(new THREE.TorusGeometry(0.22, 0.035, 4, 10, Math.PI), C.ink, { at: [0.95, 1.22, 0.36], rot: [0, 0.5, Math.PI] }),
  ]
  for (const [x, y] of [[0.55, 2.0], [0.47, 2.18], [0.63, 2.2], [0.55, 2.38]]) parts.push(part(ball(0.07, 6, 4), C.mint, { at: [x, y, 0] }))
  for (const [x, z] of [[-0.55, 0.28], [0.65, 0.28], [-0.55, -0.28], [0.65, -0.28]]) {
    parts.push(part(cyl(0.11, 0.09, 0.75, 6), C.lard, { at: [x, 0.72, z], rot: [0, 0, x > 0 ? -0.15 : 0.15] }))
    parts.push(part(ball(0.12, 6, 4), C.lard, { at: [x + (x > 0 ? 0.1 : -0.1), 0.39, z + 0.05], size: [1.5, 0.6, 1.1] }))
  }
  for (let i = 0; i < 4; i++) parts.push(part(new THREE.TorusGeometry(0.3, 0.03, 4, 10, Math.PI), C.shade, { at: [-0.55 + i * 0.27, 1.25, 0.42], rot: [0, 0, Math.PI] }))
  eyes(parts, 1.52, 0.4, 0.15, 0.12)
  for (const p of parts.slice(-4)) p.translate(0.82, 0, 0)
  return merge(parts)
}

function skull() {
  const parts = [
    part(cyl(0.16, 0.55, 2.2, 12), C.bone, { at: [0.9, 0.18, 0], rot: [0, 0, -Math.PI / 2], size: [0.42, 1, 1] }),
    part(ball(0.62, 14, 9), C.bone, { at: [-0.45, 0.32, 0], size: [1, 0.62, 1.15] }),
    part(ball(0.5, 12, 8), C.ivory, { at: [-0.55, 0.5, 0], size: [1, 0.5, 0.95] }),
  ]
  for (const side of [-1, 1]) {
    parts.push(part(cyl(0.05, 0.08, 2.1, 6), C.shade, { at: [0.85, 0.06, side * 0.52], rot: [0, side * 0.1, -Math.PI / 2] }))
    parts.push(part(ball(0.2, 8, 6), C.ink, { at: [-0.05, 0.3, side * 0.5], size: [1, 0.7, 0.5] }))
  }
  eyes(parts, 0.62, 0.42, 0.2, 0.17)
  for (const p of parts.slice(-4)) p.translate(-0.45, 0, 0)
  parts.push(part(cyl(0.025, 0.025, 1.1, 5), C.wood, { at: [1.55, 0.55, 0.45] }))
  parts.push(part(box(0.5, 0.18, 0.03), C.ivory, { at: [1.8, 0.95, 0.45] }))
  for (let i = 0; i < 5; i++) parts.push(part(box(0.02, 0.1, 0.035), C.ink, { at: [1.6 + i * 0.1, 0.95, 0.45] }))
  return merge(parts)
}

function stake(parts: THREE.BufferGeometry[], tall = 1) {
  parts.push(part(cyl(0.05, 0.03, tall, 5), C.wood, { at: [0, tall / 2, 0] }))
  parts.push(part(box(0.18, 0.1, 0.02), C.terra, { at: [0.09, tall - 0.08, 0] }))
}

function heap() {
  return merge([
    part(new THREE.ConeGeometry(1, 0.55, 12), C.sand, { at: [0, 0.27, 0] }),
    part(new THREE.ConeGeometry(0.6, 0.35, 10), C.ochre, { at: [0.35, 0.52, 0.1] }),
    part(cyl(0.03, 0.03, 0.9), C.wood, { at: [-0.3, 0.8, 0.2], rot: [0, 0, 0.5] }),
    part(box(0.2, 0.25, 0.04), C.shade, { at: [-0.62, 1.15, 0.2], rot: [0, 0, 0.5] }),
  ])
}

function pile() {
  const parts: THREE.BufferGeometry[] = [part(box(1.6, 0.12, 0.9), C.wood, { at: [0, 0.06, 0] })]
  vertebra(parts, [-0.45, 0.12, 0], 0.55)
  vertebra(parts, [0.4, 0.12, 0.05], 0.6)
  vertebra(parts, [0, 0.12, -0.25], 0.5)
  return merge(parts)
}

function post() {
  const parts: THREE.BufferGeometry[] = []
  stake(parts, 1)
  return merge(parts)
}

function stanchion() {
  return merge([part(cyl(0.06, 0.06, 0.9, 5), C.rust, { at: [0, 0.45, 0] }), part(ball(0.1, 6, 4), C.fat, { at: [0, 0.92, 0] })])
}

function signPost(w: number) {
  return merge([
    part(box(w + 0.12, 0.62, 0.05), C.wood, { at: [0, 0.95, -0.04] }),
    part(cyl(0.05, 0.05, 1.2, 5), C.bark, { at: [-w * 0.35, 0.6, -0.02] }), part(cyl(0.05, 0.05, 1.2, 5), C.bark, { at: [w * 0.35, 0.6, -0.02] })])
}

export const SIGNS: { at: [number, number]; size: number; row: number; y: number; z: number; posts: boolean }[] = [
  { at: TENT, size: 200, row: 0, y: 1.12, z: 1.98, posts: false },
  { at: BOOTH, size: 70, row: 1, y: 2.45, z: 0.2, posts: false },
  { at: [GRID.x - 40, GRID.y + GRID.rows * CELL + 70], size: 95, row: 2, y: 0.95, z: 0.02, posts: true },
  { at: [SHRINE[0] - 230, SHRINE[1] + 40], size: 80, row: 3, y: 0.95, z: 0.02, posts: true },
  { at: [LARD[0] + 40, LARD[1] + 130], size: 75, row: 4, y: 0.95, z: 0.02, posts: true },
]

export function staticGeometry() {
  const out: THREE.BufferGeometry[] = [
    placed(tent(), TENT[0], TENT[1], 300),
    placed(booth(), BOOTH[0], BOOTH[1], 120),
    placed(derrickBase(), DERRICK[0], DERRICK[1], 230),
    placed(shrine(), SHRINE[0], SHRINE[1], 170),
    placed(gate(), GATE[0], GATE[1], 95, 1.35),
    placed(lardWhale(), LARD[0], LARD[1], 150, 0.15),
    placed(heap(), HEAP[0], HEAP[1], 150),
    placed(pile(), PILE[0], PILE[1], 130, 0.2),
    placed(skull(), SKULL[0], SKULL[1] + 10, 150, 0.08),
  ]
  for (let c = 0; c <= GRID.cols; c++)
    for (let r = 0; r <= GRID.rows; r++) out.push(placed(post(), GRID.x + c * CELL, GRID.y + r * CELL, 42))
  const dug = new Set(DUG.map(([c, r]) => `${c},${r}`))
  SPINE.forEach(([x, y], i) => {
    const c = Math.floor((x - GRID.x) / CELL)
    const r = Math.floor((y - GRID.y) / CELL)
    if (!dug.has(`${c},${r}`)) return
    const parts: THREE.BufferGeometry[] = []
    vertebra(parts, [0, -0.1, 0], 1)
    out.push(placed(merge(parts), x, y, 70 + (i % 3) * 6, (i % 2 ? 0.2 : -0.2) + 0.15))
  })
  const [cx, cy] = cellAt(1, 1)
  const odd: THREE.BufferGeometry[] = []
  vertebra(odd, [0, 0, 0], 0.35)
  out.push(placed(merge(odd), cx + 60, cy + 40, 60))
  for (let i = 1; i < QUEUE.length; i++)
    for (const side of [-1, 1]) {
      const [x0, y0] = QUEUE[i - 1]
      const [x1, y1] = QUEUE[i]
      const a = Math.atan2(y1 - y0, x1 - x0)
      out.push(placed(stanchion(), x0 - Math.sin(a) * side * 42, y0 + Math.cos(a) * side * 42, 32))
    }
  for (const s of SIGNS) if (s.posts) out.push(placed(signPost(2.4), s.at[0], s.at[1], s.size))
  return merge(out)
}
