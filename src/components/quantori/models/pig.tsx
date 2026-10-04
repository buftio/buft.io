'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group } from 'three'
import { Clay, palette, type GroupProps } from '../../marketdata/models/clay'

export type PigProps = GroupProps & {
  since?: RefObject<number>
  delay?: number
}

const pink = '#f5b0be'
const blush = '#e990a7'
const feet: [number, number][] = [
  [0.22, 0.19],
  [0.22, -0.19],
  [-0.24, 0.19],
  [-0.24, -0.19],
]

export function Pig({ since, delay = 0, ...props }: PigProps) {
  const body = useRef<Group>(null)
  const limbs = useRef<(Group | null)[]>([])
  const ears = useRef<(Group | null)[]>([])
  const eyes = useRef<Group>(null)
  const mouth = useRef<Group>(null)
  const smile = useRef<Group>(null)
  const tail = useRef<Group>(null)
  useFrame(({ clock }) => {
    const group = body.current
    if (!group) return
    const t = clock.elapsedTime
    const s = since ? t - since.current - delay : -1
    const hit = s >= 0 && s < 0.45
    const running = s >= 0.45
    const run = s - 0.45
    if (s < 0) {
      group.position.set(0, Math.abs(Math.sin(t * 1.6)) * 0.03, 0)
      group.rotation.set(0, Math.sin(t * 0.5) * 0.25, 0)
    } else if (hit) {
      const p = s / 0.45
      group.position.set(0, Math.sin(p * Math.PI) * 0.7, 0)
      group.rotation.set(
        Math.sin(p * Math.PI * 6) * 0.25,
        0,
        Math.sin(p * Math.PI) * 0.5,
      )
    } else {
      group.position.set(
        run * run * 2 + run * 3,
        Math.abs(Math.sin(run * 16)) * 0.14,
        0,
      )
      group.rotation.set(0, 0, -0.08)
    }
    for (let i = 0; i < limbs.current.length; i++) {
      const leg = limbs.current[i]
      if (leg)
        leg.rotation.z = running
          ? Math.sin(run * 22 + (i % 2) * Math.PI) * 0.8
          : 0
    }
    for (let i = 0; i < ears.current.length; i++) {
      const ear = ears.current[i]
      if (ear)
        ear.rotation.z =
          -0.32 +
          (hit
            ? Math.sin(s * 35) * 0.55
            : running
              ? Math.sin(run * 22 + i) * 0.25
              : Math.sin(t * 2 + i) * 0.07)
    }
    const blink = Math.pow(Math.max(0, Math.cos(t * 1.1)), 48)
    if (eyes.current) eyes.current.scale.y = hit ? 1.45 : 1 - blink * 0.9
    if (mouth.current) mouth.current.scale.setScalar(hit ? 1 : 0)
    if (smile.current) smile.current.scale.setScalar(hit ? 0 : 1)
    if (tail.current)
      tail.current.rotation.x = Math.sin(t * (running ? 17 : 3)) * 0.3
  })
  return (
    <group {...props}>
      <group ref={body} name="pig">
        <Clay
          shape="sphere"
          color={pink}
          size={[0.9, 0.61, 0.6]}
          position={[-0.04, 0.46, 0]}
        />
        <Clay
          shape="sphere"
          color="#fac1cb"
          size={[0.66, 0.3, 0.51]}
          position={[-0.02, 0.32, 0]}
        />
        <group name="pig-head" position={[0.38, 0.58, 0]}>
          <Clay shape="sphere" color={pink} size={[0.49, 0.47, 0.46]} />
          <Clay
            shape="sphere"
            color={blush}
            size={[0.14, 0.21, 0.29]}
            position={[0.225, -0.035, 0]}
          />
          <Clay
            shape="sphere"
            color="#f8bdc8"
            size={[0.055, 0.185, 0.26]}
            position={[0.29, -0.03, 0]}
          />
          {[-1, 1].map((side, i) => (
            <group key={side}>
              <Clay
                shape="sphere"
                color="#b2637d"
                size={[0.017, 0.044, 0.033]}
                position={[0.319, -0.03, side * 0.059]}
              />
              <Clay
                shape="sphere"
                color={blush}
                size={[0.105, 0.072, 0.033]}
                position={[0.12, -0.07, side * 0.195]}
                rotation={[0, side * 0.65, 0]}
              />
              <group
                ref={(node) => {
                  ears.current[i] = node
                }}
                name={`pig-ear-${i}`}
                position={[-0.04, 0.17, side * 0.14]}
                rotation={[side * 0.25, 0, -0.32]}
              >
                <Clay
                  shape="sphere"
                  color={pink}
                  size={[0.16, 0.245, 0.075]}
                  position={[0, 0.085, 0]}
                />
                <Clay
                  shape="sphere"
                  color={blush}
                  size={[0.095, 0.155, 0.019]}
                  position={[0.02, 0.09, side * 0.034]}
                />
              </group>
            </group>
          ))}
          <group ref={eyes} position={[0.13, 0.075, 0]}>
            {[-1, 1].map((side) => (
              <group
                key={side}
                position={[0, 0, side * 0.175]}
                rotation={[0, side * 0.85, 0]}
              >
                <Clay
                  shape="sphere"
                  color="#fff9ee"
                  size={[0.08, 0.104, 0.045]}
                />
                <Clay
                  shape="sphere"
                  color={palette.ink}
                  size={[0.046, 0.063, 0.027]}
                  position={[0.01, 0, side * 0.023]}
                />
                <Clay
                  shape="sphere"
                  color="#ffffff"
                  size={0.018}
                  position={[0.017, 0.018, side * 0.036]}
                />
              </group>
            ))}
          </group>
          <group
            ref={mouth}
            name="pig-surprise"
            position={[0.185, -0.15, 0]}
            rotation={[0, Math.PI / 2, 0]}
            scale={0}
          >
            <Clay shape="sphere" color="#874359" size={[0.085, 0.105, 0.025]} />
            <Clay
              shape="torus"
              color={blush}
              size={[0.09, 0.11, 0.15]}
              position={[0, 0, 0.012]}
            />
          </group>
          <group ref={smile} position={[0.17, -0.14, 0]}>
            {[-1, 1].map((side) => (
              <Clay
                key={side}
                shape="smile"
                color="#ae667c"
                size={0.07}
                position={[0, 0, side * 0.108]}
                rotation={[0, side * 0.8, Math.PI]}
              />
            ))}
          </group>
        </group>
        <group ref={tail} name="pig-tail" position={[-0.485, 0.51, 0]}>
          <Clay
            shape="sphere"
            color={blush}
            size={[0.13, 0.045, 0.045]}
            position={[-0.035, 0.02, 0]}
          />
          <Clay
            shape="torus"
            color={blush}
            size={[0.15, 0.15, 0.24]}
            position={[-0.1, 0.07, 0]}
            rotation={[0, Math.PI / 2, 0]}
          />
          <Clay
            shape="sphere"
            color={pink}
            size={0.045}
            position={[-0.105, 0.125, 0.04]}
          />
        </group>
        {feet.map(([x, z], i) => (
          <group
            key={i}
            ref={(node) => {
              limbs.current[i] = node
            }}
            name={`pig-leg-${i}`}
            position={[x, 0.27, z]}
          >
            <Clay
              shape="sphere"
              color={pink}
              size={[0.15, 0.27, 0.15]}
              position={[0, -0.1, 0]}
            />
            <Clay
              color="#bf8594"
              size={[0.145, 0.075, 0.145]}
              position={[0.02, -0.23, 0]}
            />
            <Clay
              color="#9a6477"
              size={[0.012, 0.046, 0.01]}
              position={[0.086, -0.234, 0]}
            />
          </group>
        ))}
      </group>
    </group>
  )
}
