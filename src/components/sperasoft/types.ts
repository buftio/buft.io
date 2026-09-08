export type Point = { x: number; y: number }
export type Orb = Point & {
  id: number
  spin: number
  loose?: boolean
  held?: boolean
}
export type SceneState = {
  wallBroken: boolean
  throwProgress: number
  throwCharging: boolean
  throwStrength: number
  grenade: Point | null
  wallBricks: WallBrick[]
  aim: Point[]
  explosion: (Point & { radius: number; age: number }) | null
  balls: Orb[]
  player: Point
  keeper: Point
  kickAim: Point[]
  kickDragging: boolean
  fanPokes: number[]
  shotsLeft: number
  defenders: Point[]
  football: Point | null
  trace: Point[]
  outcome: 'setup' | 'playing' | 'repositioning' | 'goal' | 'saved' | 'lost'
  reduced: boolean
}
export const WORLD_HEIGHT = 270
export const START = { x: 18, y: 51 }
export const PASSER = { x: 50, y: 237 }
export const GOAL = { x: 50, y: 196 }
export const CHANNEL = [
  { x: 85, y: 60 },
  { x: 88, y: 80 },
  { x: 17, y: 128 },
  { x: 17, y: 139 },
  { x: 86, y: 177 },
  { x: 89, y: 186 },
  { x: 82, y: 244 },
]
export const FIRST_BALL_CHANNEL = [...CHANNEL, { x: 59, y: 248 }, PASSER]

export type WallBrick = Point & { id: number; row: number; col: number }
export const WALL_BRICKS: WallBrick[] = Array.from({ length: 48 }, (_, id) => ({
  id,
  row: Math.floor(id / 4),
  col: id % 4,
  x: 71.5 + (id % 4) * 3,
  y: 27.5 + Math.floor(id / 4) * 3,
}))
