'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Beacons, Pennants, Steam, Waves } from './great-wall/fire'
import { Pickers, Sentries } from './great-wall/life'
import { Shore } from './great-wall/shore'
import { Kitchen, Kite } from './great-wall/sky'
import type { Mood } from './great-wall/space'
import { groundGeometry, wallGeometry } from './great-wall/wall'

export default function Scene({ land, reduced }: SceneProps) {
  const wall = useMemo(() => wallGeometry(), [])
  const ground = useMemo(() => groundGeometry(), [])
  useEffect(() => () => [wall, ground].forEach((g) => g.dispose()), [wall, ground])
  const mood = useRef<Mood>({ alarm: 0, q: 0, next: 0 })

  useFrame((state, dt) => {
    const m = mood.current
    const t = state.clock.elapsedTime
    if (t > m.next) {
      m.q = threat(land.x, land.y, land.radius)
      m.next = t + 1
    }
    const goal = Math.min(1, m.q * 12)
    m.alarm += (goal - m.alarm) * Math.min(1, dt * 0.6)
  })

  return (
    <group>
      <mesh geometry={ground} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <Waves reduced={reduced} />
      <mesh geometry={wall} renderOrder={45}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} />
      </mesh>
      <Beacons mood={mood} reduced={reduced} />
      <Pennants mood={mood} reduced={reduced} />
      <Steam reduced={reduced} />
      <Sentries mood={mood} reduced={reduced} />
      <Pickers mood={mood} reduced={reduced} />
      <Kitchen mood={mood} reduced={reduced} />
      <Kite mood={mood} reduced={reduced} />
      <Shore mood={mood} reduced={reduced} />
    </group>
  )
}
