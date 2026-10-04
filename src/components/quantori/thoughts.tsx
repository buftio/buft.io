'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { MeshStandardMaterial, type Group } from 'three'
import { Clay, geo } from '../marketdata/models/clay'
import { gold } from './docking'
import type { V3 } from './layout'

export type Idea = 'molecule' | 'question' | 'eureka' | 'chart'
const cloud = new MeshStandardMaterial({
  color: '#ffffff',
  roughness: 0.6,
  transparent: true,
  opacity: 0.95,
})
const CYCLE = 5.5

function Icon({ idea }: { idea: Idea }) {
  if (idea === 'question')
    return (
      <group scale={0.5}>
        <mesh
          geometry={geo.smile}
          material={gold}
          position={[0, 0.12, 0.1]}
          rotation={[0, 0, -0.5]}
          scale={0.32}
        />
        <Clay
          shape="cylinder"
          color="#ffc94a"
          size={[0.06, 0.16, 0.06]}
          position={[0.02, -0.08, 0.1]}
        />
        <mesh
          geometry={geo.sphere}
          material={gold}
          position={[0.02, -0.26, 0.1]}
          scale={0.09}
        />
      </group>
    )
  if (idea === 'eureka')
    return (
      <group scale={0.55}>
        <mesh
          geometry={geo.sphere}
          material={gold}
          position={[0, 0.06, 0.1]}
          scale={0.34}
        />
        <Clay
          shape="cylinder"
          color="#9aa3a8"
          size={[0.16, 0.14, 0.16]}
          position={[0, -0.18, 0.1]}
        />
      </group>
    )
  if (idea === 'chart')
    return (
      <group scale={0.5} position={[0, -0.05, 0.1]}>
        {[0.12, 0.22, 0.34].map((h, i) => (
          <Clay
            key={i}
            shape="box"
            color={['#3fb8af', '#6fa8dc', '#f2766b'][i]}
            size={[0.11, h, 0.06]}
            position={[-0.15 + i * 0.15, h / 2 - 0.15, 0]}
          />
        ))}
      </group>
    )
  return (
    <group scale={0.5} position={[0, 0, 0.1]}>
      {[
        [-0.17, -0.08, '#3fb8af'],
        [0, 0.12, '#f2766b'],
        [0.17, -0.08, '#f2b84b'],
      ].map(([x, y, color], i) => (
        <Clay
          key={i}
          shape="sphere"
          color={color as string}
          size={0.14}
          position={[x as number, y as number, 0]}
        />
      ))}
      <Clay
        shape="cylinder"
        color="#d9dde2"
        size={[0.03, 0.26, 0.03]}
        position={[-0.085, 0.02, -0.02]}
        rotation={[0, 0, -0.9]}
      />
      <Clay
        shape="cylinder"
        color="#d9dde2"
        size={[0.03, 0.26, 0.03]}
        position={[0.085, 0.02, -0.02]}
        rotation={[0, 0, 0.9]}
      />
    </group>
  )
}

/** A thought bubble that puffs up over a head, holds an idea, and pops. Faces the camera. */
export function Thought({
  position,
  ideas,
  offset = 0,
}: {
  position: V3
  ideas: Idea[]
  offset?: number
}) {
  const root = useRef<Group>(null)
  const puffs = useRef<(Group | null)[]>([])
  const bubble = useRef<Group>(null)
  const icons = useRef<(Group | null)[]>([])
  useFrame(({ clock, camera }) => {
    if (!root.current) return
    root.current.quaternion.copy(camera.quaternion)
    const total = clock.elapsedTime + offset
    const t = total % CYCLE
    const which = Math.floor(total / CYCLE) % ideas.length
    puffs.current.forEach((puff, i) => {
      if (!puff) return
      const grow =
        Math.min(1, Math.max(0, (t - 0.25 * i) * 4)) *
        Math.min(1, Math.max(0, (3.6 - t) * 4))
      puff.scale.setScalar(grow * (0.07 + i * 0.04))
      puff.position.y = 0.12 * i + Math.sin(total * 2 + i) * 0.015
    })
    if (bubble.current) {
      const p = Math.min(1, Math.max(0, (t - 0.7) * 3))
      const out = Math.min(1, Math.max(0, (3.8 - t) * 5))
      const pop = p < 1 ? 1 - (1 - p) ** 3 * (1 + 1.7 * p) : 1
      bubble.current.scale.setScalar(
        Math.max(0.0001, pop * out * (1 + Math.sin(total * 2.4) * 0.03)),
      )
      bubble.current.position.y = 0.55 + Math.sin(total * 1.6) * 0.04
    }
    icons.current.forEach((icon, i) => {
      if (!icon) return
      icon.visible = i === which
      icon.rotation.z = Math.sin(total * 3) * 0.12
      const eureka = ideas[i] === 'eureka' && t > 1.4 && t < 3.6
      icon.scale.setScalar(
        eureka ? 1 + Math.abs(Math.sin(total * 9)) * 0.18 : 1,
      )
    })
  })
  return (
    <group ref={root} position={position}>
      {[0, 1, 2].map((i) => (
        <group
          key={i}
          ref={(puff) => void (puffs.current[i] = puff)}
          position={[0.04 * i, 0, 0]}
        >
          <mesh geometry={geo.sphere} material={cloud} />
        </group>
      ))}
      <group ref={bubble} position={[0.18, 0.55, 0]}>
        <mesh
          geometry={geo.sphere}
          material={cloud}
          scale={[0.62, 0.48, 0.2]}
        />
        <mesh
          geometry={geo.sphere}
          material={cloud}
          scale={0.3}
          position={[-0.22, 0.12, 0]}
        />
        <mesh
          geometry={geo.sphere}
          material={cloud}
          scale={0.32}
          position={[0.2, 0.14, 0]}
        />
        <mesh
          geometry={geo.sphere}
          material={cloud}
          scale={0.28}
          position={[0.02, -0.15, 0]}
        />
        {ideas.map((idea, i) => (
          <group
            key={i}
            ref={(icon) => void (icons.current[i] = icon)}
            visible={i === 0}
          >
            <Icon idea={idea} />
          </group>
        ))}
      </group>
    </group>
  )
}
