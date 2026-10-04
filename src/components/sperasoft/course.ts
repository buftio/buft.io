import type { Body, Point, SceneState } from './types.ts'
import {
  BLAST_RADIUS,
  GATE,
  GRENADE_FUSE,
  GRENADE_SPEED,
  PIT,
  THROW_WINDUP,
  TROOPER_START,
  blastPush,
  chipWall,
  grenadeResult,
  inTrench,
  launch,
  pastWall,
  settleTrooper,
  stepGrenade,
  stepTrooper,
  trajectory,
  type Flight,
} from './game.ts'

const STEP = 1 / 120
export const TROOPER: Body = { ...TROOPER_START, vx: 0, vy: 0, grounded: true }
const beat = (body: Point) => (body.x < 22 ? 0 : body.x < PIT.right ? 1 : 2)

export function createCourse(get: () => SceneState, open: () => void) {
  let flight: Flight | null = null
  let windup: number | null = null
  let aim = { x: 44, y: -38 }
  let safe: Point = TROOPER_START
  let freeze = 0,
    sinking = 0,
    carry = 0,
    best = 0
  const ready = () => {
    const s = get()
    return (
      !flight &&
      windup === null &&
      s.trooper.grounded &&
      !sinking &&
      !s.walking &&
      s.gate === 0
    )
  }
  const explode = (point: Point) => {
    const s = get()
    const before = s.wallBricks
    s.wallBricks = chipWall(point, before)
    s.explosion = { ...point, radius: BLAST_RADIUS, age: 0 }
    if (!inTrench(s.trooper)) safe = { x: s.trooper.x, y: s.trooper.y }
    freeze = 0.07
    s.shake = 0.35
    if (s.wallBricks.length || s.wallBroken) return true
    s.wallBroken = true
    s.collapse = s.reduced ? 0 : 0.6
    s.explosion.radius = BLAST_RADIUS * 1.5
    freeze = 0.16
    s.shake = 0.7
    return false
  }
  const land = () => {
    const s = get()
    s.landedAt = s.clock
    if (inTrench(s.trooper)) {
      sinking = s.reduced ? 0.001 : 0.45
      return
    }
    if (beat(s.trooper) > best) {
      best = beat(s.trooper)
      s.cheerAt = s.clock
    }
  }
  const finale = () => {
    const s = get()
    if (!s.wallBroken || s.walking || s.gate > 0 || !ready()) return
    if (!pastWall(s.trooper)) return
    if (s.reduced) {
      s.trooper = { ...s.trooper, x: GATE }
      s.gate = 1
      open()
    } else s.walking = true
  }
  const resolve = () => {
    const s = get()
    const { ball } = grenadeResult(aim, s.wallBricks, s.trooper)
    const push = explode(ball)
    s.explosion = null
    if (push) s.trooper = settleTrooper(s.trooper, ball, s.wallBricks)
    flight = null
    windup = null
    s.grenade = null
    s.throwProgress = 0
    land()
    if (sinking) {
      sinking = 0
      s.trooper = { ...safe, vx: 0, vy: 0, grounded: true }
    }
    finale()
  }
  return {
    ready,
    aim(point: Point, strength: number) {
      if (!ready()) return
      const s = get()
      aim = point
      s.throwCharging = true
      s.throwStrength = Math.max(0, Math.min(1, strength))
      s.throwProgress = 0.45
      s.aim = trajectory(point, s.wallBricks, s.trooper)
    },
    cancel() {
      const s = get()
      if (!s.throwCharging) return
      s.throwCharging = false
      s.throwProgress = 0
      s.aim = []
    },
    throw() {
      if (!ready()) return
      const s = get()
      s.aim = []
      s.explosion = null
      if (s.reduced) return resolve()
      windup = s.throwCharging ? 0.07 : 0
      if (!s.throwCharging) {
        s.throwStrength = 1
        s.throwProgress = 0.001
      }
      s.throwCharging = false
    },
    settle() {
      if (flight || windup !== null) resolve()
    },
    step(dt: number) {
      const s = get()
      s.shake = Math.max(0, s.shake - dt)
      if (freeze > 0) {
        freeze -= dt
        return
      }
      if (windup !== null) {
        const before = windup
        windup += dt
        s.throwProgress = Math.min(1, windup / THROW_WINDUP)
        if (before < 0.12 && windup >= 0.12) {
          flight = launch(aim, s.trooper)
          s.grenade = flight
        }
        if (windup >= THROW_WINDUP) {
          windup = null
          s.throwProgress = 0
        }
      }
      if (sinking) {
        sinking = Math.max(0, sinking - dt)
        if (!sinking) s.trooper = { ...safe, vx: 0, vy: 0, grounded: true }
        return
      }
      if (s.walking) {
        const step = Math.sign(GATE - s.trooper.x) * 15 * dt
        const x =
          Math.abs(GATE - s.trooper.x) <= Math.abs(step)
            ? GATE
            : s.trooper.x + step
        s.trooper = { ...s.trooper, x }
        if (x === GATE) {
          s.walking = false
          s.gate = 0.001
        }
        return
      }
      if (s.gate > 0 && s.gate < 1) {
        s.gate = Math.min(1, s.gate + dt / 0.9)
        if (s.gate >= 1) open()
        return
      }
      carry += dt * GRENADE_SPEED
      while (carry >= STEP) {
        carry -= STEP
        if (flight) {
          flight = stepGrenade(flight, STEP, s.wallBricks)
          s.grenade = flight
          if (flight.time >= GRENADE_FUSE) {
            const point = flight
            flight = null
            s.grenade = null
            if (explode(point)) s.trooper = blastPush(s.trooper, point)
            return
          }
        }
        if (!s.trooper.grounded || Math.abs(s.trooper.vx) > 0.01) {
          const air = !s.trooper.grounded
          s.trooper = stepTrooper(s.trooper, STEP, s.wallBricks)
          if (air && s.trooper.grounded) land()
        }
      }
      finale()
    },
  }
}
