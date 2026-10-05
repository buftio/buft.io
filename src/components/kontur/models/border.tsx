'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { BORDER, GATE, H, toWorld } from '../map'
import { isOpen } from '../factory'
import { Bake, Clay, Slim, palette, type ModelProps } from './kit'
import { OpeningBurst } from './opening-burst'

export function Border({ game }: ModelProps) {
  const arm = useRef<Group>(null)
  const flags = useRef<Group>(null)
  const lamps = useRef<(Group | null)[]>([])
  useFrame((_, dt) => {
    const g = game.current
    const open = isOpen(g)
    const age = g.time - g.at.opened
    if (arm.current) {
      const target = -Math.PI * 0.48
      if (open && age >= 0 && age < 2)
        arm.current.rotation.x =
          target * (1 - Math.exp(-age * 5.8) * Math.cos(age * 10))
      else
        arm.current.rotation.x +=
          ((open ? target : 0) - arm.current.rotation.x) *
          (1 - Math.exp(-dt * 8))
    }
    if (flags.current) {
      flags.current.visible = g.openings > 0
      const pop = g.openings === 1 && age >= 0 ? Math.min(1, age * 3) : 1
      flags.current.scale.setScalar(
        Math.max(0.001, pop + Math.sin(pop * Math.PI) * 0.18),
      )
    }
    lamps.current.forEach((lamp, i) => {
      if (!lamp) return
      const flash = open && age >= 0 && age < (g.openings === 1 ? 3 : 1.4)
      lamp.visible = i % 2 === 0 ? !open : open
      lamp.scale.setScalar(
        flash ? 1 + Math.max(0, Math.sin(age * 22)) * 0.35 : 1,
      )
    })
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
          {[-0.47, 0.47].map((z, i) => (
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
              {['#ed7560', '#71d995'].map((color, j) => (
                <group
                  key={color}
                  ref={(node) => {
                    lamps.current[i * 2 + j] = node
                  }}
                  userData={{ live: true }}
                  position={[0, 1, 0]}
                >
                  <Clay shape="sphere" color={color} size={0.17} />
                </group>
              ))}
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
          <group name="gate-bunting" ref={flags} userData={{ live: true }}>
            {[-1, 1].map((side) => (
              <group key={side} position={[0, 0, side * 1.04]}>
                <Clay
                  color="#a5764f"
                  size={[0.045, 0.8, 0.045]}
                  position={[0, 1.22, 0]}
                />
                <Clay
                  color="#fff1da"
                  size={[0.035, 0.025, 0.9]}
                  position={[0, 1.57, side * 0.44]}
                />
                {[0, 1, 2, 3].map((i) => (
                  <Clay
                    key={i}
                    shape="cone"
                    color={['#f2bf63', '#ed8073', '#8bd4b1', '#9ebee7'][i]}
                    size={[0.045, 0.26, 0.2]}
                    position={[0, 1.45, side * (0.12 + i * 0.22)]}
                    rotation={[0, 0, Math.PI]}
                  />
                ))}
              </group>
            ))}
          </group>
        </group>
      </Bake>
      <group position={[gx, 0, gz]}>
        <OpeningBurst game={game} />
      </group>
    </Slim>
  )
}
