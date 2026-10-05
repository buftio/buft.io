'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import {
  Bake,
  Clay,
  Coin,
  Goods,
  Plinth,
  Slim,
  palette,
  pulse,
  type ModelProps,
} from './kit'
import { Person } from './person'

export function Shop({ game }: ModelProps) {
  const keeper = useRef<Group>(null),
    arm = useRef<Group>(null),
    drawer = useRef<Group>(null)
  useFrame(() => {
    const p = pulse(game.current.time - game.current.at.sold, 0.65)
    if (keeper.current) keeper.current.position.y = 0.16 + p * 0.09
    if (arm.current) arm.current.rotation.z = 0.18 + p * 2.5
    if (drawer.current) drawer.current.position.z = 0.68 + p * 0.14
  })
  return (
    <Slim>
      <Bake>
        <Plinth color="#d7e5ce" />
        <Clay
          color="#edc793"
          size={[1.65, 0.95, 0.86]}
          position={[0, 0.64, -0.38]}
        />
        {[-0.78, 0.78].map((x) => (
          <Clay
            key={x}
            color="#e4b679"
            size={[0.16, 1.25, 1.4]}
            position={[x, 0.78, -0.12]}
          />
        ))}
        <Clay
          color={palette.teal}
          size={[1.8, 0.16, 1.15]}
          position={[0, 1.42, -0.29]}
        />
        <Clay
          color="#fff9ef"
          size={[1.35, 0.3, 0.09]}
          position={[0, 1.59, 0.61]}
        />
        <Coin position={[0, 1.6, 0.68]} scale={0.75} />
        <Clay
          color={palette.wood}
          size={[0.44, 0.82, 0.065]}
          position={[0.5, 0.61, 0.07]}
        />
        <Clay
          color={palette.glass}
          size={[0.3, 0.5, 0.02]}
          position={[0.5, 0.74, 0.112]}
        />
        <Clay
          shape="sphere"
          color={palette.mustard}
          size={0.055}
          position={[0.63, 0.5, 0.12]}
        />
        <Clay
          color={palette.teal}
          size={[0.92, 0.66, 0.07]}
          position={[-0.28, 0.71, 0.08]}
        />
        <Clay
          color={palette.glass}
          size={[0.8, 0.54, 0.025]}
          position={[-0.28, 0.71, 0.12]}
        />
        <Clay
          color="#fff9ef"
          size={[0.035, 0.57, 0.035]}
          position={[-0.28, 0.71, 0.145]}
        />
        <Clay
          color={palette.wood}
          size={[1.53, 0.48, 0.45]}
          position={[0, 0.37, 0.56]}
        />
        <Clay
          color="#fff9ef"
          size={[1.65, 0.09, 0.52]}
          position={[0, 0.65, 0.58]}
        />
        <Goods kind="potato" position={[-0.57, 0.7, 0.62]} scale={0.52} />
        <Goods kind="tomato" position={[-0.33, 0.7, 0.61]} scale={0.52} />
        <Goods kind="bear" position={[-0.08, 0.7, 0.58]} scale={0.48} />
        <Clay
          color={palette.steel}
          size={[0.28, 0.18, 0.23]}
          position={[0.51, 0.8, 0.56]}
        />
        <Clay
          color={palette.ink}
          size={[0.2, 0.07, 0.045]}
          position={[0.51, 0.85, 0.69]}
        />
        <group
          name="cash-drawer"
          ref={drawer}
          userData={{ live: true }}
          position={[0.51, 0.705, 0.68]}
        >
          <Clay color={palette.ink} size={[0.26, 0.06, 0.23]} />
          <Clay
            color={palette.steel}
            size={[0.24, 0.055, 0.04]}
            position={[0, 0, 0.12]}
          />
        </group>
        <group
          name="shopkeeper"
          ref={keeper}
          userData={{ live: true }}
          position={[0.14, 0.16, 0.5]}
          scale={0.72}
        >
          <Person outfit="#a9c7a0" rightArm={arm} />
        </group>
        {Array.from({ length: 9 }, (_, i) => (
          <group key={i} position={[-0.72 + i * 0.18, 1.24, 0.37]}>
            <Clay
              color={i % 2 ? '#fff9ef' : palette.terracotta}
              size={[0.18, 0.07, 0.38]}
              rotation={[-0.18, 0, 0]}
            />
            <Clay
              color={i % 2 ? '#fff9ef' : palette.terracotta}
              size={[0.18, 0.16, 0.06]}
              position={[0, -0.095, 0.18]}
            />
          </group>
        ))}
      </Bake>
    </Slim>
  )
}
