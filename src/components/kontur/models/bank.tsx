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
  type ModelProps,
} from './kit'

export function Bank({ game, connected }: ModelProps & { connected: boolean }) {
  const deposit = useRef<Group>(null),
    stack = useRef<Group>(null)
  useFrame(() => {
    const g = game.current,
      age = g.time - g.at.deposited
    if (deposit.current) {
      deposit.current.visible = age >= 0 && age < 0.65
      deposit.current.position.y = 0.91 + Math.max(0, 1 - age / 0.65) * 0.75
      deposit.current.scale.setScalar(Math.max(0.05, 1 - age / 0.65))
    }
    if (stack.current) {
      stack.current.visible = g.wallet > 0
      stack.current.scale.y = 0.5 + Math.min(g.wallet, 12) * 0.3
    }
  })
  return (
    <Slim>
      <Bake>
        <Plinth color="#d8d3e8" />
        <Clay
          color="#b9acd0"
          size={[1.5, 1.17, 0.97]}
          position={[0, 0.74, -0.27]}
        />
        <Columns color="#fff5de" z={0.4} />
        <Clay
          color="#75529d"
          size={[1.72, 0.12, 0.96]}
          position={[0, 1.39, -0.32]}
        />
        <Clay
          color="#75529d"
          size={[1.68, 0.1, 0.13]}
          position={[0, 1.39, 0.4]}
        />
        <Clay
          shape="sphere"
          color="#9877bc"
          size={[1.12, 0.68, 0.9]}
          position={[-0.12, 1.43, -0.23]}
        />
        <Coin
          position={[-0.12, 1.78, -0.23]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={2.55}
        />
        {[0, 1, 2, 3].map((i) => (
          <Clay
            key={i}
            shape="cylinder"
            color={i % 2 ? '#ffe29a' : '#e9b735'}
            size={[0.29, 0.09, 0.29]}
            position={[0.59, 1.5 + i * 0.09, -0.48]}
          />
        ))}
        <Clay
          color="#ded2e9"
          size={[1.65, 0.1, 0.53]}
          position={[0, 0.16, 0.64]}
        />
        <Clay
          shape="cylinder"
          color={palette.steel}
          size={[0.79, 0.12, 0.79]}
          position={[0, 0.73, 0.28]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <Clay
          shape="torus"
          color="#ccd2d4"
          size={0.7}
          position={[0, 0.73, 0.36]}
        />
        <Coin position={[0, 0.76, 0.4]} scale={1.05} />
        {[-1, 1].map((s) => (
          <Clay
            key={s}
            color="#657483"
            size={[0.12, 0.21, 0.1]}
            position={[s * 0.4, 0.72, 0.29]}
          />
        ))}
        <Clay
          color={palette.mustard}
          size={[0.43, 0.15, 0.27]}
          position={[0.43, 0.81, 0.63]}
        />
        <Clay
          color={palette.ink}
          size={[0.29, 0.025, 0.14]}
          position={[0.43, 0.895, 0.63]}
        />
        <group
          name="deposit-coin"
          ref={deposit}
          userData={{ live: true }}
          position={[0.43, 1.5, 0.63]}
        >
          <Goods kind="gold" scale={0.8} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <group
          name="wallet-stack"
          ref={stack}
          userData={{ live: true }}
          position={[-0.39, 0.21, 0.66]}
        >
          {[0, 0.045, 0.09, 0.135].map((y) => (
            <Goods kind="gold" key={y} position={[0, y, 0]} scale={0.85} />
          ))}
        </group>
      </Bake>
      {connected && (
        <Bake>
          <group position={[0, -0.05, -0.42]}>
            <BankLink />
          </group>
          {[-0.5, 0, 0.5].map((x, i) => (
            <group key={x} position={[x, 1.51, -0.72]}>
              <Clay
                color={['#86d2bb', '#9ebce8', '#e8bf80'][i]}
                size={[0.28, 0.24, 0.24]}
              />
              <Clay
                color="#f6fff3"
                size={[0.22, 0.045, 0.27]}
                position={[0, 0.13, 0]}
              />
              <Clay
                color={palette.ink}
                size={[0.13, 0.07, 0.02]}
                position={[0, 0, 0.13]}
              />
            </group>
          ))}
          <pointLight
            color="#7fffd0"
            intensity={0.4}
            distance={2}
            position={[0, 1.9, -0.3]}
          />
        </Bake>
      )}
    </Slim>
  )
}
