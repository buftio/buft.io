'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, type RefObject } from 'react'
import { MeshBasicMaterial, type Group, type Mesh } from 'three'
import { clay, geo, palette } from '../marketdata/models/clay'
import type { Game, Pop } from './defense'
import { Flash, seeded } from './fx'
import { virusColors } from './virus'

const GRAVITY = 11
const sick = new MeshBasicMaterial({ color: '#7fbf4d' })

/** A green cough cloud where a virus reached the patient. */
function Cough({ pop, game }: { pop: Pop; game: RefObject<Game> }) {
  const ref = useRef<Group>(null)
  useFrame(() => {
    const group = ref.current
    if (!group) return
    const p = Math.min(1, (game.current.time - pop.at) / 0.6)
    group.scale.setScalar(0.3 + p * 1.4)
    group.children.forEach((child) => child.scale.setScalar(0.18 * (1 - p)))
  })
  return (
    <group ref={ref} position={[pop.x, 0.6, pop.z]}>
      {Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2
        return (
          <mesh
            key={i}
            geometry={geo.sphere}
            material={sick}
            position={[
              Math.cos(a) * 0.4,
              Math.sin(a * 2) * 0.2,
              Math.sin(a) * 0.4,
            ]}
            scale={0.18}
          />
        )
      })}
    </group>
  )
}

type Bit = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  spin: number
  size: number
  material: string
}

/** A popped virus: chunks and spikes fly out and bounce, a shockwave rolls over the floor, a goo splat fades. */
function Explosion({ pop, game }: { pop: Pop; game: RefObject<Game> }) {
  const color = virusColors[pop.kind % virusColors.length]
  const tip = pop.kind === 1 ? '#f2b84b' : '#f6e7c8'
  const bits = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i): Bit => {
        const r = (k: number) => seeded(pop.id * 31 + i, k)
        const angle = r(1) * Math.PI * 2
        const out = 2 + r(2) * 3
        const eye = i === 16
        return {
          x: 0,
          y: 0.6,
          z: 0,
          vx: Math.cos(angle) * out * (eye ? 0.4 : 1),
          vy: (eye ? 6 : 2.5) + r(3) * 3,
          vz: Math.sin(angle) * out * (eye ? 0.4 : 1),
          spin: r(4) * 20 - 10,
          size: eye ? 0.2 : i < 9 ? 0.13 + r(5) * 0.12 : 0.1,
          material: eye ? '#ffffff' : i < 9 ? color : tip,
        }
      }),
    [pop.id, color, tip],
  )
  const motion = useRef<Bit[] | null>(null)
  const meshes = useRef<(Mesh | null)[]>([])
  const last = useRef(pop.at)
  const wave = useRef<Mesh>(null)
  const splat = useRef<Group>(null)
  const blobs = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        a: seeded(pop.id, i + 10) * Math.PI * 2,
        d: 0.15 + seeded(pop.id, i + 20) * 0.25,
        s: 0.25 + seeded(pop.id, i + 30) * 0.3,
      })),
    [pop.id],
  )
  useFrame(() => {
    const now = game.current.time
    const t = now - pop.at
    const dt = Math.min(0.05, now - last.current)
    last.current = now
    motion.current ??= bits.map((bit) => ({ ...bit }))
    motion.current.forEach((bit, i) => {
      bit.vy -= GRAVITY * dt
      bit.x += bit.vx * dt
      bit.y += bit.vy * dt
      bit.z += bit.vz * dt
      if (bit.y < bit.size / 2 && bit.vy < 0) {
        bit.y = bit.size / 2
        bit.vy *= -0.45
        bit.vx *= 0.6
        bit.vz *= 0.6
      }
      const mesh = meshes.current[i]
      if (!mesh) return
      mesh.position.set(bit.x, bit.y, bit.z)
      mesh.rotation.set(bit.spin * t, bit.spin * t * 0.7, 0)
      mesh.scale.setScalar(bit.size * Math.min(1, (1.3 - t) * 3))
    })
    if (wave.current) {
      const p = Math.min(1, t / 0.45)
      wave.current.visible = p < 1
      wave.current.scale.setScalar(0.4 + (1 - (1 - p) ** 2) * 2.2)
      ;(wave.current.material as MeshBasicMaterial).opacity = 0.8 * (1 - p)
    }
    if (splat.current) {
      const grow = Math.min(1, Math.max(0, (t - 0.08) * 6))
      const fade = Math.min(1, Math.max(0, (1.3 - t) * 2.5))
      splat.current.scale.set(
        grow * (0.9 + 0.1 * fade),
        1,
        grow * (0.9 + 0.1 * fade),
      )
      splat.current.children.forEach(
        (child) =>
          (((child as Mesh).material as MeshBasicMaterial).opacity =
            0.75 * fade),
      )
    }
  })
  return (
    <group position={[pop.x, 0, pop.z]} scale={pop.big ? 1.8 : 1}>
      <Flash position={[0, 0.6, 0]} size={0.9} color={color} life={0.35} />
      {bits.map((bit, i) => (
        <mesh
          key={i}
          ref={(mesh) => void (meshes.current[i] = mesh)}
          geometry={geo.sphere}
          material={clay(bit.material)}
          position={[0, 0.6, 0]}
          scale={bit.size}
        >
          {i === 16 && (
            <mesh
              geometry={geo.sphere}
              material={clay(palette.ink)}
              position={[0, 0, 0.35]}
              scale={0.5}
            />
          )}
        </mesh>
      ))}
      <mesh
        ref={wave}
        geometry={geo.torus}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <meshBasicMaterial color="#ffffff" transparent depthWrite={false} />
      </mesh>
      <group ref={splat} position={[0, 0.02, 0]} scale={[0.0001, 1, 0.0001]}>
        <mesh geometry={geo.sphere} scale={[0.8, 0.01, 0.8]}>
          <meshBasicMaterial color={color} transparent depthWrite={false} />
        </mesh>
        {blobs.map(({ a, d, s }, i) => (
          <mesh
            key={i}
            geometry={geo.sphere}
            position={[Math.cos(a) * (0.4 + d), 0.002, Math.sin(a) * (0.4 + d)]}
            scale={[s, 0.01, s]}
          >
            <meshBasicMaterial color={color} transparent depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

export function Boom({ pop, game }: { pop: Pop; game: RefObject<Game> }) {
  return pop.sick ? (
    <Cough pop={pop} game={game} />
  ) : (
    <Explosion pop={pop} game={game} />
  )
}
