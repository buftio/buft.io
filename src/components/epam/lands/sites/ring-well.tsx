'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { flat, heap, poles, props, signPlane, signTexture } from './ring-well/build'
import { glowDisc, glowRing } from './ring-well/kit'
import { Crowd } from './ring-well/crowd'
import { Diver } from './ring-well/diver'
import { FIRE, GATE, HEAP, POST, RING, STALL, TOWER } from './ring-well/place'
import { Rig } from './ring-well/rig'

const WARM = new THREE.Color('#ffb52e')
const ALARM = new THREE.Color('#ff7a8a')
const TEAL = new THREE.Color('#16b3a0')
const MINT = new THREE.Color('#7dffe6')
const HOME = { x: 12000, y: 25500 }

export default function Scene({ land, reduced }: SceneProps) {
  const geos = useMemo(
    () => ({ heap: heap(), flat: flat(), props: props(poles()), glow: glowDisc(), aura: glowRing(0.82, 1.2), queue: signPlane(1, 190), stall: signPlane(2, 200), dive: signPlane(3, 120), here: signPlane(4, 170) }),
    [],
  )
  const tex = useMemo(() => signTexture(), [])
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }), [tex])
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      tex.dispose()
      sign.dispose()
    },
    [geos, tex, sign],
  )
  const clock = useRef(0)
  const fear = useRef(0)
  const seen = useRef({ at: -9, v: 0 })
  const well = useRef<THREE.Mesh>(null)
  const fire = useRef<THREE.Mesh>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const aura = useRef<THREE.MeshBasicMaterial>(null)

  useFrame((state, dt) => {
    const now = state.clock.elapsedTime
    if (now - seen.current.at > 1) seen.current = { at: now, v: threat(land.x, land.y, land.radius) }
    fear.current += (seen.current.v - fear.current) * Math.min(1, dt)
    clock.current += Math.min(dt, 0.1) * (reduced ? 0.08 : 1 + fear.current * 0.8)
    const t = clock.current
    const f = fear.current
    const far = Math.min(1, Math.max(0, (0.16 - state.camera.zoom) / 0.08))
    if (well.current) {
      const s = 280 + 25 * Math.sin(t * 1.3) + f * 160
      well.current.scale.set(s, s * 1.05, 1)
      ;(well.current.material as THREE.MeshBasicMaterial).color.copy(WARM).lerp(ALARM, f).multiplyScalar(0.13 + f * 0.22)
    }
    if (fire.current) {
      const s = 120 + Math.sin(t * 11) * 10 + Math.sin(t * 7.3) * 8
      fire.current.scale.set(s, s, 1)
    }
    if (aura.current) {
      aura.current.color.copy(MINT).lerp(TEAL, far).lerp(ALARM, f)
      aura.current.opacity = 0.12 + far * 0.7 + f * 0.25 + Math.sin(t * 2) * 0.06 * (1 + far)
    }
    if (halo.current) halo.current.opacity = 0.38 + far * 0.5 + Math.sin(t * 2) * 0.08
  })

  return (
    <group position={[HOME.x - land.x, land.y - HOME.y, 0]}>
      <mesh geometry={geos.flat} renderOrder={41}>
        <meshBasicMaterial ref={halo} vertexColors transparent opacity={0.6} depthWrite={false} />
      </mesh>
      <mesh geometry={geos.aura} position={[RING.x, -RING.y, 4]} scale={[RING.rx, RING.ry, 1]} renderOrder={42}>
        <meshBasicMaterial ref={aura} vertexColors transparent opacity={0.15} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={well} geometry={geos.glow} position={[HEAP.x, -HEAP.y, 5]} renderOrder={42}>
        <meshBasicMaterial vertexColors blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={fire} geometry={geos.glow} position={[FIRE.x, -FIRE.y, 5]} renderOrder={42}>
        <meshBasicMaterial vertexColors color="#a04a12" blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geos.heap}>
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.1} />
      </mesh>
      <mesh geometry={geos.props}>
        <meshStandardMaterial vertexColors flatShading roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <Stand at={[GATE.x + 120, GATE.y - 50]} size={1}>
        <mesh geometry={geos.queue} position={[0, 120, 0]} material={sign} />
      </Stand>
      <Stand at={[STALL.x, STALL.y]} size={1}>
        <mesh geometry={geos.stall} position={[0, 178, 20]} material={sign} />
      </Stand>
      <Stand at={[TOWER.x, TOWER.y]} size={1}>
        <mesh geometry={geos.dive} position={[0, 110, 30]} material={sign} />
      </Stand>
      <Stand at={[POST.x, POST.y]} size={1}>
        <mesh geometry={geos.here} position={[0, 112, 6]} material={sign} />
      </Stand>
      <Rig clock={clock} sign={sign} />
      <Crowd clock={clock} fear={fear} />
      <Diver clock={clock} />
    </group>
  )
}
