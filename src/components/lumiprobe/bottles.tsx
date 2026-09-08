'use client'

import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import { Group, InstancedMesh, Mesh, Object3D } from 'three'
import { Clay, clay, geo } from '../marketdata/models/clay'
import { tones, glowMaterial } from './palette'
import { SHELF_Y, SHELF_DEPTH, bottles, bottleX, type View } from './projection'

const bottleTones = ['#b7a5d7', '#a9c9bc', '#e7c8a4', '#d9a59f', '#c7c1a6']
const sprinkleTones = ['#c8553d', '#8f7bb8', '#ffd66b', '#88bea6']
const BURST_DURATION = 3.4
const dummy = new Object3D()

export function Bottle({
  index,
  view,
  current,
  done,
  glow,
  hop,
  reduced,
}: {
  index: number
  view: View
  current: boolean
  done: boolean
  glow: boolean
  hop: number | null
  reduced: boolean
}) {
  const { height, radius } = bottles[index]
  const cap = useRef<Group>(null)
  const pending = useRef<number | null>(null)
  const started = useRef<number | null>(null)
  const consumed = useRef<number | null>(null)
  useLayoutEffect(() => {
    if (hop !== null && consumed.current !== hop) {
      consumed.current = hop
      pending.current = reduced ? null : hop
    }
    if (reduced) {
      pending.current = null
      started.current = null
      if (cap.current) {
        cap.current.position.y = 0
        cap.current.rotation.z = 0
      }
    }
  }, [hop, reduced])
  useFrame((state) => {
    const group = cap.current
    if (!group || reduced) return
    if (pending.current !== null) {
      started.current = state.clock.elapsedTime
      pending.current = null
    }
    if (started.current === null) return
    const t = state.clock.elapsedTime - started.current
    const lift =
      t < 0.7
        ? Math.sin((t / 0.7) * Math.PI) * 0.34
        : t < 1
          ? Math.sin(((t - 0.7) / 0.3) * Math.PI) * 0.08
          : 0
    group.position.y = lift
    group.rotation.z = t < 0.7 ? Math.sin((t / 0.7) * Math.PI * 2) * 0.35 : 0
    if (t >= 1) started.current = null
  })
  const capTone = glow
    ? tones.glow
    : current
      ? tones.oxygen
      : done
        ? tones.ring
        : tones.carbon
  const capY = height + radius * 0.55 + 0.32
  return (
    <group position={[bottleX(index, view), SHELF_Y, view.layout.shelfZ]}>
      {glow && (
        <mesh
          geometry={geo.cylinder}
          material={glowMaterial}
          position={[0, 0.02, 0]}
          scale={[radius * 4.2, 0.04, radius * 4.2]}
          receiveShadow
          dispose={null}
        />
      )}
      <Clay
        shape="cylinder"
        color={bottleTones[index]}
        size={[radius * 2, height, radius * 2]}
        position={[0, height / 2, 0]}
      />
      <Clay
        shape="sphere"
        color={bottleTones[index]}
        size={[radius * 2, radius * 1.3, radius * 2]}
        position={[0, height, 0]}
      />
      <Clay
        shape="cylinder"
        color={bottleTones[index]}
        size={[0.28, 0.32, 0.28]}
        position={[0, height + radius * 0.55 + 0.1, 0]}
      />
      <group ref={cap}>
        {glow ? (
          <mesh
            geometry={geo.cylinder}
            material={glowMaterial}
            position={[0, capY, 0]}
            scale={[0.34, 0.15, 0.34]}
            castShadow
            dispose={null}
          />
        ) : (
          <Clay
            shape="cylinder"
            color={capTone}
            size={[0.34, 0.15, 0.34]}
            position={[0, capY, 0]}
          />
        )}
      </group>
      <Clay
        shape="slab"
        color={tones.label}
        size={[radius * 1.5, 0.46, 0.05]}
        position={[0, height * 0.48, radius]}
      />
    </group>
  )
}

/* A burst of clay crumbs around the finished molecule, settling on the bench. */
export function Sprinkle({
  origin,
  shelfZ,
  reduced,
}: {
  origin: [number, number, number]
  shelfZ: number
  reduced: boolean
}) {
  const ref = useRef<InstancedMesh>(null)
  const ring = useRef<Mesh>(null)
  const life = useRef(reduced ? Infinity : 0)
  useLayoutEffect(() => {
    if (reduced) life.current = Infinity
    const visible = !reduced && life.current < BURST_DURATION
    if (ref.current) ref.current.visible = visible
    if (ring.current) ring.current.visible = visible
  }, [reduced])
  const crumbs = useMemo(
    () =>
      Array.from({ length: 64 }, (_, i) => {
        const angle = (i / 64) * Math.PI * 2 + (i % 3) * 0.4
        const speed = 0.7 + ((i * 37) % 13) / 8
        return {
          vx: Math.cos(angle) * speed,
          vz: Math.sin(angle) * speed * 0.7,
          vy: 3 + ((i * 53) % 10) / 8,
          size: 0.14 + ((i * 7) % 4) * 0.04,
          tone: sprinkleTones[i % sprinkleTones.length],
        }
      }),
    [],
  )
  useLayoutEffect(() => {
    const mesh = ref.current
    /* Seed once per burst; a resize mid-flight must not replay it. */
    if (!mesh || life.current > 0) return
    crumbs.forEach((crumb, i) => {
      mesh.setColorAt(i, clay(crumb.tone).color)
      dummy.position.set(...origin)
      dummy.scale.setScalar(0.001)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [crumbs, origin])
  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh || life.current >= BURST_DURATION) return
    life.current += Math.min(delta, 0.05)
    const t = life.current
    const [ox, oy, oz] = origin
    if (ring.current) {
      const spread = 1 + Math.min(t / 1.6, 1) * 4
      ring.current.scale.set(spread, spread, Math.max(0.001, 1 - t / 1.6))
      ring.current.visible = t < 1.6
    }
    crumbs.forEach((crumb, i) => {
      const gravity = oy + crumb.vy * t - 4.9 * t * t
      const drift = oz + crumb.vz * t
      const floor = Math.abs(drift - shelfZ) < SHELF_DEPTH / 2 ? SHELF_Y : 0
      const grounded = gravity <= floor + crumb.size / 2
      /* Time of landing, so crumbs stop sliding once they touch down. */
      const landing = grounded
        ? (crumb.vy +
            Math.sqrt(crumb.vy ** 2 + 19.6 * (oy - floor - crumb.size / 2))) /
          9.8
        : t
      const x = ox + crumb.vx * landing
      const z = oz + crumb.vz * landing
      const y = grounded ? floor + crumb.size / 2 : gravity
      const fade = t > 2.4 ? Math.max(0, BURST_DURATION - t) : 1
      dummy.position.set(x, y, z)
      dummy.rotation.set(landing * ((i % 4) + 2), landing * 3, i + landing * 2)
      const size = Math.max(0.001, crumb.size * fade)
      dummy.scale.set(size, size * 0.55, size)
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (life.current >= BURST_DURATION) mesh.visible = false
  })
  return (
    <group>
      <mesh
        ref={ring}
        geometry={geo.torus}
        material={glowMaterial}
        position={[origin[0], 0.04, origin[2]]}
        rotation={[-Math.PI / 2, 0, 0]}
        dispose={null}
      />
      <instancedMesh
        ref={ref}
        args={[geo.box, clay('#ffffff', 'sprinkle'), crumbs.length]}
        castShadow
        dispose={null}
      />
    </group>
  )
}
