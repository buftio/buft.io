'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { DOCK_N, DOCK_S, Life } from './star-moat/life'
import { Moat } from './star-moat/moat'
import { moonGeometry, moonhouseGeometry, wharfGeometry } from './star-moat/models'
import { bank, yawOf } from './star-moat/path'
import { Sky } from './star-moat/sky'
import { haloTexture, lift } from './star-moat/util'

const HOUSE = 300
const MOON_Y = 3.05
const house = bank(DOCK_N, -390)
const HX = house.x
const HY = house.y
const top = lift(HX, HY, 0, MOON_Y, 0, HOUSE)
const MOON = { x: top.x, y: top.y, z: top.z, size: 340 }
const pier = bank(DOCK_S + 0.045, 30)
const WX = pier.x
const WY = pier.y
const WYAW = yawOf(pier.ty, -pier.tx)

export default function Scene({ land, reduced }: SceneProps) {
  const hope = useRef(1)
  const seen = useRef({ at: -9, raw: 0 })
  const moon = useRef<THREE.Mesh>(null)
  const geo = useMemo(() => ({ house: moonhouseGeometry(), wharf: wharfGeometry(), moon: moonGeometry(0.22) }), [])
  const tex = useMemo(() => haloTexture(), [])
  useEffect(() => () => {
    Object.values(geo).forEach((g) => g.dispose())
    tex.dispose()
  }, [geo, tex])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const s = seen.current
    if (t - s.at > 1) {
      s.at = t
      s.raw = threat(land.x, land.y, land.radius)
    }
    hope.current += (1 - s.raw - hope.current) * Math.min(1, dt * 1.5)
    const m = moon.current
    if (m) m.rotation.z = -0.5 + (reduced ? 0 : Math.sin(t * 0.5) * 0.08)
  })

  return (
    <group>
      <Moat hope={hope} reduced={reduced} />
      <Sky hope={hope} reduced={reduced} tex={tex} />
      <Stand at={[HX, HY]} size={HOUSE}>
        <mesh geometry={geo.house}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
        <mesh ref={moon} geometry={geo.moon} position={[0, MOON_Y, 0]} scale={0.5}>
          <meshBasicMaterial color="#fff1b8" />
        </mesh>
      </Stand>
      <Stand at={[WX, WY]} size={220} turn={WYAW}>
        <mesh geometry={geo.wharf}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <Life hope={hope} moon={MOON} reduced={reduced} tex={tex} />
    </group>
  )
}
