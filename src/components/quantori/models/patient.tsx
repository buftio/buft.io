'use client'

import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type { Group } from 'three'
import { Clay, palette, type GroupProps } from '../../marketdata/models/clay'

export type PatientProps = GroupProps & {
  pose: 'stand' | 'dance' | 'recline' | 'scared'
  hurt?: RefObject<number>
}

const gown = '#9fc7e0'
const skin = '#e9bd9c'

export function Patient({ pose, hurt, ...props }: PatientProps) {
  const root = useRef<Group>(null)
  const breathing = useRef<Group>(null)
  const head = useRef<Group>(null)
  const arms = useRef<(Group | null)[]>([])
  const sweat = useRef<Group>(null)
  const scared = pose === 'scared'
  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const since = hurt ? t - hurt.current : 10
    const shiver =
      (since >= 0 && since < 0.5
        ? Math.sin(since * 60) * 0.06 * (1 - since / 0.5)
        : 0) + (scared ? Math.sin(t * 47) * 0.012 : 0)
    const k = 1 - Math.exp(-dt * 8)
    if (root.current) {
      root.current.position.x = shiver
      root.current.position.z = scared ? Math.sin(t * 39 + 1) * 0.008 : 0
      root.current.rotation.z = scared ? Math.sin(t * 31) * 0.03 : 0
      root.current.position.y =
        pose === 'dance' ? Math.abs(Math.sin(t * 5)) * 0.2 : 0
      root.current.rotation.y = pose === 'dance' ? t * 3 : 0
    }
    if (breathing.current)
      breathing.current.scale.y = 1 + Math.sin(t * 2.2) * 0.012
    if (head.current) {
      const look = scared
        ? Math.sign(Math.sin(t * 2.3) + Math.sin(t * 3.7) * 0.6) * 0.55
        : pose === 'stand'
          ? Math.sin(t * 0.9) * 0.27
          : 0
      head.current.rotation.y +=
        (look - head.current.rotation.y) * (scared ? 1 - Math.exp(-dt * 16) : k)
      head.current.rotation.z =
        Math.sin(t * 1.6) * (pose === 'dance' ? 0.1 : 0.025)
      head.current.rotation.x +=
        ((scared ? -0.45 : 0) - head.current.rotation.x) * k
    }
    for (let i = 0; i < arms.current.length; i++) {
      const arm = arms.current[i]
      if (!arm) continue
      const side = i === 0 ? -1 : 1
      arm.rotation.z +=
        ((pose === 'dance'
          ? side * (2.1 + Math.sin(t * 5 + i) * 0.2)
          : scared
            ? -side * 0.05
            : side * 0.15) -
          arm.rotation.z) *
        k
      arm.rotation.x +=
        ((pose === 'recline'
          ? -0.25
          : scared
            ? -2.55 + Math.sin(t * 40 + i * 2) * 0.05
            : Math.sin(t * 2) * 0.03) -
          arm.rotation.x) *
        k
    }
    if (sweat.current) {
      const p = (t * 0.7) % 1
      sweat.current.position.y = 0.1 - p * 0.18
      sweat.current.scale.setScalar(Math.max(0.0001, Math.sin(p * Math.PI)))
    }
  })
  const sick = pose === 'recline'
  return (
    <group {...props}>
      <group ref={root} name="patient">
        {sick && (
          <group name="patient-pillow" position={[0, 0.065, -0.8]}>
            <Clay color="#fcfaf3" size={[0.62, 0.14, 0.4]} />
            <Clay
              color="#d6e3ee"
              size={[0.57, 0.025, 0.35]}
              position={[0, -0.05, 0]}
            />
          </group>
        )}
        <group
          ref={breathing}
          name="patient-body"
          position={sick ? [0, 0.21, 0.11] : [0, 0, 0]}
          rotation={sick ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}
        >
          {[-1, 1].map((s) => (
            <group
              key={s}
              name={`patient-leg-${s}`}
              position={[s * 0.1, 0.24, 0]}
            >
              <Clay
                shape="cylinder"
                color={skin}
                size={[0.12, 0.26, 0.12]}
                position={[0, -0.09, 0]}
              />
              <Clay
                shape="cylinder"
                color="#f6f4ec"
                size={[0.13, 0.1, 0.14]}
                position={[0, -0.165, 0]}
              />
              <Clay
                shape="sphere"
                color="#7e9bb8"
                size={[0.18, 0.09, 0.24]}
                position={[0, -0.195, 0.045]}
              />
            </group>
          ))}
          <Clay
            shape="sphere"
            color={gown}
            size={[0.46, 0.54, 0.36]}
            position={[0, 0.5, 0]}
          />
          <Clay color={gown} size={[0.4, 0.21, 0.3]} position={[0, 0.34, 0]} />
          <Clay
            shape="smile"
            color="#e9f5fa"
            size={[0.14, 0.12, 0.17]}
            position={[0, 0.719, 0.13]}
            rotation={[0, 0, Math.PI]}
          />
          <Clay
            color="#d5e8f3"
            size={[0.017, 0.38, 0.012]}
            position={[0.035, 0.49, 0.177]}
          />
          {[-0.12, 0, 0.12].map((x) =>
            [-0.1, 0, 0.1].map((y) => (
              <Clay
                key={`${x}:${y}`}
                shape="sphere"
                color="#78a8c8"
                size={[0.025, 0.026, 0.012]}
                position={[x, 0.48 + y, 0.178 - Math.abs(x) * 0.12]}
              />
            )),
          )}
          <Clay
            shape="sphere"
            color={skin}
            size={[0.13, 0.12, 0.13]}
            position={[0, 0.75, 0]}
          />
          <group ref={head} name="patient-head" position={[0, 0.93, 0]}>
            <Clay shape="sphere" color={skin} size={[0.38, 0.4, 0.35]} />
            <Clay
              shape="sphere"
              color="#75503f"
              size={[0.39, 0.26, 0.34]}
              position={[0, 0.1, -0.045]}
            />
            <Clay
              shape="sphere"
              color="#75503f"
              size={[0.24, 0.105, 0.14]}
              position={[-0.045, 0.14, 0.1]}
              rotation={[0, 0, -0.2]}
            />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Clay
                  shape="sphere"
                  color={skin}
                  size={[0.075, 0.1, 0.07]}
                  position={[s * 0.18, -0.01, 0]}
                />
                <Clay
                  shape={sick ? 'smile' : 'sphere'}
                  color={palette.ink}
                  size={
                    sick
                      ? [0.065, 0.032, 0.06]
                      : scared
                        ? [0.048, 0.064, 0.03]
                        : [0.036, 0.046, 0.026]
                  }
                  position={[s * 0.078, 0.017, 0.168]}
                  rotation={[0, 0, sick ? Math.PI : 0]}
                />
                <Clay
                  shape="sphere"
                  color={sick ? '#e59b98' : '#e6a594'}
                  size={[0.074, 0.04, 0.026]}
                  position={[s * 0.12, -0.045, 0.14]}
                />
                <Clay
                  color="#785548"
                  size={[0.065, 0.017, 0.022]}
                  position={[s * 0.082, scared ? 0.095 : 0.075, 0.16]}
                  rotation={[0, 0, s * (sick || scared ? -0.3 : 0.18)]}
                />
              </group>
            ))}
            <Clay
              shape="sphere"
              color={skin}
              size={[0.05, 0.065, 0.07]}
              position={[0, -0.015, 0.18]}
            />
            {scared ? (
              <Clay
                shape="sphere"
                color="#5a3a32"
                size={[0.05, 0.07, 0.03]}
                position={[0, -0.09, 0.165]}
              />
            ) : (
              <Clay
                shape="smile"
                color="#98695a"
                size={0.075}
                position={[0, -0.08, 0.16]}
                rotation={[0, 0, sick ? 0 : Math.PI]}
              />
            )}
            {scared && (
              <group ref={sweat} position={[0.15, 0.1, 0.13]}>
                <Clay
                  shape="sphere"
                  color="#bfe6ff"
                  size={[0.045, 0.065, 0.04]}
                />
              </group>
            )}
            {sick && (
              <group
                name="patient-thermometer"
                position={[0.075, -0.08, 0.19]}
                rotation={[0, 0, -1.2]}
              >
                <Clay
                  shape="cylinder"
                  color="#f8faf5"
                  size={[0.025, 0.17, 0.025]}
                />
                <Clay
                  shape="sphere"
                  color="#e68d9c"
                  size={0.037}
                  position={[0, 0.08, 0]}
                />
              </group>
            )}
          </group>
          {[-1, 1].map((s, i) => (
            <group
              key={s}
              ref={(node) => {
                arms.current[i] = node
              }}
              name={`patient-arm-${i}`}
              position={[s * 0.23, 0.69, 0]}
              rotation={[0, 0, s * 0.15]}
            >
              <Clay
                shape="sphere"
                color={gown}
                size={[0.155, 0.18, 0.16]}
                position={[0, -0.04, 0]}
              />
              <Clay
                shape="sphere"
                color={skin}
                size={[0.105, 0.25, 0.11]}
                position={[0, -0.2, 0]}
              />
              <group name={`patient-hand-${i}`} position={[0, -0.31, 0]}>
                <Clay shape="sphere" color={skin} size={0.11} />
                {i === 1 && (
                  <Clay
                    shape="cylinder"
                    color="#faf8ef"
                    size={[0.115, 0.035, 0.12]}
                    position={[0, 0.075, 0]}
                  />
                )}
              </group>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}
