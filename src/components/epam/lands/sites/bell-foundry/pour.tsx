'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { pourState, type Life } from './clock'
import { embers, molten } from './ground'
import { CRANE } from './layout'
import { crucible } from './models'
import { jib } from './statics'

export function Pour({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(
    () => ({ jib: jib(), pot: crucible(), embers: embers(), molten: molten() }),
    [],
  )
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const arm = useRef<THREE.Group>(null)
  const pot = useRef<THREE.Group>(null)
  const stream = useRef<THREE.Group>(null)
  const coal = useRef<THREE.MeshBasicMaterial>(null)
  const melt = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    const L = life.current
    if (
      !arm.current ||
      !pot.current ||
      !stream.current ||
      !coal.current ||
      !melt.current
    )
      return
    const s = pourState(L.pour)
    arm.current.rotation.y = s.turn
    pot.current.rotation.z = s.tilt * 1.05 + Math.sin(L.t * 2.1) * 0.03
    stream.current.scale.set(1, Math.max(0.001, s.flow), 1)
    stream.current.visible = s.flow > 0.01
    const flicker =
      0.8 + 0.12 * Math.sin(L.t * 7.3) + 0.08 * Math.sin(L.t * 17.1)
    coal.current.opacity = flicker * (1 - 0.8 * L.dim)
    melt.current.opacity =
      Math.max(s.runnel * 0.95, s.pit * 0.75) * (0.9 + 0.1 * Math.sin(L.t * 9))
  })

  return (
    <group>
      <mesh geometry={geos.embers} renderOrder={47}>
        <meshBasicMaterial
          ref={coal}
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh geometry={geos.molten} position={[0, 0, 2]} renderOrder={46}>
        <meshBasicMaterial
          ref={melt}
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Stand at={CRANE.at} size={1}>
        <group ref={arm}>
          <mesh geometry={geos.jib}>
            <meshStandardMaterial vertexColors flatShading roughness={0.8} />
          </mesh>
          <group ref={pot} position={[-220, 200, 0]}>
            <mesh geometry={geos.pot}>
              <meshStandardMaterial
                vertexColors
                flatShading
                roughness={0.5}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
          <group ref={stream} position={[-238, 150, 0]}>
            <mesh position={[0, -75, 0]}>
              <cylinderGeometry args={[10, 7, 150, 6]} />
              <meshBasicMaterial color="#ffd27a" toneMapped={false} />
            </mesh>
          </group>
        </group>
      </Stand>
    </group>
  )
}
