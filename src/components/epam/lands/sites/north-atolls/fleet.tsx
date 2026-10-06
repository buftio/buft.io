'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { C, eyes, folkParts, merged, part, standQ } from './kit'
import { at, LANES, track } from './map'

const BOAT = 50
const TUG = 58
const PER = LANES.map((l) => l.boats + 1)
const ALL = PER.reduce((a, b) => a + b, 0)

function coracle() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.CylinderGeometry(1, 0.72, 0.45, 18), C.deep, 0, 0.22, 0))
  p.push(part(new THREE.TorusGeometry(0.98, 0.11, 5, 18).rotateX(Math.PI / 2), C.blush, 0, 0.46, 0))
  p.push(part(new THREE.CylinderGeometry(0.86, 0.86, 0.04, 18), '#7a0f26', 0, 0.42, 0))
  folkParts(p, 0, 0.35, -0.55)
  for (const s of [-1, 1]) p.push(part(new THREE.BoxGeometry(1.2, 0.06, 0.12), C.wood, s * 0.9, 0.62, -0.5, s * 0.5))
  return merged(p)
}

function cargo() {
  const p: THREE.BufferGeometry[] = []
  for (const [x, y, z, t] of [[-0.28, 0.62, 0.2, 0], [0.3, 0.62, 0.25, 0.6], [0, 0.62, 0.62, 1.1], [0.02, 0.92, 0.35, 0.3]]) {
    p.push(part(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 12), C.red, x, y, z, t))
    p.push(part(new THREE.CylinderGeometry(0.17, 0.17, 0.22, 8), C.deep, x, y, z, t))
  }
  return merged(p)
}

function tug() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(1.3, 0.5, 2.4), C.stone, 0, 0.25, -0.1))
  p.push(part(new THREE.ConeGeometry(0.92, 1, 4).rotateX(Math.PI / 2).rotateZ(Math.PI / 4).scale(0.7, 0.36, 1), C.stone, 0, 0.25, 1.55))
  p.push(part(new THREE.BoxGeometry(1.36, 0.14, 2.45), C.teal, 0, 0.52, -0.1))
  p.push(part(new THREE.CylinderGeometry(0.05, 0.06, 2.8, 5), C.wood, 0, 1.9, 0.25))
  const sail = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0, 2.3), new THREE.Vector2(-1.5, 0.15)])
  p.push(part(new THREE.ShapeGeometry(sail), C.white, 0.02, 0.75, 0.3, Math.PI / 2))
  const band = new THREE.Shape([new THREE.Vector2(0, 0.75), new THREE.Vector2(0, 1.15), new THREE.Vector2(-0.95, 0.75), new THREE.Vector2(-1.0, 0.45)])
  p.push(part(new THREE.ShapeGeometry(band), C.red, 0.04, 0.75, 0.3, Math.PI / 2))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.55, -0.14), new THREE.Vector2(0, -0.28)])), C.mint, 0.02, 3.3, 0.25))
  folkParts(p, 0, 0.55, -0.85, C.red)
  eyes(p, 0.32, 1.25, 0.24, 0.13)
  return merged(p)
}

function chevron() {
  const g = new THREE.BufferGeometry()
  const v = [-1, -1.4, 0, -0.1, 0, 1, 0, 0.25, 1, 1, -1.4, 0, 0, 0.25, 1, 0.1, 0, 1, -0.75, -1.4, 0, -0.62, -1.4, 1, 0.75, -1.4, 0, 0.62, -1.4, 1]
  const pos: number[] = []
  const col: number[] = []
  const tri = (a: number, b: number, c: number) => [a, b, c].forEach((k) => (pos.push(v[k * 3], v[k * 3 + 1], 0), col.push(1, 1, 1, v[k * 3 + 2] * 0.75)))
  tri(1, 0, 6)
  tri(1, 6, 7)
  tri(3, 4, 9)
  tri(3, 9, 8)
  tri(5, 2, 3)
  tri(5, 3, 1)
  tri(1, 3, 2)
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4))
  return g
}

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const p3 = new THREE.Vector3()
const s3 = new THREE.Vector3()
const tan = new THREE.Vector3()
const zAxis = new THREE.Vector3(0, 0, 1)

export function Fleet({ reduced, calm }: { reduced: boolean; calm: { current: number } }) {
  const tracks = useMemo(() => LANES.map(track), [])
  const shapes = useMemo(() => ({ boat: coracle(), load: cargo(), tug: tug(), wake: chevron() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const boats = useRef<THREE.InstancedMesh>(null)
  const loads = useRef<THREE.InstancedMesh>(null)
  const tugs = useRef<THREE.InstancedMesh>(null)
  const wakes = useRef<THREE.InstancedMesh>(null)
  const ropes = useRef<THREE.LineSegments>(null)
  const clock = useRef(0)
  const rope = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ALL * 6), 3))
    return g
  }, [])
  useEffect(() => () => rope.dispose(), [rope])

  useFrame((state, dt) => {
    const b = boats.current
    const l = loads.current
    const t = tugs.current
    const w = wakes.current
    const r = ropes.current
    if (!b || !l || !t || !w || !r) return
    clock.current += Math.min(dt, 0.1) * (reduced ? 0.15 : 1) * calm.current
    const now = clock.current
    const far = THREE.MathUtils.clamp(0.17 / state.camera.zoom, 1, 2.3)
    const line = r.geometry.getAttribute('position') as THREE.BufferAttribute
    let bi = 0
    let ri = 0
    let wi = 0
    for (let li = 0; li < LANES.length; li++) {
      const lane = LANES[li]
      const tr = tracks[li]
      const cycle = tr.total + lane.gap * lane.boats + lane.rest
      const base = (((now + lane.phase) % cycle) + cycle) % cycle
      let px = 0
      let py = 0
      let had = false
      for (let k = 0; k <= lane.boats; k++) {
        const time = base - k * lane.gap
        const live = time > 0 && time < tr.total
        const u = at(tr, time)
        tr.curve.getPointAt(u, p3)
        tr.curve.getTangentAt(u, tan)
        const fade = live ? Math.min(1, u / 0.04, (1 - u) / 0.04) : 0
        const turn = Math.atan2(tan.x, tan.y)
        const sway = Math.sin(now * 1.7 + k * 1.3) * 0.08
        const x = p3.x
        const y = p3.y
        const bob = Math.sin(now * 2.3 + k) * 4
        standQ(q, turn, sway)
        m.compose(p3.set(x, -y + bob, 0), q, s3.setScalar((k === 0 ? TUG : BOAT) * fade * far))
        if (k === 0) t.setMatrixAt(li, m)
        else {
          b.setMatrixAt(bi, m)
          l.setMatrixAt(bi, u < tr.dockU && live ? m : m.makeScale(0, 0, 0))
          bi++
        }
        q.setFromAxisAngle(zAxis, turn + Math.PI)
        const len = (k === 0 ? 2.6 : 1.6) * fade * far
        w.setMatrixAt(wi++, m.compose(p3.set(x - tan.x * (k ? 40 : 90) * far, -y + tan.y * (k ? 40 : 90) * far, 1.5), q, s3.set(55 * fade * far, 70 * len, 1)))
        if (had && live) {
          line.setXYZ(ri * 2, px, -py, 22)
          line.setXYZ(ri * 2 + 1, x + tan.x * 45 * far, -y - tan.y * 45 * far, 22)
        } else {
          line.setXYZ(ri * 2, 0, 0, 0)
          line.setXYZ(ri * 2 + 1, 0, 0, 0)
        }
        ri++
        px = x - tan.x * (k ? 48 : 120) * far
        py = y - tan.y * (k ? 48 : 120) * far
        had = live
      }
    }
    b.instanceMatrix.needsUpdate = true
    l.instanceMatrix.needsUpdate = true
    t.instanceMatrix.needsUpdate = true
    w.instanceMatrix.needsUpdate = true
    line.needsUpdate = true
  })

  const boatCount = ALL - LANES.length
  return (
    <group>
      <instancedMesh ref={wakes} args={[shapes.wake, undefined, ALL]} frustumCulled={false} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <lineSegments ref={ropes} geometry={rope} frustumCulled={false} renderOrder={44}>
        <lineBasicMaterial color="#6b3a2a" transparent opacity={0.8} />
      </lineSegments>
      <instancedMesh ref={boats} args={[shapes.boat, undefined, boatCount]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={loads} args={[shapes.load, undefined, boatCount]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={tugs} args={[shapes.tug, undefined, LANES.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
