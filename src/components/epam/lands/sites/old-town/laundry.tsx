'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { TILT } from './kit'
import { CLOTHES, onRope, ROPES } from './lines'
import { DETAIL, type LiveRef } from './live'
import { clothShape } from './shapes'

const WASH = ['#ffffff', '#ff8fb0', '#7dffe6', '#ffd36b', '#9fd0ff', '#e8664a', '#c9a6e8', '#16b3a0'].map((c) => new THREE.Color(c))
const KINDS = [0, 1, 2].map((k) => CLOTHES.filter((c) => c.kind === k))

const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const v = new THREE.Vector3()
const s = new THREE.Vector3()

export function Laundry({ live }: { live: LiveRef }) {
  const shapes = useMemo(() => [0, 1, 2].map(clothShape), [])
  useEffect(() => () => shapes.forEach((g) => g.dispose()), [shapes])
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])

  useLayoutEffect(() => {
    meshes.current.forEach((mesh, k) => {
      if (!mesh) return
      KINDS[k].forEach((p, i) => mesh.setColorAt(i, WASH[p.c]))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    })
  }, [])

  useFrame(() => {
    const { t, alarm, zoom } = live.current
    const reel = Math.max(0, 1 - alarm * 1.4)
    meshes.current.forEach((mesh, k) => {
      if (!mesh) return
      mesh.visible = zoom >= DETAIL && reel > 0.02
      if (!mesh.visible) return
      KINDS[k].forEach((p, i) => {
        onRope(ROPES[p.rope], p.t, v)
        const sway = Math.sin(t * 1.8 + p.phase) * 0.2 + Math.sin(t * 0.5 + p.rope) * 0.12
        q.setFromEuler(e.set(Math.sin(t * 1.3 + p.phase) * 0.35, 0, sway)).premultiply(TILT)
        mesh.setMatrixAt(i, m.compose(v, q, s.set(p.w * reel, p.h * reel, 1)))
      })
      mesh.instanceMatrix.needsUpdate = true
    })
  })

  return (
    <group>
      {shapes.map((g, k) => (
        <instancedMesh
          key={k}
          ref={(el) => {
            meshes.current[k] = el
          }}
          args={[g, undefined, Math.max(1, KINDS[k].length)]}
          frustumCulled={false}
        >
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} emissive="#2a2030" />
        </instancedMesh>
      ))}
    </group>
  )
}
