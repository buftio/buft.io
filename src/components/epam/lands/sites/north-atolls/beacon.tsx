'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { UP_Y, UP_Z } from './kit'
import { ATOLL, LAMP_H, TOWER } from './map'

const REACH = 2600
const SPREAD = 0.13
const WARM = new THREE.Color('#ffd36b')
const ALARM = new THREE.Color('#ff3b4e')

function beamShape() {
  const pos: number[] = [0, 0, 0]
  const alpha: number[] = [0.8]
  const n = 6
  for (let k = 0; k <= n; k++) {
    const a = -SPREAD + (2 * SPREAD * k) / n
    pos.push(Math.sin(a) * REACH, Math.cos(a) * REACH, 0)
    alpha.push(
      k === 0 || k === n ? 0 : 0.2 * (1 - Math.abs(k - n / 2) / (n / 2)),
    )
  }
  const mid: number[] = []
  for (let k = 0; k <= n; k++) {
    const a = -SPREAD + (2 * SPREAD * k) / n
    pos.push(Math.sin(a) * REACH * 0.35, Math.cos(a) * REACH * 0.35, 0)
    alpha.push(
      k === 0 || k === n ? 0 : 0.7 * (1 - Math.abs(k - n / 2) / (n / 2)) + 0.2,
    )
    mid.push(n + 2 + k)
  }
  const index: number[] = []
  for (let k = 0; k < n; k++) {
    index.push(0, mid[k], mid[k + 1])
    index.push(mid[k], 1 + k, 2 + k, mid[k], 2 + k, mid[k + 1])
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      alpha.flatMap((a) => [1, 1, 1, a]),
      4,
    ),
  )
  g.setIndex(index)
  return g
}

function haloShape() {
  const g = new THREE.CircleGeometry(1, 32)
  const n = g.getAttribute('position').count
  const col: number[] = []
  for (let k = 0; k < n; k++) col.push(1, 1, 1, k === 0 ? 0.75 : 0)
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return g
}

export function Beacon({
  reduced,
  clock,
  alarm,
}: {
  reduced: boolean
  clock: { current: number }
  alarm: { current: number }
}) {
  const shapes = useMemo(() => ({ beam: beamShape(), halo: haloShape() }), [])
  useEffect(
    () => () => Object.values(shapes).forEach((g) => g.dispose()),
    [shapes],
  )
  const spin = useRef<THREE.Group>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  const beam = useRef<THREE.MeshBasicMaterial>(null)
  const lamp = useRef<THREE.MeshBasicMaterial>(null)
  const back = useRef<THREE.MeshBasicMaterial>(null)
  const orb = useRef<THREE.Group>(null)
  const angle = useRef(0)
  const [lx, ly] = ATOLL.light.at
  const h = LAMP_H * TOWER

  useFrame((state, dt) => {
    const s = spin.current
    const g = glow.current
    const b = beam.current
    const l = lamp.current
    const k = back.current
    const o = orb.current
    if (!s || !g || !b || !l || !k || !o) return
    const far = THREE.MathUtils.clamp((0.3 - state.camera.zoom) / 0.2, 0, 1)
    o.scale.setScalar(1 + far * 1.6)
    const fear = alarm.current
    angle.current -=
      Math.min(dt, 0.1) * (reduced ? 0.05 : 0.62) * (1 - fear * 0.85)
    s.rotation.z = angle.current
    const blink =
      fear > 0.05 ? 0.55 + 0.45 * Math.sign(Math.sin(clock.current * 6)) : 1
    g.color.copy(WARM).lerp(ALARM, Math.min(1, fear * 3))
    b.color.copy(g.color)
    l.color.copy(g.color)
    k.color.copy(g.color)
    b.opacity = blink * (0.65 + 0.35 * far)
    k.opacity = b.opacity * 0.75
    g.opacity = (0.8 + 0.2 * far) * blink
  })

  return (
    <group position={[lx, -(ly + 10) + h * UP_Y, h * UP_Z]}>
      <group ref={spin}>
        <mesh geometry={shapes.beam} renderOrder={48}>
          <meshBasicMaterial
            ref={beam}
            vertexColors
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh
          geometry={shapes.beam}
          rotation={[0, 0, Math.PI]}
          scale={[0.8, 0.6, 1]}
          renderOrder={48}
        >
          <meshBasicMaterial
            ref={back}
            vertexColors
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group ref={orb}>
        <mesh
          geometry={shapes.halo}
          scale={210}
          position={[0, 0, 20]}
          renderOrder={49}
        >
          <meshBasicMaterial
            ref={glow}
            vertexColors
            transparent
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, 0]} renderOrder={49}>
          <sphereGeometry args={[0.43 * TOWER, 16, 10]} />
          <meshBasicMaterial ref={lamp} />
        </mesh>
      </group>
    </group>
  )
}
