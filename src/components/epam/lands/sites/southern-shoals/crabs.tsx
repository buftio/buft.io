'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { C, crab, merged, part, ring, rng, salvager, smoothstep } from './kit'
import { HOARD, POOL, along, fromShip } from './plan'
import { half, zOf } from './wreck'
import type { World } from './world'

const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const q = new THREE.Quaternion()
const qb = new THREE.Quaternion()
const e = new THREE.Euler()
const at = new THREE.Vector3()
const off = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()

export const KEG = fromShip(half(0.1) + 250, zOf(0.05))
export const CRAB_PATH: [number, number][] = [
  KEG,
  [KEG[0] + 15, 90],
  [560, 140],
  [745, 230],
  [745, 420],
  [540, 480],
  [HOARD[0] + 30, HOARD[1] + 50],
]

type Crab = {
  kind: number
  speed: number
  p: number
  s: number
  x: number
  y: number
}
const N = 20

function crabs(): Crab[] {
  const roll = rng(21)
  const out: Crab[] = [{ kind: 2, speed: 0, p: 0, s: 1.4, x: 0, y: 0 }]
  for (let k = 0; k < 14; k++)
    out.push({
      kind: 0,
      speed: 0.018 + roll() * 0.017,
      p: roll() * 2,
      s: 0.8 + roll() * 0.4,
      x: 0,
      y: 0,
    })
  for (let k = 0; k < N - 15; k++) {
    const a = (k / (N - 15)) * Math.PI * 2 + roll()
    out.push({
      kind: 1,
      speed: 0.3 + roll() * 0.3,
      p: roll() * 6,
      s: 0.85 + roll() * 0.3,
      x: POOL[0] + Math.cos(a) * 150,
      y: POOL[1] + Math.sin(a) * 90,
    })
  }
  return out
}

function hoard() {
  const parts: THREE.BufferGeometry[] = []
  const roll = rng(3)
  for (let k = 0; k < 34; k++) {
    const a = roll() * Math.PI * 2
    const r = Math.sqrt(roll()) * 70
    const y = (1 - r / 70) * 40 + roll() * 6
    const g =
      k % 3
        ? ring(9 + roll() * 3, 3.6)
        : part(new THREE.SphereGeometry(8, 6, 4), C.gold)
    parts.push(
      part(
        g,
        k % 5 ? C.gold : C.rind,
        Math.cos(a) * r * 1.3,
        y,
        Math.sin(a) * r * 0.7,
        roll() * 3,
        roll() * 3,
        roll() * 3,
      ),
    )
  }
  parts.push(
    part(new THREE.CylinderGeometry(3, 3, 120, 5), C.driftD, 95, 60, -20),
  )
  const flag = new THREE.PlaneGeometry(60, 34)
  parts.push(part(flag, C.crab, 126, 100, -20))
  parts.push(part(new THREE.CircleGeometry(9, 10), C.gold, 120, 100, -19))
  const king = crab(2.6)
  king.translate(0, 34, 0)
  parts.push(king)
  for (let k = 0; k < 5; k++)
    parts.push(
      part(new THREE.ConeGeometry(5, 16, 4), C.gold, -20 + k * 10, 34 + 70, 0),
    )
  parts.push(
    part(
      new THREE.CylinderGeometry(28, 28, 8, 12, 1, true),
      C.gold,
      0,
      34 + 62,
      0,
    ),
  )
  return merged(parts)
}

function keg() {
  const parts = [
    part(new THREE.CylinderGeometry(24, 24, 44, 9), C.drift, 0, 22, 0),
    part(new THREE.CylinderGeometry(25, 25, 4, 9), C.driftD, 0, 10, 0),
    part(new THREE.CylinderGeometry(25, 25, 4, 9), C.driftD, 0, 34, 0),
  ]
  for (let k = 0; k < 6; k++)
    parts.push(
      part(
        new THREE.TorusGeometry(8, 3, 5, 10),
        C.gold,
        -12 + (k % 3) * 12,
        47 + Math.floor(k / 3) * 4,
        -6 + Math.floor(k / 3) * 8,
        0,
        0,
        Math.PI / 2,
      ),
    )
  const g = merged(parts)
  g.applyQuaternion(qPitch)
  g.translate(KEG[0] - 40, -KEG[1] + 10, 0)
  return g
}

function place(
  x: number,
  y: number,
  s: number,
  wob: number,
  hop: number,
  turn = 0,
) {
  e.set(0, turn, wob)
  q.copy(qPitch).multiply(qb.setFromEuler(e))
  return m.compose(at.set(x, -y + hop * 0.64, hop * 0.77), q, sc.set(s, s, s))
}

export function Crabs({ world }: { world: RefObject<World> }) {
  const shapes = useMemo(
    () => ({
      crab: crab(),
      loot: ring(),
      hoard: hoard(),
      keg: keg(),
      claw: merged([
        part(new THREE.BoxGeometry(10, 40, 10), C.crabD, 0, 20, 0),
        part(new THREE.SphereGeometry(16, 8, 6), C.crab, 0, 46, 0),
        ring(13, 4.5),
      ]),
      folk: salvager(),
    }),
    [],
  )
  useEffect(
    () => () => Object.values(shapes).forEach((g) => g.dispose()),
    [shapes],
  )
  const list = useMemo(() => crabs(), [])
  const body = useRef<THREE.InstancedMesh>(null)
  const loot = useRef<THREE.InstancedMesh>(null)
  const claw = useRef<THREE.Mesh>(null)
  const chaser = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const w = world.current
    const P = body.current
    const G = loot.current
    const H = chaser.current
    if (!w || !P || !G || !claw.current || !H) return
    const t = w.t
    const cyc = t % 26
    list.forEach((c, i) => {
      let x = c.x
      let y = c.y
      let carry = false
      let wob = 0
      let hop = 0
      if (c.kind === 0) {
        const s = (t * c.speed * w.rush + c.p) % 2
        carry = s < 1
        const u = carry ? 1 - s : s - 1
        ;[x, y] = along(CRAB_PATH, 1 - u)
        x += Math.sin(i * 7.1) * 22
        y += Math.cos(i * 3.3) * 16
        wob = Math.sin(t * 14 + i) * 0.16
        hop = Math.abs(Math.sin(t * 14 + i)) * 4
      } else if (c.kind === 1) {
        wob = Math.sin(t * c.speed * 3 + c.p) * 0.1
        hop = Math.max(0, Math.sin(t * c.speed + c.p)) * 6
      } else {
        const u =
          cyc < 10 ? 1 - cyc / 10 : cyc < 11 ? 0 : cyc < 17 ? (cyc - 11) / 6 : 1
        carry = cyc >= 11 && cyc < 24
        ;[x, y] = along(CRAB_PATH, u)
        const run = cyc >= 11 && cyc < 17
        wob = Math.sin(t * (run ? 26 : 12)) * 0.2
        hop = Math.abs(Math.sin(t * (run ? 26 : 12))) * (run ? 8 : 3)
        const v =
          cyc < 11
            ? 0
            : cyc < 17
              ? Math.max(0, u - 0.14)
              : cyc < 19
                ? 0.86
                : cyc < 25
                  ? 0.86 * (1 - (cyc - 19) / 6)
                  : 0
        const [cx, cy] = along(CRAB_PATH, v)
        const fume = cyc >= 17 && cyc < 19
        const legs = cyc >= 11 && cyc < 17 ? 22 : 8
        H.position.set(cx - 30, -cy - 20 + Math.abs(Math.sin(t * legs)) * 6, 8)
        e.set(
          0,
          cyc >= 19 ? -0.6 : 0.5,
          fume ? Math.sin(t * 30) * 0.25 : Math.sin(t * legs) * 0.12,
        )
        H.quaternion.copy(qPitch).multiply(qb.setFromEuler(e))
      }
      P.setMatrixAt(i, place(x, y, c.s, wob, hop))
      if (carry) {
        off.set(0, 40 * c.s, 6 * c.s).applyQuaternion(q)
        m.setPosition(at.add(off))
      } else m.scale(sc.set(0.001, 0.001, 0.001))
      G.setMatrixAt(i, m)
    })
    P.instanceMatrix.needsUpdate = true
    G.instanceMatrix.needsUpdate = true
    const cheer = smoothstep(0.9, 1, Math.abs(Math.sin(t * 0.7)))
    claw.current.rotation.z = -0.5 + Math.sin(t * 2.2) * 0.25 - cheer * 0.4
  })

  return (
    <group>
      <instancedMesh
        ref={body}
        args={[shapes.crab, undefined, list.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.55} />
      </instancedMesh>
      <instancedMesh
        ref={loot}
        args={[shapes.loot, undefined, list.length]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          vertexColors
          emissive={C.rind}
          emissiveIntensity={0.35}
          roughness={0.3}
          metalness={0.3}
        />
      </instancedMesh>
      <group position={[HOARD[0], -HOARD[1], 0]} quaternion={qPitch}>
        <mesh geometry={shapes.hoard}>
          <meshStandardMaterial
            vertexColors
            flatShading
            roughness={0.4}
            emissive={C.rind}
            emissiveIntensity={0.12}
          />
        </mesh>
        <mesh ref={claw} geometry={shapes.claw} position={[-48, 70, 8]}>
          <meshStandardMaterial vertexColors flatShading roughness={0.5} />
        </mesh>
      </group>
      <mesh geometry={shapes.keg}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
      <mesh ref={chaser} geometry={shapes.folk} scale={1.1}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
    </group>
  )
}
