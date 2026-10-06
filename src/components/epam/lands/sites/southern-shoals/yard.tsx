'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { C, folk, merged, part, ring, salvager } from './kit'
import type { World } from './world'

export const YARD: [number, number] = [120, 80]
const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const e = new THREE.Euler()
const q = new THREE.Quaternion()
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()

function stand() {
  const parts: THREE.BufferGeometry[] = [
    part(new THREE.CylinderGeometry(26, 30, 10, 8), C.driftD, 0, 5, 0),
    part(new THREE.CylinderGeometry(4, 5, 110, 6), C.driftD, 0, 60, 0),
    part(new THREE.ConeGeometry(9, 14, 6), C.gold, 0, 120, 0),
  ]
  for (let k = 0; k < 3; k++)
    parts.push(
      part(
        new THREE.BoxGeometry(40, 30, 34),
        C.fresh,
        -110,
        15 + k * 0,
        k * 8 - 30,
        k * 0.3,
      ),
    )
  folk(parts, -110, 30, -30, C.hat, 15)
  parts.push(part(new THREE.TorusGeometry(4, 1, 4, 10), C.gold, -105, 47, -17))
  parts.push(
    part(new THREE.BoxGeometry(64, 46, 4), C.driftL, 70, 58, -36, -0.2),
  )
  parts.push(
    part(new THREE.CylinderGeometry(2, 2, 70, 4), C.driftD, 70, 35, -38),
  )
  for (let k = 0; k < 3; k++)
    parts.push(
      part(new THREE.BoxGeometry(44, 3, 5), C.ink, 70, 70 - k * 12, -33, -0.2),
    )
  return merged(parts)
}

function beam() {
  const parts: THREE.BufferGeometry[] = [
    part(new THREE.BoxGeometry(150, 5, 6), C.driftD, 0, 0, 0),
  ]
  for (const s of [-1, 1]) {
    parts.push(
      part(new THREE.CylinderGeometry(1, 1, 40, 3), C.rope, s * 72, -20, 0),
    )
    parts.push(
      part(new THREE.CylinderGeometry(24, 18, 6, 10), C.rind, s * 72, -42, 0),
    )
  }
  const anchor = [
    part(new THREE.CylinderGeometry(3.5, 3.5, 40, 6), C.copper, 0, 20, 0),
    part(new THREE.TorusGeometry(6, 2, 4, 10), C.copper, 0, 44, 0),
    part(
      new THREE.TorusGeometry(18, 3.5, 4, 12, Math.PI),
      C.copper,
      0,
      12,
      0,
      0,
      Math.PI,
    ),
    part(new THREE.BoxGeometry(26, 4, 4), C.copper, 0, 34, 0),
  ]
  parts.push(merged(anchor).translate(-72, -38, 0))
  for (let k = 0; k < 7; k++)
    parts.push(
      ring(8, 3)
        .rotateX(Math.PI / 2 + k * 0.3)
        .translate(72 + (k % 3) * 6 - 6, -36 + k * 3.4, (k % 2) * 4),
    )
  return merged(parts)
}

const QUEUE: [number, number, string][] = [
  [-60, 100, C.glass],
  [-20, 140, C.coral],
  [30, 170, C.gold],
]

function finds() {
  const parts: THREE.BufferGeometry[] = []
  parts.push(part(new THREE.CylinderGeometry(5, 6, 22, 7), C.glass, 0, 0, 0))
  parts.push(
    part(new THREE.CylinderGeometry(2.4, 2.4, 9, 5), C.glass, 0, 15, 0),
  )
  parts.push(part(new THREE.BoxGeometry(5, 8, 3), C.sail, 0, 0, 5.2))
  return merged(parts)
}

export function Yard({ world }: { world: RefObject<World> }) {
  const shapes = useMemo(
    () => ({ stand: stand(), beam: beam(), folk: salvager(), find: finds() }),
    [],
  )
  useEffect(
    () => () => Object.values(shapes).forEach((g) => g.dispose()),
    [shapes],
  )
  const tilt = useRef<THREE.Mesh>(null)
  const line = useRef<THREE.InstancedMesh>(null)
  const held = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const w = world.current
    const L = line.current
    const H = held.current
    if (!w || !tilt.current || !L || !H) return
    const t = w.t
    const cyc = t % 9
    const tip =
      cyc < 3
        ? Math.sin(cyc * 6) * 0.18 * (1 - cyc / 3)
        : cyc < 6
          ? 0.22
          : -0.08
    tilt.current.rotation.z += (tip - tilt.current.rotation.z) * 0.08
    const gone = Math.min(1, w.board * 2)
    QUEUE.forEach(([x, z], i) => {
      const hop = Math.abs(Math.sin(t * 3 + i * 1.7)) * (i === 0 ? 7 : 2)
      const s = 1 - gone
      e.set(0, -0.6, Math.sin(t * 2 + i) * 0.08)
      q.setFromEuler(e)
      L.setMatrixAt(i, m.compose(at.set(x, hop, z), q, sc.set(s, s, s)))
      H.setMatrixAt(
        i,
        m.compose(at.set(x - 16, 26 + hop, z + 14), q, sc.set(s, s, s)),
      )
    })
    L.instanceMatrix.needsUpdate = true
    H.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={[YARD[0], -YARD[1], 0]} quaternion={qPitch}>
      <mesh geometry={shapes.stand}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
      <mesh ref={tilt} geometry={shapes.beam} position={[0, 112, 0]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </mesh>
      <instancedMesh
        ref={line}
        args={[shapes.folk, undefined, QUEUE.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh
        ref={held}
        args={[shapes.find, undefined, QUEUE.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.3} />
      </instancedMesh>
    </group>
  )
}
