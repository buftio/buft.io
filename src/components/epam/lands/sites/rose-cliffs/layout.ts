import * as THREE from 'three'
import { at, stand, TILT } from './kit'

export const LIFT = 320
export const TURN = 0.6
export const QUARRY = stand(-430, -60, 1, TURN, LIFT)
export const BACK = -330
export const STEPS = [0, 1, 2, 3].map((k) => ({ h: 120 * (k + 1), front: 240 - k * 150, w: 520 - k * 60, c: k * 25 }))
export const BEACON_AT = { x: -250, y: 690, z: -400 }
export const BEACON = at(QUARRY, BEACON_AT.x, BEACON_AT.y, BEACON_AT.z)
export const HOIST = { x: 330, z: -260, tx: 470, ty: 620, tz: 290 }

const SPAN = 0.16
export const TOWERS = [
  { x: 190, y: -330, h: 250 },
  { x: 640, y: -250, h: 380 },
  { x: 1080, y: -380, h: 380 },
  { x: 1520, y: -500, h: 250 },
].map((t) => ({ ...t, m: stand(t.x, t.y, 1, SPAN, LIFT) }))
export const GAP = 24
export const SPIN = SPAN

export const CLOD = { x: -1260, y: -320, s: 190 }
export const DERRICK = stand(-950, -900, 1, 2.36, LIFT)
export const DERRICK_TIP = at(DERRICK, 0, 300, 280)
export const SNORT = 11.3
export const snort = (t: number) => t % SNORT
export const DOWN = new THREE.Vector3(0, -1, 0).applyQuaternion(TILT)

const SEG = 14

function lane(side: number) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < TOWERS.length - 1; i++) {
    const a = at(TOWERS[i].m, 0, TOWERS[i].h, side * GAP)
    const b = at(TOWERS[i + 1].m, 0, TOWERS[i + 1].h, side * GAP)
    const sag = a.distanceTo(b) * 0.06
    for (let k = 0; k < SEG; k++) {
      const t = k / SEG
      pts.push(a.clone().lerp(b, t).addScaledVector(DOWN, sag * 4 * t * (1 - t)))
    }
    if (i === TOWERS.length - 2) pts.push(b)
  }
  return pts
}

export const LANES = [lane(1), lane(-1)]
const LOOP = [...LANES[0], ...[...LANES[1]].reverse(), LANES[0][0]]
const DIST = LOOP.reduce<number[]>((d, p, i) => [...d, i ? d[i - 1] + p.distanceTo(LOOP[i - 1]) : 0], [])
export const LOOP_LEN = DIST[DIST.length - 1]
export const OUT_LEN = DIST[LANES[0].length - 1]

export function ride(d: number, out: THREE.Vector3) {
  const s = ((d % LOOP_LEN) + LOOP_LEN) % LOOP_LEN
  let i = 1
  while (i < DIST.length - 1 && DIST[i] < s) i++
  const t = (s - DIST[i - 1]) / Math.max(1e-6, DIST[i] - DIST[i - 1])
  return out.lerpVectors(LOOP[i - 1], LOOP[i], t)
}

export const WALK = [at(QUARRY, 560, 8, 330), at(QUARRY, 640, 0, 240), at(QUARRY, 700, 0, 120), at(TOWERS[0].m, -80, 30, 40)]
const WALK_D = WALK.reduce<number[]>((d, p, i) => [...d, i ? d[i - 1] + p.distanceTo(WALK[i - 1]) : 0], [])
export const WALK_LEN = WALK_D[WALK_D.length - 1]

export function walk(d: number, out: THREE.Vector3) {
  let i = 1
  while (i < WALK_D.length - 1 && WALK_D[i] < d) i++
  const t = Math.min(1, Math.max(0, (d - WALK_D[i - 1]) / (WALK_D[i] - WALK_D[i - 1])))
  return out.lerpVectors(WALK[i - 1], WALK[i], t)
}
