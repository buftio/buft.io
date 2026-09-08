import { CHANNEL, FIRST_BALL_CHANNEL, type Point } from './types.ts'
import { along, pathLength, clamp } from './game.ts'

export const CHANNEL_LENGTH = pathLength(CHANNEL)
export const FIRST_BALL_LENGTH = pathLength(FIRST_BALL_CHANNEL)
export const RADIUS = 1.4
export type FallingBall = Point & {
  vx: number
  vy: number
  spin: number
  held?: boolean
}
export type RollingBall = {
  id: number
  travelled: number
  speed: number
  drop: FallingBall | null
}
export const releaseBalls = (): RollingBall[] =>
  Array.from({ length: 24 }, (_, id) => ({
    id,
    travelled: -id * 3.9,
    speed: 24,
    drop: null,
  }))
function constrain(ball: FallingBall, previous = ball) {
  if (ball.held) return
  if (ball.x < 2 || ball.x > 98) {
    ball.x = clamp(ball.x, 2, 98)
    ball.vx *= -0.35
  }
  for (const box of [
    { left: 19, right: 21.3, top: 191.6, bottom: 253 },
    { left: 78.7, right: 81, top: 191.6, bottom: 253 },
    { left: 19, right: 81, top: 250.7, bottom: 253 },
    { left: 19, right: 44, top: 190, bottom: 192.3 },
    { left: 56, right: 81, top: 190, bottom: 192.3 },
  ]) {
    if (
      ball.x <= box.left - RADIUS ||
      ball.x >= box.right + RADIUS ||
      ball.y <= box.top - RADIUS ||
      ball.y >= box.bottom + RADIUS
    )
      continue
    if (previous.y <= box.top - RADIUS) {
      ball.y = box.top - RADIUS
      ball.vy = -Math.abs(ball.vy) * 0.45
    } else if (previous.y >= box.bottom + RADIUS) {
      ball.y = box.bottom + RADIUS
      ball.vy = Math.abs(ball.vy) * 0.45
    } else {
      ball.x =
        previous.x < (box.left + box.right) / 2
          ? box.left - RADIUS
          : box.right + RADIUS
      ball.vx *= -0.45
    }
  }
  if (ball.y > 266 - RADIUS) {
    ball.y = 266 - RADIUS
    ball.vy = Math.abs(ball.vy) < 3 ? 0 : -Math.abs(ball.vy) * 0.38
    ball.vx *= 0.96
  }
}
function fall(
  balls: FallingBall[],
  dt: number,
  obstacles: (Point & { radius: number })[],
) {
  for (const ball of balls) {
    if (ball.held) continue
    const previous = { ...ball }
    ball.vy += 90 * dt
    ball.vx *= Math.exp(-0.22 * dt)
    ball.x += ball.vx * dt
    ball.y += ball.vy * dt
    ball.spin += (ball.vx * dt) / RADIUS
    constrain(ball, previous)
    for (const p of obstacles) {
      const dx = ball.x - p.x,
        dy = ball.y - p.y,
        d = Math.hypot(dx, dy)
      if (d >= RADIUS + p.radius) continue
      const nx = d > 0.001 ? dx / d : 1,
        ny = d > 0.001 ? dy / d : 0
      ball.x = p.x + nx * (RADIUS + p.radius)
      ball.y = p.y + ny * (RADIUS + p.radius)
      const speed = ball.vx * nx + ball.vy * ny
      if (speed < 0) {
        ball.vx -= 1.45 * speed * nx
        ball.vy -= 1.45 * speed * ny
      }
    }
  }
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const a = balls[i],
          b = balls[j]
        const dx = b.x - a.x,
          dy = b.y - a.y
        const distance = Math.hypot(dx, dy)
        if (distance >= RADIUS * 2) continue
        const nx = distance > 0.001 ? dx / distance : 1
        const ny = distance > 0.001 ? dy / distance : 0
        const weightA = a.held ? 0 : 1,
          weightB = b.held ? 0 : 1
        const weight = weightA + weightB
        if (!weight) continue
        const overlap = (RADIUS * 2 - distance) / weight
        a.x -= nx * overlap * weightA
        a.y -= ny * overlap * weightA
        b.x += nx * overlap * weightB
        b.y += ny * overlap * weightB
        const speed = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
        if (speed < 0) {
          const impulse = (-speed * 1.3) / weight
          a.vx -= impulse * nx * weightA
          a.vy -= impulse * ny * weightA
          b.vx += impulse * nx * weightB
          b.vy += impulse * ny * weightB
        }
        constrain(a)
        constrain(b)
      }
    }
  }
}
export function rollBalls(
  balls: RollingBall[],
  dt: number,
  obstacles: (Point & { radius: number })[] = [],
) {
  for (const ball of balls) {
    if (ball.drop) continue
    const path = ball.id ? CHANNEL : FIRST_BALL_CHANNEL
    const length = ball.id ? CHANNEL_LENGTH : FIRST_BALL_LENGTH
    const before = along(path, Math.max(0, ball.travelled))
    const after = along(path, Math.max(0, ball.travelled) + 0.5)
    const gravity = ((after.y - before.y) / 0.5) * 75
    ball.speed = clamp(ball.speed + (gravity - ball.speed * 0.1) * dt, 32, 74)
    ball.travelled = Math.min(length, ball.travelled + ball.speed * dt)
    if (ball.id && ball.travelled >= length) {
      const end = path.at(-1)!,
        start = path.at(-2)!
      const dx = end.x - start.x,
        dy = end.y - start.y
      const distance = Math.hypot(dx, dy)
      ball.drop = {
        ...end,
        vx: (dx / distance) * ball.speed,
        vy: (dy / distance) * ball.speed,
        spin: ball.travelled / RADIUS,
      }
    }
  }
  fall(
    balls.flatMap((ball) => (ball.drop ? [ball.drop] : [])),
    dt,
    obstacles,
  )
}
export function ballPosition(ball: RollingBall): Point {
  if (ball.drop) return { x: ball.drop.x, y: ball.drop.y }
  if (ball.travelled < 0) {
    const start = {
      x: 84 + (ball.id % 4) * 2.5,
      y: 57 - Math.floor(ball.id / 4) * 2.7,
    }
    const t = clamp(1 + ball.travelled / Math.max(1, ball.id * 3.9), 0, 1)
    return {
      x: start.x + (CHANNEL[0].x - start.x) * t,
      y: start.y + (CHANNEL[0].y - start.y) * t,
    }
  }
  return along(ball.id ? CHANNEL : FIRST_BALL_CHANNEL, ball.travelled)
}

export function grabBall(balls: RollingBall[], id: number) {
  const ball = balls.find((ball) => ball.id === id)?.drop
  if (!ball) return false
  ball.held = true
  ball.vx = 0
  ball.vy = 0
  return true
}
export function moveBall(balls: RollingBall[], id: number, point: Point) {
  const ball = balls.find((ball) => ball.id === id)?.drop
  if (!ball?.held) return
  ball.x = clamp(point.x, 2, 98)
  ball.y = clamp(point.y, 187, 264.6)
}
export function dropBall(balls: RollingBall[], id: number, velocity: Point) {
  const ball = balls.find((ball) => ball.id === id)?.drop
  if (!ball?.held) return
  ball.held = false
  const speed = Math.hypot(velocity.x, velocity.y)
  const scale = speed > 110 ? 110 / speed : 1
  ball.vx = velocity.x * scale
  ball.vy = velocity.y * scale
}
