import { START, WALL_BRICKS, type WallBrick, type Point } from './types.ts'

export const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n))
export const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
export type Flight = Point & { vx: number; vy: number; time: number }
export const BLAST_RADIUS = 25
export const GRENADE_FUSE = 1.55
export const GRENADE_SPEED = 2.1
export const THROW_WINDUP = 0.24
export function launch(aim: Point): Flight {
  return {
    ...START,
    vx: clamp(aim.x, 8, 66),
    vy: clamp(aim.y, -62, -8),
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
  if (next.y > 60.5) {
    next.y = 60.5
    next.vy = -Math.abs(next.vy) * bounce
    next.vx *= 0.83
  }
  if (next.x < 5 || next.x > 95) {
    next.x = clamp(next.x, 5, 95)
    next.vx *= -bounce
  }
  for (const box of [
    { left: 43, right: 49, top: 51, bottom: 62 },
    { left: 70, right: 96, top: 24, bottom: 26 },
    { left: 82, right: 96, top: 26, bottom: 62 },
    ...bricks.map((brick) => ({
      left: brick.x - 1.5,
      right: brick.x + 1.5,
      top: brick.y - 1.5,
      bottom: brick.y + 1.5,
    })),
  ]) {
    if (
      next.x > box.left - 1.5 &&
      next.x < box.right + 1.5 &&
      next.y > box.top - 1.5 &&
      next.y < box.bottom + 1.5
    ) {
      if (ball.y <= box.top - 1.5) {
        next.y = box.top - 1.5
        next.vy = -Math.abs(next.vy) * bounce
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
export function chipWall(point: Point, bricks: WallBrick[]) {
  if (!bricks.length || point.x <= 49) return bricks
  const sorted = [...bricks].sort(
    (a, b) => distance(a, point) - distance(b, point),
  )
  const nearest = distance(sorted[0], point)
  const count = Math.max(8, Math.min(22, Math.round(24 - nearest * 0.65)))
  const removed = new Set(sorted.slice(0, count).map((brick) => brick.id))
  const remaining = bricks.filter((brick) => !removed.has(brick.id))
  return remaining.length <= 6 ? [] : remaining
}
export function grenadeResult(aim: Point, bricks: WallBrick[] = WALL_BRICKS) {
  let ball = launch(aim)
  while (ball.time < GRENADE_FUSE) ball = stepGrenade(ball, 1 / 120, bricks)
  const remaining = chipWall(ball, bricks)
  return { ball, bricks: remaining, broken: remaining.length === 0 }
}
export function trajectory(aim: Point, bricks: WallBrick[] = WALL_BRICKS) {
  let ball = launch(aim)
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
