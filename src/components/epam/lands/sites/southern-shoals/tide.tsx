'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import {
  C,
  folk,
  merged,
  part,
  rng,
  salvager,
  smoothstep,
  softDisc,
} from './kit'
import { BEACH, BUOY, CAMP, POOLS, ROW, SAIL_TO, along } from './plan'
import type { World } from './world'

const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const q = new THREE.Quaternion()
const qb = new THREE.Quaternion()
const e = new THREE.Euler()
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()
const SIN = Math.sin((50 * Math.PI) / 180)
const COS = Math.cos((50 * Math.PI) / 180)

function pools() {
  const parts: THREE.BufferGeometry[] = []
  const roll = rng(77)
  for (const [x, y, r] of POOLS) {
    const rim = new THREE.RingGeometry(r * 0.9, r * 1.02, 18, 1)
    parts.push(part(rim, '#e9dcc0', x, -y, 2))
    parts.push(
      part(new THREE.CircleGeometry(r * 0.92, 18), '#7fd8c8', x, -y, 2.2),
    )
    parts.push(
      part(
        new THREE.CircleGeometry(r * 0.6, 14),
        '#4fb9a8',
        x + r * 0.08,
        -y - r * 0.05,
        2.4,
      ),
    )
    for (let k = 0; k < 5; k++) {
      const a = roll() * Math.PI * 2
      const d = r * (0.95 + roll() * 0.25)
      parts.push(
        part(
          new THREE.DodecahedronGeometry(r * (0.1 + roll() * 0.08), 0),
          roll() < 0.4 ? C.driftL : '#c9b3c9',
          x + Math.cos(a) * d,
          -y + Math.sin(a) * d * 0.7,
          6,
        ),
      )
    }
    for (let k = 0; k < 3; k++) {
      const a = roll() * Math.PI * 2
      const d = r * roll() * 0.5
      const star = new THREE.CircleGeometry(r * 0.13, 5)
      parts.push(
        part(
          star,
          k ? C.coral : C.gold,
          x + Math.cos(a) * d,
          -y + Math.sin(a) * d,
          2.6,
          0,
          roll() * 3,
        ),
      )
    }
  }
  return merged(parts)
}

function camp() {
  const parts: THREE.BufferGeometry[] = []
  const tent = new THREE.ConeGeometry(110, 140, 4, 1, true)
  parts.push(part(tent, C.sail, 0, 70, 0, Math.PI / 4))
  for (let k = 0; k < 4; k++) {
    const stripe = new THREE.ConeGeometry(
      111,
      140,
      4,
      1,
      true,
      (k * Math.PI) / 2 + Math.PI / 4 - 0.2,
      0.4,
    )
    parts.push(part(stripe, C.coral, 0, 70, 0))
  }
  parts.push(part(new THREE.BoxGeometry(40, 70, 4), C.ink, 0, 35, 78))
  parts.push(part(new THREE.CylinderGeometry(3, 3, 60, 4), C.driftD, 0, 160, 0))
  parts.push(part(new THREE.PlaneGeometry(50, 26), C.teal, 25, 175, 0))
  const roll = rng(5)
  for (let k = 0; k < 7; k++) {
    const x = 150 + (k % 4) * 46
    const z = -40 + Math.floor(k / 4) * 70 + roll() * 10
    const crate = new THREE.BoxGeometry(40, 34, 40)
    parts.push(part(crate, k % 3 ? C.fresh : C.drift, x, 17, z, roll()))
  }
  for (let k = 0; k < 4; k++)
    parts.push(
      part(
        new THREE.BoxGeometry(150, 7, 18),
        C.fresh,
        -170,
        4 + k * 8,
        -10 + k * 3,
        0.15 * k,
      ),
    )
  for (let k = 0; k < 3; k++) {
    parts.push(
      part(
        new THREE.CylinderGeometry(16, 16, 34, 8),
        C.gold,
        150 + k * 40,
        17,
        120,
      ),
    )
    parts.push(
      part(
        new THREE.CylinderGeometry(17, 17, 5, 8),
        C.rind,
        150 + k * 40,
        26,
        120,
      ),
    )
  }
  parts.push(
    part(new THREE.CylinderGeometry(2.5, 2.5, 130, 4), C.driftD, -40, 65, 130),
  )
  parts.push(part(new THREE.BoxGeometry(110, 50, 4), C.driftL, -40, 130, 132))
  folk(parts, -100, 0, 110, C.hat, 15)
  return merged(parts)
}

function boatGeometry() {
  const parts: THREE.BufferGeometry[] = []
  const shell = (
    sx: number,
    sy: number,
    sz: number,
    color: string,
    y: number,
  ) =>
    part(
      new THREE.SphereGeometry(
        1,
        14,
        5,
        0,
        Math.PI * 2,
        Math.PI / 2,
        Math.PI / 2,
      ).scale(sx, sy, sz),
      color,
      0,
      y,
      0,
    )
  parts.push(shell(70, 26, 28, C.driftD, 24))
  parts.push(shell(64, 21, 23, C.drift, 25))
  const rim = new THREE.TorusGeometry(1, 0.08, 4, 28)
  rim.rotateX(Math.PI / 2)
  rim.scale(68, 50, 27)
  parts.push(part(rim, C.teal, 0, 24, 0))
  for (const x of [-12, 34])
    parts.push(part(new THREE.BoxGeometry(9, 4, 46), C.fresh, x, 20, 0))
  for (let k = 0; k < 2; k++)
    parts.push(
      part(
        new THREE.BoxGeometry(18, 16, 18),
        C.fresh,
        -46 + k * 18,
        20,
        -4 + k * 6,
        0.3 * k,
      ),
    )
  parts.push(part(new THREE.CylinderGeometry(8, 8, 16, 8), C.gold, -40, 22, 14))
  const rower: THREE.BufferGeometry[] = []
  folk(rower, 0, 0, 0, C.hat, 13)
  parts.push(
    merged(rower)
      .rotateY(-Math.PI / 2)
      .translate(12, 12, 0),
  )
  for (const s of [-1, 1])
    parts.push(
      part(
        new THREE.BoxGeometry(4, 4, 70),
        C.driftD,
        14,
        26,
        s * 34,
        0,
        0,
        s * 0.35,
      ),
    )
  return merged(parts)
}

function buoy() {
  const parts: THREE.BufferGeometry[] = []
  parts.push(
    part(new THREE.CylinderGeometry(30, 40, 50, 10), C.coral, 0, 25, 0),
  )
  parts.push(
    part(new THREE.CylinderGeometry(31, 31, 12, 10), C.white, 0, 30, 0),
  )
  parts.push(part(new THREE.CylinderGeometry(4, 4, 60, 5), C.ink, 0, 80, 0))
  parts.push(
    part(new THREE.ConeGeometry(18, 22, 8), C.gold, 0, 116, 0, 0, Math.PI),
  )
  parts.push(part(new THREE.SphereGeometry(5, 6, 4), C.gold, 0, 100, 0))
  const s: THREE.BufferGeometry[] = []
  folk(s, 0, 0, 0, '', 9, '#2d6f8f')
  parts.push(merged(s).translate(28, 46, 10))
  return merged(parts)
}

export function Tide({ world }: { world: RefObject<World> }) {
  const shapes = useMemo(
    () => ({
      pools: pools(),
      camp: camp(),
      boat: boatGeometry(),
      buoy: buoy(),
      folk: salvager(),
      ripple: softDisc(C.white, 0.5, 24),
    }),
    [],
  )
  useEffect(
    () => () => Object.values(shapes).forEach((g) => g.dispose()),
    [shapes],
  )
  const boats = useRef<THREE.InstancedMesh>(null)
  const walkers = useRef<THREE.InstancedMesh>(null)
  const bell = useRef<THREE.Group>(null)
  const roll = useMemo(() => {
    const r = rng(8)
    return Array.from({ length: 9 }, () => ({ p: r() * 9, w: 0.3 + r() * 0.4 }))
  }, [])

  useFrame(() => {
    const w = world.current
    const B = boats.current
    const W = walkers.current
    if (!w || !B || !W || !bell.current) return
    const t = w.t
    ROW.forEach(([x, y, rx, ry], i) => {
      const a = (t * 0.07 * w.rush * 140) / Math.max(rx, ry) + i * 2.1
      let px = x + Math.cos(a) * rx
      let py = y + Math.sin(a) * ry
      if (w.launch > 0) {
        const [sx, sy] = along(SAIL_TO, smoothstep(0, 1, w.launch))
        const d = Math.hypot(px - sx, py - sy) || 1
        if (d < 360) {
          px = sx + ((px - sx) / d) * 360
          py = sy + ((py - sy) / d) * 360
        }
      }
      const head = Math.atan2(ry * Math.cos(a), -rx * Math.sin(a))
      e.set(0, -head, Math.sin(t * 1.5 + i) * 0.06)
      q.copy(qPitch).multiply(qb.setFromEuler(e))
      const bob = Math.sin(t * 1.3 + i) * 3
      B.setMatrixAt(
        i,
        m.compose(
          at.set(px, -py + bob * COS, 4 + bob * SIN),
          q,
          sc.set(1.7, 1.7, 1.7),
        ),
      )
    })
    B.instanceMatrix.needsUpdate = true
    roll.forEach((r, i) => {
      let x = 0
      let y = 0
      if (i < 4) {
        const s = Math.sin(t * r.w * 0.25 * w.rush + r.p)
        x = CAMP[0] - 150 + s * 240 - i * 30
        y = CAMP[1] + 140 + Math.cos(t * 0.2 + r.p) * 30 + i * 18
      } else if (i < 7) {
        const a = t * r.w * 0.18 + r.p
        x = BEACH[0] + Math.cos(a) * 160
        y = BEACH[1] + Math.sin(a) * 50
      } else {
        const a = t * r.w * 0.12 + r.p
        x = 900 + Math.cos(a) * 280
        y = 160 + Math.sin(a * 1.3) * 60
      }
      const step = t * 9 + i
      const hop = Math.abs(Math.sin(step)) * 4
      e.set(0, 0, Math.sin(step) * 0.14)
      q.copy(qPitch).multiply(qb.setFromEuler(e))
      W.setMatrixAt(
        i,
        m.compose(at.set(x, -y + hop * COS, 4 + hop * SIN), q, sc.set(1, 1, 1)),
      )
    })
    W.instanceMatrix.needsUpdate = true
    bell.current.rotation.z = Math.sin(t * 1.1) * 0.12 * (1 + w.danger * 4)
  })

  return (
    <group>
      <mesh geometry={shapes.pools} renderOrder={42}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>
      <group position={[CAMP[0], -CAMP[1], 0]} quaternion={qPitch}>
        <mesh geometry={shapes.camp}>
          <meshStandardMaterial
            vertexColors
            flatShading
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      <group position={[BUOY[0], -BUOY[1], 0]}>
        <group ref={bell} quaternion={qPitch}>
          <mesh geometry={shapes.buoy}>
            <meshStandardMaterial vertexColors flatShading roughness={0.6} />
          </mesh>
        </group>
      </group>
      <instancedMesh
        ref={boats}
        args={[shapes.boat, undefined, ROW.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.7}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      <instancedMesh
        ref={walkers}
        args={[shapes.folk, undefined, roll.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
    </group>
  )
}
