'use client'

import { useEffect, useRef, useState } from 'react'
import { fans } from './fan-layout'
import { PASSER, WALL_BRICKS, type Point, type SceneState } from './types'
import {
  BLAST_RADIUS,
  chipWall,
  grenadeResult,
  launch,
  stepGrenade,
  trajectory,
  type Flight,
} from './game'
import {
  ballPosition,
  grabBall,
  moveBall,
  dropBall,
  FIRST_BALL_LENGTH,
  releaseBalls,
  rollBalls,
  type RollingBall,
} from './rolling'
import {
  formation,
  keeperAt,
  kickGuide,
  kickOutcome,
  launchKick,
  stepKick,
  STEP,
  type Kick,
} from './football'

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
    reduced,
  }))
  const model = useRef(scene)
  const flight = useRef<Flight | null>(null)
  const windup = useRef<number | null>(null)
  const rolling = useRef<RollingBall[]>([])
  const kick = useRef<Kick | null>(null)
  const footballTime = useRef(0)
  const shifting = useRef<{ from: Point[]; to: Point[]; age: number } | null>(
    null,
  )
  const trailSteps = useRef(0)
  const grenadeAim = useRef({
    x: Math.cos((62 * Math.PI) / 180) * 56,
    y: -Math.sin((62 * Math.PI) / 180) * 56,
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
    model.current.wallBricks = chipWall(point, model.current.wallBricks)
    if (!model.current.wallBricks.length) {
      model.current.wallBroken = true
      rolling.current = releaseBalls()
      setMessage('Wall open')
    } else setMessage('')
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
    if (
      !ballArrived.current &&
      rolling.current[0]?.travelled >= FIRST_BALL_LENGTH
    ) {
      ballArrived.current = true
      ready.current = true
      setArrived(true)
      setFootballMessage('Three kicks remaining')
      model.current.kickAim = kickGuide(PASSER, shotAim.current)
      model.current.football = { ...PASSER }
      model.current.balls = model.current.balls.filter((ball) => ball.id !== 0)
    }
  }
  function finishKick() {
    const result = kick.current
    if (!result) return
    model.current.football = { x: result.x, y: result.y }
    model.current.trace = [...model.current.trace, model.current.football]
    model.current.outcome = kickOutcome(
      result,
      model.current.defenders,
      model.current.shotsLeft,
    )
    model.current.kickAim = []
    setFootballMessage(
      model.current.outcome === 'goal'
        ? 'Goal'
        : model.current.outcome === 'saved'
          ? 'Saved'
          : model.current.outcome === 'lost'
            ? 'Possession lost'
            : `${model.current.shotsLeft} kicks remaining`,
    )
    kick.current = null
    if (model.current.outcome === 'repositioning') {
      const next = formation(
        3 - model.current.shotsLeft,
        model.current.football,
      )
      if (model.current.reduced) {
        model.current.defenders = next
        model.current.outcome = 'setup'
        model.current.kickAim = kickGuide(
          model.current.football,
          shotAim.current,
        )
      } else
        shifting.current = { from: model.current.defenders, to: next, age: 0 }
    }
  }
  function footballStep() {
    footballTime.current += STEP
    model.current.keeper = keeperAt(footballTime.current)
    if (!kick.current) return
    kick.current = stepKick(
      kick.current,
      STEP,
      model.current.defenders,
      model.current.keeper,
    )
    model.current.football = { x: kick.current.x, y: kick.current.y }
    if (++trailSteps.current % 4 === 0)
      model.current.trace = [...model.current.trace, model.current.football]
    if (kick.current.status !== 'rolling') finishKick()
  }
  function settleKick() {
    for (let i = 0; i < 600 && kick.current; i++) footballStep()
    if (model.current.football)
      model.current.player = {
        x: model.current.football.x,
        y: Math.min(247, model.current.football.y + 3.5),
      }
  }
  useEffect(() => {
    model.current.reduced = reduced
    let raf = 0,
      last = 0,
      carry = 0,
      grenadeCarry = 0
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.08) : 0
      last = now
      const reducedChange =
        reduced &&
        (!!flight.current ||
          windup.current !== null ||
          !!kick.current ||
          !!shifting.current)
      if (reduced) {
        if (flight.current || windup.current !== null)
          finishThrow(
            grenadeResult(grenadeAim.current, model.current.wallBricks).ball,
          )
        model.current.explosion = null
        if (kick.current) settleKick()
        if (shifting.current) {
          model.current.defenders = shifting.current.to
          model.current.outcome = 'setup'
          shifting.current = null
        }
      } else {
        if (windup.current !== null) {
          const before = windup.current
          windup.current += dt
          model.current.throwProgress = Math.min(1, windup.current / 0.48)
          if (before < 0.312 && windup.current >= 0.312) {
            flight.current = launch(grenadeAim.current)
            model.current.grenade = flight.current
          }
          if (windup.current >= 0.48) {
            windup.current = null
            model.current.throwProgress = 0
          }
        }
        grenadeCarry += dt * 1.7
        while (grenadeCarry >= STEP && flight.current) {
          grenadeCarry -= STEP
          flight.current = stepGrenade(
            flight.current,
            STEP,
            model.current.wallBricks,
          )
          model.current.grenade = flight.current
          if (flight.current.time >= 2.2) finishThrow(flight.current)
        }
        if (!flight.current) grenadeCarry = 0
        carry += dt
        while (carry >= STEP) {
          carry -= STEP
          if (rolling.current.length) stepBalls()
          if (ready.current) footballStep()
        }
        if (rolling.current.length) updateBalls()
        if (model.current.explosion) {
          model.current.explosion.age += dt
          if (model.current.explosion.age > 0.85) model.current.explosion = null
        }
        if (shifting.current) {
          const shift = shifting.current
          shift.age = Math.min(1, shift.age + dt * 2)
          const t = shift.age * shift.age * (3 - 2 * shift.age)
          model.current.defenders = shift.to.map((p, i) => ({
            x: shift.from[i].x + (p.x - shift.from[i].x) * t,
            y: shift.from[i].y + (p.y - shift.from[i].y) * t,
          }))
          if (shift.age >= 1) {
            shifting.current = null
            model.current.outcome = 'setup'
            model.current.kickAim = kickGuide(
              model.current.football!,
              shotAim.current,
            )
          }
        }
        if (model.current.football && !kick.current) {
          const target = {
            x: model.current.football.x,
            y: Math.min(247, model.current.football.y + 3.5),
          }
          const t = Math.min(1, dt * 9)
          model.current.player = {
            x: model.current.player.x + (target.x - model.current.player.x) * t,
            y: model.current.player.y + (target.y - model.current.player.y) * t,
          }
        }
      }
      if (!reduced || reducedChange) publish()
      raf = requestAnimationFrame(tick)
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
        windup.current = model.current.throwCharging ? 0.216 : 0
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
      if (kick.current) settleKick()
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
      const grabbed = grabBall(rolling.current, id)
      updateBalls()
      publish()
      return grabbed
    },
    moveBall(id: number, point: Point) {
      moveBall(rolling.current, id, point)
      updateBalls()
      publish()
    },
    dropBall(id: number, velocity: Point) {
      dropBall(rolling.current, id, velocity)
      if (reduced) for (let i = 0; i < 720; i++) stepBalls()
      updateBalls()
      publish()
    },
    grabKick(active: boolean) {
      model.current.kickDragging = active && canKick()
      publish()
    },
    aimKick(vector: Point) {
      if (!canKick()) return
      shotAim.current = vector
      model.current.kickAim = kickGuide(model.current.football!, vector)
      publish()
    },
    play(vector = shotAim.current) {
      if (!canKick() || Math.hypot(vector.x, vector.y) < 3) return
      model.current.kickDragging = false
      shotAim.current = vector
      model.current.shotsLeft--
      model.current.trace = [model.current.football!]
      model.current.kickAim = []
      model.current.outcome = 'playing'
      kick.current = launchKick(model.current.football!, vector)
      trailSteps.current = 0
      setFootballMessage('')
      if (reduced) settleKick()
      publish()
    },
    retry() {
      if (!ready.current) return
      kick.current = null
      shifting.current = null
      footballTime.current = 0
      shotAim.current = { x: 0, y: -44 }
      model.current.outcome = 'setup'
      model.current.kickDragging = false
      model.current.trace = []
      model.current.shotsLeft = 3
      model.current.defenders = formation(0, PASSER)
      model.current.keeper = keeperAt(0)
      model.current.football = { ...PASSER }
      model.current.player = { x: PASSER.x, y: PASSER.y + 3.5 }
      model.current.kickAim = kickGuide(PASSER, shotAim.current)
      setFootballMessage('Three kicks remaining')
      publish()
    },
  }
}
