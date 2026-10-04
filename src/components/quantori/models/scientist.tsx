'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group } from 'three'
import { Clay, palette, type GroupProps } from '../../marketdata/models/clay'

export type ScientistProps = GroupProps & {
  variant?: number
  action?: 'think' | 'write' | 'peer' | 'cheer'
}

const looks = [
  { skin: '#f2c7a8', hair: '#5c3e32', shirt: '#91bdb9' },
  { skin: '#9c6349', hair: '#332c35', shirt: '#c9a4ce' },
  { skin: '#ecc2a1', hair: '#b88148', shirt: '#91afd7' },
  { skin: '#684737', hair: '#302a2a', shirt: '#e5b779' },
  { skin: '#d79b78', hair: '#ded6c9', shirt: '#9fb7dc' },
  { skin: '#f4d6c3', hair: '#a4573e', shirt: '#c6b0d8' },
]
const coat = '#fff9ef'

function blend(
  group: Group | null,
  x: number,
  y: number,
  z: number,
  k: number,
) {
  if (!group) return
  group.rotation.x += (x - group.rotation.x) * k
  group.rotation.y += (y - group.rotation.y) * k
  group.rotation.z += (z - group.rotation.z) * k
}

function Arm({
  side,
  skin,
  shoulder,
  elbow,
  tool,
}: {
  side: -1 | 1
  skin: string
  shoulder: RefObject<Group | null>
  elbow: RefObject<Group | null>
  tool: RefObject<Group | null>
}) {
  const label = side === -1 ? 'left' : 'right'
  return (
    <group
      ref={shoulder}
      name={`scientist-arm-${label}`}
      position={[side * 0.225, 0.7, 0]}
    >
      <Clay
        shape="sphere"
        color={coat}
        size={[0.14, 0.22, 0.15]}
        position={[0, -0.08, 0]}
      />
      <group
        ref={elbow}
        name={`scientist-forearm-${label}`}
        position={[0, -0.17, 0]}
      >
        <Clay
          shape="sphere"
          color={coat}
          size={[0.125, 0.2, 0.135]}
          position={[0, -0.07, 0]}
        />
        <Clay
          shape="cylinder"
          color="#dbe4e9"
          size={[0.125, 0.035, 0.13]}
          position={[0, -0.14, 0]}
        />
        <group name={`scientist-hand-${label}`} position={[0, -0.18, 0]}>
          <Clay shape="sphere" color={skin} size={0.11} />
          <group
            ref={tool}
            name={side === -1 ? 'scientist-clipboard' : 'scientist-pencil'}
            scale={0}
          >
            {side === -1 ? (
              <group position={[0, -0.015, 0.035]} rotation={[-0.25, 0, 0]}>
                <Clay color="#b98e69" size={[0.24, 0.29, 0.035]} />
                <Clay
                  color={coat}
                  size={[0.205, 0.245, 0.012]}
                  position={[0, -0.007, 0.025]}
                />
                <Clay
                  color="#8d9cab"
                  size={[0.075, 0.035, 0.02]}
                  position={[0, 0.135, 0.028]}
                />
                {[-0.055, 0, 0.055].map((y) => (
                  <Clay
                    key={y}
                    color="#94b3c8"
                    size={[0.12, 0.009, 0.008]}
                    position={[0, y, 0.034]}
                  />
                ))}
              </group>
            ) : (
              <group rotation={[0.3, 0, -0.45]}>
                <Clay
                  shape="cylinder"
                  color="#e5b779"
                  size={[0.022, 0.2, 0.022]}
                />
                <Clay
                  shape="cone"
                  color={palette.ink}
                  size={[0.022, 0.035, 0.022]}
                  position={[0, -0.115, 0]}
                  rotation={[0, 0, Math.PI]}
                />
              </group>
            )}
          </group>
        </group>
      </group>
    </group>
  )
}

function Hair({ style, color }: { style: number; color: string }) {
  return (
    <group name="scientist-hair">
      <Clay
        shape="sphere"
        color={color}
        size={[0.39, 0.27, 0.36]}
        position={[0, 0.09, -0.035]}
      />
      {style === 0 && (
        <Clay
          shape="sphere"
          color={color}
          size={[0.27, 0.105, 0.2]}
          position={[-0.07, 0.135, 0.095]}
          rotation={[0, 0, -0.2]}
        />
      )}
      {style === 1 && (
        <>
          <Clay
            shape="sphere"
            color={color}
            size={0.19}
            position={[0, 0.24, -0.07]}
          />
          <Clay
            shape="sphere"
            color={color}
            size={[0.12, 0.24, 0.16]}
            position={[-0.165, 0, -0.055]}
          />
        </>
      )}
      {style === 2 &&
        [-1, 1].map((s) => (
          <Clay
            key={s}
            shape="sphere"
            color={color}
            size={[0.1, 0.33, 0.23]}
            position={[s * 0.16, -0.015, -0.04]}
          />
        ))}
      {style === 3 &&
        [-1, 0, 1].map((s) => (
          <Clay
            key={s}
            shape="sphere"
            color={color}
            size={0.17}
            position={[s * 0.115, 0.17 + (s === 0 ? 0.03 : 0), 0.035]}
          />
        ))}
      {style === 4 &&
        [-1, 1].map((s) => (
          <Clay
            key={s}
            shape="sphere"
            color={color}
            size={[0.11, 0.19, 0.19]}
            position={[s * 0.16, 0.025, -0.045]}
          />
        ))}
      {style === 5 && (
        <>
          <Clay
            shape="sphere"
            color={color}
            size={[0.26, 0.14, 0.19]}
            position={[0.035, 0.15, 0.09]}
          />
          <Clay
            shape="sphere"
            color={color}
            size={[0.16, 0.28, 0.18]}
            position={[0.1, -0.02, -0.19]}
          />
        </>
      )}
    </group>
  )
}

export function Scientist({
  variant = 0,
  action = 'think',
  ...props
}: ScientistProps) {
  const index =
    ((Math.floor(variant) % looks.length) + looks.length) % looks.length
  const look = looks[index]
  const root = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const head = useRef<Group>(null)
  const left = useRef<Group>(null)
  const right = useRef<Group>(null)
  const elbowL = useRef<Group>(null)
  const elbowR = useRef<Group>(null)
  const clipboard = useRef<Group>(null)
  const pencil = useRef<Group>(null)
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + variant * 1.73
    const k = 1 - Math.exp(-dt * 8)
    const sway = Math.sin(t * 1.5)
    const scratch = Math.pow(Math.max(0, Math.sin(t * 0.63)), 12)
    const glance = Math.pow(Math.max(0, Math.sin(t * 0.7)), 8)
    const writing = action === 'write'
    const cheering = action === 'cheer'
    blend(torso.current, action === 'peer' ? 0.24 : 0, 0, sway * 0.035, k)
    blend(
      head.current,
      writing ? 0.25 - glance * 0.4 : action === 'peer' ? -0.1 : -0.06,
      writing ? glance * 0.35 : Math.sin(t * 0.6) * 0.14,
      cheering ? sway * 0.08 : sway * 0.07,
      k,
    )
    blend(
      left.current,
      writing ? -0.9 : action === 'peer' ? 0.2 : cheering ? -0.2 : -0.1,
      0,
      cheering
        ? -2.65 + sway * 0.15
        : writing
          ? 0.3
          : action === 'peer'
            ? 0.2
            : -0.16,
      k,
    )
    blend(
      elbowL.current,
      writing ? -0.95 : action === 'peer' ? -1.2 : -0.15,
      0,
      0,
      k,
    )
    blend(
      right.current,
      writing
        ? -0.95 + Math.sin(t * 9) * 0.045
        : cheering
          ? -0.25
          : action === 'peer'
            ? -2
            : -1.4 - scratch * 1.6,
      writing ? -0.35 : 0,
      cheering
        ? 2.65 + Math.sin(t * 2.8) * 0.15
        : writing
          ? -0.5
          : action === 'peer'
            ? -0.4
            : -0.9 + scratch * 0.7,
      k,
    )
    blend(
      elbowR.current,
      writing
        ? -1.2 + Math.sin(t * 9) * 0.08
        : cheering
          ? -0.15
          : action === 'peer'
            ? -0.9 + Math.sin(t * 3) * 0.05
            : -1.2 + scratch * 1.1 + Math.sin(t * 14) * scratch * 0.06,
      0,
      0,
      k,
    )
    if (root.current) {
      root.current.position.y +=
        ((cheering ? Math.abs(Math.sin(t * 5)) * 0.12 : 0) -
          root.current.position.y) *
        k
      root.current.position.x += (sway * 0.016 - root.current.position.x) * k
    }
    const target = writing ? 1 : 0
    if (clipboard.current)
      clipboard.current.scale.setScalar(
        clipboard.current.scale.x + (target - clipboard.current.scale.x) * k,
      )
    if (pencil.current)
      pencil.current.scale.setScalar(
        pencil.current.scale.x + (target - pencil.current.scale.x) * k,
      )
  })
  return (
    <group {...props}>
      <group ref={root} name="scientist">
        {[-1, 1].map((side) => (
          <group
            key={side}
            name={`scientist-leg-${side === -1 ? 'left' : 'right'}`}
            position={[side * 0.1, 0.23, 0]}
          >
            <Clay
              shape="cylinder"
              color="#738399"
              size={[0.14, 0.29, 0.15]}
              position={[0, -0.1, 0]}
            />
            <Clay
              shape="sphere"
              color="#455567"
              size={[0.18, 0.09, 0.24]}
              position={[0, -0.185, 0.045]}
            />
          </group>
        ))}
        <group ref={torso} name="scientist-torso" position={[0, 0.27, 0]}>
          <Clay
            shape="sphere"
            color={coat}
            size={[0.47, 0.55, 0.35]}
            position={[0, 0.22, 0]}
          />
          <Clay
            color={look.shirt}
            size={[0.14, 0.32, 0.05]}
            position={[0, 0.3, 0.16]}
          />
          {[-1, 1].map((s) => (
            <group key={s}>
              <Clay
                color={coat}
                size={[0.095, 0.2, 0.05]}
                position={[s * 0.093, 0.34, 0.185]}
                rotation={[0, 0, s * -0.2]}
              />
              <Clay
                color="#e4ebed"
                size={[0.105, 0.11, 0.025]}
                position={[s * 0.13, 0.13, 0.155]}
              />
            </group>
          ))}
          <Clay
            color="#7faeb9"
            size={[0.065, 0.055, 0.016]}
            position={[-0.135, 0.315, 0.179]}
          />
          <Clay
            shape="sphere"
            color={look.skin}
            size={[0.14, 0.15, 0.14]}
            position={[0, 0.47, 0]}
          />
          <group ref={head} name="scientist-head" position={[0, 0.65, 0]}>
            <Clay shape="sphere" color={look.skin} size={[0.38, 0.39, 0.36]} />
            <Hair style={index} color={look.hair} />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Clay
                  shape="sphere"
                  color={look.skin}
                  size={[0.09, 0.115, 0.075]}
                  position={[s * 0.18, -0.015, 0]}
                />
                <Clay
                  shape="torus"
                  color="#556675"
                  size={[0.135, 0.13, 0.16]}
                  position={[s * 0.078, 0.02, 0.175]}
                />
                <Clay
                  shape="sphere"
                  color={palette.ink}
                  size={[0.035, 0.045, 0.025]}
                  position={[s * 0.078, 0.023, 0.18]}
                />
                <Clay
                  shape="sphere"
                  color="#e3a193"
                  size={[0.065, 0.035, 0.026]}
                  position={[s * 0.115, -0.05, 0.15]}
                />
              </group>
            ))}
            <Clay
              color="#556675"
              size={[0.048, 0.014, 0.025]}
              position={[0, 0.02, 0.184]}
            />
            <Clay
              shape="sphere"
              color={look.skin}
              size={[0.055, 0.065, 0.075]}
              position={[0, -0.014, 0.19]}
            />
            <Clay
              shape="smile"
              color="#805b55"
              size={0.08}
              position={[0, -0.08, 0.166]}
              rotation={[0, 0, Math.PI]}
            />
          </group>
          <group position={[0, -0.27, 0]}>
            <Arm
              side={-1}
              skin={look.skin}
              shoulder={left}
              elbow={elbowL}
              tool={clipboard}
            />
            <Arm
              side={1}
              skin={look.skin}
              shoulder={right}
              elbow={elbowR}
              tool={pencil}
            />
          </group>
        </group>
      </group>
    </group>
  )
}
