'use client'

import { useEffect, useRef, useState } from 'react'
import { fans } from './fan-layout'
import { PASSER, WALL_BRICKS, type Point, type SceneState } from './types'
import {
  BLAST_RADIUS,
  GRENADE_FUSE,
  GRENADE_SPEED,
  THROW_WINDUP,
  chipWall,
  grenadeResult,
  launch,
  stepGrenade,
  trajectory,
  type Flight,
} from './game'
import {
  fall,
  type FallingBall,
  ballPosition,
  grabBall,
  moveBall,
  dropBall,
  FIRST_BALL_LENGTH,
  releaseBalls,
  rollBalls,
  type RollingBall,
} from './rolling'
import { formation, keeperAt, kickGuide, HOME_KEEPER, STEP } from './football'
import { createMatch } from './match'

export function useGame(reduced: boolean) {
  const [scene, setScene] = useState<SceneState>(() => ({
    wallBroken: false,
    throwProgress: 0,
    throwCharging: false,
    throwStrength: 1,
    grenade: null,
    wallBricks: WALL_BRICKS,
    aim: [],
    explosion: null,
    balls: [],
    player: { x: PASSER.x, y: PASSER.y + 3.5 },
    keeper: keeperAt(0),
    kickAim: [],
    kickDragging: false,
    fanPokes: fans.map(() => 0),
    shotsLeft: 3,
    defenders: formation(0, PASSER),
    football: null,
    trace: [],
    outcome: 'setup',
    score: [0, 0],
    homeKeeper: { ...HOME_KEEPER },
    shooter: 0,
    reaction: 'neutral',
    collapse: 0,
    clock: 0,
    wallOpenedAt: null,
    arrivedAt: null,
    reduced,
  }))
  const model = useRef(scene)
  const flight = useRef<Flight | null>(null)
  const windup = useRef<number | null>(null)
  const rolling = useRef<RollingBall[]>([])
  const match = useRef<ReturnType<typeof createMatch> | null>(null)
  const popped = useRef<(FallingBall & { id: number })[]>([])
  const grenadeAim = useRef({
    x: 44,
    y: -38,
  })
  const shotAim = useRef({ x: 0, y: -44 })
  const ballArrived = useRef(false)
  const ready = useRef(false)
  const [message, setMessage] = useState('')
  const [footballMessage, setFootballMessage] = useState('')
  const [arrived, setArrived] = useState(false)
  const publish = () =>
    setScene({
      ...model.current,
      explosion: model.current.explosion
        ? { ...model.current.explosion }
        : null,
    })
  const finishThrow = (point: Point) => {
    flight.current = null
    windup.current = null
    model.current.throwProgress = 0
    model.current.throwCharging = false
    model.current.grenade = null
    model.current.explosion = { ...point, radius: BLAST_RADIUS, age: 0 }
    const before = model.current.wallBricks
    model.current.wallBricks = chipWall(point, before)
    const removed = before.filter(
      (b) => !model.current.wallBricks.some((kept) => kept.id === b.id),
    )
    if (removed.length && model.current.wallBricks.length) {
      const hole = removed[Math.floor(removed.length / 2)]
      for (let i = 0; i < Math.min(3, Math.ceil(removed.length / 8)); i++)
        popped.current.push({
          id: 100 + popped.current.length,
          x: hole.x - i * 2,
          y: hole.y,
          vx: -8 - i * 3,
          vy: -14,
          spin: 0,
        })
      if (model.current.reduced)
        for (let i = 0; i < 240; i++) fall(popped.current, STEP, [], 59.1)
    }
    if (!model.current.wallBricks.length) {
      model.current.wallBroken = true
      model.current.wallOpenedAt = model.current.clock
      model.current.collapse = model.current.reduced ? 0 : 0.6
      model.current.explosion.radius = BLAST_RADIUS * 1.5
      rolling.current = releaseBalls()
      setMessage('Wall open')
    } else setMessage('')
    updateBalls()
  }
  const stepBalls = () =>
    rollBalls(rolling.current, STEP, [
      ...model.current.defenders.map((p) => ({ ...p, radius: 3.5 })),
      { ...model.current.player, radius: 2.7 },
      { ...model.current.keeper, radius: 2.2 },
    ])
  const updateBalls = () => {
    model.current.balls = rolling.current
      .filter((ball) => !(ball.id === 0 && ballArrived.current))
      .map((ball) => ({
        ...ballPosition(ball),
        id: ball.id,
        spin: ball.drop?.spin ?? ball.travelled / 1.4,
        loose: !!ball.drop,
        held: !!ball.drop?.held,
      }))
    model.current.balls = [
      ...model.current.balls,
      ...popped.current.map((ball) => ({
        ...ball,
        loose: true,
      })),
    ]
    if (
      !ballArrived.current &&
      rolling.current[0]?.travelled >= FIRST_BALL_LENGTH
    ) {
      ballArrived.current = true
      model.current.arrivedAt = model.current.clock
      ready.current = true
      setArrived(true)
      setFootballMessage('')
      model.current.kickAim = kickGuide(PASSER, shotAim.current)
      model.current.football = { ...PASSER }
      model.current.balls = model.current.balls.filter((ball) => ball.id !== 0)
    }
  }
  useEffect(() => {
    if (!match.current) match.current = createMatch(() => model.current)
    model.current.reduced = reduced
    let raf = 0,
      last = 0,
      carry = 0,
      grenadeCarry = 0,
      paused = false
    const tick = (now: number) => {
      const dt = last && !paused ? Math.min((now - last) / 1000, 0.08) : 0
      last = now
      const reducedChange =
        reduced &&
        (!!flight.current ||
          windup.current !== null ||
          model.current.outcome !== 'setup')
      if (reduced) {
        if (flight.current || windup.current !== null)
          finishThrow(
            grenadeResult(grenadeAim.current, model.current.wallBricks).ball,
          )
        model.current.explosion = null
        match.current!.settle()
      } else {
        if (windup.current !== null) {
          const before = windup.current
          windup.current += dt
          model.current.throwProgress = Math.min(
            1,
            windup.current / THROW_WINDUP,
          )
          if (before < 0.12 && windup.current >= 0.12) {
            flight.current = launch(grenadeAim.current)
            model.current.grenade = flight.current
          }
          if (windup.current >= THROW_WINDUP) {
            windup.current = null
            model.current.throwProgress = 0
          }
        }
        grenadeCarry += dt * GRENADE_SPEED
        while (grenadeCarry >= STEP && flight.current) {
          grenadeCarry -= STEP
          flight.current = stepGrenade(
            flight.current,
            STEP,
            model.current.wallBricks,
          )
          model.current.grenade = flight.current
          if (flight.current.time >= GRENADE_FUSE) finishThrow(flight.current)
        }
        if (!flight.current) grenadeCarry = 0
        model.current.clock += dt
        const speed = model.current.collapse > 0 ? 0.25 : 1
        model.current.collapse = Math.max(0, model.current.collapse - dt)
        carry += dt * speed
        while (carry >= STEP) {
          carry -= STEP
          if (rolling.current.length) stepBalls()
          if (popped.current.length) fall(popped.current, STEP, [], 59.1)
          if (ready.current) match.current!.step()
        }
        if (rolling.current.length || popped.current.length) updateBalls()
        if (model.current.explosion) {
          model.current.explosion.age += dt * speed
          if (model.current.explosion.age > 0.85) model.current.explosion = null
        }
      }
      if (!reduced || reducedChange) publish()
      raf = requestAnimationFrame(tick)
    }
    if (
      process.env.NODE_ENV === 'development' &&
      new URLSearchParams(window.location.search).has('spera-test')
    ) {
      const target = window as unknown as { speraTest?: unknown }
      target.speraTest = {
        state: () => model.current,
        pause: (value: boolean) => {
          paused = value
        },
        step: (seconds: number) => {
          for (let i = 0; i < seconds / STEP; i++) {
            model.current.clock += STEP
            const speed = model.current.collapse > 0 ? 0.25 : 1
            model.current.collapse = Math.max(0, model.current.collapse - STEP)
            if (rolling.current.length) rollBalls(rolling.current, STEP * speed)
            if (ready.current) match.current!.step()
            updateBalls()
          }
          updateBalls()
          publish()
        },
        goal: (team: 0 | 1) => {
          match.current!.forceGoal(team)
          publish()
        },
      }
    }
    publish()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [reduced])
  const canKick = () =>
    ready.current &&
    model.current.outcome === 'setup' &&
    model.current.shotsLeft > 0 &&
    !!model.current.football
  return {
    scene,
    message,
    footballMessage,
    arrived,
    aim(point: Point, strength = Math.hypot(point.x, point.y) / 70) {
      if (flight.current || windup.current !== null || model.current.wallBroken)
        return
      grenadeAim.current = point
      model.current.throwCharging = true
      model.current.throwStrength = Math.max(0, Math.min(1, strength))
      model.current.throwProgress = 0.45
      model.current.aim = trajectory(point, model.current.wallBricks)
      publish()
    },
    cancelThrow() {
      if (!model.current.throwCharging) return
      model.current.throwCharging = false
      model.current.throwProgress = 0
      model.current.aim = []
      publish()
    },
    throwGrenade() {
      if (flight.current || windup.current !== null || model.current.wallBroken)
        return
      model.current.aim = []
      model.current.explosion = null
      if (reduced) {
        finishThrow(
          grenadeResult(grenadeAim.current, model.current.wallBricks).ball,
        )
        model.current.explosion = null
      } else {
        windup.current = model.current.throwCharging ? 0.07 : 0
        if (!model.current.throwCharging) {
          model.current.throwStrength = 1
          model.current.throwProgress = 0.001
        }
        model.current.throwCharging = false
      }
      publish()
    },
    advance() {
      if (flight.current || windup.current !== null)
        finishThrow(
          grenadeResult(grenadeAim.current, model.current.wallBricks).ball,
        )
      if (rolling.current.length) {
        const target = (Math.floor(rolling.current[0].travelled / 95) + 1) * 95
        for (let i = 0; i < 1800; i++) {
          stepBalls()
          if (
            rolling.current[0].travelled >= target &&
            target < FIRST_BALL_LENGTH
          )
            break
        }
        updateBalls()
      }
      match.current!.settle()
      model.current.explosion = null
      publish()
    },
    pokeFan(id: number) {
      if (id < 0 || id >= model.current.fanPokes.length) return
      model.current.fanPokes = model.current.fanPokes.map(
        (count, i) => count + (i === id ? 1 : 0),
      )
      publish()
    },
    grabBall(id: number) {
      const loose = popped.current.find((ball) => ball.id === id)
      if (loose) {
        loose.held = true
        loose.vx = 0
        loose.vy = 0
      }
      const grabbed = !!loose || grabBall(rolling.current, id)
      updateBalls()
      publish()
      return grabbed
    },
    moveBall(id: number, point: Point) {
      const loose = popped.current.find((ball) => ball.id === id)
      if (loose?.held) {
        loose.x = Math.max(2, Math.min(81, point.x))
        loose.y = Math.max(26, Math.min(59.1, point.y))
      } else moveBall(rolling.current, id, point)
      updateBalls()
      publish()
    },
    dropBall(id: number, velocity: Point) {
      const loose = popped.current.find((ball) => ball.id === id)
      if (loose) {
        loose.held = false
        loose.vx = velocity.x
        loose.vy = velocity.y
      } else dropBall(rolling.current, id, velocity)
      if (reduced) for (let i = 0; i < 720; i++) stepBalls()
      updateBalls()
      publish()
    },
    grabKick(active: boolean) {
      model.current.kickDragging = active && canKick()
      publish()
    },
    aimKick(vector: Point) {
      shotAim.current = vector
      match.current!.aim(vector)
      publish()
    },
    play(vector = shotAim.current) {
      match.current!.play(vector)
      publish()
    },
    moveKeeper(x: number) {
      match.current!.keeper(x)
      publish()
    },
    retry() {
      if (!ready.current) return
      match.current!.retry()
      publish()
    },
    forceGoal(team: 0 | 1) {
      match.current!.forceGoal(team)
      publish()
    },
  }
}
