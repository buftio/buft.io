'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import {
  Bake,
  Clay,
  Goods,
  Plinth,
  Slim,
  palette,
  pulse,
  type ModelProps,
} from './kit'
import { Person } from './person'

export function Business({ game }: ModelProps) {
  const stamp = useRef<Group>(null),
    sheet = useRef<Group>(null),
    arm = useRef<Group>(null)
  useFrame(() => {
    const age = game.current.time - game.current.at.paper,
      p = pulse(age, 0.5)
    if (stamp.current) stamp.current.position.y = 0.94 - p * 0.12
    if (sheet.current) sheet.current.position.z = 0.37 + p * 0.28
    if (arm.current) arm.current.rotation.x = -1.2 - p * 0.45
  })
  return (
    <Slim>
      <Bake>
        <Plinth color="#d7dce9" />
        <Clay
          color="#9cbdd5"
          size={[1.68, 1.12, 0.18]}
          position={[0, 0.72, -0.65]}
        />
        {[-0.76, 0.76].map((x) => (
          <Clay
            key={x}
            color="#b8d2e2"
            size={[0.17, 1.1, 1.25]}
            position={[x, 0.72, -0.12]}
          />
        ))}
        <Clay
          color="#2866a4"
          size={[1.8, 0.13, 0.76]}
          position={[0, 1.34, -0.44]}
        />
        <group position={[0, 1.55, -0.43]} rotation={[-0.28, 0, 0]}>
          <Clay color="#e6ac4f" size={[1.02, 0.35, 0.55]} />
          <Clay
            color="#805538"
            size={[0.91, 0.035, 0.56]}
            position={[0, 0.03, 0]}
          />
          {[-0.17, 0.17].map((x) => (
            <Clay
              key={x}
              color="#fff4d7"
              size={[0.065, 0.065, 0.19]}
              position={[x, 0.21, 0]}
            />
          ))}
          <Clay
            color="#fff4d7"
            size={[0.4, 0.065, 0.065]}
            position={[0, 0.21, -0.09]}
          />
          {[-0.3, 0.3].map((x) => (
            <Clay
              key={x}
              color="#fff4d7"
              size={[0.085, 0.1, 0.045]}
              position={[x, 0.055, 0.29]}
            />
          ))}
        </group>
        <Clay
          color={palette.glass}
          size={[0.9, 0.49, 0.04]}
          position={[0, 0.91, -0.535]}
        />
        <Clay
          color="#fff9ef"
          size={[0.045, 0.52, 0.065]}
          position={[0, 0.91, -0.5]}
        />
        <Clay
          color={palette.wood}
          size={[1.38, 0.11, 0.65]}
          position={[0, 0.67, 0.42]}
        />
        {[-0.55, 0.55].map((x) => (
          <Clay
            key={x}
            color={palette.darkWood}
            size={[0.085, 0.5, 0.085]}
            position={[x, 0.37, 0.5]}
          />
        ))}
        <Clay
          color={palette.steel}
          size={[0.37, 0.26, 0.08]}
          position={[-0.3, 0.9, 0.3]}
        />
        <Clay
          color={palette.ink}
          size={[0.31, 0.2, 0.025]}
          position={[-0.3, 0.91, 0.35]}
        />
        <Clay
          color={palette.steel}
          size={[0.26, 0.035, 0.14]}
          position={[-0.3, 0.74, 0.44]}
        />
        <Clay
          color="#fff9ef"
          size={[0.43, 0.22, 0.35]}
          position={[0.43, 0.83, 0.38]}
        />
        <Clay
          color={palette.ink}
          size={[0.31, 0.035, 0.04]}
          position={[0.43, 0.83, 0.565]}
        />
        <group
          name="printed-paper"
          ref={sheet}
          userData={{ live: true }}
          position={[0.43, 0.733, 0.37]}
        >
          <Goods kind="paper" scale={0.85} />
        </group>
        <group
          name="stamp"
          ref={stamp}
          userData={{ live: true }}
          position={[0.43, 0.94, 0.36]}
        >
          <Clay color={palette.teal} size={[0.25, 0.07, 0.19]} />
          <Clay
            shape="sphere"
            color={palette.teal}
            size={[0.09, 0.14, 0.09]}
            position={[0, 0.08, 0]}
          />
        </group>
        <group
          userData={{ live: true }}
          position={[-0.28, 0.14, -0.05]}
          scale={0.75}
        >
          <Person outfit="#bba9d4" rightArm={arm} />
        </group>
        <Clay
          color={palette.terracotta}
          size={[0.25, 0.24, 0.25]}
          position={[-0.6, 0.25, 0.7]}
        />
        <Clay
          shape="sphere"
          color="#86ad76"
          size={[0.34, 0.38, 0.3]}
          position={[-0.6, 0.55, 0.7]}
        />
      </Bake>
    </Slim>
  )
}
