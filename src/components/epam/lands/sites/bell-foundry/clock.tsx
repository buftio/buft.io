'use client'

import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Land } from '../../registry'
import { threat } from '../../threat'
import { COOL } from './layout'

export const STRIKE = 0.62
export const RINGS = 6
export const TINGS = 4

export type Life = {
  t: number
  ram: number
  hit: number
  strikes: Float32Array
  slot: number
  alarm: number
  dim: number
  threat: number
  poll: number
  pour: number
  tings: Float32Array
  tingBell: Int8Array
  tingSlot: number
  tingNext: number
  taps: Float32Array
}

export function birth(): Life {
  return {
    t: 0,
    ram: 0.25,
    hit: -1.3,
    strikes: Float32Array.from({ length: RINGS }, (_, i) =>
      i === 0 ? -1.3 : i === 1 ? -1.02 : -99,
    ),
    slot: 2,
    alarm: 0,
    dim: 0,
    threat: 0,
    poll: 0,
    pour: 0.5,
    tings: Float32Array.from({ length: TINGS }, (_, i) =>
      i === 0 ? -0.3 : -99,
    ),
    tingBell: Int8Array.from({ length: TINGS }, () => 0),
    tingSlot: 1,
    tingNext: 1,
    taps: new Float32Array(2).fill(-99),
  }
}

export function dunk(t: number) {
  const u = t / 3.4
  const side = Math.floor(u) % 2
  const f = u - Math.floor(u)
  const depth =
    f > 0.35 && f < 0.6 ? Math.sin(((f - 0.35) / 0.25) * Math.PI) : 0
  return { side, depth, since: (f - 0.45) * 3.4 }
}

const smooth = (x: number) => x * x * (3 - 2 * x)

export function ramAngle(p: number) {
  if (p < 0.55) return 0.5 * smooth(p / 0.55)
  if (p < STRIKE) {
    const u = (p - 0.55) / (STRIKE - 0.55)
    return 0.5 * (1 - u * u)
  }
  const u = p - STRIKE
  return 0.12 * Math.sin(u * 22) * Math.exp(-u * 9)
}

export function pourState(p: number) {
  const ramp = (a: number, b: number) =>
    smooth(Math.min(1, Math.max(0, (p - a) / (b - a))))
  const turn = ramp(0.25, 0.37) - ramp(0.76, 0.88)
  const tilt = ramp(0.37, 0.45) - ramp(0.68, 0.76)
  const flow = ramp(0.44, 0.47) - ramp(0.66, 0.7)
  const runnel = ramp(0.45, 0.52) - ramp(0.68, 0.82)
  const pit = 0.18 + 0.82 * (ramp(0.5, 0.72) - ramp(0.74, 1))
  return { turn, tilt, flow, runnel, pit }
}

export function Clock({
  life,
  land,
  reduced,
}: {
  life: RefObject<Life>
  land: Land
  reduced: boolean
}) {
  useFrame((_, delta) => tick(life.current, land, reduced, delta))
  return null
}

function tick(L: Life, land: Land, reduced: boolean, delta: number) {
  const real = Math.min(delta, 0.1)
  const dt = reduced ? 0 : real
  L.poll -= real
  if (L.poll <= 0) {
    L.poll = 1
    L.threat = threat(land.x, land.y, land.radius)
  }
  L.alarm += ((L.threat > 0.02 ? 1 : 0) - L.alarm) * Math.min(1, real * 1.5)
  L.dim += ((L.threat > 0.5 ? 1 : 0) - L.dim) * Math.min(1, real * 0.8)
  L.t += dt
  const was = L.ram
  L.ram += dt / (7 - 4.6 * L.alarm)
  if (was < STRIKE && L.ram >= STRIKE) {
    L.hit = L.t
    L.strikes[L.slot % RINGS] = L.t
    L.strikes[(L.slot + 1) % RINGS] = L.t + 0.28
    L.slot += 2
  }
  if (L.ram >= 1) L.ram -= 1
  L.pour = (L.pour + dt / 13) % 1
  if (dt > 0 && L.t > L.tingNext) {
    const who = L.tingSlot % 2
    const bell =
      who === 0 ? (L.tingSlot % 4 === 0 ? 0 : 1) : 2 + (L.tingSlot % 3)
    L.tings[L.tingSlot % TINGS] = L.t
    L.tingBell[L.tingSlot % TINGS] = Math.min(bell, COOL.length - 1)
    L.taps[who] = L.t
    L.tingSlot++
    L.tingNext = L.t + 0.9 + ((L.tingSlot * 0.618) % 1) * 1.6
  }
}
