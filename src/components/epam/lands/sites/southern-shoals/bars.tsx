'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { BARS } from './flats'
import { C, crab, folk, merged, part } from './kit'
import type { World } from './world'

const qPitch = new THREE.Quaternion().setFromEuler(PITCH)

function bottle() {
  const parts: THREE.BufferGeometry[] = [
    part(
      new THREE.CylinderGeometry(46, 46, 190, 12),
      C.glass,
      0,
      40,
      0,
      0.5,
      Math.PI / 2 - 0.12,
    ),
    part(
      new THREE.CylinderGeometry(18, 40, 50, 12),
      C.glass,
      -118,
      52,
      55,
      0.5,
      Math.PI / 2 - 0.12,
    ),
    part(
      new THREE.CylinderGeometry(18, 18, 30, 10),
      C.glassD,
      -150,
      56,
      72,
      0.5,
      Math.PI / 2 - 0.12,
    ),
    part(
      new THREE.CylinderGeometry(19, 17, 22, 10),
      C.rind,
      -170,
      58,
      82,
      0.5,
      Math.PI / 2 - 0.12,
    ),
    part(
      new THREE.CylinderGeometry(22, 22, 120, 10),
      C.sail,
      10,
      40,
      0,
      0.5,
      Math.PI / 2 - 0.12,
    ),
  ]
  folk(parts, 30, 82, 0, C.hat, 18)
  for (let k = 0; k < 4; k++) {
    const x = 120 + (k % 2) * 46
    const z = -70 + Math.floor(k / 2) * 46
    parts.push(
      part(new THREE.CylinderGeometry(15, 18, 34, 6), C.sand, x, 17, z),
    )
    parts.push(part(new THREE.ConeGeometry(15, 18, 6), C.sand, x, 43, z))
  }
  parts.push(part(new THREE.BoxGeometry(46, 26, 46), C.sand, 143, 13, -47))
  parts.push(
    part(new THREE.CylinderGeometry(1.4, 1.4, 30, 3), C.driftD, 143, 60, -47),
  )
  parts.push(part(new THREE.PlaneGeometry(14, 9), C.teal, 150, 70, -47))
  return merged(parts)
}

function lounge() {
  const parts: THREE.BufferGeometry[] = [
    part(
      new THREE.CylinderGeometry(2.5, 2.5, 110, 4),
      C.white,
      0,
      55,
      -20,
      0,
      0.2,
    ),
    part(new THREE.ConeGeometry(70, 24, 8), C.coral, -11, 112, -20, 0, 0.2),
    part(
      new THREE.ConeGeometry(71, 24, 8, 1, true, 0, Math.PI / 4),
      C.white,
      -11,
      112,
      -20,
      0,
      0.2,
    ),
    part(
      new THREE.ConeGeometry(71, 24, 8, 1, true, Math.PI, Math.PI / 4),
      C.white,
      -11,
      112,
      -20,
      0,
      0.2,
    ),
    part(new THREE.BoxGeometry(80, 6, 40), C.sail, 30, 8, 10, 0, -0.1),
  ]
  const c = crab(1.5)
  c.rotateZ(-0.35).translate(30, 14, 10)
  parts.push(c)
  parts.push(part(new THREE.BoxGeometry(18, 6, 6), C.ink, 22, 40, 24))
  return merged(parts)
}

function anchor() {
  return merged([
    part(new THREE.CylinderGeometry(7, 7, 120, 6), C.copper, 0, 40, 0, 0, 0.5),
    part(new THREE.TorusGeometry(14, 5, 5, 10), C.copper, -32, 92, 0, 0, 0.5),
    part(
      new THREE.TorusGeometry(48, 8, 5, 14, Math.PI),
      C.copper,
      22,
      -4,
      0,
      0,
      Math.PI + 0.5,
    ),
    part(new THREE.BoxGeometry(70, 9, 9), C.copper, -20, 70, 0, 0, 0.5),
  ])
}

function flag() {
  return merged([
    part(new THREE.CylinderGeometry(1.6, 1.6, 70, 4), C.driftD, 0, 35, 0),
    part(new THREE.PlaneGeometry(40, 26), C.coral, 20, 58, 0),
  ])
}

export function Bars({ world }: { world: RefObject<World> }) {
  const shapes = useMemo(
    () => ({
      bottle: bottle(),
      lounge: lounge(),
      anchor: anchor(),
      flag: flag(),
    }),
    [],
  )
  useEffect(
    () => () => Object.values(shapes).forEach((g) => g.dispose()),
    [shapes],
  )
  const wave = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const w = world.current
    if (!w || !wave.current) return
    const t = w.t
    const sweep = 0.6 + 0.4 * Math.max(0, Math.sin(t * 0.4))
    wave.current.rotation.z = Math.sin(t * 7) * 0.5 * sweep
  })
  const [b0, b1, b2] = BARS
  return (
    <group>
      <group position={[b0[0] - 40, -b0[1] + 20, 0]} quaternion={qPitch}>
        <mesh geometry={shapes.bottle}>
          <meshStandardMaterial vertexColors flatShading roughness={0.25} />
        </mesh>
        <mesh ref={wave} geometry={shapes.flag} position={[44, 110, 14]}>
          <meshStandardMaterial
            vertexColors
            flatShading
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group position={[b2[0], -b2[1] + 10, 0]} quaternion={qPitch}>
        <mesh geometry={shapes.lounge}>
          <meshStandardMaterial
            vertexColors
            flatShading
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group position={[b1[0], -b1[1], 0]} quaternion={qPitch}>
        <mesh geometry={shapes.anchor}>
          <meshStandardMaterial vertexColors flatShading roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
