'use client'

import { useEffect, useRef, useState } from 'react'
import { fans } from './fan-layout'
import { PASSER, WALL_BRICKS, type Point, type SceneState } from './types'
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
import { formation, keeperAt, kickGuide, HOME_KEEPER, STEP } from './football'
import { createMatch } from './match'
import { createCourse, TROOPER } from './course'

export function useGame(reduced: boolean) {
  const [scene, setScene] = useState<SceneState>(() => ({
    trooper: { ...TROOPER },
    walking: false,
    gate: 0,
    landedAt: null,
    cheerAt: null,
    shake: 0,
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
  const course = useRef<ReturnType<typeof createCourse> | null>(null)
  const rolling = useRef<RollingBall[]>([])
  const match = useRef<ReturnType<typeof createMatch> | null>(null)
  const shotAim = useRef({ x: 0, y: -44 })
  const ballArrived = useRef(false)
  const ready = useRef(false)
  const [message, setMessage] = useState('')
  const [arrived, setArrived] = useState(false)
  const publish = () =>
    setScene({
      ...model.current,
      explosion: model.current.explosion
        ? { ...model.current.explosion }
        : null,
    })
  const openGate = () => {
    model.current.wallOpenedAt = model.current.clock
    rolling.current = releaseBalls()
    setMessage('Gate open')
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
    if (
      !ballArrived.current &&
      rolling.current[0]?.travelled >= FIRST_BALL_LENGTH
    ) {
      ballArrived.current = true
      model.current.arrivedAt = model.current.clock
      ready.current = true
      setArrived(true)
      model.current.kickAim = kickGuide(PASSER, shotAim.current)
      model.current.football = { ...PASSER }
      model.current.balls = model.current.balls.filter((ball) => ball.id !== 0)
    }
  }
  useEffect(() => {
    if (!match.current) match.current = createMatch(() => model.current)
    if (!course.current)
      course.current = createCourse(() => model.current, openGate)
    model.current.reduced = reduced
    let raf = 0,
      last = 0,
      carry = 0,
      paused = false
    const tick = (now: number) => {
      const dt = last && !paused ? Math.min((now - last) / 1000, 0.08) : 0
      last = now
      const reducedChange =
        reduced && !['setup', 'won', 'lost'].includes(model.current.outcome)
      if (reduced) {
        course.current!.settle()
        model.current.explosion = null
        match.current!.settle()
      } else {
        course.current!.step(dt)
        model.current.clock += dt
        const speed = model.current.collapse > 0 ? 0.25 : 1
        model.current.collapse = Math.max(0, model.current.collapse - dt)
        carry += dt * speed
        while (carry >= STEP) {
          carry -= STEP
          if (rolling.current.length) stepBalls()
          if (ready.current) match.current!.step()
        }
        if (rolling.current.length) updateBalls()
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
        throw: (aim: Point) => {
          course.current!.aim(aim, 1)
          course.current!.throw()
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
    arrived,
    aim(point: Point, strength = Math.hypot(point.x, point.y) / 70) {
      course.current!.aim(point, strength)
      publish()
    },
    cancelThrow() {
      course.current!.cancel()
      publish()
    },
    throwGrenade() {
      course.current!.throw()
      publish()
    },
    advance() {
      course.current!.settle()
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
