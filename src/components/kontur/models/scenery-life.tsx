'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { H, W } from '../map'
import { Bake, Clay } from './kit'

export function SceneryLife({ chimneys }: { chimneys: [number, number][] }) {
  const clouds = useRef<(Group | null)[]>([])
  const smoke = useRef<(Group | null)[]>([])
  const birds = useRef<(Group | null)[]>([])
  const wings = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    clouds.current.forEach((cloud, i) => {
      if (!cloud) return
      cloud.position.x = -W / 2 + i * 7 + Math.sin(t * 0.045 + i) * 1.3
      cloud.position.z = -H / 2 - 5 - (i % 2)
    })
    smoke.current.forEach((puff, i) => {
      if (!puff) return
      const age = (t * 0.19 + (i % 5) / 5) % 1
      puff.position.set(
        Math.sin(age * 3 + i) * age * 0.45,
        2.35 + age * 1.9,
        age * -0.45,
      )
      puff.scale.setScalar(Math.sin(age * Math.PI) * (0.18 + age * 0.35))
    })
    birds.current.forEach((bird, i) => {
      if (!bird) return
      const a = t * 0.17 + i * 2
      bird.position.set(
        Math.sin(a) * (W / 2 + 2),
        3.3 + Math.sin(a * 2) * 0.25,
        -H / 2 - 3.5 - Math.cos(a) * 0.8,
      )
      bird.rotation.y = Math.atan2(Math.cos(a) * (W / 2 + 2), Math.sin(a) * 0.8)
    })
    wings.current.forEach((wing, i) => {
      if (wing)
        wing.rotation.z =
          (i % 2 ? -1 : 1) * (0.2 + Math.sin(t * 5 + Math.floor(i / 2)) * 0.35)
    })
  })
  return (
    <Bake>
      {Array.from({ length: 4 }, (_, i) => (
        <group
          key={i}
          ref={(node) => {
            clouds.current[i] = node
          }}
          userData={{ live: true }}
          position={[0, 4.5 + (i % 2) * 0.7, 0]}
          scale={0.9 + (i % 2) * 0.2}
        >
          {[0, 1, 2].map((j) => (
            <Clay
              key={j}
              shape="sphere"
              color="#f8f1e5"
              size={[1.55, j === 1 ? 0.7 : 0.48, 0.75]}
              position={[(j - 1) * 0.65, j === 1 ? 0.12 : 0, 0]}
              castShadow={false}
            />
          ))}
        </group>
      ))}
      {chimneys.map(([x, z], k) => (
        <group key={k} position={[x, 0, z]}>
          {Array.from({ length: 5 }, (_, i) => (
            <group
              key={i}
              ref={(node) => {
                smoke.current[k * 5 + i] = node
              }}
              userData={{ live: true }}
            >
              <Clay
                shape="sphere"
                color="#e7e2d7"
                size={[1, 0.8, 1]}
                castShadow={false}
              />
            </group>
          ))}
        </group>
      ))}
      {Array.from({ length: 2 }, (_, i) => (
        <group
          key={i}
          ref={(node) => {
            birds.current[i] = node
          }}
          userData={{ live: true }}
        >
          <Clay shape="sphere" color="#807b69" size={[0.13, 0.1, 0.28]} />
          {[-1, 1].map((s, j) => (
            <group
              key={s}
              ref={(node) => {
                wings.current[i * 2 + j] = node
              }}
              userData={{ live: true }}
            >
              <Clay
                shape="sphere"
                color="#807b69"
                size={[0.32, 0.04, 0.16]}
                position={[s * 0.16, 0, 0]}
              />
            </group>
          ))}
        </group>
      ))}
    </Bake>
  )
}
