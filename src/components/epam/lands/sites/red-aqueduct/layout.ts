import * as THREE from 'three'

export const SIN = Math.sin((50 * Math.PI) / 180)
export const COS = Math.cos((50 * Math.PI) / 180)
export const PITCH_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler((50 * Math.PI) / 180, 0, 0))

const C = [140, -74]
const D = [-0.712, 0.702]
const N = [-0.702, -0.712]

export const spot = (t: number, n: number): [number, number] => [C[0] + D[0] * t + N[0] * n, C[1] + D[1] * t + N[1] * n]

export const turnOf = (ix: number, iy: number) => Math.atan2(-iy / SIN, ix)
export const stretch = (turn: number) => Math.hypot(Math.cos(turn), SIN * Math.sin(turn))

export const ALONG = turnOf(-D[0], -D[1])
export const ACROSS = turnOf(-N[0], -N[1])

export const ARC_N = 320
export const ARC_T0 = -700
export const ARC_T1 = 860
export const SEGS = 9
export const SEG = ((ARC_T1 - ARC_T0) / SEGS) / stretch(ALONG)
export const H1 = 195
export const H2 = 285
export const WALK = 50
export const MILLS = [-120, 230, 520]
export const WHEEL_Z = 112
export const WHEEL_R = 118
export const DAM_T = -700
export const DAM_N = 45
export const DAM_LEN = 560 / stretch(ACROSS)

const RIVER: [number, number, number][] = [
  [-760, -90, 60],
  [-700, -60, 110],
  [-400, 0, 140],
  [0, 20, 220],
  [300, 80, 200],
  [500, 40, 170],
  [700, -20, 180],
  [900, -60, 170],
  [1100, -80, 90],
]
export const RIVER_T0 = -680
export const RIVER_T1 = 1100

export function river(t: number): [number, number] {
  let k = 0
  while (k < RIVER.length - 2 && RIVER[k + 1][0] < t) k++
  const [t0, c0, h0] = RIVER[k]
  const [t1, c1, h1] = RIVER[k + 1]
  const f = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)))
  return [c0 + (c1 - c0) * f, h0 + (h1 - h0) * f]
}

export function offset(at: [number, number], turn: number, x: number, z: number): [number, number] {
  const c = Math.cos(turn)
  const s = Math.sin(turn)
  return [at[0] + x * c + z * s, at[1] + SIN * (-x * s + z * c)]
}

const tq = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const tv = new THREE.Vector3()
const ts = new THREE.Vector3()

export function lift(at: [number, number], turn: number, x: number, y: number, z: number, out: THREE.Vector3) {
  tq.setFromAxisAngle(yAxis, turn)
  tv.set(x, y, z).applyQuaternion(tq).applyQuaternion(PITCH_Q)
  return out.set(at[0] + tv.x, -at[1] + tv.y, tv.z)
}

export function standMatrix(at: [number, number], turn: number, s: number, out: THREE.Matrix4) {
  tq.setFromAxisAngle(yAxis, turn).premultiply(PITCH_Q)
  return out.compose(tv.set(at[0], -at[1], 0), tq, ts.set(s, s, s))
}

export const millAt = (k: number) => spot(MILLS[k], ARC_N)
export const wheelAt = (k: number) => offset(millAt(k), ALONG, 0, WHEEL_Z)
export const damAt = () => spot(DAM_T, DAM_N)
export const deckAt = (t: number) => spot(t, ARC_N)

export const hash = (k: number) => {
  const x = Math.sin(k * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export const GATE_X = (DAM_N + 60) / stretch(ACROSS)
export const craneAt = () => spot(ARC_T1 + 15, ARC_N)
export const loadAt = () => offset(spot(ARC_T0 + 40, ARC_N), ALONG, 0, 130)

const ROAD: [number, number][] = [loadAt(), spot(-860, 330), [700, -1150], [1150, -1260]]
const LEGS = ROAD.slice(1).map((p, k) => Math.hypot(p[0] - ROAD[k][0], p[1] - ROAD[k][1]))
const TOTAL = LEGS.reduce((a, b) => a + b, 0)

export function road(f: number): [number, number] {
  let d = Math.min(1, Math.max(0, f)) * TOTAL
  let k = 0
  while (k < LEGS.length - 1 && d > LEGS[k]) d -= LEGS[k++]
  const g = Math.min(1, d / LEGS[k])
  return [ROAD[k][0] + (ROAD[k + 1][0] - ROAD[k][0]) * g, ROAD[k][1] + (ROAD[k + 1][1] - ROAD[k][1]) * g]
}
