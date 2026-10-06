'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { C, eyes, folkParts, lift, merged, part, standQ, UP_Y, UP_Z } from './kit'
import { ATOLL, DESK, HAWSER, LAMP_H, PIER, polyline, ROAD, TOWER } from './map'

const FOLK = 30
const BUOYS = polyline(HAWSER, 430)
  .filter((b) => Math.hypot(b.x, b.y) > 700)
  .map((b) => ({ ...b, home: Math.hypot(b.x + 600, b.y + 960) }))
const LIT = new THREE.Color('#ffcf4a')
const DIM = new THREE.Color('#8a6a7a')

type Pose = { x: number; y: number; h: number; turn: number; roll: number; s: number }
type Actor = (t: number, o: Pose) => void

const [LX, LY] = ATOLL.light.at
const [CX, CY] = ATOLL.count.at
const [QX, QY] = ATOLL.pen.at

const keeper: Actor = (t, o) => {
  const a = t * 0.35
  const mz = Math.sin(a) * 0.86 * TOWER
  const h = 5.16 * TOWER
  o.x = LX + Math.cos(a) * 0.86 * TOWER
  o.y = LY + 10 - h * UP_Y + mz * UP_Z
  o.h = h * UP_Z + mz * UP_Y
  o.turn = -a + Math.PI / 2
  o.s = FOLK * 0.9
}

const kid = (k: number): Actor => (t, o) => {
  o.x = LX - 30 + k * 34
  o.y = LY + 170 + (k % 2) * 14
  o.h = Math.max(0, Math.sin(t * 4.4 + k * 1.9)) * 16
  o.turn = Math.sin(t * 0.8 + k) * 0.5
  o.s = FOLK * 0.75
}

const chaser = (k: number): Actor => (t, o) => {
  const ang = t * 0.42 + Math.sin(t * 0.31) * 0.9 - 0.32 - k * 0.2
  o.x = CX + Math.cos(ang) * 235
  o.y = CY + Math.sin(ang) * 215
  o.h = Math.abs(Math.sin(t * 9 + k)) * 9
  o.turn = Math.atan2(-Math.sin(ang), Math.cos(ang))
  o.s = FOLK
}

const docker = (k: number): Actor => (t, o) => {
  const f = ((t * 0.09 + k / 3) % 1) * 2
  o.x = PIER[0] - 240 + (f < 1 ? f : 2 - f) * 480
  o.y = PIER[1] + 4
  o.h = 14 + Math.abs(Math.sin(t * 7 + k)) * 4
  o.turn = f < 1 ? Math.PI / 2 : -Math.PI / 2
  o.s = FOLK
}

const clerk: Actor = (t, o) => {
  o.x = DESK[0] + 12
  o.y = DESK[1] - 38
  o.h = Math.abs(Math.sin(t * 2.9)) * 5
  o.turn = -0.5 + Math.sin(t * 0.7) * 0.3
  o.s = FOLK * 1.05
}

const guard: Actor = (t, o) => {
  o.x = QX - 95
  o.y = QY + 50
  o.h = 0
  o.turn = 0.6
  o.roll = 0.35 + Math.sin(t * 0.8) * 0.12
  o.s = FOLK
}

const lock: Actor = (t, o) => {
  o.x = ROAD[3][0] - 60
  o.y = ROAD[3][1] - 10
  o.h = Math.max(0, Math.sin(t * 3)) * 10
  o.turn = 0.8
  o.s = FOLK
}

const fisher: Actor = (t, o) => {
  o.x = LX - 175
  o.y = LY - 40
  o.h = 0
  o.turn = -1.9 + Math.sin(t * 0.5) * 0.1
  o.roll = Math.sin(t * 0.5) * 0.05
  o.s = FOLK
}

const ACTORS: Actor[] = [keeper, kid(0), kid(1), kid(2), chaser(0), chaser(1), docker(0), docker(1), docker(2), clerk, guard, lock, fisher]

function folkShape() {
  const p: THREE.BufferGeometry[] = []
  folkParts(p)
  return merged(p)
}

function gullShape() {
  const g = new THREE.BufferGeometry()
  const pos = [0, 0.5, 0, -0.18, -0.4, 0, 0.18, -0.4, 0, 0, 0.1, 0, -1, 0.3, 0, -0.45, -0.05, 0, 0, 0.1, 0, 0.45, -0.05, 0, 1, 0.3, 0, -1, 0.3, 0, -1.15, 0.38, 0, -0.85, 0.2, 0, 1, 0.3, 0, 0.85, 0.2, 0, 1.15, 0.38, 0]
  const col: number[] = []
  for (let k = 0; k < pos.length / 3; k++) col.push(...(k >= 9 ? [0.16, 0.09, 0.19] : [1, 1, 1]))
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

function buoyShape() {
  return merged([
    part(new THREE.CylinderGeometry(0.5, 0.7, 0.4, 8), C.red, 0, 0.2, 0),
    part(new THREE.ConeGeometry(0.42, 1.1, 8), C.stone, 0, 0.95, 0),
    part(new THREE.CylinderGeometry(0.43, 0.48, 0.25, 8), C.red, 0, 0.75, 0),
    part(new THREE.SphereGeometry(0.2, 6, 5), C.mint, 0, 1.6, 0),
  ])
}

function squareShape() {
  const p = [part(new THREE.BoxGeometry(1.6, 1.6, 0.7), C.red, 0, 0.8, 0), part(new THREE.BoxGeometry(0.8, 0.8, 0.74), C.deep, 0, 0.8, 0)]
  eyes(p, 1.0, 0.42, 0.3, 0.2)
  return merged(p)
}

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const v = new THREE.Vector3()
const s3 = new THREE.Vector3()
const col = new THREE.Color()
const pose: Pose = { x: 0, y: 0, h: 0, turn: 0, roll: 0, s: 0 }
const RINGS = [ATOLL.light, ATOLL.count, ATOLL.pen].flatMap((a) => [0, 0.5].map((p) => ({ ...a, p })))

export function Life({ clock, alarm }: { clock: { current: number }; alarm: { current: number } }) {
  const shapes = useMemo(() => ({ folk: folkShape(), gull: gullShape(), buoy: buoyShape(), square: squareShape(), ring: new THREE.RingGeometry(0.975, 1, 56) }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const folk = useRef<THREE.InstancedMesh>(null)
  const gulls = useRef<THREE.InstancedMesh>(null)
  const buoys = useRef<THREE.InstancedMesh>(null)
  const lights = useRef<THREE.InstancedMesh>(null)
  const surf = useRef<THREE.InstancedMesh>(null)
  const square = useRef<THREE.Mesh>(null)
  useEffect(() => {
    const g = gulls.current
    if (!g) return
    for (let k = 0; k < 10; k++) g.setColorAt(k, col.set(k < 5 ? '#ffffff' : '#9a8fa6'))
    if (g.instanceColor) g.instanceColor.needsUpdate = true
  }, [])

  useFrame(() => {
    const f = folk.current
    const g = gulls.current
    const b = buoys.current
    const r = surf.current
    const sq = square.current
    const li = lights.current
    if (!f || !g || !b || !r || !sq || !li) return
    const t = clock.current
    for (let k = 0; k < ACTORS.length; k++) {
      const act = ACTORS[k]
      pose.roll = 0
      act(t, pose)
      if (k > 0 && k < 4) pose.s *= 1 - Math.min(1, alarm.current * 2)
      if (k === 10 && alarm.current > 0.3) {
        pose.roll = 0
        pose.h = Math.abs(Math.sin(t * 8)) * 12
      }
      standQ(q, pose.turn, pose.roll)
      if (k === 0) v.set(pose.x, -pose.y, pose.h)
      else lift(v, pose.x, pose.y, pose.h)
      f.setMatrixAt(k, m.compose(v, q, s3.setScalar(pose.s)))
    }
    f.instanceMatrix.needsUpdate = true
    for (let k = 0; k < 5; k++) {
      const lamp = k < 3
      const a = t * (lamp ? 0.5 + k * 0.12 : 0.7) * (k % 2 ? -1 : 1) + k * 2
      const rad = lamp ? 150 + k * 45 : 110
      const cx = lamp ? LX : PIER[0] - 120 + (k - 3) * 200
      const cy = lamp ? -LY + LAMP_H * TOWER * UP_Y + 40 : -PIER[1] - 60
      v.set(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.8, 520)
      q.setFromAxisAngle(v3z, a + (k % 2 ? 0 : Math.PI))
      s3.set(30 * (0.55 + 0.45 * Math.abs(Math.sin(t * 7 + k * 2))), 30, 1)
      g.setMatrixAt(k, m.compose(v, q, s3))
      v.set(v.x + 70, v.y - 90, 3)
      g.setMatrixAt(k + 5, m.compose(v, q, s3))
    }
    g.instanceMatrix.needsUpdate = true
    for (let k = 0; k < BUOYS.length; k++) {
      const p = BUOYS[k]
      const tip = Math.sin(t * 1.6 + k * 1.7) * 0.14
      const bob = Math.sin(t * 2 + k) * 3
      b.setMatrixAt(k, m.compose(lift(v, p.x, p.y, bob), standQ(q, p.a, tip), s3.setScalar(26)))
      const on = Math.sin(t * 3 + p.home / 140) > 0.6
      li.setMatrixAt(k, m.compose(lift(v, p.x, p.y, bob + 44), q.identity(), s3.setScalar(on ? 12 : 7)))
      li.setColorAt(k, on ? LIT : DIM)
    }
    b.instanceMatrix.needsUpdate = true
    li.instanceMatrix.needsUpdate = true
    if (li.instanceColor) li.instanceColor.needsUpdate = true
    for (let k = 0; k < RINGS.length; k++) {
      const a = RINGS[k]
      const ph = (t / 5 + a.p + k * 0.13) % 1
      r.setMatrixAt(k, m.compose(v.set(a.at[0], -a.at[1], 1), q.identity(), s3.setScalar(a.r * (1.02 + ph * 0.45))))
      r.setColorAt(k, col.setScalar(0.22 * (1 - ph) * Math.min(1, ph * 6)))
    }
    r.instanceMatrix.needsUpdate = true
    if (r.instanceColor) r.instanceColor.needsUpdate = true
    const hop = Math.max(0, Math.sin(t * 1.3)) ** 6
    sq.position.copy(lift(v, QX + Math.sin(t * 0.4) * 22, QY + 10, hop * 26))
    sq.quaternion.copy(standQ(q, Math.sin(t * 0.25) * 0.9, hop * 0.3))
  })

  return (
    <group>
      <instancedMesh ref={surf} args={[shapes.ring, undefined, RINGS.length]} frustumCulled={false} renderOrder={41}>
        <meshBasicMaterial transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={folk} args={[shapes.folk, undefined, ACTORS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={buoys} args={[shapes.buoy, undefined, BUOYS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={lights} args={[undefined, undefined, BUOYS.length]} frustumCulled={false} renderOrder={47}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={gulls} args={[shapes.gull, undefined, 10]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} depthWrite={false} />
      </instancedMesh>
      <mesh ref={square} geometry={shapes.square} scale={26}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </mesh>
    </group>
  )
}

const v3z = new THREE.Vector3(0, 0, 1)
