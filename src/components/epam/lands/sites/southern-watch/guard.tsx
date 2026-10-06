'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { guard, PQ, SACK, sack, stake, upright, zee } from './kit'
import { ARC, GATE_A, LAUNCHER, rand, smooth, TOWER, type Mood, type P } from './plan'

const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const UP = new THREE.Vector3(0, 1, 0)
const AXIS = new THREE.Vector3()
const UPV = new THREE.Vector3(0, 1, 0).applyQuaternion(PQ)

type Ref = { mood: RefObject<Mood>; reduced: boolean }

const gap = (a: number) => Math.abs(a - GATE_A) < 0.09

function along(step: number, r: number, shift = 0) {
  const out: number[] = []
  const n = Math.floor(((ARC.a1 - ARC.a0) * r) / step)
  for (let k = 0; k <= n; k++) {
    const a = ARC.a0 + ((k + shift) / n) * (ARC.a1 - ARC.a0)
    if (a <= ARC.a1 && !gap(a)) out.push(a)
  }
  return out
}

const STAKES = [...along(70, ARC.r + 60).map((a) => ({ a, r: ARC.r + 60, row: 0 })), ...along(70, ARC.r + 140, 0.5).map((a) => ({ a, r: ARC.r + 140, row: 1 }))]
const SACKS = [...along(70, ARC.r - 10).map((a) => ({ a, h: 0 })), ...along(70, ARC.r - 10, 0.5).map((a) => ({ a, h: 1 }))]
const SACK_TONES = [SACK, '#e9b553', '#f7d98c', '#dca84a'].map((x) => new THREE.Color(x))

export function Wall({ mood, reduced }: Ref) {
  const stakeGeo = useMemo(() => stake(), [])
  const sackGeo = useMemo(() => sack(), [])
  useEffect(() => () => [stakeGeo, sackGeo].forEach((g) => g.dispose()), [stakeGeo, sackGeo])
  const stakes = useRef<THREE.InstancedMesh>(null)
  const sacks = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const b = sacks.current
    if (!b) return
    SACKS.forEach(({ a, h }, k) => {
      const tx = -Math.sin(a)
      const ty = Math.cos(a)
      q.setFromAxisAngle(UP, Math.atan2(-ty, tx) + (rand(k) - 0.5) * 0.3).premultiply(PQ)
      v.set(Math.cos(a) * (ARC.r - 10), -Math.sin(a) * (ARC.r - 10), 0).addScaledVector(UPV, h * 17)
      const z = 34 + rand(k + 9) * 6
      b.setMatrixAt(k, m.compose(v, q, s.set(z, z * (1 - h * 0.15), z)))
      b.setColorAt(k, SACK_TONES[k % 4])
    })
    b.instanceMatrix.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const a = stakes.current
    if (!a) return
    const t = reduced ? 0 : state.clock.elapsedTime
    const alarm = mood.current.alarm
    STAKES.forEach(({ a: ang, r, row }, k) => {
      const up = row === 0 ? 0.55 + 0.45 * smooth(0, 0.6, alarm) : smooth(0.15 + rand(k) * 0.4, 0.45 + rand(k) * 0.4, alarm)
      const lean = 1.2 - up * 0.45 + (rand(k + 3) - 0.5) * 0.25
      AXIS.set(Math.cos(ang) * Math.sin(lean), Math.cos(lean), Math.sin(ang) * Math.sin(lean)).normalize()
      q.setFromUnitVectors(UP, AXIS).premultiply(PQ)
      v.set(Math.cos(ang) * r, -Math.sin(ang) * r, 0)
      const shake = alarm * Math.sin(t * 20 + k) * 0.03
      const z = up * (82 + rand(k + 1) * 26) * (1 + shake)
      a.setMatrixAt(k, m.compose(v, q, s.set(z * (row ? 0.9 : 1), z, z)))
    })
    a.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={sacks} args={[sackGeo, undefined, SACKS.length]} frustumCulled={false} renderOrder={44}>
        <meshStandardMaterial vertexColors flatShading roughness={0.95} />
      </instancedMesh>
      <instancedMesh ref={stakes} args={[stakeGeo, undefined, STAKES.length]} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

const N = 22
const arcP = (a: number, r: number): P => [Math.cos(a) * r, Math.sin(a) * r]
const POSTS = Array.from({ length: N }, (_, k) => {
  const a = ARC.a0 + 0.12 + ((ARC.a1 - ARC.a0 - 0.24) * (k + 0.5)) / N
  return { a: gap(a) ? a + 0.12 : a, p: arcP(gap(a) ? a + 0.12 : a, ARC.r - 95) }
})
const HOMES: P[] = Array.from({ length: N }, (_, k) => {
  if (k === 3) return arcP(-1.35, ARC.r - 20)
  if (k < 3) return arcP(-1.6 + k * 0.9, ARC.r - 110)
  const near = k % 2 ? TOWER : LAUNCHER
  const a = rand(k) * Math.PI * 2
  const r = 200 + rand(k + 5) * 160
  return [near[0] + Math.cos(a) * r, near[1] + Math.sin(a) * r * 0.7 + 60]
})
const RING: P[] = Array.from({ length: N }, (_, k) => {
  const a = (k / N) * Math.PI * 2
  return [TOWER[0] + Math.cos(a) * 330, TOWER[1] + 90 + Math.sin(a) * 230]
})

function face(dx: number, dy: number) {
  const a = Math.atan2(dx, dy)
  const wrap = Math.atan2(Math.sin(a), Math.cos(a))
  return wrap * 0.6
}

export function Guards({ mood, reduced }: Ref) {
  const geo = useMemo(() => guard(), [])
  const zGeo = useMemo(() => zee(), [])
  useEffect(() => () => [geo, zGeo].forEach((g) => g.dispose()), [geo, zGeo])
  const ref = useRef<THREE.InstancedMesh>(null)
  const zs = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const g = ref.current
    const z = zs.current
    if (!g || !z) return
    const t = reduced ? state.clock.elapsedTime * 0.05 : state.clock.elapsedTime
    const { alarm, stand } = mood.current
    for (let k = 0; k < N; k++) {
      const go = smooth((k % 7) * 0.04, (k % 7) * 0.04 + 0.3, alarm)
      const home = HOMES[k]
      let hx = home[0]
      let hy = home[1]
      let dir = 0
      if (k < 3) {
        const a = -1.6 + k * 0.9 + Math.sin(t * 0.07 + k * 2) * 0.32
        const p = arcP(a, ARC.r - 110)
        hx = p[0]
        hy = p[1]
        dir = Math.cos(t * 0.07 + k * 2) > 0 ? 1 : -1
      }
      const post = POSTS[k].p
      const ring = RING[k]
      const ls = smooth(k / N / 2, k / N / 2 + 0.5, stand)
      const x = (hx + (post[0] - hx) * go) * (1 - ls) + ring[0] * ls
      const y = (hy + (post[1] - hy) * go) * (1 - ls) + ring[1] * ls
      const moving = go > 0.02 && go < 0.98
      const sleep = k === 3 && alarm < 0.15
      let turn = 0
      if (k < 3 && go < 0.5) turn = face(-Math.sin(POSTS[k].a) * dir, Math.cos(POSTS[k].a) * dir)
      else if (moving) turn = face(post[0] - hx, post[1] - hy)
      else if (go >= 0.98) turn = face(Math.cos(POSTS[k].a), Math.sin(POSTS[k].a))
      if (ls > 0.5) turn = face(ring[0] - TOWER[0], ring[1] - TOWER[1] - 90)
      const hop = moving ? Math.abs(Math.sin(t * 14 + k)) * 14 : go > 0.98 ? Math.abs(Math.sin(t * (3 + alarm * 5) + k * 1.3)) * 5 * alarm : k < 3 ? Math.abs(Math.sin(t * 6 + k)) * 3 : Math.sin(t * 1.3 + k) * 1.2
      upright(q, turn, sleep ? 1.45 : Math.sin(t * 2 + k) * 0.05)
      v.set(x, -y, sleep ? 18 : 0).addScaledVector(UPV, hop + (sleep ? 12 : 0))
      g.setMatrixAt(k, m.compose(v, q, s.setScalar(18)))
    }
    g.instanceMatrix.needsUpdate = true
    const sleeper = HOMES[3]
    const zz = 1 - smooth(0.05, 0.15, alarm)
    for (let j = 0; j < 3; j++) {
      const life = (t * 0.33 + j / 3) % 1
      v.set(sleeper[0] + 30 + life * 70 + Math.sin(life * 9) * 12, -sleeper[1] + 40 + life * 150, 120)
      const r = (10 + life * 18) * zz * Math.sin(life * Math.PI)
      q2.setFromAxisAngle(AXIS.set(0, 0, 1), Math.sin(life * 6 + j) * 0.3)
      z.setMatrixAt(j, m.compose(v, q2, s.set(r, r, 1)))
    }
    z.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={zs} args={[zGeo, undefined, 3]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial color="#fff6e8" toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
