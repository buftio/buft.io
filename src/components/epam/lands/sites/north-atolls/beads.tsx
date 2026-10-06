'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { C, folkParts, lift, merged, part, standQ, UP_Y, UP_Z } from './kit'
import { along, ATOLL, CRANE, CRANE_H, CRANE_SIZE, PIER, ROAD, roadLength } from './map'

export const BEAD = 21
const GAP = 58
const SPEED = 34
const LEN = roadLength(ROAD)
const ROLLERS = Math.floor(LEN / GAP)
const RUNAWAY = ROLLERS
const CARRIED = ROLLERS + 1
const COUNT = ROLLERS + 4
const DESK_S = Math.hypot(ROAD[1][0] - ROAD[0][0], ROAD[1][1] - ROAD[0][1])
const DOCK = Math.atan2(290 - CRANE[0], -235 - CRANE[1])
const DROP = DOCK + Math.PI * 0.86
const SWING = 7.5

export function beadShape() {
  const p = [
    part(new THREE.CylinderGeometry(1, 1, 0.55, 16), C.red, 0, 0, 0),
    part(new THREE.TorusGeometry(0.82, 0.2, 5, 16).rotateX(Math.PI / 2), C.blush, 0, 0.18, 0),
    part(new THREE.CylinderGeometry(0.48, 0.48, 0.6, 12), C.deep, 0, 0, 0),
  ]
  return merged(p).rotateZ(Math.PI / 2)
}

function boom() {
  const p = [
    part(new THREE.BoxGeometry(0.22, 0.22, 3.6), C.wood, 0, 0, 1.3),
    part(new THREE.BoxGeometry(0.6, 0.5, 0.6), C.ink, 0, 0, -0.65),
    part(new THREE.BoxGeometry(0.9, 0.7, 0.9), C.teal, 0, 0.45, 0),
    part(new THREE.CylinderGeometry(0.015, 0.015, 1.5, 3), C.ink, 0, -0.75, 3.05),
    part(new THREE.TorusGeometry(0.12, 0.03, 4, 8), C.ink, 0, -1.5, 3.05),
  ]
  folkParts(p, 0, 0.75, 0.05, C.red)
  return merged(p)
}

function stamp() {
  return merged([
    part(new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), C.wood, 0, 0.45, 0),
    part(new THREE.SphereGeometry(0.13, 8, 6), C.red, 0, 0.75, 0),
    part(new THREE.BoxGeometry(0.4, 0.14, 0.3), C.ink, 0, 0.14, 0),
  ])
}

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const v = new THREE.Vector3()
const s3 = new THREE.Vector3()
const pos = { x: 0, y: 0, a: 0 }

const smooth = (x: number) => x * x * (3 - 2 * x)

export function craneAngle(t: number) {
  const f = (t % SWING) / SWING
  if (f < 0.15) return [DOCK, 1] as const
  if (f < 0.5) return [DOCK + (DROP - DOCK) * smooth((f - 0.15) / 0.35), 1] as const
  if (f < 0.62) return [DROP, f < 0.55 ? 1 : 0] as const
  return [DROP + (DOCK - DROP) * smooth((f - 0.62) / 0.38), 0] as const
}

export function Beads({ reduced, clock }: { reduced: boolean; clock: { current: number } }) {
  const shapes = useMemo(() => ({ bead: beadShape(), boom: boom(), stamp: stamp(), tag: new THREE.OctahedronGeometry(1, 0) }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const beads = useRef<THREE.InstancedMesh>(null)
  const tags = useRef<THREE.InstancedMesh>(null)
  const arm = useRef<THREE.Group>(null)
  const hook = useRef<THREE.Mesh>(null)
  const press = useRef<THREE.Group>(null)

  useFrame(() => {
    const b = beads.current
    const t = tags.current
    const a = arm.current
    const h = hook.current
    const s = press.current
    if (!b || !t || !a || !h || !s) return
    const now = clock.current
    const run = now * SPEED * (reduced ? 0.2 : 1)
    for (let k = 0; k < ROLLERS; k++) {
      const d = (run + k * GAP) % LEN
      along(ROAD, d, pos)
      const size = BEAD * Math.min(1, d / 30, (LEN - d) / 60)
      standQ(q, pos.a, d / BEAD)
      b.setMatrixAt(k, m.compose(lift(v, pos.x, pos.y, size), q, s3.setScalar(size)))
      const ok = d > DESK_S + 8 ? size * 0.32 : 0
      t.setMatrixAt(k, m.compose(lift(v, pos.x, pos.y, size * 2 + 7 + Math.sin(now * 6 + k) * 2), standQ(q, now * 2 + k, 0), s3.set(ok, ok * 1.4, ok)))
    }
    const ang = now * 0.42 + Math.sin(now * 0.31) * 0.9
    const [cx, cy] = ATOLL.count.at
    const rx = cx + Math.cos(ang) * 235
    const ry = cy + Math.sin(ang) * 215
    b.setMatrixAt(RUNAWAY, m.compose(lift(v, rx, ry, BEAD + Math.abs(Math.sin(now * 5)) * 10), standQ(q, Math.atan2(-Math.sin(ang), Math.cos(ang)), now * 7), s3.setScalar(BEAD)))
    for (let k = 0; k < 3; k++) {
      const f = ((now * 0.09 + k / 3) % 1) * 2
      const x = PIER[0] - 240 + (f < 1 ? f : 2 - f) * 480
      const carry = f < 1 ? BEAD * 0.7 : 0
      b.setMatrixAt(CARRIED + k, m.compose(lift(v, x, PIER[1] + 2, 44 + BEAD * 0.7), standQ(q, Math.PI / 2, now * 0.3), s3.setScalar(carry)))
      t.setMatrixAt(ROLLERS + k, m.makeScale(0, 0, 0))
    }
    t.setMatrixAt(ROLLERS + 3, m.makeScale(0, 0, 0))
    b.instanceMatrix.needsUpdate = true
    t.instanceMatrix.needsUpdate = true
    const [turn, loaded] = craneAngle(now)
    a.quaternion.copy(standQ(q, turn))
    h.visible = loaded === 1
    const slam = ((run - DESK_S) % GAP + GAP) % GAP / GAP
    const up = slam < 0.12 ? slam / 0.12 : slam > 0.7 ? 1 - (slam - 0.7) / 0.3 : 1
    const hh = 44 + up * 34
    s.position.set(ROAD[1][0], -ROAD[1][1] + hh * UP_Y, hh * UP_Z)
  })

  const top = CRANE_H * CRANE_SIZE + 10
  return (
    <group>
      <instancedMesh ref={beads} args={[shapes.bead, undefined, COUNT]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.45} />
      </instancedMesh>
      <instancedMesh ref={tags} args={[shapes.tag, undefined, COUNT]} frustumCulled={false}>
        <meshBasicMaterial color={C.mint} />
      </instancedMesh>
      <group ref={arm} position={[CRANE[0], -CRANE[1] + top * UP_Y, top * UP_Z]} scale={CRANE_SIZE}>
        <mesh geometry={shapes.boom}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
        <mesh ref={hook} geometry={shapes.bead} position={[0, -2.0, 3.05]} scale={0.42}>
          <meshStandardMaterial vertexColors roughness={0.45} />
        </mesh>
      </group>
      <group ref={press} rotation={[(Math.PI * 50) / 180, 0, 0]} scale={58}>
        <mesh geometry={shapes.stamp}>
          <meshStandardMaterial vertexColors flatShading />
        </mesh>
      </group>
    </group>
  )
}
