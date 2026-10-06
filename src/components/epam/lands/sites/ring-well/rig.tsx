'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { folk, signPlane } from './build'
import { WELL } from './place'
import { bucketGeometry, frameGeometry, plaque, ropeGeometry, WHEEL, wellGeometry, wheelGeometry } from './well'

const TOP = 470
const LOW = 70
const DRUM = 40
const PERIOD = 16

function phase(t: number) {
  const k = t % PERIOD
  const ease = (u: number) => u * u * (3 - 2 * u)
  if (k < 5) return { y: TOP - (TOP - LOW) * ease(k / 5), run: 0.5, tip: 0 }
  if (k < 7) return { y: LOW + Math.sin(k * 9) * 4, run: 0, tip: 0 }
  if (k < 13) return { y: LOW + (TOP - LOW) * ease((k - 7) / 6), run: 1.6, tip: 0 }
  return { y: TOP, run: 0, tip: Math.sin(((k - 13) / 3) * Math.PI) * 1.1 }
}

export function Rig({ clock, sign }: { clock: RefObject<number>; sign: THREE.Material }) {
  const geos = useMemo(() => ({ well: wellGeometry(), wheel: wheelGeometry(), bucket: bucketGeometry(), rope: ropeGeometry(), keeper: folk('top'), frame: frameGeometry(), plaque: signPlane(0, 380) }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const wheel = useRef<THREE.Group>(null)
  const bucket = useRef<THREE.Group>(null)
  const rope = useRef<THREE.Mesh>(null)
  const keeper = useRef<THREE.Group>(null)
  const pq = plaque()

  useFrame(() => {
    const t = clock.current
    const p = phase(t)
    if (wheel.current) wheel.current.rotation.z = (p.y - TOP) / DRUM
    if (bucket.current) {
      bucket.current.position.y = p.y
      bucket.current.rotation.z = p.tip
    }
    if (rope.current) rope.current.scale.y = WELL.axle - DRUM - p.y
    if (keeper.current) {
      const hop = p.run ? Math.abs(Math.sin(t * 7 * p.run)) * 10 * p.run : Math.max(0, Math.sin(t * 5)) * (p.tip ? 18 : 0)
      keeper.current.position.y = WELL.axle - WHEEL.r + 10 + hop
      keeper.current.rotation.z = p.run ? Math.sin(t * 7 * p.run) * 0.12 : 0
    }
  })

  return (
    <Stand at={[WELL.x, WELL.y]} size={1}>
      <mesh geometry={geos.well}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geos.plaque} position={[0, pq.y, pq.z]} rotation={[pq.tilt, 0, 0]} material={sign} />
      <group ref={wheel} position={[WHEEL.x, WELL.axle, 0]}>
        <mesh geometry={geos.wheel}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </group>
      <mesh geometry={geos.frame}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
      <group ref={keeper} position={[WHEEL.x, WELL.axle - WHEEL.r + 10, 0]} rotation={[0, 0.5, 0]} scale={28}>
        <mesh geometry={geos.keeper}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </mesh>
      </group>
      <mesh ref={rope} geometry={geos.rope} position={[WELL.bucket, WELL.axle - DRUM, 0]}>
        <meshStandardMaterial vertexColors roughness={0.9} />
      </mesh>
      <group ref={bucket} position={[WELL.bucket, TOP, 0]}>
        <mesh geometry={geos.bucket}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </mesh>
      </group>
    </Stand>
  )
}
