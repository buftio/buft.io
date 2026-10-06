'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { groundPaint, structures } from './southern-watch/build'
import { Carts } from './southern-watch/crowd'
import { Guards, Wall } from './southern-watch/guard'
import type { Mood } from './southern-watch/plan'
import { Sky } from './southern-watch/sky'
import { Tower } from './southern-watch/tower'

export default function Scene({ land, reduced }: SceneProps) {
  const solid = useMemo(() => structures(), [])
  const paint = useMemo(() => groundPaint(), [])
  useEffect(() => () => [solid, paint].forEach((g) => g.dispose()), [solid, paint])
  const mood = useRef<Mood>({ alarm: 0, stand: 0, q: 0, next: 0 })

  useFrame((state, dt) => {
    const m = mood.current
    const t = state.clock.elapsedTime
    if (t > m.next) {
      m.q = threat(land.x, land.y, land.radius)
      m.next = t + 1
    }
    const k = Math.min(1, dt * 0.7)
    m.alarm += (Math.min(1, m.q * 14) - m.alarm) * k
    m.stand += (Math.min(1, Math.max(0, (m.q - 0.35) * 4)) - m.stand) * k
  })

  return (
    <group>
      <mesh geometry={paint} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={solid} renderOrder={45}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} />
      </mesh>
      <Wall mood={mood} reduced={reduced} />
      <Guards mood={mood} reduced={reduced} />
      <Carts mood={mood} reduced={reduced} />
      <Tower mood={mood} reduced={reduced} />
      <Sky mood={mood} reduced={reduced} />
    </group>
  )
}
