import { path, smooth } from './kit'

export const ROAD_PTS = smooth([
  [-1180, -1850],
  [-1080, -1350],
  [-800, -880],
  [-560, -430],
  [-450, 0],
  [-360, 400],
  [-200, 800],
  [-80, 1200],
  [-20, 1850],
])
export const ROAD = path(ROAD_PTS)
export const HALF = 82

export const LANE_PTS = smooth([
  [-140, 790],
  [20, 690],
  [410, 510],
  [770, 365],
  [960, 255],
])
export const LANE = path(LANE_PTS)

export const VEIN = path(
  smooth([
    [-60, 790],
    [180, 690],
    [440, 570],
    [800, 430],
    [1060, 280],
  ]),
)

export const INN = { x: -100, y: -60 }
export const PADDOCK = { x: -870, y: -480 }
export const CAMP = { x: -900, y: 260 }
export const TOLL = { x: -190, y: 400 }
export const POST = { x: -40, y: 680 }
export const PIER = { x: 990, y: 230 }
export const WRECK = { x: -760, y: -1130 }
export const THUMB = { x: 70, y: 1350 }

export function roadAt(s: number) {
  return ROAD.at(s, { x: 0, y: 0, dx: 0, dy: 0 })
}

export function nearest(x: number, y: number) {
  let best = 0
  let d = Infinity
  const p = { x: 0, y: 0, dx: 0, dy: 0 }
  for (let s = 0; s < ROAD.length; s += 10) {
    ROAD.at(s, p)
    const e = Math.hypot(p.x - x, p.y - y)
    if (e < d) {
      d = e
      best = s
    }
  }
  return best
}
