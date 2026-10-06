'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { SceneProps } from '../registry'
import { birth, Clock } from './bell-foundry/clock'
import { Crowd, Quencher } from './bell-foundry/crowd'
import { Ripples, Smoke, Sparks } from './bell-foundry/fx'
import { Gantry, Relays } from './bell-foundry/gantry'
import { decals } from './bell-foundry/ground'
import { Pour } from './bell-foundry/pour'
import { statics } from './bell-foundry/statics'

export default function Scene({ land, reduced }: SceneProps) {
  const life = useRef(birth())
  const geos = useMemo(() => ({ town: statics(), floor: decals() }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  return (
    <group>
      <Clock life={life} land={land} reduced={reduced} />
      <mesh geometry={geos.floor} position={[0, 0, 1]} renderOrder={44}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} />
      </mesh>
      <Ripples life={life} />
      <Pour life={life} />
      <mesh geometry={geos.town}>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.75}
          side={2}
        />
      </mesh>
      <Gantry life={life} />
      <Relays life={life} />
      <Crowd life={life} />
      <Quencher life={life} />
      <Sparks life={life} />
      <Smoke life={life} />
    </group>
  )
}
