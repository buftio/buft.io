import type { Point } from './types.ts'

export const FIELD = { left: 22.6, right: 77.4, top: 193.6, bottom: 249.4 }
export const BALL_RADIUS = 1.4
export const MAX_POWER = 58
export const STEP = 1 / 120
const DRAG = 45
export type Kick = Point & {
  vx: number
  vy: number
  time: number
  status: 'rolling' | 'stopped' | 'goal' | 'saved'
  rebounds: number
}
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
export const keeperAt = (time: number): Point => ({
  x: 50 + Math.sin(time * 1.05) * 3.8,
  y: 199,
})
export function formation(kicks: number, ball: Point): Point[] {
  if (!kicks)
    return [
      { x: 50, y: 218 },
      { x: 64, y: 208 },
    ]
  return [
    { x: clamp(ball.x * 0.4 + 28, 34, 64), y: 218 - kicks * 2 },
    { x: clamp(77 - ball.x * 0.35, 36, 66), y: 208 },
  ].map((p) => {
    if (Math.hypot(p.x - ball.x, p.y - ball.y) < 9)
      p.x = ball.x < 50 ? Math.min(70, ball.x + 12) : Math.max(30, ball.x - 12)
    return p
  })
}
export function kickVector(vector: Point): Point {
  const power = Math.hypot(vector.x, vector.y)
  const scale = power > MAX_POWER ? MAX_POWER / power : 1
  return { x: vector.x * scale, y: vector.y * scale }
}
export function launchKick(ball: Point, vector: Point): Kick {
  const velocity = kickVector(vector)
  return {
    ...ball,
    vx: velocity.x,
    vy: velocity.y,
    time: 0,
    status: 'rolling',
    rebounds: 0,
  }
}
export function stepKick(
  previous: Kick,
  dt: number,
  defenders: Point[],
  keeper: Point,
): Kick {
  if (previous.status !== 'rolling') return previous
  const ball = { ...previous, time: previous.time + dt }
  const speed = Math.hypot(ball.vx, ball.vy)
  const nextSpeed = Math.max(0, speed - DRAG * dt)
  const ratio = speed ? nextSpeed / speed : 0
  ball.vx *= ratio
  ball.vy *= ratio
  ball.x += ball.vx * dt
  ball.y += ball.vy * dt
  const bounce = (nx: number, ny: number, restitution: number) => {
    const inward = ball.vx * nx + ball.vy * ny
    if (inward < 0) {
      ball.vx -= (1 + restitution) * inward * nx
      ball.vy -= (1 + restitution) * inward * ny
      ball.rebounds++
    }
  }
  if (ball.x < FIELD.left) {
    ball.x = FIELD.left
    bounce(1, 0, 0.84)
  }
  if (ball.x > FIELD.right) {
    ball.x = FIELD.right
    bounce(-1, 0, 0.84)
  }
  if (ball.y > FIELD.bottom) {
    ball.y = FIELD.bottom
    bounce(0, -1, 0.84)
  }
  for (const [p, radius] of [
    ...defenders.map((p) => [p, 3.5] as const),
    [{ x: 44, y: 197 }, 0.6] as const,
    [{ x: 56, y: 197 }, 0.6] as const,
  ]) {
    const dx = ball.x - p.x,
      dy = ball.y - p.y
    const distance = Math.hypot(dx, dy)
    if (distance >= radius + BALL_RADIUS) continue
    const nx = distance ? dx / distance : 0,
      ny = distance ? dy / distance : 1
    ball.x = p.x + nx * (radius + BALL_RADIUS + 0.01)
    ball.y = p.y + ny * (radius + BALL_RADIUS + 0.01)
    bounce(nx, ny, 0.8)
  }
  if (Math.hypot(ball.x - keeper.x, ball.y - keeper.y) < 2.2 + BALL_RADIUS)
    ball.status = 'saved'
  else if (
    ball.y <= 195 &&
    ball.x > 44 + BALL_RADIUS &&
    ball.x < 56 - BALL_RADIUS
  )
    ball.status = 'goal'
  else if (ball.y < FIELD.top) {
    ball.y = FIELD.top
    bounce(0, 1, 0.84)
  }
  if (ball.status === 'rolling' && (nextSpeed < 0.7 || ball.time > 2.4))
    ball.status = 'stopped'
  return ball
}
export function resolveKick(
  ball: Point,
  vector: Point,
  defenders: Point[],
  time: number,
) {
  let kick = launchKick(ball, vector)
  const path: Point[] = [{ ...ball }]
  for (let i = 0; i < 600 && kick.status === 'rolling'; i++) {
    time += STEP
    kick = stepKick(kick, STEP, defenders, keeperAt(time))
    if (i % 4 === 0) path.push({ x: kick.x, y: kick.y })
  }
  path.push({ x: kick.x, y: kick.y })
  return { kick, time, path }
}
export function kickOutcome(kick: Kick, defenders: Point[], shotsLeft: number) {
  if (kick.status === 'goal') return 'goal' as const
  if (kick.status === 'saved') return 'saved' as const
  if (
    !shotsLeft ||
    defenders.some((p) => Math.hypot(kick.x - p.x, kick.y - p.y) < 6.2)
  )
    return 'lost' as const
  return 'repositioning' as const
}
export function kickGuide(ball: Point, vector: Point): Point[] {
  const v = kickVector(vector),
    power = Math.hypot(v.x, v.y)
  if (power < 3) return []
  return Array.from({ length: 6 }, (_, i) => ({
    x: ball.x + ((v.x / power) * (i + 1) * power) / 26,
    y: ball.y + ((v.y / power) * (i + 1) * power) / 26,
  }))
}
