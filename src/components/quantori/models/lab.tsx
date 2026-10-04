'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { Clay, type GroupProps } from '../../marketdata/models/clay'

const ivory = '#faf6ee'
const blue = '#99afc8'
const dark = '#596c87'
const mint = '#96c8b8'
const purple = '#baa6d1'
const rose = '#e6a4b7'

export function Bench(props: GroupProps) {
  return (
    <group {...props} name="lab-bench">
      <Clay color={blue} size={[1.85, 0.1, 0.78]} position={[0, 0.76, 0]} />
      <Clay color={ivory} size={[1.92, 0.065, 0.84]} position={[0, 0.825, 0]} />
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.65, 0, 0]}>
          <Clay
            color="#c1cedd"
            size={[0.43, 0.68, 0.6]}
            position={[0, 0.38, 0]}
          />
          <Clay
            color={dark}
            size={[0.46, 0.07, 0.63]}
            position={[0, 0.055, 0]}
          />
          {[0.27, 0.48, 0.66].map((y) => (
            <group key={y}>
              <Clay
                color="#e3eaf0"
                size={[0.37, 0.17, 0.045]}
                position={[0, y, 0.31]}
              />
              <Clay
                color={blue}
                size={[0.12, 0.027, 0.045]}
                position={[0, y + 0.02, 0.345]}
              />
            </group>
          ))}
        </group>
      ))}
      <Clay
        color={blue}
        size={[0.85, 0.09, 0.12]}
        position={[0, 0.27, -0.24]}
      />
    </group>
  )
}

function Molecule({ size = 1 }: { size?: number }) {
  return (
    <group scale={size}>
      <Clay color={blue} size={[0.23, 0.025, 0.02]} rotation={[0, 0, 0.55]} />
      <Clay
        color={blue}
        size={[0.2, 0.025, 0.02]}
        position={[0.04, -0.065, 0]}
        rotation={[0, 0, -0.6]}
      />
      <Clay
        color={blue}
        size={[0.16, 0.025, 0.02]}
        position={[-0.095, -0.045, 0]}
        rotation={[0, 0, 1.3]}
      />
      <Clay
        shape="sphere"
        color={mint}
        size={0.08}
        position={[-0.1, -0.07, 0.006]}
      />
      <Clay
        shape="sphere"
        color={purple}
        size={0.085}
        position={[0.1, 0.055, 0.006]}
      />
      <Clay
        shape="sphere"
        color={rose}
        size={0.065}
        position={[0.125, -0.13, 0.006]}
      />
      <Clay
        shape="sphere"
        color="#f0cf8d"
        size={0.06}
        position={[-0.12, 0.04, 0.006]}
      />
      <Clay
        shape="sphere"
        color={ivory}
        size={0.065}
        position={[-0.02, -0.015, 0.01]}
      />
    </group>
  )
}

export function Monitor(props: GroupProps) {
  return (
    <group {...props} name="lab-monitor">
      <Clay color={blue} size={[0.34, 0.04, 0.25]} position={[0, 0.02, 0]} />
      <Clay
        color={blue}
        size={[0.08, 0.17, 0.07]}
        position={[0, 0.11, -0.025]}
      />
      <group position={[0, 0.38, 0]} rotation={[-0.07, 0, 0]}>
        <Clay color={ivory} size={[0.6, 0.4, 0.075]} />
        <Clay
          color={dark}
          size={[0.54, 0.33, 0.02]}
          position={[0, 0.014, 0.047]}
        />
        <group position={[-0.075, 0.015, 0.065]} scale={0.82}>
          <Molecule />
        </group>
        {[0, 1, 2, 3].map((i) => (
          <Clay
            key={i}
            color={mint}
            size={[0.025, 0.045 + i * 0.028, 0.009]}
            position={[0.125 + i * 0.032, -0.07 + i * 0.014, 0.065]}
          />
        ))}
        <Clay
          shape="sphere"
          color={mint}
          size={0.018}
          position={[0.24, -0.18, 0.04]}
        />
      </group>
    </group>
  )
}

export function ServerRack(props: GroupProps) {
  const leds = useRef<(Group | null)[]>([])
  useFrame(({ clock }) => {
    for (let i = 0; i < leds.current.length; i++) {
      const led = leds.current[i]
      if (led)
        led.scale.setScalar(
          0.55 +
            Math.max(0, Math.sin(clock.elapsedTime * (2 + i * 0.19) + i * 2)) *
              0.45,
        )
    }
  })
  return (
    <group {...props} name="server-rack">
      <Clay color={blue} size={[0.65, 1.22, 0.55]} position={[0, 0.63, 0]} />
      <Clay color={dark} size={[0.56, 1.1, 0.05]} position={[0, 0.63, 0.285]} />
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 0.22 + i * 0.2, 0.32]}>
          <Clay color="#bbcbdc" size={[0.5, 0.16, 0.045]} />
          {[-0.15, -0.095, -0.04].map((x) => (
            <Clay
              key={x}
              color={dark}
              size={[0.022, 0.072, 0.01]}
              position={[x, 0, 0.03]}
            />
          ))}
          <Clay
            color={dark}
            size={[0.1, 0.025, 0.01]}
            position={[0.1, 0.025, 0.03]}
          />
          <group
            ref={(node) => {
              leds.current[i] = node
            }}
            userData={{ live: true }}
            position={[0.195, -0.025, 0.035]}
          >
            <Clay
              shape="sphere"
              color={i % 2 ? '#f0cc83' : '#8ae0bd'}
              size={0.035}
            />
          </group>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <Clay
          key={s}
          color={dark}
          size={[0.1, 0.08, 0.48]}
          position={[s * 0.23, 0.04, 0]}
        />
      ))}
    </group>
  )
}

export function Whiteboard(props: GroupProps) {
  return (
    <group {...props} name="whiteboard">
      {[-1, 1].map((s) => (
        <group key={s}>
          <Clay
            shape="cylinder"
            color={blue}
            size={[0.055, 1.32, 0.055]}
            position={[s * 0.51, 0.67, -0.025]}
          />
          <Clay
            color={blue}
            size={[0.14, 0.065, 0.46]}
            position={[s * 0.51, 0.033, 0]}
          />
        </group>
      ))}
      <Clay color={blue} size={[1.28, 0.81, 0.08]} position={[0, 1.01, 0]} />
      <Clay
        color={ivory}
        size={[1.2, 0.73, 0.025]}
        position={[0, 1.01, 0.05]}
      />
      <group position={[-0.26, 1.09, 0.077]}>
        <Molecule size={1.45} />
      </group>
      <group position={[0.14, 0.92, 0.077]}>
        <Clay color={blue} size={[0.025, 0.27, 0.008]} />
        <Clay
          color={blue}
          size={[0.36, 0.025, 0.008]}
          position={[0.17, -0.13, 0]}
        />
        {[0, 1, 2, 3].map((i) => (
          <Clay
            key={i}
            color={rose}
            size={[0.1, 0.021, 0.012]}
            position={[0.06 + i * 0.076, -0.09 + i * 0.065, 0]}
            rotation={[0, 0, 0.65]}
          />
        ))}
      </group>
      {[0.19, 0.13].map((y, i) => (
        <Clay
          key={y}
          color={i ? blue : purple}
          size={[i ? 0.27 : 0.41, 0.02, 0.008]}
          position={[0.22, 1.01 + y, 0.077]}
        />
      ))}
      <Clay
        color={blue}
        size={[1.07, 0.035, 0.15]}
        position={[0, 0.615, 0.075]}
      />
      {[rose, dark, mint].map((color, i) => (
        <Clay
          key={color}
          shape="cylinder"
          color={color}
          size={[0.025, 0.12, 0.025]}
          position={[0.18 + i * 0.16, 0.65, 0.09]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
    </group>
  )
}

export function Plant(props: GroupProps) {
  return (
    <group {...props} name="lab-plant">
      <Clay
        shape="cylinder"
        color="#d8ad98"
        size={[0.25, 0.26, 0.25]}
        position={[0, 0.13, 0]}
      />
      <Clay
        shape="cylinder"
        color="#e6c0aa"
        size={[0.3, 0.055, 0.3]}
        position={[0, 0.25, 0]}
      />
      <Clay
        shape="cylinder"
        color="#7b6357"
        size={[0.255, 0.015, 0.255]}
        position={[0, 0.278, 0]}
      />
      <Clay
        shape="cylinder"
        color="#6a9a80"
        size={[0.035, 0.45, 0.035]}
        position={[0, 0.47, 0]}
      />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Clay
            shape="sphere"
            color={mint}
            size={[0.22, 0.12, 0.14]}
            position={[s * 0.08, 0.43, 0.035]}
            rotation={[0, s * 0.5, s * 0.5]}
          />
          <Clay
            shape="sphere"
            color="#78ae94"
            size={[0.21, 0.115, 0.14]}
            position={[s * 0.075, 0.58, -0.015]}
            rotation={[0, s * -0.6, s * 0.7]}
          />
        </group>
      ))}
      <Clay
        shape="sphere"
        color={mint}
        size={[0.12, 0.21, 0.12]}
        position={[0.02, 0.69, 0]}
        rotation={[0, 0, -0.15]}
      />
    </group>
  )
}

export function Stool(props: GroupProps) {
  return (
    <group {...props} name="lab-stool">
      <Clay
        shape="cylinder"
        color={blue}
        size={[0.06, 0.4, 0.06]}
        position={[0, 0.23, 0]}
      />
      <Clay
        shape="cylinder"
        color={purple}
        size={[0.38, 0.105, 0.38]}
        position={[0, 0.48, 0]}
      />
      <Clay
        shape="torus"
        color={blue}
        size={[0.28, 0.28, 0.34]}
        position={[0, 0.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
          <Clay
            color={blue}
            size={[0.06, 0.055, 0.23]}
            position={[0, 0.04, 0.09]}
          />
          <Clay
            shape="sphere"
            color={dark}
            size={[0.09, 0.07, 0.09]}
            position={[0, 0.035, 0.19]}
          />
        </group>
      ))}
    </group>
  )
}

export { Microscope, Flasks, type FlasksProps } from './lab-instruments'
