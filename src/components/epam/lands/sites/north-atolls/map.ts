import * as THREE from 'three'

export type P = [number, number]

export const ATOLL = {
  light: { at: [-100, -125] as P, r: 185 },
  count: { at: [300, 20] as P, r: 170 },
  pen: { at: [670, -140] as P, r: 120 },
}

export const LAMP_H = 5.62
export const TOWER = 80
export const CRANE: P = [175, -105]
export const CRANE_H = 3.1
export const CRANE_SIZE = 48
export const DESK: P = [118, 132]
export const PIER: P = [1090, -60]

export const ROAD: P[] = [
  [40, -20],
  [55, 150],
  [-60, 215],
  [-200, 225],
  [-170, 340],
  [-115, 520],
  [-75, 720],
  [-45, 950],
]

export const HAWSER: P[] = [
  [-2840, 920],
  [-1900, 120],
  [-1200, -500],
  [-600, -960],
  [150, -1180],
  [920, -1400],
]

export type Lane = { pts: P[]; dock: number; fast: number; slow: number; gap: number; boats: number; rest: number; phase: number }

export const LANES: Lane[] = [
  {
    pts: [[-3000, -250], [-1800, -620], [-900, -760], [-430, -480], [40, -345], [300, -235], [520, -330], [600, -700], [480, -1400], [250, -2700]],
    dock: 5,
    fast: 170,
    slow: 70,
    gap: 1.9,
    boats: 7,
    rest: 8,
    phase: 0,
  },
  {
    pts: [[1420, -2900], [1380, -1500], [1330, -700], [1290, -280], [1150, -165], [950, -190], [880, -450], [990, -1000], [1060, -1700], [1000, -2900]],
    dock: 4,
    fast: 160,
    slow: 65,
    gap: 2,
    boats: 5,
    rest: 14,
    phase: 21,
  },
]

export type Track = { curve: THREE.CatmullRomCurve3; len: number; times: Float32Array; total: number; dockU: number }

const SAMPLES = 400

export function track(lane: Lane): Track {
  const curve = new THREE.CatmullRomCurve3(lane.pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal')
  const len = curve.getLength()
  const lengths = curve.getLengths(SAMPLES * 4)
  const dockU = lengths[Math.round((lane.dock / (lane.pts.length - 1)) * SAMPLES * 4)] / len
  const times = new Float32Array(SAMPLES + 1)
  const step = len / SAMPLES
  for (let k = 1; k <= SAMPLES; k++) {
    const u = (k - 0.5) / SAMPLES
    const near = Math.exp(-(((u - dockU) / 0.07) ** 2))
    times[k] = times[k - 1] + step / (lane.fast + (lane.slow - lane.fast) * near)
  }
  return { curve, len, times, total: times[SAMPLES], dockU }
}

export function at(tr: Track, time: number) {
  const { times } = tr
  if (time <= 0) return 0
  if (time >= tr.total) return 1
  let lo = 0
  let hi = SAMPLES
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] < time) lo = mid
    else hi = mid
  }
  return (lo + (time - times[lo]) / (times[hi] - times[lo])) / SAMPLES
}

export function polyline(pts: P[], spacing: number) {
  const out: { x: number; y: number; a: number; s: number }[] = []
  let s = 0
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k]
    const [x1, y1] = pts[k + 1]
    const d = Math.hypot(x1 - x0, y1 - y0)
    for (let t = 0; t < d; t += spacing) out.push({ x: x0 + ((x1 - x0) * t) / d, y: y0 + ((y1 - y0) * t) / d, a: Math.atan2(x1 - x0, y1 - y0), s: s + t })
    s += d
  }
  return out
}

export function roadLength(pts: P[]) {
  let s = 0
  for (let k = 0; k < pts.length - 1; k++) s += Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1])
  return s
}

export function along(pts: P[], s: number, out: { x: number; y: number; a: number }) {
  for (let k = 0; k < pts.length - 1; k++) {
    const [x0, y0] = pts[k]
    const [x1, y1] = pts[k + 1]
    const d = Math.hypot(x1 - x0, y1 - y0)
    if (s <= d || k === pts.length - 2) {
      const t = Math.min(1, s / d)
      out.x = x0 + (x1 - x0) * t
      out.y = y0 + (y1 - y0) * t
      out.a = Math.atan2(x1 - x0, y1 - y0)
      return out
    }
    s -= d
  }
  return out
}
