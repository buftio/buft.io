export type V3 = [number, number, number]

export type Phase =
  | 'dock'
  | 'grail'
  | 'papers'
  | 'roll'
  | 'ready'
  | 'play'
  | 'won'
  | 'lost'

export const STEP = 0.2

export const ARENA: V3 = [3.6, 0, -0.2]
export const PIG: V3 = [1.2, 0, 0.4]
export const GUN: V3 = [0, 2.0, 0]
export const gunAt = { x: GUN[0], y: GUN[1], z: GUN[2] }

const at = (offset: V3): V3 => [ARENA[0] + offset[0], ARENA[1] + offset[1], ARENA[2] + offset[2]]

export const stations: Record<Phase, { position: V3; target: V3 }> = {
  dock: { position: [0, 1.75, 2.8], target: [0, 1.5, -2.7] },
  grail: { position: [0.6, 4.4, 8.5], target: [0.6, 2.2, -2] },
  papers: { position: [0.6, 4.8, 9], target: [0.6, 1.4, -1] },
  roll: { position: at([0.1, 2.4, 5.4]), target: at([0.2, 0.9, 0.2]) },
  ready: { position: at([0, 10, 6.5]), target: at([0, 0, -2]) },
  play: { position: at([0, 10, 6.5]), target: at([0, 0, -2]) },
  won: { position: at([0, 6, 6]), target: at([0, 0.6, 0]) },
  lost: { position: at([0, 6, 6]), target: at([0, 0.6, 0]) },
}

export const timeline = {
  grail: 2.8,
  roll: { enter: 0.7, paper: 2.2, syringe: 3, aim: 3.7, hit: 4.05, done: 6.2 },
}
