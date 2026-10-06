'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { atlas } from './bubble-bazaar/atlas'
import { Balloon } from './bubble-bazaar/balloon'
import { Bunting } from './bubble-bazaar/bunting'
import { Film } from './bubble-bazaar/film'
import { Folk } from './bubble-bazaar/folk'
import type { Mood } from './bubble-bazaar/kit'
import { Stalls } from './bubble-bazaar/stalls'

export default function Scene({ land, reduced }: SceneProps) {
  const map = useMemo(() => atlas(), [])
  useEffect(() => () => map.dispose(), [map])
  const mood = useRef<Mood>({ t: 0, zoom: 0.25 })
  const goal = useRef(0)
  const poll = useRef(0)

  useFrame((state, dt) => {
    poll.current -= dt
    if (poll.current <= 0) {
      poll.current = 1
      goal.current = threat(land.x, land.y, land.radius)
    }
    const md = mood.current
    md.zoom = state.camera.zoom
    md.t += (goal.current - md.t) * Math.min(1, dt * 0.8)
  })

  return (
    <group>
      <Film mood={mood} reduced={reduced} />
      <Stalls mood={mood} reduced={reduced} map={map} />
      <Bunting mood={mood} reduced={reduced} />
      <Balloon mood={mood} reduced={reduced} map={map} />
      <Folk mood={mood} reduced={reduced} map={map} />
    </group>
  )
}
