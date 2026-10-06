'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { ISLES, size } from './isles'
import { gull, walker } from './kit'
import { BEACH, BRIDGES, LIGHT, QUAY, SPECIAL, WORKS, lift, rng, span } from './plan'

const SIN50 = Math.sin((50 * Math.PI) / 180)
const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const qSway = new THREE.Quaternion()
const q = new THREE.Quaternion()
const Z = new THREE.Vector3(0, 0, 1)
const Y = new THREE.Vector3(0, 1, 0)
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()

type Walk = { kind: 0 | 1; x: number; y: number; ax: number; ay: number; w: number; p: number }

function routes() {
  const roll = rng(5)
  const out: Walk[] = []
  BRIDGES.slice(0, 9).forEach(([a, b]) => {
    const [[x0, y0], [x1, y1]] = span(a, b, -34)
    out.push({ kind: 1, x: x0, y: y0, ax: x1 - x0, ay: y1 - y0, w: 22 / Math.hypot(x1 - x0, y1 - y0), p: roll() * 9 })
  })
  const homes = ISLES.map((_, k) => k).filter((k) => !SPECIAL.has(k) && size(ISLES[k]) > 95 && Math.hypot(ISLES[k][0], ISLES[k][1]) < 1350)
  homes.slice(0, 16).forEach((k) => {
    const r = size(ISLES[k])
    out.push({ kind: 0, x: ISLES[k][0], y: ISLES[k][1] + r * 0.15, ax: r * 0.4, ay: r * 0.28, w: (0.25 + roll() * 0.3) * (roll() < 0.5 ? -1 : 1), p: roll() * 9 })
  })
  for (const k of [WORKS, WORKS, WORKS, QUAY, QUAY, BEACH]) {
    const r = size(ISLES[k])
    out.push({ kind: 0, x: ISLES[k][0], y: ISLES[k][1] + r * 0.1, ax: r * 0.45, ay: r * 0.3, w: 0.3 + roll() * 0.3, p: roll() * 9 })
  }
  return out
}

const NESTS: [number, number, number][] = [
  [ISLES[LIGHT][0], ISLES[LIGHT][1] - 120, 170],
  [ISLES[LIGHT][0] + 40, ISLES[LIGHT][1] - 90, 120],
  [ISLES[QUAY][0], ISLES[QUAY][1] - 60, 200],
  [ISLES[WORKS][0], ISLES[WORKS][1] - 70, 150],
  [ISLES[BEACH][0], ISLES[BEACH][1] - 60, 180],
  [ISLES[QUAY][0] - 200, ISLES[QUAY][1] - 30, 240],
]

export function Islanders({ danger, reduced }: { danger: RefObject<number>; reduced: boolean }) {
  const shapes = useMemo(() => ({ body: walker(), bird: gull() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const walks = useMemo(() => routes(), [])
  const people = useRef<THREE.InstancedMesh>(null)
  const birds = useRef<THREE.InstancedMesh>(null)
  const pace = useRef(0)

  useFrame((state, delta) => {
    const P = people.current
    const G = birds.current
    if (!P || !G) return
    const run = (danger.current ?? 0) > 0.05 ? 3 : 1
    pace.current += reduced ? 0 : Math.min(delta, 0.1) * run
    const t = pace.current
    walks.forEach((w, i) => {
      const s = t * w.w + w.p
      let x = w.x
      let y = w.y
      if (w.kind === 1) {
        const u = (Math.sin(s) + 1) / 2
        x += w.ax * u
        y += w.ay * u
      } else {
        const v = s + Math.sin(s * 1.7) * 0.4
        x += Math.cos(v) * w.ax
        y += Math.sin(v) * w.ay
      }
      const step = t * 8 + i
      const hop = Math.abs(Math.sin(step)) * 4
      qSway.setFromAxisAngle(Z, Math.sin(step) * 0.14)
      q.copy(qPitch).multiply(qSway)
      P.setMatrixAt(i, m.compose(at.set(x, -y + hop * Math.cos(0.873), 5 + hop * SIN50), q, sc.set(1, 1, 1)))
    })
    const tb = reduced ? 0 : state.clock.elapsedTime
    NESTS.forEach(([x, y, r], i) => {
      const a = tb * (0.35 + i * 0.05) * (i % 2 ? 1 : -1) + i * 2
      const [up, z] = lift(160 + 30 * Math.sin(tb + i))
      const flap = 0.35 + 0.65 * Math.abs(Math.sin(tb * 5 + i))
      q.copy(qPitch).multiply(qSway.setFromAxisAngle(Y, Math.sin(a) * 0.6))
      G.setMatrixAt(i, m.compose(at.set(x + Math.cos(a) * r, -(y + Math.sin(a) * r * 0.6) + up, z), q, sc.set(1, flap, 1)))
    })
    P.instanceMatrix.needsUpdate = true
    G.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={people} args={[shapes.body, undefined, walks.length]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={birds} args={[shapes.bird, undefined, NESTS.length]} frustumCulled={false} renderOrder={49}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </instancedMesh>
    </group>
  )
}
