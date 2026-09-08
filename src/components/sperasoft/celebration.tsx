'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Object3D,
  type InstancedMesh,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'
import { Instanced, clay, geo, type Item } from '../marketdata/models/clay'
import { GOAL } from './types'
import { at, rand } from './stage'

const LIFE = 3.4
const colors = ['#ffd66b', '#88bea6', '#8f7bb8', '#e68564', '#f3e6cf']
const pieces = Array.from({ length: 76 }, (_, i) => {
  const angle = (i / 76) * Math.PI * 2
  return {
    vx: Math.cos(angle) * (8 + rand(i, 71) * 15),
    vy: 12 + rand(i, 72) * 15,
    floor: -8 - rand(i, 73) * 31,
    size: 0.8 + rand(i, 74) * 1.15,
    spin: (rand(i, 75) - 0.5) * 12,
    color: colors[i % colors.length],
  }
})
const settled: Item[] = pieces.slice(0, 12).map((piece, i) => ({
  position: [Math.cos(i * 2.4) * (10 + i * 0.6), -4 - (i % 4) * 2, 1],
  rotation: [0, 0, i * 1.7],
  scale: [piece.size, piece.size * 0.6, 0.35],
  color: piece.color,
}))

export function Celebration({ reduced }: { reduced: boolean }) {
  const mesh = useRef<InstancedMesh>(null)
  const ring = useRef<Mesh>(null)
  const life = useRef(reduced ? LIFE : 0)
  const dummy = useMemo(() => new Object3D(), [])
  const invalidate = useThree((state) => state.invalidate)
  useLayoutEffect(() => {
    if (reduced) life.current = LIFE
    const confetti = mesh.current
    if (!confetti) return
    confetti.visible = life.current < LIFE
    if (ring.current) ring.current.visible = life.current < LIFE
    pieces.forEach((piece, i) => {
      confetti.setColorAt(i, clay(piece.color).color)
      dummy.scale.setScalar(0.001)
      dummy.updateMatrix()
      confetti.setMatrixAt(i, dummy.matrix)
    })
    confetti.instanceMatrix.needsUpdate = true
    if (confetti.instanceColor) confetti.instanceColor.needsUpdate = true
    invalidate()
  }, [dummy, invalidate, reduced])
  useFrame((_, delta) => {
    const confetti = mesh.current
    if (!confetti || reduced || life.current >= LIFE) return
    life.current = Math.min(LIFE, life.current + Math.min(delta, 0.05))
    const t = life.current
    if (ring.current) {
      const progress = Math.min(1, t / 1.25)
      const spread = 8 + 29 * (1 - (1 - progress) ** 3)
      ring.current.scale.set(spread, spread * 0.72, 1)
      ring.current.visible = progress < 1
      ;(ring.current.material as MeshBasicMaterial).opacity =
        0.7 * (1 - progress) ** 2
    }
    pieces.forEach((piece, i) => {
      const landing =
        (piece.vy + Math.sqrt(piece.vy ** 2 + 48 * (3 - piece.floor))) / 24
      const flight = Math.min(t, landing)
      const fade = 1 - Math.max(0, (t - 2.7) / (LIFE - 2.7))
      const size = Math.max(0.001, piece.size * fade)
      dummy.position.set(
        Math.max(-38, Math.min(38, piece.vx * flight)),
        Math.max(piece.floor, 3 + piece.vy * flight - 12 * flight * flight),
        3 + (i % 5) * 0.4,
      )
      dummy.rotation.set(flight * piece.spin, flight * 3, i + flight * 2)
      dummy.scale.set(size, size * 0.55, size * 0.4)
      dummy.updateMatrix()
      confetti.setMatrixAt(i, dummy.matrix)
    })
    confetti.instanceMatrix.needsUpdate = true
    confetti.visible = t < LIFE
    invalidate()
  })
  return (
    <group position={at(GOAL, 2)}>
      <mesh position={[0, -0.5, -0.8]} scale={[18, 10, 1]}>
        <ringGeometry args={[0.475, 0.5, 64]} />
        <meshStandardMaterial color="#e4bd56" roughness={0.9} />
      </mesh>
      <mesh ref={ring} position={[0, 0, -0.5]}>
        <ringGeometry args={[0.46, 0.5, 64]} />
        <meshBasicMaterial
          color="#ffe5a0"
          transparent
          opacity={0.7}
          depthWrite={false}
        />
      </mesh>
      <instancedMesh
        ref={mesh}
        args={[geo.box, clay('#ffffff', 'goal-confetti'), pieces.length]}
        castShadow
        dispose={null}
      />
      {reduced && <Instanced items={settled} />}
    </group>
  )
}
