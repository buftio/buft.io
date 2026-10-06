'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { folk } from './build'
import { rand, TILT, UP } from './kit'
import { HEAP, TOWER } from './place'

const CYCLE = 15
const BALLS = 18
const SIZE = 17
const LAND = new THREE.Vector3(HEAP.x + 10, -(HEAP.y - 10), 70)
const BASE = new THREE.Vector3(TOWER.x, -TOWER.y, 0)
const v = new THREE.Vector3()
const tip = new THREE.Vector3()
const q = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const xAxis = new THREE.Vector3(1, 0, 0)
const o = new THREE.Object3D()

const model = (out: THREE.Vector3, x: number, y: number, z: number) => out.set(x, y, z).applyQuaternion(TILT).add(BASE)
const ease = (u: number) => u * u * (3 - 2 * u)

function pose(t: number, out: { p: THREE.Vector3; turn: number; flip: number; size: number }) {
  const { h, board } = TOWER
  out.flip = 0
  out.size = SIZE
  if (t < 4) {
    model(out.p, 0, h * (t / 4) + Math.abs(Math.sin(t * 8)) * 4, 22)
    out.turn = Math.PI
  } else if (t < 5.5) {
    model(out.p, 0, h + 6 + Math.abs(Math.sin(t * 9)) * 3, -14 - (board - 6) * ((t - 4) / 1.5))
    out.turn = Math.PI
  } else if (t < 6) {
    model(out.p, 0, h + 6, -board - 6)
    out.turn = Math.PI * (1 - ease((t - 5.5) * 2))
  } else if (t < 7.5) {
    model(out.p, 0, h + 6 + Math.abs(Math.sin((t - 6) * Math.PI * 2)) * (14 + (t - 6) * 16), -board - 6)
    out.turn = 0
  } else if (t < 8.6) {
    const u = (t - 7.5) / 1.1
    model(tip, 0, h + 6, -board - 6)
    out.p.lerpVectors(tip, LAND, u).addScaledVector(UP, 240 * 4 * u * (1 - u))
    out.turn = 0
    out.flip = -Math.PI * 2 * ease(u)
  } else if (t < 10.4) {
    out.p.copy(LAND)
    out.size = 0
    out.turn = 0
  } else if (t < 11.2) {
    out.p.copy(LAND).addScaledVector(UP, -24 + 30 * ease((t - 10.4) / 0.8))
    out.turn = Math.sin(t * 6) * 0.5
  } else {
    const u = (t - 11.2) / (CYCLE - 11.2)
    model(v, 0, 0, 22)
    out.p.lerpVectors(LAND, v, ease(u)).addScaledVector(UP, Math.abs(Math.sin(t * 8)) * 4)
    out.turn = Math.atan2(v.x - LAND.x, -(v.y - LAND.y))
  }
  return out
}

export function Diver({ clock }: { clock: RefObject<number> }) {
  const geos = useMemo(() => ({ body: folk('cap'), ball: new THREE.SphereGeometry(15, 8, 6) }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const kicks = useMemo(() => {
    const r = rand(3)
    return Array.from({ length: BALLS }, () => [r() * Math.PI * 2, 90 + r() * 160, 90 + r() * 160] as const)
  }, [])
  const me = useRef<THREE.Group>(null)
  const balls = useRef<THREE.InstancedMesh>(null)
  const out = useRef({ p: new THREE.Vector3(), turn: 0, flip: 0, size: SIZE })

  useFrame(() => {
    const t = (clock.current + 3) % CYCLE
    const g = me.current
    const m = balls.current
    if (!g || !m) return
    const p = pose(t, out.current)
    g.position.copy(p.p)
    g.quaternion.copy(TILT).multiply(q.setFromAxisAngle(yAxis, p.turn)).multiply(q.setFromAxisAngle(xAxis, p.flip))
    g.scale.setScalar(p.size)
    const u = (t - 8.6) / 1.2
    kicks.forEach(([a, sp, up], i) => {
      const live = u > 0 && u < 1
      o.position.set(LAND.x + Math.cos(a) * sp * u, LAND.y + Math.sin(a) * sp * u * 0.8, LAND.z).addScaledVector(UP, up * 4 * u * (1 - u))
      o.scale.setScalar(live ? 1 : 0)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <group ref={me}>
        <mesh geometry={geos.body}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </mesh>
      </group>
      <instancedMesh ref={balls} args={[geos.ball, undefined, BALLS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial color="#e83a5e" roughness={0.35} />
      </instancedMesh>
    </group>
  )
}
