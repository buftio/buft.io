'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { statics } from './ring-road/build'
import { Folk } from './ring-road/folk'
import { Fx } from './ring-road/fx'
import { band, roads, trail } from './ring-road/road'
import { Traffic } from './ring-road/traffic'

export default function Scene({ land, reduced }: SceneProps) {
  const geos = useMemo(() => ({ road: roads(), trail: trail(), band: band(), statics: statics() }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const clock = useRef(0)
  const fear = useRef(0)
  const seen = useRef({ at: -9, v: 0 })
  const shine = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    if (now - seen.current.at > 1) seen.current = { at: now, v: threat(land.x, land.y, land.radius) }
    fear.current += (seen.current.v - fear.current) * Math.min(1, dt * 0.8)
    clock.current += Math.min(dt, 0.1) * (reduced ? 0.08 : 1)
    const far = Math.min(1, Math.max(0, (0.16 - state.camera.zoom) / 0.08))
    if (shine.current) shine.current.opacity = (0.22 + Math.sin(clock.current * 1.7) * 0.08) * far
    if (halo.current) halo.current.opacity = far * 0.55 * (1 - fear.current * 0.8)
  })

  return (
    <group>
      <mesh geometry={geos.band} renderOrder={40}>
        <meshBasicMaterial ref={halo} vertexColors color="#ff9a3c" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.road} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} depthTest={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.trail} renderOrder={42}>
        <meshBasicMaterial ref={shine} vertexColors transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.statics}>
        <meshStandardMaterial vertexColors roughness={0.75} />
      </mesh>
      <Traffic clock={clock} fear={fear} reduced={reduced} />
      <Folk clock={clock} fear={fear} reduced={reduced} />
      <Fx clock={clock} fear={fear} />
    </group>
  )
}
