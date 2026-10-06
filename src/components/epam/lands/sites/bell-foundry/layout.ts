import type { Spot } from './kit'

export const GANTRY: Spot = { at: [0, -60], size: 1.35 }
export const CRANE: Spot = { at: [-380, 160], size: 1 }
export const KILNS: (Spot & { h: number })[] = [
  { at: [-662, -7], size: 1, h: 500 },
  { at: [-1238, 351], size: 1, h: 400, turn: 0.25 },
  { at: [-1166, -787], size: 1, h: 440, turn: 0.15 },
]
export const COTTAGE: Spot = { at: [1120, -1010], size: 1, turn: -0.35 }
export const ORE: [number, number] = [-430, -1260]
export const FORGE: [number, number] = [-804, 236]
export const PIT: [number, number] = [-440, 480]
export const MOULDS: [number, number][] = [
  [-560, 450],
  [-460, 410],
  [-360, 470],
  [-500, 540],
  [-380, 560],
]
export const RUNNEL: [number, number][] = [
  [-509, 313],
  [-470, 360],
  [-470, 420],
  [-450, 470],
]
export const COOL: [number, number, number][] = [
  [420, 200, 120],
  [620, 165, 100],
  [540, 370, 130],
  [740, 430, 95],
  [400, 490, 110],
]
export const SCRAP: [number, number, number, number][] = [
  [860, -1180, 90, 1.2],
  [760, -1080, 70, -1.4],
  [920, -1060, 60, 0.4],
]
export const COALS: [number, number, number][] = [
  [219, -101, 40],
  [359, -223, 34],
  [-1241, -1481, 60],
]
export const BARRELS: [number, number][] = [
  [-140, 100],
  [68, 120],
]
export const LISTENER: [number, number] = [1480, -430]
export const ROAD: [number, number][] = [
  [800, 330],
  [1100, 250],
  [1450, 60],
  [1800, -150],
  [2080, -300],
]
export const CARRY: [number, number][] = [
  [-430, -1200],
  [-700, -900],
  [-830, -560],
  [-770, -250],
]
export const TEAM = [720, 800, 880]
export const RAM_PIVOT: [number, number] = [292, 640]
export const MUFFS: [number, number] = [-250, 70]
export const QUENCH: [number, number] = [-36, 40]
export const RELAYS: [number, number][] = [
  [170, 640],
  [260, 990],
  [340, 1340],
  [430, 1690],
]
