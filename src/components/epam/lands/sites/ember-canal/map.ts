import * as THREE from 'three'

const TILT = (50 * Math.PI) / 180
const SIN = Math.sin(TILT)
export const PITCH = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))
export const UP = new THREE.Vector3(0, 1, 0)

export const yawSide = (ux: number, uy: number) => Math.atan2(uy / SIN, ux)
export const yawAhead = (ux: number, uy: number) => Math.atan2(ux, -uy / SIN)
export const fore = (t: number) => Math.hypot(Math.cos(t), SIN * Math.sin(t))

export const clamp = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

const PATH: [number, number][] = [
  [110, 980],
  [160, 820],
  [190, 705],
  [205, 640],
  [245, 520],
  [300, 380],
  [360, 230],
  [410, 80],
  [448, -80],
  [470, -215],
  [560, -470],
]
const LENS = PATH.reduce<number[]>((acc, p, k) => {
  acc.push(k ? acc[k - 1] + Math.hypot(p[0] - PATH[k - 1][0], p[1] - PATH[k - 1][1]) : 0)
  return acc
}, [])
const END = LENS[LENS.length - 1]

export const S_END = END
export const S_TOP = LENS[9]
export const S_BOT = LENS[2]

export type Spot = { x: number; y: number; tx: number; ty: number }

export function along(s: number, out: Spot) {
  const d = Math.max(0, Math.min(END - 0.01, s))
  let k = 1
  while (k < LENS.length - 1 && LENS[k] < d) k++
  const [ax, ay] = PATH[k - 1]
  const [bx, by] = PATH[k]
  const f = (d - LENS[k - 1]) / (LENS[k] - LENS[k - 1])
  const len = LENS[k] - LENS[k - 1]
  out.x = ax + (bx - ax) * f
  out.y = -(ay + (by - ay) * f)
  out.tx = (bx - ax) / len
  out.ty = -(by - ay) / len
  return out
}

export const PERIOD = 13
export const FLEET = 22
const GAP = 44
const LANE = 58
const HOLD = S_TOP - 60

const now = { c: 0, p: 0 }
export const cycle = (cyc: number) => {
  now.c = Math.floor(cyc / PERIOD)
  now.p = cyc / PERIOD - now.c
  return now
}

export const moveOf = (p: number) => smooth(0.55, 0.85, p)
export const gateOf = (p: number) => smooth(0.47, 0.57, p) * (1 - smooth(0.86, 0.96, p))

export const capAngle = (k: number, c: number, p: number) => (k ? -1 : 1) * Math.PI * 2 * (c + smooth(0.47, 0.96, p))

export function slotOf(i: number, c: number, p: number) {
  return (((i - c) % FLEET) + FLEET) % FLEET - moveOf(p)
}

export function slotS(u: number) {
  if (u < 0) return HOLD - u * 280
  const last = FLEET - 2
  if (u > last) return HOLD - last * GAP - (u - last) * GAP * 2.6
  return HOLD - u * GAP
}

export const laneOf = (i: number, s: number) => (i % 2 ? LANE : -LANE) * smooth(S_TOP - 10, S_TOP - 150, s) * smooth(S_BOT - 40, S_BOT + 100, s)

export function shown(u: number) {
  if (u < 0) return 1 - smooth(0.55, 1, -u)
  return 1 - smooth(0, 0.7, u - (FLEET - 2))
}

export const VESSEL = { x: 375, y: 245, w: 1250, h: 720, turn: 1.26 }
export const TOP_GATE = { at: [470, -215] as [number, number], half: 100 }
export const BOT_GATE = { at: [190, 705] as [number, number], half: 95 }
export const TOLL = [262, -262] as [number, number]
export const KEEPER = [330, -140] as [number, number]
export const CAMP = [10, 80] as [number, number]
export const CAP_TOP = [650, -120] as [number, number]
export const CAP_BOT = [345, 790] as [number, number]
export const BOLLARD = [152, 202] as [number, number]
export const TOW = { from: [82, 196] as [number, number], dir: [-0.99, -0.13] as [number, number], step: 44 }
