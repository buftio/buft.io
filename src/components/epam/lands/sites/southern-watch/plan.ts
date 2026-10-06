import * as THREE from 'three'

export type P = [number, number]
export type Mood = { alarm: number; stand: number; q: number; next: number }
export const signal = { gate: 0 }

export const TOWER: P = [1010, -120]
export const TOWER_H = 1000
export const GATE_A = 0.16
export const ARC = { r: 1460, a0: -2.75, a1: 1.02 }
export const CHECK: P = [-300, 40]
export const BOOM: P = [CHECK[0], CHECK[1] - 200]
export const BRIDGE: P = [-960, -110]
export const LAUNCHER: P = [560, 330]
export const CAMP: P = [-640, 760]

export const PYRES: P[] = [
  [1000, -850],
  [60, 980],
  [-460, 240],
  [-1420, 520],
  [-200, 1560],
]

export const BRAZIERS: P[] = [-2.35, -1.75, -1.15, -0.55, 0.55, 0.9].map((a) => arcAt(a, ARC.r - 150))

export const TENTS: [number, number, number, number][] = [
  [-1000, 520, 0.3, 1],
  [-760, 860, -0.4, 1.1],
  [-300, 620, 0.6, 0.9],
  [-1180, 820, 0.9, 0.95],
  [-470, 950, -0.2, 1],
  [-900, 1150, 0.2, 0.85],
  [-620, 600, -0.5, 0.9],
  [-1250, 1080, 0.4, 1],
  [-240, 880, 0.1, 0.85],
  [-640, 1250, -0.3, 0.95],
]

export const REST: P[] = [
  [-540, 330],
  [-380, 350],
  [-560, 150],
  [-330, 150],
  [-1340, 620],
  [-1500, 600],
]

const ROAD_PTS: P[] = [
  [2700, 520],
  [1950, 380],
  [1440, 240],
  [1000, 150],
  [600, 110],
  [150, 90],
  [-300, 40],
  [-640, -50],
  [-960, -110],
  [-1320, -150],
  [-1800, -230],
  [-2500, -330],
]

export function arcAt(a: number, r = ARC.r): P {
  return [Math.cos(a) * r, Math.sin(a) * r]
}

const curve = new THREE.CatmullRomCurve3(ROAD_PTS.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal')
export const ROAD_N = 160
export const ROAD: P[] = curve.getSpacedPoints(ROAD_N).map((v) => [v.x, v.y])
const tmp = new THREE.Vector3()

export function road(u: number, out: { x: number; y: number; dx: number; dy: number }) {
  const t = Math.min(1, Math.max(0, u))
  curve.getPointAt(t, tmp)
  out.x = tmp.x
  out.y = tmp.y
  curve.getTangentAt(t, tmp)
  out.dx = tmp.x
  out.dy = tmp.y
  return out
}

export function roadU(x: number) {
  let best = 0
  let d = Infinity
  ROAD.forEach(([px], k) => {
    const e = Math.abs(px - x)
    if (e < d) {
      d = e
      best = k
    }
  })
  return best / ROAD_N
}

export const rand = (i: number) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}

export const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
