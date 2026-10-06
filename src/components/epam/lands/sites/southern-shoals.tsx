'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Bars } from './southern-shoals/bars'
import { Crabs } from './southern-shoals/crabs'
import { Flats } from './southern-shoals/flats'
import { smoothstep } from './southern-shoals/kit'
import { Ship } from './southern-shoals/ship'
import { Tide } from './southern-shoals/tide'
import { Yard } from './southern-shoals/yard'
import { fresh } from './southern-shoals/world'

export default function Scene({ land, reduced }: SceneProps) {
  const world = useRef(fresh())
  const next = useRef(0)
  const clock = useRef(0)
  const tide = useRef(0.5)

  useFrame((state, delta) => {
    const w = world.current
    const dt = Math.min(delta, 0.1) * (reduced ? 0.08 : 1)
    w.t += dt
    w.zoom = state.camera.zoom
    const now = state.clock.elapsedTime
    if (now > next.current) {
      next.current = now + 1
      w.danger = threat(land.x, land.y, land.radius)
    }
    w.rush = 1 + 1.6 * smoothstep(0.04, 0.2, w.danger)
    w.board +=
      (smoothstep(0.18, 0.4, w.danger) - w.board) * Math.min(1, dt * 0.6)
    if (w.danger > 0.45 || w.launch > 0)
      w.launch = Math.min(1, w.launch + dt / 50)
    w.tide = 0.5 + 0.5 * Math.sin((w.t / 46) * Math.PI * 2)
    clock.current = w.t
    tide.current = w.tide
  })

  return (
    <group>
      <Flats tide={tide} clock={clock} />
      <Tide world={world} />
      <Bars world={world} />
      <Crabs world={world} />
      <Yard world={world} />
      <Ship world={world} />
    </group>
  )
}
