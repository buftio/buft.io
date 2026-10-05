'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { BORDER, GATE, H, toWorld } from '../map'
import { isOpen } from '../factory'
import { Bake, Clay, Slim, palette, type ModelProps } from './kit'

export function Border({ game }: ModelProps) {
  const arm = useRef<Group>(null)
  useFrame((_, dt) => {
    if (arm.current)
      arm.current.rotation.x +=
        ((isOpen(game.current) ? -Math.PI * 0.48 : 0) -
          arm.current.rotation.x) *
        (1 - Math.exp(-dt * 6))
  })
  const [gx, gz] = toWorld(...GATE)
  return (
    <Slim>
      <Bake>
        {Array.from({ length: H }, (_, row) => {
          if (row === GATE[1]) return null
          const [x, z] = toWorld(BORDER, row)
          return (
            <group key={row} position={[x, 0, z]}>
              <Clay
                color="#b2b6ae"
                size={[0.2, 0.64, 0.96]}
                position={[0, 0.36, 0]}
              />
              <Clay
                color="#d1d1be"
                size={[0.28, 0.12, 0.98]}
                position={[0, 0.72, 0]}
              />
              {[-0.42, 0.42].map((d) => (
                <group key={d} position={[0, 0, d]}>
                  <Clay
                    color="#a1a999"
                    size={[0.27, 0.88, 0.17]}
                    position={[0, 0.44, 0]}
                  />
                  <Clay
                    shape="sphere"
                    color="#d1d1be"
                    size={[0.3, 0.17, 0.23]}
                    position={[0, 0.9, 0]}
                  />
                </group>
              ))}
              {[-0.22, 0, 0.22].map((d) => (
                <Clay
                  key={d}
                  color="#879682"
                  size={[0.04, 0.12, 0.13]}
                  position={[0, 0.83, d]}
                  rotation={[0.45, 0, 0]}
                />
              ))}
            </group>
          )
        })}
        <group position={[gx, 0, gz]}>
          {[-0.47, 0.47].map((z) => (
            <group key={z} position={[0, 0, z]}>
              <Clay
                color="#fff1da"
                size={[0.24, 0.95, 0.18]}
                position={[0, 0.48, 0]}
              />
              <Clay
                color={palette.red}
                size={[0.25, 0.13, 0.19]}
                position={[0, 0.71, 0]}
              />
              <Clay
                shape="sphere"
                color={palette.mustard}
                size={0.17}
                position={[0, 1, 0]}
              />
            </group>
          ))}
          <group
            name="barrier"
            ref={arm}
            userData={{ live: true }}
            position={[0, 0.75, -0.45]}
          >
            <Clay
              color="#fff9ef"
              size={[0.12, 0.12, 0.9]}
              position={[0, 0, 0.45]}
            />
            {[0.12, 0.34, 0.56, 0.78].map((z) => (
              <Clay
                key={z}
                color={palette.red}
                size={[0.127, 0.127, 0.1]}
                position={[0, 0, z]}
              />
            ))}
            <Clay
              shape="cylinder"
              color={palette.steel}
              size={[0.2, 0.18, 0.2]}
              rotation={[0, 0, Math.PI / 2]}
            />
          </group>
        </group>
      </Bake>
    </Slim>
  )
}
