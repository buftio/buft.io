'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { reelAge, REEL_T, REELS, type Life } from './clock'
import { air, C, Kit, orient } from './kit'
import { HAUL, LONG, ROLL } from './layout'
import { along, path, WIRES, yarn } from './threads'

const H = Math.PI / 2
const PER = 4
const B = WIRES.length * PER + 1
const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const v = new THREE.Vector3()
const s = new THREE.Vector3()
const q = new THREE.Quaternion()
const roll = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const haul = path(HAUL)
const frac = (x: number) => x - Math.floor(x)

function rollGeometry() {
  const k = new Kit()
  const r = new THREE.CylinderGeometry(1, 1, 1, 16)
  r.rotateZ(H)
  k.add(r, C.rose, 0, 0, 0)
  for (const x of [-0.3, 0, 0.3]) {
    const band = new THREE.CylinderGeometry(1.04, 1.04, 0.06, 16)
    band.rotateZ(H)
    k.add(band, C.magenta, x, 0, 0)
  }
  for (const x of [-0.52, 0.52]) {
    const end = new THREE.CircleGeometry(0.4, 10)
    end.rotateY(x > 0 ? H : -H)
    k.add(end, C.oak, x, 0, 0)
  }
  return k.geo()
}

export function Haul({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(() => ({ roll: rollGeometry(), bob: new THREE.SphereGeometry(1, 10, 8) }), [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const rolls = useRef<THREE.InstancedMesh>(null)
  const bobs = useRef<THREE.InstancedMesh>(null)
  const colored = useRef(false)

  useFrame(() => {
    const L = life.current
    const R = rolls.current
    const b = bobs.current
    if (!R || !b) return
    const t = L.t
    for (let k = 0; k < REELS; k++) {
      const u = reelAge(t, k) / REEL_T
      if (u >= 1) {
        R.setMatrixAt(k, ZERO)
        continue
      }
      haul(u, v)
      const fade = Math.min(1, (1 - u) * 12)
      orient(v.z + H, q).multiply(roll.setFromAxisAngle(X, Math.sin(t * 7 + k) * 0.08))
      air(v.x, v.y, ROLL + 12 + Math.abs(Math.sin(t * 7 + k)) * 4, p)
      R.setMatrixAt(k, m.compose(p, q, s.set(LONG * fade, ROLL * fade, ROLL * fade)))
    }
    R.instanceMatrix.needsUpdate = true
    if (!colored.current) {
      colored.current = true
      let i = 0
      for (const w of WIRES) for (let k = 0; k < PER; k++) b.setColorAt(i++, w.color)
      b.setColorAt(i, new THREE.Color(C.saffron))
      if (b.instanceColor) b.instanceColor.needsUpdate = true
    }
    b.visible = L.zoom > 0.1
    if (!b.visible) return
    let i = 0
    WIRES.forEach((w, wi) => {
      for (let k = 0; k < PER; k++) {
        const u = frac(t / (22 + wi * 5) + k / PER)
        along(w, u, p)
        const r = 20 * Math.min(1, u * 8, (1 - u) * 8)
        p.z -= 14
        b.setMatrixAt(i++, m.compose(p, q.identity(), s.set(r * 1.2, r, r)))
      }
    })
    yarn(t, v)
    air(v.x, v.y, 15, p)
    b.setMatrixAt(i, m.compose(p, q.setFromAxisAngle(X, -t * 4), s.setScalar(15)))
    b.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={rolls} args={[geos.roll, undefined, REELS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.7} emissive={C.magenta} emissiveIntensity={0.15} />
      </instancedMesh>
      <instancedMesh ref={bobs} args={[geos.bob, undefined, B]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial roughness={0.5} />
      </instancedMesh>
    </group>
  )
}
