'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Fish } from './cloud-sea/fish'
import { Fleet } from './cloud-sea/fleet'
import { Harbour } from './cloud-sea/harbour'
import { CLOUDS } from './cloud-sea/map'
import { shadowTexture } from './cloud-sea/models'
import { type Drift, Sky } from './cloud-sea/sky'
import { Whales } from './cloud-sea/whales'

export default function Scene({ land, reduced }: SceneProps) {
  const shade = useMemo(() => shadowTexture(), [])
  useEffect(() => () => shade.dispose(), [shade])
  const clock = useRef(0)
  const alarm = useRef(0)
  const fear = useRef(0)
  const polled = useRef(-9)
  const drift = useRef<Drift>({ x: new Float32Array(CLOUDS.length), y: new Float32Array(CLOUDS.length), h: new Float32Array(CLOUDS.length) })

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.1)
    if (state.clock.elapsedTime - polled.current > 1) {
      polled.current = state.clock.elapsedTime
      fear.current = threat(land.x, land.y, land.radius)
    }
    alarm.current += (Math.min(1, fear.current * 5) - alarm.current) * step * 0.6
    clock.current += step * (reduced ? 0.08 : 1)
  })

  return (
    <group>
      <Sky clock={clock} shade={shade} alarm={alarm} drift={drift} />
      <Harbour clock={clock} alarm={alarm} />
      <Whales clock={clock} shade={shade} alarm={alarm} />
      <Fleet clock={clock} shade={shade} alarm={alarm} />
      <Fish clock={clock} alarm={alarm} drift={drift} />
    </group>
  )
}
