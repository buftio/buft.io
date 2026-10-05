'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Bake, Clay, Slim, type ModelProps } from './kit'

export function Lot({ game }: ModelProps) {
  const sign = useRef<Group>(null)
  const ribbons = useRef<(Group | null)[]>([])
  useFrame(() => {
    const t = game.current.time
    if (sign.current) sign.current.rotation.z = Math.sin(t * 0.75) * 0.025
    ribbons.current.forEach((ribbon, i) => {
      if (ribbon) ribbon.rotation.x = 0.08 + Math.sin(t * 1.8 + i * 0.8) * 0.16
    })
  })
  return (
    <group name="business-lot">
      <Slim>
        <Bake>
          <Clay
            color="#a9bd8f"
            size={[1.88, 0.1, 1.88]}
            position={[0, 0.05, 0]}
          />
          <Clay
            color="#ceb394"
            size={[1.46, 0.035, 1.46]}
            position={[0, 0.11, 0]}
          />
          {[-0.8, 0.8].flatMap((x) =>
            [-0.8, 0.8].map((z) => (
              <group key={`${x}-${z}`} position={[x, 0, z]}>
                <Clay
                  color="#b4916f"
                  size={[0.085, 0.5, 0.085]}
                  position={[0, 0.32, 0]}
                />
                <Clay
                  color="#fff2d6"
                  size={[0.09, 0.1, 0.09]}
                  position={[0, 0.55, 0]}
                />
                <Clay
                  color="#e5b87a"
                  size={[0.11, 0.045, 0.11]}
                  position={[0, 0.47, 0]}
                />
              </group>
            )),
          )}
          <Clay
            color="#f4dec0"
            size={[1.6, 0.027, 0.027]}
            position={[0, 0.46, -0.8]}
          />
          {[-0.8, 0.8].map((x) => (
            <group key={x}>
              <Clay
                color="#f4dec0"
                size={[0.027, 0.027, 1.6]}
                position={[x, 0.46, 0]}
              />
              <Clay
                color="#f4dec0"
                size={[0.52, 0.027, 0.027]}
                position={[x * 0.67, 0.46, 0.8]}
              />
            </group>
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <group
              key={i}
              ref={(node) => {
                ribbons.current[i] = node
              }}
              userData={{ live: true }}
              position={[-0.6 + i * 0.2, 0.45, -0.8]}
            >
              <Clay
                color={i % 2 ? '#f1c576' : '#83b6ae'}
                size={[0.12, 0.17, 0.02]}
                position={[0, -0.08, 0]}
              />
              <Clay
                color={i % 2 ? '#f1c576' : '#83b6ae'}
                shape="cone"
                size={[0.12, 0.075, 0.02]}
                position={[0, -0.18, 0]}
                rotation={[0, 0, Math.PI]}
              />
            </group>
          ))}
          {[-0.44, 0.12].map((x) => (
            <Clay
              key={x}
              color="#aa8362"
              size={[0.07, 0.72, 0.07]}
              position={[x, 0.46, -0.3]}
            />
          ))}
          <group
            name="lot-sign"
            ref={sign}
            userData={{ live: true }}
            position={[-0.16, 0.77, -0.3]}
          >
            <Clay
              color="#b9916d"
              size={[0.99, 0.54, 0.095]}
              position={[0, 0.15, 0]}
            />
            <Clay
              color="#fff0d2"
              size={[0.91, 0.46, 0.022]}
              position={[0, 0.15, 0.052]}
            />
            <Clay
              color="#74a69e"
              shape="torus"
              size={[0.17, 0.13, 0.036]}
              position={[0, 0.3, 0.083]}
            />
            <Clay
              color="#74a69e"
              size={[0.4, 0.26, 0.06]}
              position={[0, 0.15, 0.086]}
            />
            <Clay
              color="#e0eee1"
              size={[0.35, 0.025, 0.012]}
              position={[0, 0.17, 0.121]}
            />
            <Clay
              color="#f1c576"
              size={[0.055, 0.07, 0.024]}
              position={[0, 0.165, 0.131]}
            />
            {[-0.38, 0.38].map((x) => (
              <Clay
                key={x}
                shape="sphere"
                color="#d3b58b"
                size={0.035}
                position={[x, 0.15, 0.07]}
              />
            ))}
          </group>
          <group position={[0.57, 0, -0.35]} rotation={[0, -0.14, 0]}>
            <Clay
              color="#a78564"
              shape="cylinder"
              size={[0.065, 0.4, 0.065]}
              position={[0, 0.29, 0]}
            />
            <Clay
              color="#83b6ae"
              size={[0.27, 0.23, 0.34]}
              position={[0, 0.55, 0]}
            />
            <Clay
              color="#a5c8b4"
              shape="sphere"
              size={[0.28, 0.18, 0.34]}
              position={[0, 0.655, 0]}
            />
            <Clay
              color="#537b73"
              size={[0.18, 0.025, 0.015]}
              position={[0, 0.59, 0.177]}
            />
            <Clay
              color="#f1c576"
              size={[0.025, 0.15, 0.025]}
              position={[0.153, 0.64, -0.035]}
            />
            <Clay
              color="#f1c576"
              size={[0.085, 0.07, 0.028]}
              position={[0.184, 0.715, -0.035]}
            />
          </group>
          {Array.from({ length: 6 }, (_, i) => (
            <Clay
              key={i}
              color={i % 2 ? '#dca88b' : '#c99275'}
              size={[0.24, 0.085, 0.14]}
              position={[
                0.4 + (i % 2) * 0.27,
                0.17 + Math.floor(i / 2) * 0.087,
                0.46,
              ]}
              rotation={[0, (Math.floor(i / 2) % 2) * 0.08, 0]}
            />
          ))}
          {[0.18, 0.44, 0.7].map((z, i) => (
            <Clay
              key={z}
              shape="cylinder"
              color="#eadac0"
              size={[0.28, 0.035, 0.19]}
              position={[-0.15 + (i % 2) * 0.035, 0.15, z]}
              rotation={[0, i * 0.35, 0]}
            />
          ))}
          {[-0.53, -0.67, -0.42].map((x, i) => (
            <group key={x} position={[x, 0.14, 0.38 + (i % 2) * 0.16]}>
              <Clay
                color="#88a779"
                shape="cylinder"
                size={[0.02, 0.16, 0.02]}
                position={[0, 0.07, 0]}
              />
              {[-1, 1].map((side) => (
                <Clay
                  key={side}
                  color={i % 2 ? '#98b987' : '#7f9f74'}
                  shape="sphere"
                  size={[0.12, 0.04, 0.075]}
                  position={[side * 0.045, 0.13, 0]}
                  rotation={[0, 0, side * 0.45]}
                />
              ))}
            </group>
          ))}
        </Bake>
      </Slim>
    </group>
  )
}
