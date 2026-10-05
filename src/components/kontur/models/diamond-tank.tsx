'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { InstancedMesh, Object3D, type Group } from 'three'
import { ROCKET } from '../factory'
import { itemGeometry } from './items'
import { Bake, Clay, itemMaterial, type ModelProps } from './kit'

const capacity = 1000
const panels = [
  [0, 1.24, 0.4, 0.96, 1.96, 0.025],
  [0, 1.24, -0.4, 0.96, 1.96, 0.025],
  [-0.48, 1.24, 0, 0.025, 1.96, 0.8],
  [0.48, 1.24, 0, 0.025, 1.96, 0.8],
]

export function DiamondTank({
  game,
  launched,
}: ModelProps & { launched: boolean }) {
  const gems = useRef<InstancedMesh>(null)
  const glass = useRef<(Group | null)[]>([])
  const state = useRef({
    count: -1,
    born: new Float64Array(capacity).fill(-10),
    dummy: new Object3D(),
  })
  useEffect(() => {
    const mesh = gems.current
    return () => mesh?.dispose()
  }, [])
  useFrame(() => {
    const mesh = gems.current
    const g = game.current
    const age = Math.max(0, g.time - g.at.launched)
    if (mesh) {
      const count = launched
        ? 0
        : Math.min(
            capacity,
            Math.ceil(Math.max(0, g.rocket / ROCKET) * capacity),
          )
      const s = state.current
      if (s.count >= 0 && count > s.count)
        for (let i = s.count; i < count; i++)
          s.born[i] = g.time + (i - s.count) * 0.014
      for (let i = 0; i < count; i++) {
        const layer = Math.floor(i / 56)
        const slot = (i * 23) % 56
        const x = ((slot % 8) - 3.5) * 0.108 + Math.sin(i * 9.1) * 0.018
        const z = (Math.floor(slot / 8) - 3) * 0.105 + Math.cos(i * 4.7) * 0.018
        const mound = Math.max(0, 1 - Math.hypot(x / 0.45, z / 0.38)) * 0.065
        const settled = 0.28 + layer * 0.101 + mound + Math.sin(i * 3.7) * 0.018
        const t = Math.max(0, g.time - s.born[i])
        const drop = Math.max(0, 2.34 - settled - 4.5 * t * t)
        const landed = t - Math.sqrt((2.34 - settled) / 4.5)
        const bounce =
          landed > 0 && landed < 0.23
            ? Math.sin((landed / 0.23) * Math.PI) * 0.035
            : 0
        s.dummy.position.set(x, settled + drop + bounce, z)
        s.dummy.rotation.set(
          Math.sin(i * 2.1) * 0.3,
          i * 2.4 + (drop > 0 ? t * 3 : 0),
          Math.cos(i * 1.9) * 0.28,
        )
        s.dummy.scale.setScalar(
          g.time < s.born[i] ? 0.0001 : 0.24 + (Math.sin(i * 5.3) + 1) * 0.012,
        )
        s.dummy.updateMatrix()
        mesh.setMatrixAt(i, s.dummy.matrix)
      }
      mesh.count = count
      mesh.instanceMatrix.needsUpdate = true
      s.count = count
    }
    glass.current.forEach((panel, i) => {
      if (!panel) return
      const [x, y, z] = panels[i]
      const t = launched ? Math.min(1, age) : 0
      panel.visible = !launched || age < 1
      panel.position.set(
        x * (1 - t * 0.8) + (i === 2 ? -1 : i === 3 ? 1 : 0) * t * 0.1,
        Math.max(0.14, y + t * 0.55 - t * t * 2),
        z * (1 - t) + (i === 0 ? 1 : i === 1 ? -1 : 0) * t * 0.1,
      )
      panel.rotation.set(
        (i < 2 ? (i === 0 ? 1 : -1) : 0) * t * 1.4,
        t * 0.2,
        (i > 1 ? (i === 2 ? 1 : -1) : 0) * t * 1.4,
      )
      panel.scale.setScalar(1 - t * 0.85)
    })
  })
  return (
    <group name="diamond-tank" position={[0.69, 0, 0.78]}>
      <Bake>
        <Clay
          color="#638f97"
          size={[1.04, 0.14, 0.88]}
          position={[0, 0.2, 0]}
        />
        <Clay
          color="#bfe3ec"
          size={[0.93, 0.025, 0.77]}
          position={[0, 0.28, 0]}
        />
      </Bake>
      <instancedMesh
        ref={gems}
        args={[itemGeometry('diamond'), itemMaterial, capacity]}
        castShadow
        receiveShadow
        frustumCulled={false}
        dispose={null}
      />
      {panels.map(([x, y, z, w, h, d], i) => (
        <group
          key={i}
          ref={(node) => {
            glass.current[i] = node
          }}
          position={[x, y, z]}
        >
          <Bake>
            {[-1, 1].map((side) => (
              <group key={side}>
                <Clay
                  color="#9ebdb6"
                  size={[w, 0.045, d]}
                  position={[0, (side * h) / 2, 0]}
                />
                <Clay
                  color="#9ebdb6"
                  size={[0.035, h, 0.035]}
                  position={[
                    i < 2 ? (side * w) / 2 : 0,
                    0,
                    i < 2 ? 0 : (side * d) / 2,
                  ]}
                />
              </group>
            ))}
            {i === 0 &&
              Array.from({ length: 9 }, (_, j) => (
                <Clay
                  key={j}
                  color="#fff3d6"
                  size={[j % 2 ? 0.09 : 0.16, 0.025, 0.026]}
                  position={[-0.36, -0.82 + j * 0.2, 0.023]}
                />
              ))}
          </Bake>
          <mesh scale={[w, h, d]}>
            <boxGeometry />
            <meshStandardMaterial
              color="#bce6df"
              transparent
              opacity={0.15}
              roughness={0.22}
              metalness={0.08}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
