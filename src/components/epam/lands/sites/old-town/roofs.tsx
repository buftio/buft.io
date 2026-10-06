'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TILT, UP_Y, UP_Z } from './kit'
import { CATS, CHIMNEYS, HOPS, onRope, PERCH, ROPES, STEAM, WIRE } from './lines'
import { DETAIL, type LiveRef } from './live'
import { catEyeShape, catShape, puffShape } from './shapes'

const COATS = ['#f09a4a', '#3a2a44', '#a89cb8', '#f4e2c8', '#ffffff'].map((c) => new THREE.Color(c))
const CAT = 34
const KITTIES = CATS.length + 3
const PUFFS = CHIMNEYS.length * 3 + STEAM.length * 2

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const v = new THREE.Vector3()
const w = new THREE.Vector3()
const s = new THREE.Vector3()
const zero = new THREE.Matrix4().makeScale(0, 0, 0)

function pose(at: THREE.Vector3, size: number, turn = 0, lean = 0, sy = size) {
  q.setFromEuler(e.set(0, turn, lean)).premultiply(TILT)
  return m.compose(at, q, s.set(size, sy, size))
}

const up = (out: THREE.Vector3, h: number) => out.set(out.x, out.y + h * UP_Y, out.z + h * UP_Z)

function ropeShape() {
  const pts: number[] = []
  for (const r of ROPES) for (let i = 0; i < r.length - 1; i++) pts.push(r[i].x, r[i].y, r[i].z, r[i + 1].x, r[i + 1].y, r[i + 1].z)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return g
}

export function Roofs({ live }: { live: LiveRef }) {
  const lines = useMemo(() => ropeShape(), [])
  const cat = useMemo(() => catShape(), [])
  const eye = useMemo(() => catEyeShape(), [])
  const puff = useMemo(() => puffShape(), [])
  useEffect(() => () => [lines, cat, eye, puff].forEach((g) => g.dispose()), [lines, cat, eye, puff])
  const cats = useRef<THREE.InstancedMesh>(null)
  const eyes = useRef<THREE.InstancedMesh>(null)
  const smoke = useRef<THREE.InstancedMesh>(null)
  const rope = useRef<THREE.LineSegments>(null)

  useLayoutEffect(() => {
    const k = cats.current
    if (!k) return
    for (let i = 0; i < KITTIES; i++) k.setColorAt(i, COATS[i < CATS.length ? CATS[i].coat : i % 2])
    if (k.instanceColor) k.instanceColor.needsUpdate = true
  }, [])

  useFrame(() => {
    const { t, alarm, zoom } = live.current
    const k = cats.current
    const ey = eyes.current
    const sm = smoke.current
    if (!k || !ey || !sm || !rope.current) return
    const detail = zoom >= DETAIL
    for (const o of [k, ey, rope.current]) o.visible = detail
    CHIMNEYS.forEach((p, i) => {
      for (let j = 0; j < 3; j++) {
        const a = (t / 6 + i * 0.37 + j / 3) % 1
        v.copy(p)
        up(v, a * 120)
        v.x += a * 50 + Math.sin(t + i + j) * 6
        const size = (7 + a * 20) * Math.min(1, (1 - a) * 3)
        sm.setMatrixAt(i * 3 + j, pose(v, size, 0, a * 1.5, size * 0.8))
      }
    })
    const base = CHIMNEYS.length * 3
    STEAM.forEach((p, i) => {
      for (let j = 0; j < 2; j++) {
        const a = (t / 7 + i * 0.29 + j / 2) % 1
        v.copy(p)
        up(v, a * 150)
        v.x += Math.sin(t * 0.6 + i) * 20 + a * 30
        const size = (18 + a * 34) * Math.min(1, (1 - a) * 2.5)
        sm.setMatrixAt(base + i * 2 + j, pose(v, size, 0, a, size * 0.75))
      }
    })
    sm.instanceMatrix.needsUpdate = true
    if (!detail) return
    const hide = 1 - Math.min(1, alarm * 1.5)
    const put = (i: number, mat: THREE.Matrix4) => {
      k.setMatrixAt(i, mat)
      ey.setMatrixAt(i, mat)
    }
    CATS.forEach((p, i) => {
      const look = Math.sin(t * 0.4 + p.phase) > 0.6 ? 0.5 : Math.sin(t * 0.4 + p.phase) < -0.7 ? -0.5 : 0
      const stretch = Math.max(0, Math.sin(t * 0.3 + p.phase * 2) - 0.92) * 4
      v.copy(p.at)
      put(i, pose(v, CAT * hide, look, Math.sin(t * 2 + p.phase) * 0.05, CAT * hide * (1 + stretch * 0.3)))
    })
    const n = CATS.length
    const r = WIRE
    if (r) {
      const u = (t / 16) % 2
      const pos = Math.min(1, Math.max(0, (u < 1 ? u : 2 - u) * 1.2 - 0.1))
      onRope(r, 0.08 + pos * 0.84, v)
      up(v, 2)
      put(n, pose(v, CAT * 0.9 * hide, 0, Math.sin(t * 3.1) * 0.25))
    } else put(n, zero)
    if (HOPS.length > 1) {
      const span = HOPS.length - 1
      const u = (t / 2.6) % (span * 2)
      const seg = Math.floor(u)
      const f = u - seg
      const [a, b] = seg < span ? [seg, seg + 1] : [span * 2 - seg, span * 2 - seg - 1]
      const k2 = Math.max(0, (f - 0.6) / 0.4)
      v.lerpVectors(HOPS[a], HOPS[b], k2)
      up(v, Math.sin(Math.PI * k2) * 70)
      w.subVectors(HOPS[b], HOPS[a])
      put(n + 1, pose(v, CAT * hide, w.x > 0 ? 0.6 : -0.6, k2 > 0 ? -Math.sign(w.x) * 0.4 : 0, CAT * hide * (k2 > 0 ? 1.2 : 1)))
    } else put(n + 1, zero)
    v.copy(PERCH)
    put(n + 2, pose(v, 22, Math.sin(t * 0.5) * 0.6, 0))
    k.instanceMatrix.needsUpdate = true
    ey.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <lineSegments ref={rope} geometry={lines}>
        <lineBasicMaterial color="#6b5878" />
      </lineSegments>
      <instancedMesh ref={cats} args={[cat, undefined, KITTIES]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[eye, undefined, KITTIES]} frustumCulled={false}>
        <meshBasicMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={smoke} args={[puff, undefined, PUFFS]} frustumCulled={false}>
        <meshBasicMaterial vertexColors transparent opacity={0.82} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
