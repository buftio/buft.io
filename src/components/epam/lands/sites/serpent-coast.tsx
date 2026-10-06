'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Charmer, Folk, Kite } from './serpent-coast/folk'
import { Back, Crest, Eyes, Snore } from './serpent-coast/granny'
import { Shore } from './serpent-coast/sea'

export default function Scene({ land, reduced }: SceneProps) {
  const alarm = useRef(0)
  const goal = useRef(0)
  const next = useRef(0)

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    if (now > next.current) {
      next.current = now + 1
      goal.current = Math.min(1, threat(land.x, land.y, land.radius) * 4)
    }
    alarm.current += (goal.current - alarm.current) * Math.min(1, dt * 0.8)
  })

  const live = { alarm, reduced }
  return (
    <group>
      <Shore {...live} />
      <Back />
      <Crest {...live} />
      <Eyes {...live} />
      <Snore {...live} />
      <Folk {...live} />
      <Charmer {...live} />
      <Kite reduced={reduced} />
    </group>
  )
}
