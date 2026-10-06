import * as THREE from 'three'
import { TOWER_SIZE } from './buildings'
import { bodyMatrix, roofMatrix } from './homes'
import { rng, TILT, UP_Y, UP_Z } from './kit'
import { along, BATH, follicle, HALF, HOUSES, LENGTH, near, PLAZA, SPRING, TOWER, type House, type Spot } from './plan'

const m = new THREE.Matrix4()
const SEG = 8

const eave = (h: House) => new THREE.Vector3(0, 0.96, 0.5).applyMatrix4(bodyMatrix(h, m))
export const apex = (h: House) => new THREE.Vector3(0, 1, 0).applyMatrix4(roofMatrix(h, m))
const chimney = (h: House) => new THREE.Vector3(0.3, 0.82, -0.18).applyMatrix4(roofMatrix(h, m))

export type Rope = THREE.Vector3[]

function rope(a: THREE.Vector3, b: THREE.Vector3): Rope {
  const sag = a.distanceTo(b) * 0.12
  return Array.from({ length: SEG + 1 }, (_, i) => {
    const t = i / SEG
    const d = 4 * t * (1 - t) * sag
    return new THREE.Vector3().lerpVectors(a, b, t).add(new THREE.Vector3(0, -d * UP_Y, -d * UP_Z))
  })
}

export function onRope(r: Rope, t: number, out: THREE.Vector3) {
  const f = Math.max(0, Math.min(0.9999, t)) * SEG
  const i = Math.floor(f)
  return out.lerpVectors(r[i], r[i + 1], f - i)
}

function crossings() {
  const out: Rope[] = []
  const o: Spot = { x: 0, y: 0, tx: 0, ty: 0 }
  for (let s = 200; s < LENGTH - 160; s += 140) {
    along(s, o)
    if (Math.hypot(o.x - PLAZA.x, o.y - PLAZA.y) < PLAZA.r - 40) continue
    const pick = (side: number) => {
      let best: House | null = null
      let score = Infinity
      for (const h of HOUSES) {
        const a = (h.x - o.x) * o.tx + (h.y - o.y) * o.ty
        const lat = ((h.x - o.x) * -o.ty + (h.y - o.y) * o.tx) * side
        if (Math.abs(a) > 110 || lat < HALF + 30 || lat > 320) continue
        if (lat + Math.abs(a) < score) {
          score = lat + Math.abs(a)
          best = h
        }
      }
      return best
    }
    const a = pick(1)
    const b = pick(-1)
    if (a && b) out.push(rope(eave(a), eave(b)))
  }
  return out
}

function alleys() {
  const r = rng(17)
  const out: Rope[] = []
  const used = new Map<House, number>()
  for (let i = 0; i < HOUSES.length && out.length < 110; i++)
    for (let j = i + 1; j < HOUSES.length; j++) {
      const a = HOUSES[i]
      const b = HOUSES[j]
      const d = Math.hypot(a.x - b.x, a.y - b.y)
      if (d < 105 || d > 200 || Math.abs(a.y - b.y) > d * 0.45) continue
      if (!follicle(a.x, a.y) || (used.get(a) ?? 0) > 1 || (used.get(b) ?? 0) > 1 || r() > 0.3) continue
      used.set(a, (used.get(a) ?? 0) + 1)
      used.set(b, (used.get(b) ?? 0) + 1)
      out.push(rope(eave(a), eave(b)))
      break
    }
  return out
}

export const STREET_ROPES = crossings()
export const ROPES = [...STREET_ROPES, ...alleys()]
export const WIRE = STREET_ROPES.reduce<Rope | null>((a, b) => {
  const d = (r: Rope) => r[SEG / 2].distanceTo(new THREE.Vector3(210, -560, 100))
  return !a || d(b) < d(a) ? b : a
}, null)

export type Cloth = { rope: number; t: number; w: number; h: number; c: number; phase: number; kind: number }

export const CLOTHES = (() => {
  const r = rng(29)
  const out: Cloth[] = []
  ROPES.forEach((p, k) => {
    const len = p[0].distanceTo(p[SEG])
    for (let d = 26 + r() * 20; d < len - 24; d += 30 + r() * 24) {
      const kind = r() < 0.45 ? 0 : r() < 0.6 ? 1 : 2
      const [w, h] = [[34, 32], [30, 38], [18, 26]][kind]
      out.push({ rope: k, t: d / len, w, h, c: Math.floor(r() * 8), phase: r() * 6, kind })
    }
  })
  return out
})()

export const CATS = (() => {
  const r = rng(41)
  const picks = HOUSES.filter((h) => near(h.x, h.y) < 360 && r() < 0.22).slice(0, 18)
  return picks.map((h) => ({ at: apex(h), phase: r() * 9, coat: Math.floor(r() * 5) }))
})()

export const HOPS = (() => {
  const start = HOUSES.reduce((a, b) => (Math.hypot(b.x + 420, b.y + 140) < Math.hypot(a.x + 420, a.y + 140) ? b : a))
  const chain = [start]
  while (chain.length < 6) {
    const last = chain[chain.length - 1]
    const next = HOUSES.filter((h) => !chain.includes(h) && h.x > last.x + 40 && Math.hypot(h.x - last.x, h.y - last.y) < 190).sort(
      (a, b) => Math.hypot(a.x - last.x, a.y - last.y) - Math.hypot(b.x - last.x, b.y - last.y),
    )[0]
    if (!next) break
    chain.push(next)
  }
  return chain.map(apex)
})()

export const PERCH = new THREE.Vector3(0.42, 4.39, 0.5)
  .multiplyScalar(TOWER_SIZE)
  .applyQuaternion(TILT)
  .add(new THREE.Vector3(TOWER[0], -TOWER[1], 0))

export const CHIMNEYS = HOUSES.filter((h, k) => !h.hip && k % 7 === 0).map(chimney)
export const STEAM = (() => {
  const r = rng(53)
  const [ax, ay, bx, by] = BATH
  const pts = Array.from({ length: 9 }, () => {
    const t = r()
    return new THREE.Vector3(ax + (bx - ax) * t + (r() - 0.5) * 80, -(ay + (by - ay) * t + (r() - 0.5) * 60), 6)
  })
  pts.push(new THREE.Vector3(SPRING[0], -SPRING[1], 6), new THREE.Vector3(SPRING[0] + 40, -SPRING[1] + 10, 6))
  return pts
})()
