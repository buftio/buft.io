import * as THREE from 'three'
import { sample, type Spine } from './spine'

const hold = (lo: number, hi: number, gaps: [number, number][]) => {
  const out: { t: number; s: number; yaw: number }[] = []
  for (let t = lo; t <= hi; t += 0.019) if (!gaps.some(([a, b]) => t > a && t < b)) out.push({ t, s: 32 + 26 * Math.sin(Math.PI * Math.min(1, t * 1.15)), yaw: 0 })
  return out
}

export const HOUSES = [0.43, 0.53, 0.63]
export const NESTS = [0.19, 0.27, 0.78]
export const FISH = 0.1
export const TETHERS = [0.33, 0.72]
export const LEGS = [0.3, 0.8]
export const TUFTS = [
  { t: 0.004, s: 46, yaw: 0.5 },
  { t: 0.004, s: 54, yaw: 0 },
  { t: 0.004, s: 46, yaw: -0.5 },
  ...hold(0.035, 0.94, [
    ...HOUSES.map((t): [number, number] => [t - 0.03, t + 0.03]),
    ...NESTS.map((t): [number, number] => [t - 0.012, t + 0.012]),
  ]),
]

export const COUNT = {
  tufts: TUFTS.length,
  girths: HOUSES.length + 1,
  houses: HOUSES.length,
  folk: 9,
  birds: 7,
  wings: 14,
  nests: NESTS.length,
  zeds: 6,
  puffs: 11,
  ropes: 58,
  beads: 10,
  pegs: TETHERS.length,
  legs: 4,
  buckets: 4,
}

export const ROPE = { whisker: 0, tether: 20, rod: 36, line: 37, string: 42 }

export function pegSpots(sp: Spine) {
  return TETHERS.map((t) => {
    const a = sample(sp, t)
    return [a.x + a.ty * 340, a.y - a.tx * 340] as [number, number]
  })
}

export const ropeColors = (mesh: THREE.InstancedMesh) => {
  const c = new THREE.Color()
  for (let i = 0; i < COUNT.ropes; i++) {
    const hex = i < ROPE.tether ? '#ffcf5a' : i < ROPE.rod ? '#c89a6a' : i === ROPE.rod ? '#6b4325' : '#2a1630'
    mesh.setColorAt(i, c.set(hex))
  }
}

