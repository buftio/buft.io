'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { isOpen } from '../factory'
import { Bake, Clay, Coin, Plinth, Slim, palette, type ModelProps } from './kit'
import { Person } from './person'

export function Customs({ game }: ModelProps) {
  const officer = useRef<Group>(null),
    left = useRef<Group>(null),
    right = useRef<Group>(null),
    stop = useRef<Group>(null),
    red = useRef<Group>(null),
    green = useRef<Group>(null),
    tape = useRef<Group>(null),
    lines = useRef<(Group | null)[]>([])
  const logged = useRef(0)
  useFrame((_, dt) => {
    const g = game.current,
      open = isOpen(g),
      age = g.time - g.at.opened,
      celebrating = open && age >= 0 && age < (g.openings === 1 ? 3 : 1.4),
      denied = !open && g.time - g.denied >= 0 && g.time - g.denied < 1.2,
      passing = g.time - g.at.passed >= 0 && g.time - g.at.passed < 0.6
    if (officer.current) {
      officer.current.rotation.x = denied ? 0.22 : 0
      officer.current.position.y =
        0.03 +
        (celebrating && g.openings === 1
          ? Math.abs(Math.sin(age * 9)) * 0.1
          : 0)
      officer.current.position.z +=
        ((celebrating ? 0.55 : -0.58) - officer.current.position.z) *
        (1 - Math.exp(-dt * 9))
      officer.current.rotation.y = celebrating ? Math.sin(age * 7) * 0.12 : 0
    }
    if (right.current) {
      right.current.rotation.z = denied
        ? 2.5
        : celebrating
          ? -2.7 + Math.sin(age * 18) * 0.3
          : 0.2
      right.current.rotation.x = celebrating ? -0.5 : -0.35
    }
    if (left.current)
      left.current.rotation.x = passing
        ? -1.45 + Math.sin(g.time * 35) * 0.12
        : -0.65
    if (stop.current) stop.current.visible = denied
    if (red.current) red.current.visible = !isOpen(g)
    if (green.current) {
      green.current.visible = open
      green.current.scale.setScalar(
        celebrating ? 1 + Math.max(0, Math.sin(age * 22)) * 0.4 : 1,
      )
    }
    if (passing) logged.current = Math.min(1, logged.current + dt * 0.7)
    const length = 0.12 + logged.current * 0.49
    if (tape.current) {
      tape.current.scale.z = length
      tape.current.position.y = 1.14 - length / 2
    }
    lines.current.forEach((line, i) => {
      if (line) {
        const p =
          (((i / 5 + (passing ? g.time * 0.75 : g.at.passed * 0.75)) % 1) + 1) %
          1
        line.position.z = p - 0.5
      }
    })
  })
  return (
    <Slim>
      <Bake>
        <Plinth size={0.88} color="#d8dce2" />
        <Clay
          color="#fff1da"
          size={[0.68, 0.86, 0.62]}
          position={[0, 0.53, 0]}
        />
        {[-0.25, 0, 0.25].map((x) => (
          <Clay
            key={x}
            color={palette.terracotta}
            size={[0.13, 0.26, 0.025]}
            position={[x, 0.27, 0.322]}
          />
        ))}
        <Clay
          color="#536d81"
          size={[0.55, 0.41, 0.045]}
          position={[0, 0.7, 0.33]}
        />
        <Clay
          color={palette.glass}
          size={[0.46, 0.32, 0.022]}
          position={[0, 0.71, 0.357]}
        />
        <Clay
          color="#fff1da"
          size={[0.035, 0.35, 0.028]}
          position={[0, 0.71, 0.376]}
        />
        <Clay
          color={palette.terracotta}
          size={[0.86, 0.13, 0.8]}
          position={[0, 1.05, 0]}
        />
        <Clay
          shape="cylinder"
          color={palette.steel}
          size={[0.055, 0.25, 0.055]}
          position={[0.24, 1.21, 0]}
        />
        <group
          name="red-lamp"
          ref={red}
          userData={{ live: true }}
          position={[0.24, 1.38, 0]}
        >
          <Clay shape="sphere" color="#ef624c" size={0.18} />
        </group>
        <group
          name="green-lamp"
          ref={green}
          userData={{ live: true }}
          position={[0.24, 1.38, 0]}
        >
          <Clay shape="sphere" color="#71d995" size={0.18} />
        </group>
        <Coin position={[-0.16, 0.42, 0.365]} scale={0.53} />
        <Clay
          color={palette.ink}
          size={[0.16, 0.027, 0.025]}
          position={[0.12, 0.42, 0.36]}
        />
        <Clay
          color={palette.steel}
          size={[0.32, 0.16, 0.26]}
          position={[0, 1.13, 0.27]}
        />
        <Clay
          color={palette.ink}
          size={[0.23, 0.027, 0.04]}
          position={[0, 1.14, 0.405]}
        />
        <group
          name="log-tape"
          ref={tape}
          userData={{ live: true }}
          position={[0, 1.08, 0.415]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <Clay color="#fff9ef" size={[0.22, 0.018, 1]} />
          {Array.from({ length: 5 }, (_, i) => (
            <group
              key={i}
              ref={(node) => {
                lines.current[i] = node
              }}
              userData={{ live: true }}
            >
              <Clay
                color="#9aa3a8"
                size={[0.16, 0.005, 0.018]}
                position={[0, 0.012, 0]}
              />
            </group>
          ))}
        </group>
        <group
          name="customs-officer"
          ref={officer}
          userData={{ live: true }}
          position={[0.6, 0.03, -0.58]}
          scale={0.72}
        >
          <Person
            outfit="#7f9c85"
            hat="cap"
            leftArm={left}
            rightArm={right}
            rightHand={
              <group
                name="stop-sign"
                ref={stop}
                userData={{ live: true }}
                rotation={[0, 0, Math.PI]}
              >
                <Clay
                  shape="cylinder"
                  color={palette.wood}
                  size={[0.055, 0.34, 0.055]}
                  position={[0, 0.12, 0]}
                />
                <Clay
                  shape="cylinder"
                  color="#fff9ef"
                  size={[0.43, 0.055, 0.43]}
                  position={[0, 0.45, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                />
                <Clay
                  shape="cylinder"
                  color={palette.red}
                  size={[0.37, 0.065, 0.37]}
                  position={[0, 0.45, 0.009]}
                  rotation={[Math.PI / 2, 0, 0]}
                />
                <Clay
                  color="#fff9ef"
                  size={[0.24, 0.055, 0.025]}
                  position={[0, 0.45, 0.05]}
                />
              </group>
            }
            leftHand={
              <group rotation={[-0.8, 0, 0.3]}>
                <Clay color={palette.wood} size={[0.24, 0.29, 0.045]} />
                <Clay
                  color="#fff9ef"
                  size={[0.2, 0.24, 0.012]}
                  position={[0, 0, 0.029]}
                />
                <Clay
                  color={palette.steel}
                  size={[0.08, 0.035, 0.025]}
                  position={[0, 0.135, 0.035]}
                />
                <Clay
                  color={palette.mustard}
                  size={[0.025, 0.21, 0.025]}
                  position={[0.075, 0, 0.06]}
                  rotation={[0, 0, -0.4]}
                />
              </group>
            }
          />
        </group>
      </Bake>
    </Slim>
  )
}
