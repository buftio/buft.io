'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { C, part, merged, salvager, smoothstep, softDisc } from './kit'
import { SAIL_TO, SHIP, along } from './plan'
import { boards, FISH, fishGeometry } from './rigging'
import {
  SAIL,
  gangGeometry,
  glowGeometry,
  lanternGeometry,
  pennantGeometry,
  sailGeometry,
} from './gear'
import {
  CASTLE,
  MAIN_H,
  MAIN_Z,
  deckY,
  half,
  wreckGeometry,
  zOf,
} from './wreck'
import type { World } from './world'

const SIN50 = Math.sin((50 * Math.PI) / 180)
const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const q = new THREE.Quaternion()
const qa = new THREE.Quaternion()
const e = new THREE.Euler()
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()

type Crew = { kind: number; x: number; y: number; z: number; p: number }
const mainDeck = deckY(MAIN_Z / 550)
const roof = deckY(CASTLE.z0) + CASTLE.h + 10

const CREW: Crew[] = [
  { kind: 0, x: 0, y: mainDeck + 566, z: MAIN_Z, p: 0 },
  { kind: 1, x: -70, y: mainDeck + 266, z: MAIN_Z + 14, p: 1 },
  { kind: 2, x: -50, y: 0, z: 0, p: 2 },
  { kind: 3, x: half(0.35) + 26, y: 83, z: zOf(0.24), p: 0.3 },
  { kind: 3, x: half(0.35) + 26, y: 163, z: zOf(0.45), p: 1.9 },
  { kind: 4, x: FISH.x, y: roof, z: FISH.z, p: 0 },
  ...[-0.55, -0.4, -0.22, -0.05, 0.12, 0.3].map((zn, k) => ({
    kind: 5,
    x: half(zn) * 0.72,
    y: deckY(zn),
    z: zOf(zn),
    p: k,
  })),
]

export function Ship({ world }: { world: RefObject<World> }) {
  const shapes = useMemo(
    () => ({
      wreck: wreckGeometry(),
      sail: sailGeometry(),
      pennant: pennantGeometry(),
      lantern: lanternGeometry(),
      glow: glowGeometry(),
      gang: gangGeometry(),
      folk: salvager(),
      fish: fishGeometry(),
      line: merged([
        part(
          new THREE.CylinderGeometry(0.8, 0.8, 1, 3, 1, true),
          C.driftL,
          0,
          -0.5,
          0,
        ),
      ]),
      shadow: softDisc(C.ink, 0.4),
      boot: merged([
        part(new THREE.BoxGeometry(16, 34, 16), C.driftD, 0, -17, 0),
        part(new THREE.BoxGeometry(30, 12, 16), C.driftD, 8, -30, 0),
        part(new THREE.SphereGeometry(5, 5, 4), C.glass, 18, -20, 0),
      ]),
    }),
    [],
  )
  const signs = useMemo(() => boards(), [])
  useEffect(
    () => () => {
      Object.values(shapes).forEach((g) => g.dispose())
      signs.geometry.dispose()
      signs.texture.dispose()
    },
    [shapes, signs],
  )
  const outer = useRef<THREE.Group>(null)
  const shade = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Group>(null)
  const sail = useRef<THREE.Mesh>(null)
  const pennant = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.Mesh>(null)
  const gang = useRef<THREE.Mesh>(null)
  const crew = useRef<THREE.InstancedMesh>(null)
  const line = useRef<THREE.Mesh>(null)
  const boot = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const w = world.current
    const o = outer.current
    const g = inner.current
    const P = crew.current
    if (
      !w ||
      !o ||
      !g ||
      !P ||
      !shade.current ||
      !sail.current ||
      !pennant.current ||
      !glow.current ||
      !gang.current ||
      !line.current ||
      !boot.current
    )
      return
    const t = w.t
    const u = smoothstep(0, 1, w.launch)
    const [x, y] = along(SAIL_TO, u)
    const afloat = smoothstep(0, 0.06, w.launch)
    const turn = SHIP.turn - 2.54 * smoothstep(0.12, 0.55, w.launch)
    o.position.set(x, -y, afloat * (8 + Math.sin(t * 1.3) * 6))
    const lx = -Math.sin(turn)
    const ly = Math.cos(turn) * SIN50
    shade.current.rotation.z = Math.atan2(ly, lx)
    shade.current.scale.set(Math.hypot(lx, ly) * 330 * SHIP.s, 95 * SHIP.s, 1)
    g.rotation.set(
      afloat * Math.sin(t * 0.8) * 0.03,
      turn,
      0.05 * (1 - afloat) + afloat * Math.sin(t * 0.9) * 0.05,
    )
    const up = Math.max(smoothstep(0.1, 0.3, w.danger), afloat)
    sail.current.scale.set(
      1,
      0.82 + 0.18 * up,
      0.55 + 0.3 * Math.sin(t * 0.7) + up * 0.6,
    )
    pennant.current.rotation.y =
      Math.sin(t * 2.1) * 0.35 + Math.sin(t * 5.3) * 0.08
    const blink =
      w.danger > 0.06
        ? Math.sin(t * 9) > 0
          ? 1.15
          : 0.6
        : 1 + Math.sin(t * 1.7) * 0.08
    glow.current.scale.setScalar(blink)
    q.copy(qPitch).multiply(qa.setFromEuler(g.rotation)).invert()
    glow.current.quaternion.copy(q)
    gang.current.visible = w.launch <= 0
    const face = -turn
    CREW.forEach((c, i) => {
      let px = c.x
      let py = c.y
      let pz = c.z
      let s = 1
      let rz = 0
      let ry = face
      if (c.kind === 0) py += 12 + Math.max(0, Math.sin(t * 0.6 + c.p)) * 18
      if (c.kind === 1) rz = Math.sin(t * 3 + c.p) * 0.15
      if (c.kind === 2) {
        const zn = Math.sin(t * 0.25 * w.rush) * 0.55 - 0.15
        pz = zOf(zn)
        py = deckY(zn)
        ry = Math.cos(t * 0.25 * w.rush) > 0 ? Math.PI : 0
        rz = Math.sin(t * 7) * 0.1
      }
      if (c.kind === 3) {
        py += Math.abs(Math.sin(t * 6 * w.rush + c.p)) * 6
        rz = Math.sin(t * 6 * w.rush + c.p) * 0.12
        ry = face + 0.9
      }
      if (c.kind === 4) rz = Math.sin(t * 0.5) * 0.05
      if (c.kind === 5) {
        s = smoothstep(i * 0.06 - 0.3, i * 0.06 - 0.15, w.board)
        py += Math.abs(Math.sin(t * 4 + c.p)) * 10 * w.board
        rz = Math.sin(t * 5 + c.p) * 0.2
      }
      e.set(0, ry, rz)
      P.setMatrixAt(
        i,
        m.compose(at.set(px, py, pz), qa.setFromEuler(e), sc.set(s, s, s)),
      )
    })
    P.instanceMatrix.needsUpdate = true
    const cyc = (t + 3) % 16
    const reel =
      cyc < 11 ? 0 : cyc < 12 ? cyc - 11 : cyc < 14 ? 1 : 1 - (cyc - 14) / 2
    const len =
      FISH.tip.y - 6 + Math.sin(t * 1.4) * 4 - reel * (FISH.tip.y - 70)
    line.current.scale.set(1, Math.max(1, len), 1)
    boot.current.position.set(FISH.tip.x, FISH.tip.y - len, FISH.tip.z)
    boot.current.rotation.z = Math.sin(t * 3) * 0.3 * reel
    boot.current.scale.setScalar(reel > 0.6 ? 1 : 0.001)
  })

  const top = mainDeck + MAIN_H
  return (
    <group ref={outer} position={[SHIP.x, -SHIP.y, 0]}>
      <mesh
        ref={shade}
        geometry={shapes.shadow}
        position={[0, 40, 1]}
        renderOrder={42}
      >
        <meshBasicMaterial
          vertexColors
          transparent
          depthWrite={false}
          depthTest={false}
        />
      </mesh>
      <group quaternion={qPitch} scale={SHIP.s}>
        <group ref={inner} rotation={[0, SHIP.turn, 0.05]}>
          <mesh geometry={shapes.wreck} renderOrder={44}>
            <meshStandardMaterial
              vertexColors
              flatShading
              roughness={0.85}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            ref={sail}
            geometry={shapes.sail}
            position={[0, SAIL.y(), SAIL.z]}
            renderOrder={44}
          >
            <meshStandardMaterial
              vertexColors
              flatShading
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh
            ref={pennant}
            geometry={shapes.pennant}
            position={[0, top + 40, MAIN_Z]}
          >
            <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={shapes.lantern} position={[0, top + 18, MAIN_Z]}>
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh
            ref={glow}
            geometry={shapes.glow}
            position={[0, top + 18, MAIN_Z]}
            renderOrder={46}
          >
            <meshBasicMaterial
              color={C.gold}
              transparent
              opacity={0.22}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh ref={gang} geometry={shapes.gang}>
            <meshStandardMaterial vertexColors flatShading roughness={0.8} />
          </mesh>
          <mesh geometry={shapes.fish}>
            <meshStandardMaterial vertexColors flatShading />
          </mesh>
          <mesh
            ref={line}
            geometry={shapes.line}
            position={[FISH.tip.x, FISH.tip.y, FISH.tip.z]}
          >
            <meshBasicMaterial vertexColors />
          </mesh>
          <mesh ref={boot} geometry={shapes.boot}>
            <meshStandardMaterial vertexColors flatShading />
          </mesh>
          <mesh geometry={signs.geometry}>
            <meshBasicMaterial
              map={signs.texture}
              transparent
              side={THREE.DoubleSide}
            />
          </mesh>
          <instancedMesh
            ref={crew}
            args={[shapes.folk, undefined, CREW.length]}
            frustumCulled={false}
          >
            <meshStandardMaterial vertexColors flatShading roughness={0.7} />
          </instancedMesh>
        </group>
      </group>
    </group>
  )
}
