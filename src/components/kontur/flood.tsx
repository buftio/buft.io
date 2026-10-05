'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import { InstancedMesh, Object3D } from 'three'
import { FLOOD, type Game } from './factory'
import { H, W, sites, toWorld } from './map'
import { itemGeometry } from './models/items'
import { itemMaterial } from './models/kit'

const dummy = new Object3D()
const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return v - Math.floor(v)
}
const FLIGHT = 0.9

/** After liftoff every diamond still arriving arcs out of the launch pad and piles up over the board. */
export function Flood({ game }: { game: RefObject<Game> }) {
  const mesh = useRef<InstancedMesh>(null)
  const pad = sites.rocket
  const [ox, oz] = toWorld(pad.x + (pad.w - 1) / 2, pad.y + (pad.h - 1) / 2)
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const { flood, time } = game.current
    let n = 0
    for (let i = 0; i < flood.length; i++) {
      const age = time - flood[i]
      if (age < 0) continue
      const f = Math.min(1, age / FLIGHT)
      const tx = (rand(i, 1) - 0.5) * (W - 0.6)
      const tz = (rand(i, 2) - 0.5) * (H - 0.6)
      const rest = 0.02 + (i / FLOOD) * 0.55 + rand(i, 3) * 0.12
      dummy.position.set(
        ox + (tx - ox) * f,
        1.4 * (1 - f) + rest * f + 4 * f * (1 - f) * (2 + rand(i, 4)),
        oz + (tz - oz) * f,
      )
      dummy.rotation.set(rand(i, 5) * 3, age * (f < 1 ? 8 : 0) + i, 0)
      dummy.scale.setScalar(0.8)
      dummy.updateMatrix()
      m.setMatrixAt(n++, dummy.matrix)
    }
    m.count = n
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={mesh}
      args={[itemGeometry('diamond'), itemMaterial, FLOOD]}
      frustumCulled={false}
    />
  )
}
