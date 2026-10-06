'use client'

import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Land } from '../../registry'
import { threat } from '../../threat'

export const birth = (): Life => ({ t: 30, zoom: 0.25, alarm: 0, flee: 0, hit: 0, poll: 0 })

export const PERIOD = 84
export const WEAVE = 64

export type Life = { t: number; zoom: number; alarm: number; flee: number; hit: number; poll: number }

export function Clock({ life, land, reduced }: { life: RefObject<Life>; land: Land; reduced: boolean }) {
  useFrame((state, dt) => tick(life.current, land, reduced, dt, state.camera.zoom))
  return null
}

function tick(L: Life, land: Land, reduced: boolean, dt: number, zoom: number) {
  const d = Math.min(dt, 0.1)
  L.zoom = zoom
  L.poll -= d
  if (L.poll <= 0) {
    L.poll = 1
    L.hit = threat(land.x, land.y, land.radius)
  }
  const k = Math.min(1, d * 0.8)
  L.alarm += (Math.min(1, L.hit * 8) - L.alarm) * k
  L.flee += ((L.hit > 0.3 ? 1 : 0) - L.flee) * k * 0.6
  L.t += reduced ? 0 : d * (1 + L.alarm * 0.8)
}

const ph = { u: 0, p: 0, back: 0, wind: 0 }

export function phase(t: number) {
  const u = ((t % PERIOD) + PERIOD) % PERIOD
  ph.u = u
  if (u < WEAVE) {
    ph.p = u / WEAVE
    ph.back = 0
    ph.wind = 0
    return ph
  }
  const b = (u - WEAVE) / (PERIOD - WEAVE)
  ph.wind = b * b * (3 - 2 * b)
  ph.p = 1 - ph.wind
  ph.back = 1
  return ph
}

export const REELS = 3
export const REEL_T = 190

export const reelAge = (t: number, k: number) =>
  (((t - PERIOD - k * PERIOD) % (PERIOD * REELS)) + PERIOD * REELS) % (PERIOD * REELS)
