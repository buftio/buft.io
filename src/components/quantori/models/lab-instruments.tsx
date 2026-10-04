'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Clay, type GroupProps } from '../../marketdata/models/clay'

const ivory = '#faf6ee'
const blue = '#99afc8'
const dark = '#596c87'
const mint = '#96c8b8'
const purple = '#baa6d1'
const rose = '#e6a4b7'

export function Microscope(props: GroupProps) {
  return (
    <group {...props} name="microscope">
      <Clay color={blue} size={[0.4, 0.07, 0.32]} position={[0, 0.035, 0]} />
      <Clay
        color={ivory}
        size={[0.12, 0.44, 0.12]}
        position={[0.09, 0.27, -0.07]}
        rotation={[0, 0, -0.23]}
      />
      <Clay
        color={dark}
        size={[0.32, 0.035, 0.23]}
        position={[-0.035, 0.24, 0.025]}
      />
      <Clay
        color="#dce8ec"
        size={[0.14, 0.012, 0.085]}
        position={[-0.055, 0.265, 0.045]}
      />
      <Clay
        shape="sphere"
        color={rose}
        size={[0.025, 0.012, 0.025]}
        position={[-0.065, 0.275, 0.045]}
      />
      <group position={[-0.07, 0.49, 0]} rotation={[0.28, 0, -0.3]}>
        <Clay shape="cylinder" color={ivory} size={[0.09, 0.25, 0.09]} />
        <Clay
          shape="cylinder"
          color={dark}
          size={[0.11, 0.05, 0.11]}
          position={[0, 0.14, 0]}
        />
        <Clay
          shape="cylinder"
          color={blue}
          size={[0.055, 0.08, 0.055]}
          position={[0, -0.15, 0]}
        />
      </group>
      {[-1, 1].map((s) => (
        <Clay
          key={s}
          shape="cylinder"
          color={dark}
          size={[0.09, 0.045, 0.09]}
          position={[0.08 + s * 0.085, 0.38, -0.07]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
      <Clay
        shape="cylinder"
        color={mint}
        size={[0.075, 0.05, 0.075]}
        position={[-0.065, 0.12, 0.03]}
      />
    </group>
  )
}

export type FlasksProps = GroupProps & { bubbling?: boolean }

const flaskPositions: [number, number, number][] = [
  [-0.23, 0, 0.015],
  [0.03, 0, -0.08],
  [0.24, 0, 0.065],
]
const liquids = [mint, rose, purple]

export function Flasks({ bubbling = true, ...props }: FlasksProps) {
  const bubbles = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    for (let i = 0; i < bubbles.current.length; i++) {
      const bubble = bubbles.current[i]
      if (!bubble) continue
      const p = (clock.elapsedTime * 0.5 + i * 0.31) % 1
      bubble.position.y = 0.06 + p * 0.17
      bubble.scale.setScalar(bubbling ? Math.sin(p * Math.PI) : 0)
    }
  })
  return (
    <group {...props} name="flasks">
      {flaskPositions.map((position, i) => (
        <group key={i} position={position}>
          <Clay
            shape="sphere"
            color="#d8eaf1"
            size={[0.22, 0.23, 0.22]}
            position={[0, 0.13, 0]}
          />
          <Clay
            shape="sphere"
            color={liquids[i]}
            size={[0.225, 0.13, 0.225]}
            position={[0, 0.085, 0]}
          />
          <Clay
            shape="cylinder"
            color="#d8eaf1"
            size={[0.065, 0.16, 0.065]}
            position={[0, 0.28, 0]}
          />
          <Clay
            shape="torus"
            color={blue}
            size={[0.085, 0.085, 0.18]}
            position={[0, 0.36, 0]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Clay
            shape="sphere"
            color="#f3faf9"
            size={[0.03, 0.065, 0.02]}
            position={[-0.065, 0.155, 0.08]}
            rotation={[0, 0, -0.4]}
          />
          <group
            ref={(node) => {
              bubbles.current[i] = node
            }}
            userData={{ live: true }}
            position={[0.02, 0.15, 0.105]}
          >
            <Clay shape="sphere" color="#f5fbf6" size={0.026} />
            <Clay
              shape="sphere"
              color="#f5fbf6"
              size={0.018}
              position={[-0.042, -0.05, -0.015]}
            />
          </group>
        </group>
      ))}
      <group position={[0.02, 0, 0.3]}>
        <Clay
          color={blue}
          size={[0.55, 0.035, 0.13]}
          position={[0, 0.018, 0]}
        />
        <Clay color={ivory} size={[0.55, 0.03, 0.13]} position={[0, 0.18, 0]} />
        {[-1, 1].map((s) => (
          <Clay
            key={s}
            color={blue}
            size={[0.035, 0.2, 0.11]}
            position={[s * 0.255, 0.1, 0]}
          />
        ))}
        {[-0.16, 0, 0.16].map((x, i) => (
          <group key={x} position={[x, 0, 0]}>
            <Clay
              shape="cylinder"
              color="#d8eaf1"
              size={[0.065, 0.26, 0.065]}
              position={[0, 0.16, 0]}
            />
            <Clay
              shape="sphere"
              color={liquids[i]}
              size={[0.067, 0.14, 0.067]}
              position={[0, 0.09, 0]}
            />
            <Clay
              shape="cylinder"
              color={liquids[i]}
              size={[0.077, 0.035, 0.077]}
              position={[0, 0.3, 0]}
            />
          </group>
        ))}
      </group>
    </group>
  )
}
