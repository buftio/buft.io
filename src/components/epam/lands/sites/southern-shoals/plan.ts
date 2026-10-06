import * as THREE from 'three'

export const COAST: [number, number, number][] = [
  [-2050, 760, 260],
  [-1940, 560, 300],
  [-1880, 280, 240],
  [-1840, -80, 160],
  [-1680, -280, 120],
  [-1400, -320, 140],
  [-1180, -220, 150],
  [-1100, -480, 110],
  [-960, -720, 130],
  [-760, -960, 170],
  [-520, -1020, 190],
  [-370, -980, 170],
  [-410, -600, 200],
  [-440, -130, 250],
  [-380, 80, 330],
  [-120, 170, 420],
  [80, 360, 470],
  [280, 500, 380],
  [600, 480, 260],
  [1000, 520, 340],
  [1320, 440, 460],
  [1720, 340, 300],
  [2050, 290, 240],
]

export type Shore = {
  x: number
  y: number
  nx: number
  ny: number
  w: number
  u: number
}

export function shore(n = 220): Shore[] {
  const curve = new THREE.CatmullRomCurve3(
    COAST.map(([x, y, w]) => new THREE.Vector3(x, y, w)),
    false,
    'centripetal',
  )
  const pts = curve.getSpacedPoints(n)
  const out: Shore[] = []
  let u = 0
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 3)]
    const b = pts[Math.min(n, i + 3)]
    const tx = b.x - a.x
    const ty = b.y - a.y
    const l = Math.hypot(tx, ty) || 1
    if (i) u += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y)
    out.push({ x: p.x, y: p.y, nx: -ty / l, ny: tx / l, w: p.z, u })
  })
  return out
}

export const SHIP = { x: -150, y: -330, turn: -0.6, s: 1.5 }
export const SAIL_TO: [number, number][] = [
  [-150, -330],
  [-420, -260],
  [-760, -120],
  [-900, 420],
  [-940, 1250],
]

export function fromShip(x: number, z: number): [number, number] {
  const c = Math.cos(SHIP.turn)
  const s = Math.sin(SHIP.turn)
  const rx = (x * c + z * s) * SHIP.s
  const rz = (-x * s + z * c) * SHIP.s
  return [SHIP.x + rx, SHIP.y + rz * Math.sin((50 * Math.PI) / 180)]
}

export const POOL: [number, number] = [-1060, -1290]
export const HOARD: [number, number] = [380, 290]
export const BEACH: [number, number] = [10, 330]
export const CAMP: [number, number] = [800, -170]
export const BUOY: [number, number] = [-1080, 140]
export const ROW: [number, number, number, number][] = [
  [-840, -320, 30, 150],
  [-800, 330, 100, 50],
  [-1420, 260, 140, 60],
]

export const POOLS: [number, number, number][] = [
  [420, -90, 120],
  [900, 210, 105],
  [1200, 60, 85],
  [620, 300, 80],
  [1520, 170, 100],
  [-1560, -470, 95],
  [-1980, 100, 80],
]

export function along(
  path: [number, number][],
  u: number,
): [number, number, number] {
  const n = path.length - 1
  const f = Math.min(n - 1e-6, Math.max(0, u * n))
  const i = Math.floor(f)
  const t = f - i
  const [ax, ay] = path[i]
  const [bx, by] = path[i + 1]
  return [ax + (bx - ax) * t, ay + (by - ay) * t, Math.atan2(by - ay, bx - ax)]
}
