'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import {
  Bake,
  BankLink,
  Clay,
  Coin,
  Columns,
  Goods,
  Pediment,
  Plinth,
  Slim,
  palette,
  pulse,
  type ModelProps,
} from './kit'
import { Person } from './person'

export function TaxOffice({ game, banks }: ModelProps & { banks: boolean }) {
  const clerk = useRef<Group>(null),
    arm = useRef<Group>(null),
    broom = useRef<Group>(null),
    minted = useRef<Group>(null),
    heap = useRef<Group>(null)
  const slots = useRef<(Group | null)[]>([])
  useFrame(() => {
    const g = game.current,
      busy = g.tax.until >= 0,
      sweep = busy ? Math.sin(g.time * 8) : 0
    if (clerk.current) clerk.current.rotation.z = sweep * 0.07
    if (arm.current) arm.current.rotation.x = -0.9 + sweep * 0.25
    if (broom.current) broom.current.rotation.z = sweep * 0.3
    if (heap.current) heap.current.position.x = -0.72 + sweep * 0.025
    slots.current.forEach((node, i) => {
      if (node) node.visible = i === 0 ? g.tax.paper >= 1 : g.tax.gray >= i
    })
    const age = g.time - g.at.minted
    if (minted.current) {
      minted.current.visible = age >= 0 && age < 1.15
      minted.current.position.y = 1.9 + pulse(age, 1.15) * 0.6
      minted.current.rotation.y = age * 5
    }
  })
  return (
    <Slim>
      <Bake>
        <Plinth color="#d5dce8" />
        <Clay
          color="#c7d4e2"
          size={[1.45, 1.15, 0.86]}
          position={[0, 0.76, -0.34]}
        />
        <Clay
          color="#71899d"
          size={[0.47, 0.82, 0.05]}
          position={[0, 0.63, 0.12]}
        />
        <Clay
          color="#9fb4c8"
          size={[1.7, 0.12, 0.6]}
          position={[0, 0.2, 0.56]}
        />
        <Clay
          color="#edf0f3"
          size={[1.7, 0.1, 0.38]}
          position={[0, 0.13, 0.7]}
        />
        <Columns />
        <Pediment />
        <Goods
          kind="paper"
          position={[0, 1.59, 0.505]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={0.55}
        />
        {[-0.4, 0, 0.4].map((x, i) => (
          <group key={x} position={[x, 0.31, 0.68]}>
            <Clay
              color={i === 0 ? '#7d9fb7' : '#8c949d'}
              size={[0.32, 0.055, 0.3]}
            />
            <group
              name={`tax-slot-${i}`}
              ref={(node) => {
                slots.current[i] = node
              }}
              userData={{ live: true }}
              position={[0, 0.03, 0]}
            >
              <Goods kind={i === 0 ? 'paper' : 'gray'} scale={0.75} />
            </group>
          </group>
        ))}
        <group
          name="minted-coin"
          ref={minted}
          userData={{ live: true }}
          position={[0, 1.9, 0]}
        >
          <Coin scale={1.35} />
        </group>
        <group
          name="tax-clerk"
          ref={clerk}
          userData={{ live: true }}
          position={[-0.58, 0.15, 0.57]}
          scale={0.62}
        >
          <Person outfit="#889eb7" leftArm={arm} />
          <group
            name="broom"
            ref={broom}
            userData={{ live: true }}
            position={[-0.15, 0.63, 0.21]}
            rotation={[0, 0, -0.3]}
          >
            <Clay
              shape="cylinder"
              color={palette.wood}
              size={[0.045, 0.8, 0.045]}
            />
            <Clay
              color="#d8b874"
              size={[0.3, 0.17, 0.14]}
              position={[0, -0.4, 0]}
            />
            {[-0.08, 0, 0.08].map((x) => (
              <Clay
                key={x}
                color="#b08a4c"
                size={[0.015, 0.1, 0.15]}
                position={[x, -0.45, 0.005]}
              />
            ))}
          </group>
        </group>
        <group
          name="coin-heap"
          ref={heap}
          userData={{ live: true }}
          position={[-0.72, 0.27, 0.79]}
        >
          {[-0.06, 0, 0.06].map((x, i) => (
            <Goods
              key={x}
              kind="gray"
              position={[x, i * 0.025, 0]}
              scale={0.42}
            />
          ))}
        </group>
      </Bake>
      {banks && (
        <Bake>
          <BankLink />
          <Clay
            shape="sphere"
            color="#a5edbd"
            size={0.13}
            position={[0, 1.98, -0.31]}
          />
          <pointLight
            color="#7fffd0"
            intensity={0.6}
            distance={2}
            position={[0, 2, -0.25]}
          />
        </Bake>
      )}
    </Slim>
  )
}
