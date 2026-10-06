'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { BALLOON, POLE } from './balloon'
import { MOOR, STALLS } from './data'
import { BERRY, BUTTER, CORAL, CREAM, hash, LILAC, lift, MINT, TEAL, UP, type Mood } from './kit'

const COLORS = [CORAL, BUTTER, TEAL, CREAM, LILAC, MINT, BERRY].map((c) => new THREE.Color(c))
const GAP = 48
const SEGS = 14
const FLAG = new THREE.Vector3(36, 44, 1)

type Flag = { at: THREE.Vector3; base: THREE.Quaternion; seed: number }

function top(k: number) {
  const st = STALLS[k]
  return st.kind === 3 ? lift(new THREE.Vector3(), st.x, st.y, 0, 1.27 * st.size, -0.3 * st.size) : lift(new THREE.Vector3(), st.x, st.y, 0, 1.75 * st.size, -0.38 * st.size)
}

function lines() {
  const ends: [THREE.Vector3, THREE.Vector3][] = []
  STALLS.forEach((a, i) =>
    STALLS.forEach((b, j) => {
      if (j > i && Math.hypot(a.x - b.x, a.y - b.y) < 600) ends.push([top(i), top(j)])
    }),
  )
  const mast = lift(new THREE.Vector3(), MOOR.x, MOOR.y, 0, POLE * BALLOON, 0)
  STALLS.map((st, k) => [Math.hypot(st.x - MOOR.x, st.y - MOOR.y), k])
    .sort((a, b) => a[0] - b[0])
    .slice(0, 3)
    .forEach(([, k]) => ends.push([mast, top(k)]))
  return ends
}

function build() {
  const pts: number[] = []
  const flags: Flag[] = []
  const p = new THREE.Vector3()
  const q = new THREE.Vector3()
  const along = new THREE.Vector3()
  const up = new THREE.Vector3()
  const side = new THREE.Vector3()
  const basis = new THREE.Matrix4()
  const at = (a: THREE.Vector3, b: THREE.Vector3, u: number, sag: number, out: THREE.Vector3) =>
    out.lerpVectors(a, b, u).addScaledVector(UP, -sag * 4 * u * (1 - u))
  lines().forEach(([a, b], n) => {
    const len = a.distanceTo(b)
    const sag = len * 0.1
    for (let k = 0; k < SEGS; k++) {
      at(a, b, k / SEGS, sag, p)
      at(a, b, (k + 1) / SEGS, sag, q)
      pts.push(p.x, p.y, p.z, q.x, q.y, q.z)
    }
    const count = Math.floor(len / GAP)
    for (let k = 1; k < count; k++) {
      const u = k / count
      at(a, b, u - 0.01, sag, p)
      at(a, b, u + 0.01, sag, q)
      along.subVectors(q, p).normalize()
      up.copy(UP).addScaledVector(along, -UP.dot(along)).normalize()
      side.crossVectors(along, up)
      basis.makeBasis(along, up, side)
      flags.push({ at: at(a, b, u, sag, new THREE.Vector3()), base: new THREE.Quaternion().setFromRotationMatrix(basis), seed: n * 7.3 + k })
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
  return { flags, string: g }
}

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const swing = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)
const s = new THREE.Vector3()

export function Bunting({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const { flags, string } = useMemo(() => build(), [])
  const tri = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, -1, 0], 3))
    return g
  }, [])
  useEffect(() => () => [string, tri].forEach((g) => g.dispose()), [string, tri])
  const mesh = useRef<THREE.InstancedMesh>(null)
  const group = useRef<THREE.Group>(null)
  const painted = useRef(false)
  const clock = useRef(0)

  useFrame((_, dt) => {
    const f = mesh.current
    const g = group.current
    if (!f || !g) return
    g.visible = mood.current.zoom > 0.14
    if (!g.visible) return
    clock.current += reduced ? 0 : dt
    const t = clock.current
    const drop = Math.min(1, mood.current.t * 3)
    flags.forEach((fl, k) => {
      const a = Math.sin(t * (1.6 + hash(fl.seed) * 1.2) + fl.seed) * 0.35 + 0.15 + drop * (hash(k) > 0.5 ? 1.2 : 0)
      q.copy(fl.base).multiply(swing.setFromAxisAngle(X, a))
      f.setMatrixAt(k, m.compose(fl.at, q, s.copy(FLAG).multiplyScalar(drop > 0.5 && hash(k + 3) > 0.6 ? 0 : 1)))
      if (!painted.current) f.setColorAt(k, COLORS[k % COLORS.length])
    })
    painted.current = true
    f.instanceMatrix.needsUpdate = true
    if (f.instanceColor) f.instanceColor.needsUpdate = true
  })

  return (
    <group ref={group}>
      <lineSegments geometry={string} renderOrder={47}>
        <lineBasicMaterial color="#6b4a6b" transparent opacity={0.5} />
      </lineSegments>
      <instancedMesh ref={mesh} args={[tri, undefined, flags.length]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
