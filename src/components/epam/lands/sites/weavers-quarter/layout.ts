import { C } from './kit'

export type P = [number, number]

export const FIELD = { x0: -380, x1: 780, south: -190, north: -1440 }
export const MID = (FIELD.x0 + FIELD.x1) / 2
export const WIDTH = FIELD.x1 - FIELD.x0
export const LENGTH = FIELD.south - FIELD.north
export const WARPS = 30
export const LONG = WIDTH * 0.42
export const ROLL = 32

export const VATS: { at: P; r: number; h: number; dye: string; rim: string }[] = [
  { at: [-900, -700], r: 190, h: 110, dye: C.indigo, rim: C.wood },
  { at: [1010, 1270], r: 150, h: 70, dye: C.madder, rim: C.stone },
  { at: [170, 1230], r: 120, h: 130, dye: C.gold, rim: C.oak },
]

export const LINES: { color: string; pts: [number, number, number][] }[] = [
  {
    color: C.indigo,
    pts: [
      [-900, -700, 250],
      [-650, -420, 300],
      [-380, -190, 280],
    ],
  },
  {
    color: C.madder,
    pts: [
      [1010, 1270, 230],
      [1160, 760, 320],
      [1120, 260, 320],
      [780, -190, 280],
    ],
  },
  {
    color: C.saffron,
    pts: [
      [170, 1230, 260],
      [60, 760, 320],
      [120, 260, 320],
      [200, -190, 300],
    ],
  },
]

export const SPOOLS: { at: P; r: number; h: number; bands: string[] }[] = [
  { at: [-1380, 180], r: 80, h: 260, bands: [C.saffron, C.madder] },
  { at: [-1060, 120], r: 70, h: 200, bands: [C.indigo, C.rose] },
  { at: [-1520, 600], r: 90, h: 240, bands: [C.magenta, C.saffron] },
  { at: [-1180, 640], r: 110, h: 380, bands: [C.indigo, C.madder, C.saffron] },
  { at: [-880, 860], r: 80, h: 210, bands: [C.rose, C.indigo] },
  { at: [-1300, 1040], r: 85, h: 230, bands: [C.madder, C.magenta] },
  { at: [-700, 560], r: 70, h: 190, bands: [C.saffron, C.indigo] },
]
export const GRANNY = 3

export const STALLS: { at: P; awning: string; cloth: string[] }[] = [
  { at: [-560, 150], awning: C.madder, cloth: [C.indigo, C.saffron, C.rose] },
  { at: [-320, 210], awning: C.indigo, cloth: [C.madder, C.magenta, C.gold] },
  { at: [-580, 380], awning: C.saffron, cloth: [C.indigo, C.madder, C.teal] },
  { at: [-330, 440], awning: C.magenta, cloth: [C.saffron, C.indigo, C.rose] },
]
export const PLAZA: P = [-450, 300]

export const HAUL: P[] = [
  [MID, -110],
  [880, -100],
  [1260, -60],
  [1330, -560],
  [1250, -1000],
]

const R = 1700
export const FENCE: P[] = Array.from({ length: 12 }, (_, i) => {
  const a = ((-72 + i * 6) * Math.PI) / 180
  return [Math.round(Math.cos(a) * R), Math.round(Math.sin(a) * R)]
})

export const CLOTHS: { from: P; to: P; w: number; color: string; edge: string }[] = [
  { from: [-260, 600], to: [760, 540], w: 100, color: C.indigo, edge: C.saffron },
  { from: [-220, 740], to: [740, 700], w: 100, color: C.saffron, edge: C.madder },
  { from: [-280, 880], to: [700, 860], w: 100, color: C.madder, edge: C.stone },
  { from: [-200, 1020], to: [660, 1030], w: 100, color: C.magenta, edge: C.indigo },
  { from: [-420, 1080], to: [-120, 1380], w: 90, color: C.teal, edge: C.gold },
]

export const CAPSTAN: P = [MID - 150, -40]
export const HANDLOOM: P = [620, 160]
