import { WALL_BRICKS, type Body, type WallBrick, type Point } from './types.ts'

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n))
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export type Flight = Point & { vx: number; vy: number; time: number }
export type Box = { left: number; right: number; top: number; bottom: number }
export const BLAST_RADIUS = 25
export const GRENADE_FUSE = 1.55
export const GRENADE_SPEED = 2.1
export const THROW_WINDUP = 0.24
export const GROUND = 60.5
export const TRENCH = 74
export const CRATES: Box = { left: 22, right: 30, top: 47, bottom: GROUND }
export const PIT = { left: 46, right: 58 }
export const CAGE = { left: 82, right: 94, top: 38, bottom: 59 }
export const GATE = 78.5
export const TROOPER_START = { x: 8, y: GROUND }
const HALF = 2.6
const TALL = 12.5
const CEILING = 36.5
const PUSH = 60
const PUSH_RADIUS = 13
const CHIP_RADIUS = 10
export const SOLIDS: Box[] = [
  { left: 0, right: PIT.left, top: GROUND, bottom: 66 },
  CRATES,
  { left: PIT.left, right: PIT.right, top: TRENCH, bottom: 78 },
  { left: PIT.right, right: 83, top: GROUND, bottom: 66 },
  { left: 89, right: 100, top: GROUND, bottom: 66 },
  { left: CAGE.left, right: CAGE.right, top: CAGE.top, bottom: CAGE.top + 1.5 },
  { left: CAGE.left, right: CAGE.left + 1, top: CAGE.top, bottom: CAGE.bottom },
  {
    left: CAGE.right - 1,
    right: CAGE.right,
    top: CAGE.top,
    bottom: CAGE.bottom,
  },
]
const brickBoxes = (bricks: WallBrick[]): Box[] =>
  bricks.map((brick) => ({
    left: brick.x - 1.5,
    right: brick.x + 1.5,
    top: brick.y - 1.5,
    bottom: brick.y + 1.5,
  }))
export const hand = (trooper: Point): Point => ({
  x: trooper.x + 3,
  y: trooper.y - 10.5,
})
export function launch(aim: Point, from: Point = TROOPER_START): Flight {
  return {
    ...hand(from),
    vx: clamp(aim.x, -40, 66),
    vy: clamp(aim.y, -62, -4),
    time: 0,
  }
}
export function stepGrenade(
  ball: Flight,
  dt: number,
  bricks: WallBrick[] = WALL_BRICKS,
): Flight {
  const next = { ...ball, time: ball.time + dt, vy: ball.vy + 48 * dt }
  next.x += next.vx * dt
  next.y += next.vy * dt
  const bounce = 0.32
  if (next.x < 1.5 || next.x > 98.5) {
    next.x = clamp(next.x, 1.5, 98.5)
    next.vx *= -bounce
  }
  for (const box of [...SOLIDS, ...brickBoxes(bricks)]) {
    if (
      next.x > box.left - 1.5 &&
      next.x < box.right + 1.5 &&
      next.y > box.top - 1.5 &&
      next.y < box.bottom + 1.5
    ) {
      if (ball.y <= box.top - 1.5) {
        next.y = box.top - 1.5
        next.vy = -Math.abs(next.vy) * bounce
        next.vx *= 0.83
      } else if (ball.y >= box.bottom + 1.5) {
        next.y = box.bottom + 1.5
        next.vy = Math.abs(next.vy) * bounce
      } else {
        next.x =
          ball.x < (box.left + box.right) / 2 ? box.left - 1.5 : box.right + 1.5
        next.vx *= -bounce
      }
    }
  }
  return next
}
export function stepTrooper(body: Body, dt: number, bricks: WallBrick[]): Body {
  const next = { ...body, vy: body.vy + 48 * dt }
  if (next.grounded) next.vx *= Math.exp(-14 * dt)
  const solids = [...SOLIDS, ...brickBoxes(bricks)]
  const overlaps = (box: Box) =>
    next.x + HALF > box.left &&
    next.x - HALF < box.right &&
    next.y > box.top &&
    next.y - TALL < box.bottom
  next.x = clamp(next.x + next.vx * dt, HALF, 100 - HALF)
  for (const box of solids)
    if (overlaps(box)) {
      next.x =
        body.x < (box.left + box.right) / 2 ? box.left - HALF : box.right + HALF
      next.vx *= -0.2
    }
  next.y += next.vy * dt
  next.grounded = false
  for (const box of solids)
    if (overlaps(box)) {
      if (next.vy >= 0) {
        next.y = box.top
        next.grounded = true
      } else next.y = box.bottom + TALL
      next.vy = 0
    }
  if (next.y < CEILING) {
    next.y = CEILING
    next.vy = Math.max(0, next.vy)
  }
  return next
}
export function blastPush(body: Body, point: Point): Body {
  const dx = body.x - point.x,
    dy = body.y - TALL / 2 - point.y
  const reach = Math.hypot(dx, dy)
  if (reach >= PUSH_RADIUS) return body
  const force = PUSH * (1 - (reach / PUSH_RADIUS) ** 2)
  const lift = dy - reach * 0.6
  const norm = Math.hypot(dx, lift) || 1
  return {
    ...body,
    vx: body.vx + (dx / norm) * force,
    vy: body.vy + (lift / norm) * force,
    grounded: false,
  }
}
export const inTrench = (body: Point) =>
  body.x > PIT.left && body.x < PIT.right && body.y > GROUND + 1
export const pastWall = (body: Body) =>
  body.grounded && body.x > PIT.right && body.y <= GROUND + 0.01
export function chipWall(point: Point, bricks: WallBrick[]) {
  const remaining = bricks.filter(
    (brick) => distance(brick, point) > CHIP_RADIUS,
  )
  const base = remaining.filter((brick) => brick.row < 2).length
  return base <= 3 || remaining.length <= 12 ? [] : remaining
}
export function grenadeResult(
  aim: Point,
  bricks: WallBrick[] = WALL_BRICKS,
  from: Point = TROOPER_START,
) {
  let ball = launch(aim, from)
  while (ball.time < GRENADE_FUSE) ball = stepGrenade(ball, 1 / 120, bricks)
  const remaining = chipWall(ball, bricks)
  return { ball, bricks: remaining, broken: remaining.length === 0 }
}
export function settleTrooper(body: Body, blast: Point, bricks: WallBrick[]) {
  let next = blastPush(body, blast)
  for (let i = 0; i < 1200 && !(next.grounded && Math.abs(next.vx) < 0.5); i++)
    next = stepTrooper(next, 1 / 120, bricks)
  return next
}
export function trajectory(
  aim: Point,
  bricks: WallBrick[] = WALL_BRICKS,
  from: Point = TROOPER_START,
) {
  let ball = launch(aim, from)
  const points: Point[] = []
  for (let i = 0; i < Math.ceil(GRENADE_FUSE * 120); i++) {
    ball = stepGrenade(ball, 1 / 120, bricks)
    if (i % 12 === 0) points.push({ x: ball.x, y: ball.y })
  }
  return points
}
export function along(points: Point[], travelled: number): Point {
  let remaining = travelled
  for (let i = 1; i < points.length; i++) {
    const length = distance(points[i - 1], points[i])
    if (remaining <= length) {
      const t = length ? remaining / length : 1
      return {
        x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
        y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
      }
    }
    remaining -= length
  }
  return { ...points[points.length - 1] }
}
export const pathLength = (points: Point[]) =>
  points.slice(1).reduce((sum, point, i) => sum + distance(point, points[i]), 0)
