'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { Group } from 'three'
import { ROCKET } from '../factory'
import { DiamondTank } from './diamond-tank'
import {
  Bake,
  Clay,
  Goods,
  Plinth,
  Slim,
  palette,
  type ModelProps,
} from './kit'

export function RocketSite({
  game,
  stage,
}: ModelProps & { stage: 'plot' | 'factory' | 'launched' }) {
  const rocket = useRef<Group>(null),
    nose = useRef<Group>(null),
    flame = useRef<Group>(null),
    sparks = useRef<Group>(null),
    scorch = useRef<Group>(null)
  const segments = useRef<(Group | null)[]>([]),
    slots = useRef<(Group | null)[]>([]),
    smoke = useRef<(Group | null)[]>([]),
    arms = useRef<(Group | null)[]>([])
  useFrame(() => {
    const g = game.current,
      age = g.time - g.at.launched,
      launch = stage === 'launched',
      p = Math.max(0, Math.min(1, g.rocket / ROCKET))
    slots.current.forEach((slot, i) => {
      if (slot) slot.visible = g.rocket > i
    })
    segments.current.forEach((segment, i) => {
      if (segment) segment.visible = launch || p > i / 6
    })
    if (nose.current) nose.current.visible = launch || p >= 0.95
    if (rocket.current) {
      rocket.current.visible = !launch || age < 4
      rocket.current.position.y =
        0.26 +
        (launch && age >= 0 && age < 4 ? Math.max(0, age - 0.15) ** 2 * 2 : 0)
      rocket.current.rotation.z =
        launch && age < 0.6 ? Math.sin(g.time * 60) * 0.012 : 0
    }
    if (flame.current) {
      flame.current.visible = launch && age >= 0 && age < 4
      flame.current.scale.set(1, 0.8 + Math.sin(g.time * 40) * 0.2, 1)
    }
    if (sparks.current) {
      sparks.current.visible =
        stage === 'factory' && p > 0 && p < 1 && Math.sin(g.time * 17) > 0.05
      sparks.current.position.y = 0.5 + Math.min(5, Math.floor(p * 6)) * 0.3
      sparks.current.rotation.z = g.time * 3
    }
    arms.current.forEach((arm, i) => {
      if (arm)
        arm.rotation.y =
          (launch ? Math.min(1, Math.max(0, age) * 2) : 0) *
          (i % 2 ? 1 : -1) *
          1.3
    })
    smoke.current.forEach((puff, i) => {
      if (!puff) return
      puff.visible = launch && age >= 0 && age < 4.5
      const t = Math.max(0, age - i * 0.12),
        a = i * 2.4
      puff.position.set(
        Math.sin(a) * Math.min(0.95, 0.35 + t * 0.33),
        0.31 + t * 0.23,
        Math.cos(a) * Math.min(0.95, 0.35 + t * 0.33),
      )
      puff.scale.setScalar(
        Math.max(
          0.001,
          (0.12 + Math.min(0.74, t * 0.5)) * (1 - Math.max(0, age - 3) / 1.5),
        ),
      )
    })
    if (scorch.current) scorch.current.visible = launch && age > 0.3
  })
  return (
    <Slim>
      <Bake>
        <Plinth size={2.8} color="#bbc9c4" />
        <Clay
          shape="cylinder"
          color="#9aa3a8"
          size={[1.9, 0.14, 1.9]}
          position={[0, 0.19, 0]}
        />
        <Clay
          shape="torus"
          color="#fff1da"
          size={1.58}
          position={[0, 0.27, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
        <group
          name="scorch"
          ref={scorch}
          userData={{ live: true }}
          position={[0, 0.273, 0]}
        >
          <Clay shape="cylinder" color="#55504c" size={[1.1, 0.012, 1.1]} />
        </group>
        {stage === 'plot' &&
          Array.from({ length: 5 }, (_, i) => {
            const a = Math.PI * 0.15 + i * Math.PI * 0.175
            const x = Math.cos(a) * 1.06,
              z = Math.sin(a) * 1.06
            return (
              <group key={i} position={[x, 0.17, z]}>
                <Clay color="#638f97" size={[0.34, 0.1, 0.34]} />
                <Clay
                  color="#bbdfe1"
                  size={[0.28, 0.02, 0.28]}
                  position={[0, 0.06, 0]}
                />
                <group
                  name={`diamond-slot-${i}`}
                  ref={(node) => {
                    slots.current[i] = node
                  }}
                  userData={{ live: true }}
                  position={[0, 0.08, 0]}
                >
                  <Goods kind="diamond" scale={0.8} />
                </group>
              </group>
            )
          })}
        {stage !== 'plot' && (
          <>
            {[-1, 1].map((s) => (
              <group key={s} position={[s * 0.88, 0.16, -0.53]}>
                <Clay
                  color={palette.teal}
                  size={[0.16, 2.62, 0.16]}
                  position={[0, 1.31, 0]}
                />
                <Clay
                  color={palette.teal}
                  size={[0.16, 2.62, 0.16]}
                  position={[0, 1.31, -0.33]}
                />
                {[0.25, 0.8, 1.35, 1.9, 2.45].map((y) => (
                  <group key={y} position={[0, y, -0.15]}>
                    <Clay color="#a4c8c3" size={[0.22, 0.1, 0.58]} />
                    <Clay
                      color={palette.teal}
                      size={[0.09, 0.62, 0.09]}
                      position={[0, 0.25, 0]}
                      rotation={[0.52, 0, 0]}
                    />
                  </group>
                ))}
                {[0.9, 1.8].map((y, i) => (
                  <group
                    ref={(node) => {
                      arms.current[(s === -1 ? 0 : 2) + i] = node
                    }}
                    userData={{ live: true }}
                    key={y}
                    position={[0, y, 0.06]}
                  >
                    <Clay
                      color="#d9a527"
                      size={[0.68, 0.1, 0.14]}
                      position={[-s * 0.31, 0, 0]}
                    />
                    <Clay
                      color={palette.teal}
                      size={[0.12, 0.22, 0.16]}
                      position={[-s * 0.6, 0, 0]}
                    />
                  </group>
                ))}
              </group>
            ))}
            <Clay
              color={palette.teal}
              size={[1.93, 0.15, 0.54]}
              position={[0, 2.87, -0.69]}
            />
            <Clay
              color={palette.mustard}
              size={[0.69, 0.32, 0.47]}
              position={[-0.93, 0.32, 0.55]}
            />
            <Clay
              color={palette.ink}
              size={[0.48, 0.15, 0.02]}
              position={[-0.93, 0.37, 0.79]}
            />
            <group
              name="rocket"
              ref={rocket}
              userData={{ live: true }}
              position={[0, 0.26, 0]}
            >
              {Array.from({ length: 6 }, (_, i) => (
                <group
                  key={i}
                  name={`segment-${i}`}
                  ref={(node) => {
                    segments.current[i] = node
                  }}
                  userData={{ live: true }}
                  position={[0, 0.2 + i * 0.3, 0]}
                >
                  <Clay
                    shape="cylinder"
                    color={i === 0 || i === 4 ? palette.terracotta : '#fff9ef'}
                    size={[0.54, 0.31, 0.54]}
                  />
                  {i === 3 && (
                    <Clay
                      shape="sphere"
                      color={palette.glass}
                      size={[0.18, 0.18, 0.035]}
                      position={[0, 0, 0.265]}
                    />
                  )}
                  {i === 0 && (
                    <>
                      {[-1, 1].map((s) => (
                        <Clay
                          key={s}
                          shape="wedge"
                          color={palette.terracotta}
                          size={[0.26, 0.43, 0.18]}
                          position={[s * 0.23, -0.17, 0]}
                          rotation={[0, s === 1 ? 0 : Math.PI, 0]}
                        />
                      ))}
                      <Clay
                        shape="cone"
                        color={palette.steel}
                        size={[0.35, 0.18, 0.35]}
                        position={[0, -0.18, 0]}
                        rotation={[0, 0, Math.PI]}
                      />
                    </>
                  )}
                </group>
              ))}
              <group
                name="nose"
                ref={nose}
                userData={{ live: true }}
                position={[0, 2.15, 0]}
              >
                <Clay
                  shape="cone"
                  color={palette.terracotta}
                  size={[0.54, 0.6, 0.54]}
                />
                <Clay
                  shape="sphere"
                  color={palette.terracotta}
                  size={0.1}
                  position={[0, 0.25, 0]}
                />
              </group>
              <group
                name="flame"
                ref={flame}
                userData={{ live: true }}
                position={[0, -0.29, 0]}
              >
                <Clay
                  shape="cone"
                  color="#f5b843"
                  size={[0.62, 0.76, 0.62]}
                  rotation={[0, 0, Math.PI]}
                />
                <Clay
                  shape="cone"
                  color="#fff0a4"
                  size={[0.3, 0.48, 0.3]}
                  position={[0, 0.08, 0.16]}
                  rotation={[0, 0, Math.PI]}
                />
                <pointLight color="#ffc056" intensity={3} distance={4} />
              </group>
            </group>
            <group
              name="sparks"
              ref={sparks}
              userData={{ live: true }}
              position={[0.28, 1, 0]}
            >
              {Array.from({ length: 6 }, (_, i) => (
                <Clay
                  key={i}
                  color={i % 2 ? '#fff5bd' : '#efb648'}
                  size={[0.035, 0.19, 0.035]}
                  position={[Math.sin(i) * 0.14, Math.cos(i) * 0.14, 0]}
                  rotation={[0, 0, -i]}
                />
              ))}
            </group>
            {Array.from({ length: 7 }, (_, i) => (
              <group
                key={i}
                ref={(node) => {
                  smoke.current[i] = node
                }}
                userData={{ live: true }}
              >
                <Clay
                  shape="sphere"
                  color={i % 2 ? '#eee7dc' : '#d8d8d3'}
                  size={[1, 0.65, 1]}
                />
              </group>
            ))}
          </>
        )}
      </Bake>
      {stage !== 'plot' && (
        <DiamondTank game={game} launched={stage === 'launched'} />
      )}
    </Slim>
  )
}
