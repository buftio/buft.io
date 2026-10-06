'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Fleet } from './archipelago/fleet'
import { Islanders } from './archipelago/folk'
import { Keeper } from './archipelago/keeper'
import { Props, Signs } from './archipelago/props'
import { Shore } from './archipelago/shore'

export default function Scene({ land, reduced }: SceneProps) {
  const danger = useRef(0)
  const next = useRef(0)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (t < next.current) return
    next.current = t + 1
    danger.current = threat(land.x, land.y, land.radius)
  })
  return (
    <group>
      <Shore reduced={reduced} />
      <Props />
      <Signs />
      <Keeper danger={danger} reduced={reduced} />
      <Fleet danger={danger} reduced={reduced} />
      <Islanders danger={danger} reduced={reduced} />
    </group>
  )
}
