import { ISLES, shore } from './isles'

export const LIGHT = 0
export const STOP = 1
export const BEACH = 4
export const FISHER = 7
export const WORKS = 9
export const WAIT = 19
export const QUAY = 36
export const HAMMOCK = 2
export const CASTLE = 3
export const SPECIAL = new Set([LIGHT, STOP, BEACH, FISHER, WORKS, WAIT, QUAY, HAMMOCK, CASTLE])

export const BRIDGES: [number, number][] = [
  [0, 4],
  [0, 3],
  [3, 8],
  [4, 14],
  [2, 7],
  [7, 16],
  [8, 9],
  [13, 21],
  [21, 22],
  [25, 38],
  [27, 43],
  [28, 31],
  [6, 10],
]

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function span(a: number, b: number, inset = 10): [[number, number], [number, number]] {
  const A = ISLES[a]
  const B = ISLES[b]
  const t = Math.atan2(B[1] - A[1], B[0] - A[0])
  return [shore(A, t, -inset), shore(B, t + Math.PI, -inset)]
}

export const lift = (h: number) => [h * Math.sin((40 * Math.PI) / 180), h * Math.cos((40 * Math.PI) / 180)] as const
