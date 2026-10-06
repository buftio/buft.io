import * as THREE from 'three'

export type P = [number, number]

export type Puff = { at: P; r: number; h: number }

export const CLOUDS: Puff[] = [
  { at: [848, -1640], r: 150, h: 300 },
  { at: [750, -905], r: 150, h: 330 },
  { at: [425, -705], r: 155, h: 280 },
  { at: [750, -525], r: 145, h: 360 },
  { at: [1433, -620], r: 140, h: 300 },
  { at: [1610, 145], r: 150, h: 320 },
  { at: [-347, 100], r: 140, h: 300 },
  { at: [2880, -800], r: 120, h: 260 },
  { at: [-1380, -700], r: 115, h: 280 },
  { at: [-800, -547], r: 100, h: 330 },
  { at: [-153, -1947], r: 110, h: 300 },
  { at: [80, 2267], r: 120, h: 260 },
]

export const NAP = 6

export const HARBOUR: P = [-430, 700]
export const HARBOUR_SIZE = 80
export const MAST: P = [-430, 560]
export const MAST_H = 7.2
export const SHOAL: P = [500, -650]

export type Route = { pts: P[]; h: number; speed: number; phase: number }

export const TRAWLER: Route = {
  pts: [[-300, 440], [300, 150], [1200, -150], [2000, -700], [1900, -1500], [1000, -2000], [0, -1700], [-700, -1100], [-900, -300], [-700, 300]],
  h: 640,
  speed: 105,
  phase: 0,
}

export const LOOKOUT: Route = {
  pts: [[-1900, -400], [-1300, -1900], [200, -2500], [1800, -2000], [2500, -700], [2200, 700], [1100, 1300], [-200, 1300], [-1400, 700]],
  h: 760,
  speed: 150,
  phase: 0.35,
}

export function loop(r: Route) {
  const curve = new THREE.CatmullRomCurve3(r.pts.map(([x, y]) => new THREE.Vector3(x, y, 0)), true, 'centripetal')
  return { curve, len: curve.getLength(), r }
}
