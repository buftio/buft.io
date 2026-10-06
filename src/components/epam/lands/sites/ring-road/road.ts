import * as THREE from 'three'
import { C, rand } from './kit'
import { LANE_PTS, ROAD_PTS, HALF } from './map'

type Stop = [number, string, number]

const ROAD_X: Stop[] = [
  [-1.32, C.dust, 0],
  [-1.1, C.dust, 0.6],
  [-1.02, C.dust, 0.85],
  [-1, C.rut, 0.95],
  [-0.93, C.road, 0.95],
  [-0.48, C.road, 0.95],
  [-0.45, C.rut, 0.95],
  [-0.35, C.rut, 0.95],
  [-0.32, C.road, 0.95],
  [0, C.crown, 0.95],
  [0.32, C.road, 0.95],
  [0.35, C.rut, 0.95],
  [0.45, C.rut, 0.95],
  [0.48, C.road, 0.95],
  [0.93, C.road, 0.95],
  [1, C.rut, 0.95],
  [1.02, C.dust, 0.85],
  [1.1, C.dust, 0.6],
  [1.32, C.dust, 0],
]

const LANE_X: Stop[] = [
  [-1.25, C.wood, 0],
  [-1, C.wood, 0.95],
  [-0.85, C.plank, 0.95],
  [0.85, C.plank, 0.95],
  [1, C.wood, 0.95],
  [1.25, C.wood, 0],
]

const col = new THREE.Color()
const tint = new THREE.Color()

function ribbon(pts: [number, number][], half: number, stops: Stop[], fade: number, stripe: number, seed: number) {
  const r = rand(seed)
  const pos: number[] = []
  const rgba: number[] = []
  const idx: number[] = []
  let run = 0
  const n = pts.length
  const w = stops.length
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i]
    const [ax, ay] = pts[Math.max(0, i - 1)]
    const [bx, by] = pts[Math.min(n - 1, i + 1)]
    if (i) run += Math.hypot(x - ax, y - ay)
    const l = Math.hypot(bx - ax, by - ay) || 1
    const nx = -(by - ay) / l
    const ny = (bx - ax) / l
    const end = Math.min(1, run / fade, (totalLen(pts) - run) / fade)
    const shade = stripe ? (Math.floor(run / stripe) % 2 ? 0.86 : 1) : 0.93 + r() * 0.1
    const sway = stripe ? 0 : (r() - 0.5) * 6
    for (const [k, c, a] of stops) {
      const wob = stripe ? 0 : sway + (Math.abs(k) > 1 ? (r() - 0.5) * 14 : 0)
      pos.push(x + nx * (k * half + wob), -(y + ny * (k * half + wob)), 2)
      tint.set(c)
      col.copy(tint).multiplyScalar(shade)
      rgba.push(col.r, col.g, col.b, a * Math.max(0, end))
    }
  }
  for (let i = 0; i < n - 1; i++)
    for (let j = 0; j < w - 1; j++) {
      const a = i * w + j
      idx.push(a, a + w, a + 1, a + 1, a + w, a + w + 1)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(rgba, 4))
  g.setIndex(idx)
  return g
}

const lens = new WeakMap<object, number>()
function totalLen(pts: [number, number][]) {
  const hit = lens.get(pts)
  if (hit !== undefined) return hit
  let s = 0
  for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  lens.set(pts, s)
  return s
}

function dense(pts: [number, number][], step: number): [number, number][] {
  const out: [number, number][] = [pts[0]]
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1]
    const [bx, by] = pts[i]
    const k = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / step))
    for (let j = 1; j <= k; j++) out.push([ax + ((bx - ax) * j) / k, ay + ((by - ay) * j) / k])
  }
  return out
}

export function roads() {
  const a = ribbon(ROAD_PTS, HALF, ROAD_X, 380, 0, 3)
  const b = ribbon(dense(LANE_PTS, 12), 36, LANE_X, 140, 22, 5)
  const g = new THREE.BufferGeometry()
  const pos = new Float32Array([...a.getAttribute('position').array, ...b.getAttribute('position').array])
  const rgba = new Float32Array([...a.getAttribute('color').array, ...b.getAttribute('color').array])
  const off = a.getAttribute('position').count
  const idx = [...Array.from(a.index!.array), ...Array.from(b.index!.array, (i) => i + off)]
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.BufferAttribute(rgba, 4))
  g.setIndex(idx)
  a.dispose()
  b.dispose()
  return g
}

export function trail() {
  const r = rand(9)
  const stops: Stop[] = [
    [-1, C.white, 0],
    [0, C.white, 1],
    [1, C.white, 0],
  ]
  const g = ribbon(dense(ROAD_PTS, 16), 10, stops, 300, 0, 2)
  const c = g.getAttribute('color')
  for (let i = 0; i < c.count; i++) {
    const k = r() < 0.18 ? 1 : 0.35
    c.setXYZ(i, 0.75 * k + 0.25 * k, 0.85 * k + 0.15 * k, k)
  }
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) + 14)
  return g
}

export function band() {
  const stops: Stop[] = [
    [-1, C.white, 0],
    [-0.4, C.white, 0.7],
    [0, C.white, 1],
    [0.4, C.white, 0.7],
    [1, C.white, 0],
  ]
  return ribbon(ROAD_PTS, 190, stops, 500, 0, 4)
}
