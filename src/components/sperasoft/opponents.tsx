'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { Group } from 'three'
import { Clay, palette, type Vec3 } from '../marketdata/models/clay'
import { at } from './stage'
import type { Point } from './types'

export type Role = 'defender' | 'keeper'

// Collision footprints owned by football.ts; the base disc mirrors them.
const FOOTPRINT: Record<Role, number> = { defender: 3.5, keeper: 2.2 }
// Figures are modelled at the blue player's proportions and scaled per role.
const SCALE: Record<Role, number> = { defender: 1.2, keeper: 1.05 }

const kits = {
  defender: {
    jersey: '#c8553d',
    trim: '#f3efe0',
    shorts: '#f3efe0',
    socks: '#c8553d',
    base: '#8f3a2b',
  },
  keeper: {
    jersey: palette.mustard,
    trim: '#2f3430',
    shorts: '#2f3430',
    socks: palette.mustard,
    base: '#b8871c',
  },
}
const looks = [
  { skin: '#f0d9b0', hair: '#6e4a30', crop: [2.5, 1.9, 1.4] as Vec3 },
  { skin: '#8d5b3b', hair: palette.ink, crop: [2.7, 2.3, 1.7] as Vec3 },
  { skin: '#c78d63', hair: '#4a3222', crop: [2.3, 1.7, 1.5] as Vec3 },
]

// Opponents face the shooter: -Y is their front, +Z is towards the camera.
function Head({
  look,
  position: [x, y, z],
  size = 2.3,
}: {
  look: (typeof looks)[number]
  position: Vec3
  size?: number
}) {
  const r = size / 2
  return (
    <>
      <Clay shape="sphere" color={look.skin} size={size} position={[x, y, z]} />
      <Clay
        shape="sphere"
        color={look.hair}
        size={look.crop}
        position={[x, y + r * 0.3, z + r * 0.55]}
      />
      {[-1, 1].map((s) => (
        <Clay
          key={s}
          shape="sphere"
          color={palette.ink}
          size={0.36}
          position={[x + s * r * 0.4, y - r * 0.8, z + r * 0.55]}
        />
      ))}
    </>
  )
}

function Limb({
  from: [fx, fy, fz],
  to: [tx, ty],
  color,
  width,
}: {
  from: Vec3
  to: [number, number]
  color: string
  width: number
}) {
  const dx = tx - fx,
    dy = ty - fy
  return (
    <Clay
      shape="cylinder"
      color={color}
      size={[width, Math.hypot(dx, dy), width]}
      position={[fx + dx / 2, fy + dy / 2, fz]}
      rotation={[0, 0, Math.atan2(-dx, dy)]}
    />
  )
}

function Legs({
  color,
  spread,
  length,
  y,
  z,
  tilt,
  stride,
}: {
  color: string
  spread: number
  length: number
  y: number
  z: number
  tilt: number
  stride: boolean
}) {
  return (
    <>
      {[-1, 1].map((s) => (
        <group key={s}>
          <Clay
            shape="cylinder"
            color={color}
            size={[1.05, length, 1.05]}
            position={[s * spread, y, z]}
            rotation={[stride ? s * tilt : -tilt, 0, 0]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[1.25, 1.35, 0.9]}
            position={[s * spread * 1.05, y + length / 2 - 0.1, z - 0.35]}
          />
        </group>
      ))}
    </>
  )
}

function Defender({ index }: { index: number }) {
  const kit = kits.defender
  const look = looks[index % looks.length]
  return (
    <group position={[0, -1, 0]}>
      <Legs
        color={kit.socks}
        spread={1.05}
        length={2.8}
        y={1.9}
        z={1.05}
        tilt={0.3}
        stride
      />
      <Clay
        shape="sphere"
        color={kit.shorts}
        size={[3.7, 2.7, 1.9]}
        position={[0, 0.8, 1.9]}
      />
      <Clay
        shape="sphere"
        color={kit.jersey}
        size={[4.4, 3.2, 2.4]}
        position={[0, -0.3, 2.6]}
      />
      <Clay
        shape="slab"
        color={kit.trim}
        size={[0.9, 1.2, 0.16]}
        position={[0, 0.3, 3.78]}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb
            from={[s * 1.9, 0, 2.5]}
            to={[s * 2.05, -0.7]}
            color={kit.jersey}
            width={1.05}
          />
          <Limb
            from={[s * 2.05, -0.7, 2.5]}
            to={[s * 2.15, -1.35]}
            color={look.skin}
            width={0.85}
          />
          <Clay
            shape="sphere"
            color={look.skin}
            size={0.95}
            position={[s * 2.15, -1.4, 2.5]}
          />
        </group>
      ))}
      <Head look={look} position={[0, -0.5, 4.5]} />
    </group>
  )
}

function Keeper() {
  const kit = kits.keeper
  const look = looks[2]
  return (
    <group position={[0, -0.8, 0]}>
      <Legs
        color={kit.socks}
        spread={1.3}
        length={2.4}
        y={1.8}
        z={1}
        tilt={0.5}
        stride={false}
      />
      <Clay
        shape="sphere"
        color={kit.shorts}
        size={[3.5, 2.4, 1.7]}
        position={[0, 0.9, 1.7]}
      />
      <Clay
        shape="sphere"
        color={kit.jersey}
        size={[4, 3, 2.2]}
        position={[0, -0.2, 2.4]}
      />
      <Clay
        shape="slab"
        color={kit.trim}
        size={[0.7, 1.1, 0.16]}
        position={[0, 0.35, 3.48]}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Limb
            from={[s * 1.8, 0.1, 2.3]}
            to={[s * 1.75, -1.35]}
            color={kit.jersey}
            width={1.05}
          />
          <Clay
            shape="sphere"
            color="#f7f2e4"
            size={[1.15, 0.7, 1.1]}
            position={[s * 1.76, -1.2, 2.3]}
          />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={[1.55, 1.45, 1.25]}
            position={[s * 1.75, -1.85, 2.3]}
          />
        </group>
      ))}
      <Head look={look} position={[0, -0.7, 4]} size={2.2} />
    </group>
  )
}

export function Opponent({
  kind,
  point,
  index = 0,
  reduced,
}: {
  kind: Role
  point: Point
  index?: number
  reduced: boolean
}) {
  const body = useRef<Group>(null)
  const clock = useRef(index * 1.7)
  const lastX = useRef(point.x)
  const lean = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  const scale = SCALE[kind]
  const footprint = FOOTPRINT[kind] * 2

  useLayoutEffect(() => {
    if (!reduced || !body.current) return
    body.current.rotation.set(0, 0, 0)
    body.current.position.z = 0
    invalidate()
  }, [reduced, invalidate])

  useFrame((_, delta) => {
    const group = body.current
    if (reduced || !group) return
    const dt = Math.min(delta, 0.05)
    clock.current += dt
    const t = clock.current
    if (kind === 'keeper') {
      const vx = dt ? (point.x - lastX.current) / dt : 0
      lastX.current = point.x
      const target = Math.max(-0.22, Math.min(0.22, vx * 0.05))
      lean.current += (target - lean.current) * Math.min(1, dt * 8)
      group.rotation.set(0, lean.current, Math.sin(t * 1.7) * 0.03)
      group.position.z = Math.abs(Math.sin(t * 5)) * 0.14
    } else {
      group.rotation.set(0, Math.sin(t * 1.3) * 0.04, Math.sin(t * 2.6) * 0.06)
      group.position.z = Math.abs(Math.sin(t * 4.4)) * 0.18
    }
    invalidate()
  })

  return (
    <group position={at(point, -1.5)}>
      <Clay
        shape="cylinder"
        color={kits[kind].base}
        size={[footprint, 0.9, footprint]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.45]}
      />
      <group ref={body} scale={scale}>
        {kind === 'keeper' ? <Keeper /> : <Defender index={index} />}
      </group>
    </group>
  )
}
