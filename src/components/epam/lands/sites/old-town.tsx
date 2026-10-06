'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import type { Live } from './old-town/live'
import { Laundry } from './old-town/laundry'
import { Parade } from './old-town/parade'
import { TOWER } from './old-town/plan'
import { Roofs } from './old-town/roofs'
import { Ground, Houses, Town } from './old-town/town'

export default function Scene({ land, reduced }: SceneProps) {
  const live = useRef<Live>({ t: 0, dt: 0, alarm: 0, zoom: 1 })
  const danger = useRef({ next: 0, value: 0 })

  useFrame((state, delta) => {
    const l = live.current
    const d = danger.current
    const step = Math.min(delta, 0.1)
    l.dt = reduced ? 0 : step
    l.t += l.dt
    l.zoom = state.camera.zoom
    if (state.clock.elapsedTime > d.next) {
      d.next = state.clock.elapsedTime + 1
      d.value = threat(land.x, land.y, land.radius)
    }
    l.alarm += (Math.min(1, d.value * 4) - l.alarm) * Math.min(1, step * 0.7)
  })

  return (
    <group>
      <Ground />
      <Houses live={live} />
      <Town live={live} at={TOWER} />
      <Roofs live={live} />
      <Laundry live={live} />
      <Parade live={live} />
    </group>
  )
}
