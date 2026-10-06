'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Fleet } from './ember-canal/fleet'
import type { Mood } from './ember-canal/layout'
import { Lock } from './ember-canal/lock'
import { PERIOD, smooth } from './ember-canal/map'

export default function Scene({ land, reduced }: SceneProps) {
  const mood = useRef<Mood>({ now: 0, cyc: PERIOD * 0.15, calm: 1, threat: 0, poll: 0 })

  useFrame((_, dt) => {
    const m = mood.current
    const step = Math.min(dt, 0.1) * (reduced ? 0.04 : 1)
    m.poll -= dt
    if (m.poll <= 0) {
      m.poll = 1
      m.threat = threat(land.x, land.y, land.radius)
    }
    m.calm += (1 - smooth(0.04, 0.45, m.threat) - m.calm) * Math.min(1, dt * 0.7)
    m.now += step
    m.cyc += step * m.calm
  })

  return (
    <group position={[-335, 255, 0]}>
      <Lock mood={mood} />
      <Fleet mood={mood} />
    </group>
  )
}
