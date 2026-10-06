'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { C, flatAt, folk, hash, merged, part, pose } from './kit'
import { CLOUDS, NAP } from './map'
import { cloud } from './models'

const SPAN = 1.12
const ZS = 3

function napper() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.SphereGeometry(0.5, 10, 6).scale(1, 0.45, 0.8), C.mint, 0.55, 0.12, 0))
  folk(p, 0, 0, 0, 1, C.coral, 0)
  const g = merged(p)
  g.rotateZ(Math.PI / 2 - 0.15)
  g.translate(0.5, 0.42, 0)
  return g
}

function zee() {
  const s = new THREE.Shape([
    new THREE.Vector2(-0.5, 0.5),
    new THREE.Vector2(0.5, 0.5),
    new THREE.Vector2(0.5, 0.32),
    new THREE.Vector2(-0.18, -0.32),
    new THREE.Vector2(0.5, -0.32),
    new THREE.Vector2(0.5, -0.5),
    new THREE.Vector2(-0.5, -0.5),
    new THREE.Vector2(-0.5, -0.32),
    new THREE.Vector2(0.18, 0.32),
    new THREE.Vector2(-0.5, 0.32),
  ])
  return new THREE.ShapeGeometry(s)
}

export type Drift = { x: Float32Array; y: Float32Array; h: Float32Array }

export function Sky({ clock, shade, alarm, drift }: { clock: RefObject<number>; shade: THREE.Texture; alarm: RefObject<number>; drift: RefObject<Drift> }) {
  const shapes = useMemo(() => ({ cloud: cloud(), nap: napper(), z: zee() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const puffs = useRef<THREE.InstancedMesh>(null)
  const shadows = useRef<THREE.InstancedMesh>(null)
  const nap = useRef<THREE.Mesh>(null)
  const zs = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const t = clock.current
    const mesh = puffs.current
    const flat = shadows.current
    const d = drift.current
    if (!mesh || !flat) return
    CLOUDS.forEach((c, k) => {
      const w = hash(k)
      const x = c.at[0] + Math.sin(t * 0.05 + w * 9) * 40
      const y = c.at[1] + Math.cos(t * 0.04 + w * 7) * 25
      const h = c.h + Math.sin(t * (0.25 + w * 0.15) + w * 6) * 18 - alarm.current * 60
      const s = c.r * SPAN * 2 * 0.47
      const b = 1 + Math.sin(t * 0.6 + w * 5) * 0.035
      d.x[k] = x
      d.y[k] = y
      d.h[k] = h
      mesh.setMatrixAt(k, pose(x, y, h, s, w * 6, 0, 0, b, 2 - b, 1))
      flat.setMatrixAt(k, flatAt(x, y, 2, c.r * 2.3, c.r * 1.9))
    })
    mesh.instanceMatrix.needsUpdate = true
    flat.instanceMatrix.needsUpdate = true
    const c = CLOUDS[NAP]
    const s = c.r * SPAN * 2 * 0.47
    if (nap.current) {
      nap.current.matrix.copy(pose(d.x[NAP] - s * 0.15, d.y[NAP], d.h[NAP] + s * 1.0, 44, -0.3, 0, Math.sin(t * 1.3) * 0.04))
      nap.current.visible = alarm.current < 0.5
    }
    const z = zs.current
    if (!z) return
    for (let k = 0; k < ZS; k++) {
      const a = (t * 0.32 + k / ZS) % 1
      const sz = alarm.current > 0.5 ? 0 : 14 + a * 22
      z.setMatrixAt(k, pose(d.x[NAP] + a * 90 + Math.sin(a * 9) * 12, d.y[NAP], d.h[NAP] + s * 1.15 + a * 170, sz * (1 - a * a), 0.35))
    }
    z.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={shadows} args={[undefined, undefined, CLOUDS.length]} frustumCulled={false} renderOrder={41}>
        <planeGeometry />
        <meshBasicMaterial map={shade} transparent opacity={0.35} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={puffs} args={[shapes.cloud, undefined, CLOUDS.length]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.95} emissive="#8c84b8" emissiveIntensity={0.35} />
      </instancedMesh>
      <mesh ref={nap} geometry={shapes.nap} matrixAutoUpdate={false} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.8} />
      </mesh>
      <instancedMesh ref={zs} args={[shapes.z, undefined, ZS]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial color={C.folk} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
