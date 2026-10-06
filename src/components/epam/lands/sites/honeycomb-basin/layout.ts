import * as THREE from 'three'

export type P = [number, number]

export const SKEP = { at: [920, -1450] as P, size: 420 }
export const PRESS = { at: [1700, 1360] as P, size: 160 }
export const MOTHER = 470
export const EDGE = 2420
export const FOLK_SIZE = 54
export const BEE_SIZE = 17
export const PIPE_R = 38

export const PIPE: P[] = [
  [1640, 1180],
  [1960, 640],
  [1900, -80],
  [1600, -820],
  [1260, -1260],
  [920, -1430],
  [520, -1580],
  [-60, -1800],
  [-700, -1880],
  [-1300, -1720],
  [-1900, -1820],
  [-2700, -2200],
]

export const CREWS: P[] = [
  [-430, 260],
  [-1500, 250],
  [-850, 1350],
  [350, 1650],
  [-1150, -800],
  [1450, 450],
]

export const NAPPER: P = [520, 120]

export function pipeCurve() {
  return new THREE.CatmullRomCurve3(PIPE.map(([x, y]) => new THREE.Vector3(x, -y, PIPE_R * 0.8)), false, 'centripetal')
}
