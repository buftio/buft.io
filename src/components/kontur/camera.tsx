'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { Vector3 } from 'three'
import type { Game } from './factory'
import { GATE, H, W, sites, toWorld } from './map'

const goal = new Vector3()
const target = new Vector3()

type Focus = { x: number; z: number; zoom: number; speed: number }

function focusOf(game: Game, tall: boolean): Focus {
  if (!game.registered) {
    const lot = sites.business
    const [x, z] = toWorld(lot.x + 0.5, lot.y + 0.5)
    return tall
      ? { x: x + 0.6, z, zoom: 0.42, speed: 3 }
      : { x, z: z - 1.6, zoom: 0.44, speed: 3 }
  }
  if (game.openings === 1 && game.time - game.at.opened < 3.2) {
    const [x, z] = toWorld(...GATE)
    return { x, z, zoom: 0.55, speed: 2.4 }
  }
  return tall
    ? { x: 1.2, z: 0, zoom: 1, speed: 1.6 }
    : { x: 0, z: 0.4, zoom: 1, speed: 1.6 }
}

/** Frames the board; leans in on the empty lot before registration and on the gate the first time it opens. */
export function Rig({ game }: { game: RefObject<Game> }) {
  const look = useRef<Vector3 | null>(null)
  useFrame(({ camera, size }, dt) => {
    const aspect = size.width / Math.max(1, size.height)
    const half = Math.tan((20 * Math.PI) / 180)
    const tall = aspect < 0.8
    const [across, along] = tall ? [H, W] : [W, H]
    const fitWidth = (across / 2 + 0.6) / (half * aspect)
    const fitHeight = (along / 2 + 1.4) / half
    const distance = Math.max(fitWidth, fitHeight * (tall ? 0.95 : 0.8))
    const focus = focusOf(game.current, tall)
    const d = distance * focus.zoom
    const base = focus.zoom === 1 ? [0, 0] : [focus.x, focus.z]
    if (tall) goal.set(base[0] + d * 0.574, d * 0.819, base[1])
    else goal.set(base[0], d * 0.819, base[1] + d * 0.574)
    target.set(focus.x, 0, focus.z)
    if (!look.current) {
      look.current = target.clone()
      camera.position.copy(goal)
    }
    const k = 1 - Math.exp(-Math.min(dt, 0.05) * focus.speed)
    camera.position.lerp(goal, k)
    look.current.lerp(target, k)
    camera.lookAt(look.current)
  })
  return null
}
