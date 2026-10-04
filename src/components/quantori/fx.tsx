'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  type Group,
  type Mesh,
} from 'three'
import { geo } from '../marketdata/models/clay'
import type { V3 } from './layout'

export const party = [
  '#ffd36b',
  '#f2766b',
  '#3fb8af',
  '#6fa8dc',
  '#b48ad8',
  '#e88fb4',
  '#ffffff',
]
const dummy = new Object3D()
const paper = new MeshStandardMaterial({
  roughness: 0.6,
  emissive: '#ffffff',
  emissiveIntensity: 0.15,
})
const spark = new MeshBasicMaterial({
  color: '#ffe08a',
  transparent: true,
  opacity: 0.8,
  blending: AdditiveBlending,
  depthWrite: false,
})
export const seeded = (i: number, k = 0) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function useStart(since: RefObject<number> | undefined, at: number) {
  const mounted = useRef<number | null>(null)
  return (clock: number) => {
    if (since) return clock - since.current - at
    if (mounted.current === null) mounted.current = clock
    return clock - mounted.current - at
  }
}

type Burst = {
  since?: RefObject<number>
  at?: number
  position?: V3
  count?: number
  speed?: number
  up?: number
  gravity?: number
  life?: number
  size?: number
  colors?: string[]
  repeat?: number
}

/** Paper confetti flying out of `position`. Starts on mount, or `at` seconds after the `since` clock time. */
export function Confetti({
  since,
  at = 0,
  position = [0, 0, 0],
  count = 60,
  speed = 3,
  up = 3,
  gravity = 6,
  life = 1.8,
  size = 0.09,
  colors = party,
  repeat = 0,
}: Burst) {
  const mesh = useRef<InstancedMesh>(null)
  const start = useStart(since, at)
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = seeded(i, 1) * Math.PI * 2
        const out = speed * (0.35 + seeded(i, 2) * 0.65)
        return {
          vx: Math.cos(angle) * out,
          vz: Math.sin(angle) * out,
          vy: up * (0.5 + seeded(i, 3) * 0.7),
          spin: [
            seeded(i, 4) * 12 - 6,
            seeded(i, 5) * 12 - 6,
            seeded(i, 6) * 12 - 6,
          ],
          delay: repeat ? (i / count) * repeat : seeded(i, 7) * 0.08,
          color: colors[i % colors.length],
        }
      }),
    [count, speed, up, colors, repeat],
  )
  useLayoutEffect(() => {
    const instanced = mesh.current
    if (!instanced) return
    const color = new Color()
    bits.forEach((bit, i) => instanced.setColorAt(i, color.set(bit.color)))
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  }, [bits])
  useFrame(({ clock }) => {
    const instanced = mesh.current
    if (!instanced) return
    const t0 = start(clock.elapsedTime)
    const over = !repeat && t0 > life + 0.1
    instanced.visible = !over
    if (over) return
    bits.forEach((bit, i) => {
      let t = t0 - bit.delay
      if (repeat && t > 0) t %= repeat
      const alive = t > 0 && t < life
      const fade = alive ? Math.min(1, (life - t) * 3) * Math.min(1, t * 12) : 0
      dummy.position.set(
        bit.vx * t,
        bit.vy * t - 0.5 * gravity * t * t,
        bit.vz * t,
      )
      dummy.rotation.set(bit.spin[0] * t, bit.spin[1] * t, bit.spin[2] * t)
      dummy.scale.set(
        size * fade,
        size * 0.6 * fade,
        size * 0.12 * fade + 0.0001,
      )
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    })
    instanced.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={mesh}
      args={[geo.slab, paper, count]}
      position={position}
      frustumCulled={false}
    />
  )
}

/** A bright ring and glow that pops and fades. */
export function Flash({
  since,
  at = 0,
  position = [0, 0, 0],
  size = 1,
  color = '#ffd36b',
  life = 0.6,
}: {
  since?: RefObject<number>
  at?: number
  position?: V3
  size?: number
  color?: string
  life?: number
}) {
  const group = useRef<Group>(null)
  const ring = useRef<Mesh>(null)
  const glow = useRef<Mesh>(null)
  const start = useStart(since, at)
  useFrame(({ clock, camera }) => {
    const t = start(clock.elapsedTime) / life
    const on = t > 0 && t < 1
    if (group.current) {
      group.current.visible = on
      group.current.quaternion.copy(camera.quaternion)
    }
    if (!on) return
    const out = 1 - (1 - t) ** 3
    ring.current?.scale.setScalar(size * (0.3 + out * 1.4))
    glow.current?.scale.setScalar(size * 0.5 * (1 - t))
    if (ring.current)
      (ring.current.material as MeshBasicMaterial).opacity = 1 - t
    if (glow.current)
      (glow.current.material as MeshBasicMaterial).opacity = 0.9 * (1 - t)
  })
  return (
    <group ref={group} position={position} visible={false}>
      <mesh ref={ring} geometry={geo.torus}>
        <meshBasicMaterial color={color} transparent depthWrite={false} />
      </mesh>
      <mesh ref={glow} geometry={geo.sphere} scale={0}>
        <meshBasicMaterial color="#fff6d8" transparent depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Soft additive dots that trail a moving point. Call `push` every frame with the point. */
export function useTrail(length = 10) {
  const points = useRef(Array.from({ length }, () => ({ x: 0, y: -100, z: 0 })))
  const meshes = useRef<(Mesh | null)[]>([])
  const push = (x: number, y: number, z: number, on: boolean) => {
    const list = points.current
    const point = list.pop() ?? { x: 0, y: 0, z: 0 }
    point.x = x
    point.y = on ? y : -100
    point.z = z
    list.unshift(point)
    list.forEach((point, i) => {
      const mesh = meshes.current[i]
      if (!mesh) return
      mesh.position.set(point.x, point.y, point.z)
      mesh.scale.setScalar(0.11 * (1 - i / length))
    })
  }
  const dots = Array.from({ length }, (_, i) => (
    <mesh
      key={i}
      ref={(mesh) => void (meshes.current[i] = mesh)}
      geometry={geo.sphere}
      material={spark}
      position={[0, -100, 0]}
    />
  ))
  return { push, dots }
}
