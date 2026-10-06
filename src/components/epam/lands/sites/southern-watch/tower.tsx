'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { CABIN, LEGS, T } from './build'
import { HAZARD, MINT, PQ } from './kit'
import { BOOM, signal, smooth, TOWER, type Mood } from './plan'
import { arm, lookout, pennant } from './props'

const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const e = new THREE.Euler()
const TM = new THREE.Matrix4().compose(new THREE.Vector3(TOWER[0], -TOWER[1], 0), PQ, new THREE.Vector3(T, T, T))
const CALM = new THREE.Color(MINT)
const RED = new THREE.Color('#ff3b3b')
const DIM = new THREE.Color('#6b3440')
const HOT = new THREE.Color('#ff5a2a')
const POST = new THREE.Vector3(BOOM[0], -BOOM[1], 0)

type Ref = { mood: RefObject<Mood>; reduced: boolean }

const at = (x: number, y: number, z: number) => v.set(x, y, z).applyMatrix4(TM)

export function Tower({ mood, reduced }: Ref) {
  const lookGeo = useMemo(() => lookout(), [])
  const armGeo = useMemo(() => arm(), [])
  const flagGeo = useMemo(() => pennant(), [])
  useEffect(() => () => [lookGeo, armGeo, flagGeo].forEach((g) => g.dispose()), [lookGeo, armGeo, flagGeo])
  const pupils = useRef<THREE.InstancedMesh>(null)
  const lamp = useRef<THREE.Mesh>(null)
  const flag = useRef<THREE.Mesh>(null)
  const boom = useRef<THREE.Mesh>(null)
  const man = useRef<THREE.Mesh>(null)
  const lift = useRef(0)

  useFrame((state, dt) => {
    const p = pupils.current
    const l = lamp.current
    const f = flag.current
    const b = boom.current
    const w = man.current
    if (!p || !l || !f || !b || !w) return
    const t = reduced ? state.clock.elapsedTime * 0.05 : state.clock.elapsedTime
    const { alarm } = mood.current
    const glance = Math.sin(t * 0.23) > 0.75 ? -0.7 : 1
    const jit = alarm * Math.sin(t * 31) * 0.04
    const lx = 0.22 * glance + jit
    const ly = 0.16 + Math.sin(t * 0.5) * 0.04 * (1 - alarm)
    const r = 0.28 - alarm * 0.13
    const [cx, cy, cz] = CABIN
    for (const [k, sx] of [[0, -1], [1, 1]]) {
      at(cx + sx * 0.5 + lx, cy + 0.2 + ly, cz + 0.72 + 0.34)
      p.setMatrixAt(k, m.compose(v, PQ, s.setScalar(r * T)))
    }
    p.instanceMatrix.needsUpdate = true

    const blink = 0.5 + 0.5 * Math.sin(t * 9)
    at(cx, cy + 2.75, cz)
    l.position.copy(v)
    l.scale.setScalar(T * (0.32 + alarm * 0.12 * blink))
    ;(l.material as THREE.MeshBasicMaterial).color.copy(DIM).lerp(alarm > 0.05 ? RED : HOT, alarm > 0.05 ? alarm * blink : 0.25)

    at(1.3, LEGS + 2.15, -1.3)
    f.position.copy(v)
    q.setFromEuler(e.set(0, Math.sin(t * 2.3) * 0.35 - 0.2, Math.sin(t * 3.7) * 0.06)).premultiply(PQ)
    f.quaternion.copy(q)
    f.scale.set(T * (1.5 + alarm * 0.4) * (0.92 + Math.sin(t * 5) * 0.08), T * (0.9 + alarm * 0.2), T)
    ;(f.material as THREE.MeshBasicMaterial).color.copy(CALM).lerp(RED, smooth(0.1, 0.4, alarm))

    const sweep = alarm > 0.1 ? Math.sin(t * 2.6) * 0.5 + 0.6 : 0.75 + Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.11) * 0.3
    at(0.15, LEGS + 0.25, 0.9)
    w.position.copy(v)
    q.setFromEuler(e.set(-0.15, sweep, Math.sin(t * 1.7) * 0.05 + alarm * Math.sin(t * 19) * 0.04)).premultiply(PQ)
    w.quaternion.copy(q)
    w.scale.setScalar(26)

    const want = alarm > 0.35 ? 1 : signal.gate
    lift.current += (want - lift.current) * Math.min(1, dt * 2)
    b.position.set(POST.x, POST.y, 0).addScaledVector(v.set(0, 1.25, 0).applyQuaternion(PQ), 95)
    q.setFromEuler(e.set(-1.25 * lift.current, 0, 0)).premultiply(PQ)
    b.quaternion.copy(q)
    b.scale.setScalar(95)
  })

  return (
    <group>
      <instancedMesh ref={pupils} args={[undefined, undefined, 2]} frustumCulled={false} renderOrder={47}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#2a1630" />
      </instancedMesh>
      <mesh ref={lamp} frustumCulled={false} renderOrder={47}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color={HAZARD} toneMapped={false} />
      </mesh>
      <mesh ref={flag} geometry={flagGeo} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial color={MINT} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={man} geometry={lookGeo} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </mesh>
      <mesh ref={boom} geometry={armGeo} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </mesh>
    </group>
  )
}
