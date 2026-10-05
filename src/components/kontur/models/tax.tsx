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
        <Clay
          color="#b44a43"
          size={[1.68, 0.12, 0.8]}
          position={[0, 1.4, -0.37]}
        />
        <Clay
          color="#b44a43"
          size={[1.68, 0.1, 0.14]}
          position={[0, 1.39, 0.42]}
        />
        {[-0.64, 0.64].map((x) => (
          <Clay
            key={x}
            color="#b44a43"
            size={[0.16, 0.1, 0.5]}
            position={[x, 1.39, 0.18]}
          />
        ))}
        <group position={[0, 1.5, -0.34]} rotation={[0, -0.16, 0]}>
          <Clay color="#fff7df" size={[0.98, 0.065, 0.62]} />
          {[-0.19, -0.04, 0.11].map((z) => (
            <Clay
              key={z}
              color="#7a93ac"
              size={[0.3, 0.015, 0.04]}
              position={[-0.23, 0.04, z]}
            />
          ))}
          <Clay
            shape="cylinder"
            color="#da7559"
            size={[0.43, 0.08, 0.43]}
            position={[0.24, 0.08, 0.03]}
          />
          <Clay
            shape="torus"
            color="#fff0c9"
            size={0.32}
            position={[0.24, 0.125, 0.03]}
            rotation={[-Math.PI / 2, 0, 0]}
          />
          <Clay
            color="#743c3b"
            size={[0.42, 0.09, 0.32]}
            position={[-0.03, 0.14, -0.07]}
          />
          <Clay
            shape="cylinder"
            color="#743c3b"
            size={[0.14, 0.24, 0.14]}
            position={[-0.03, 0.29, -0.07]}
          />
          <Clay
            shape="sphere"
            color="#da7559"
            size={[0.41, 0.2, 0.28]}
            position={[-0.03, 0.42, -0.07]}
          />
        </group>
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
          <group position={[0, -0.06, -0.36]}>
            <BankLink />
          </group>
          <Clay
            shape="sphere"
            color="#a5edbd"
            size={0.13}
            position={[0, 1.92, -0.67]}
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
