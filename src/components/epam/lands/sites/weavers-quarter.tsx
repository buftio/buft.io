'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { SceneProps } from '../registry'
import { birth, Clock } from './weavers-quarter/clock'
import { Crowd } from './weavers-quarter/crowd'
import { Fence } from './weavers-quarter/fence'
import { decals } from './weavers-quarter/ground'
import { Haul } from './weavers-quarter/haul'
import { Loom } from './weavers-quarter/loom'
import { statics } from './weavers-quarter/statics'

export default function Scene({ land, reduced }: SceneProps) {
  const life = useRef(birth())
  const geos = useMemo(() => ({ town: statics(), floor: decals() }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  return (
    <group>
      <Clock life={life} land={land} reduced={reduced} />
      <mesh geometry={geos.floor} renderOrder={44}>
        <meshBasicMaterial vertexColors transparent side={2} depthWrite={false} />
      </mesh>
      <Loom life={life} />
      <mesh geometry={geos.town}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={2} />
      </mesh>
      <Fence life={life} />
      <Haul life={life} />
      <Crowd life={life} />
    </group>
  )
}
