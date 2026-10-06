'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { capstanGeometry, flameGeometry, leafGeometry } from './geo'
import { FIRES, GATES, type Mood, standQ, staticGeometry } from './layout'
import { CAP_BOT, CAP_TOP, capAngle, cycle, gateOf, PITCH } from './map'
import { People } from './people'

const m4 = new THREE.Matrix4()
const loc = new THREE.Matrix4()
const q = new THREE.Quaternion()
const at = new THREE.Vector3()
const size = new THREE.Vector3()
const ORIGIN = new THREE.Vector3()
const Y = new THREE.Vector3(0, 1, 0)
const CAPS = [CAP_TOP, CAP_BOT]

export function Lock({ mood }: { mood: RefObject<Mood> }) {
  const shapes = useMemo(() => ({ base: staticGeometry(), leaf: leafGeometry(), cap: capstanGeometry(), flame: flameGeometry() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const leaves = useRef<THREE.InstancedMesh>(null)
  const caps = useRef<THREE.InstancedMesh>(null)
  const flames = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const m = mood.current
    const lv = leaves.current
    const cp = caps.current
    const fl = flames.current
    if (!m || !lv || !cp || !fl) return
    const { c, p } = cycle(m.cyc)
    const open = gateOf(p)
    GATES.forEach((g, k) => {
      const th = 0.1 + 1.25 * open
      for (let side = 0; side < 2; side++) {
        const yaw = side ? Math.PI - th : th
        loc.compose(at.set(side ? g.inner : -g.inner, 0, 0), q.setFromAxisAngle(Y, yaw), size.set(g.leaf, 1, 1))
        lv.setMatrixAt(k * 2 + side, m4.multiplyMatrices(g.matrix, loc))
      }
    })
    CAPS.forEach(([x, y], k) => cp.setMatrixAt(k, m4.compose(at.set(x, -y, 0), standQ(capAngle(k, c, p), q), size.set(1, 1, 1))))
    FIRES.forEach((f, k) => {
      const s = f.r * (0.3 + 0.7 * m.calm) * (0.85 + 0.15 * Math.sin(m.now * 11 + k * 2.3))
      const sy = s * (1 + 0.25 * Math.sin(m.now * 7.7 + k))
      q.copy(PITCH)
      fl.setMatrixAt(k, m4.compose(at.copy(f.p), q, size.set(s, sy, s)))
    })
    lv.instanceMatrix.needsUpdate = cp.instanceMatrix.needsUpdate = fl.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={shapes.base} position={ORIGIN} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} transparent side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={leaves} args={[shapes.leaf, undefined, 4]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} transparent side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[shapes.cap, undefined, 2]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} transparent side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={flames} args={[shapes.flame, undefined, FIRES.length]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial vertexColors transparent toneMapped={false} />
      </instancedMesh>
      <People mood={mood} />
    </group>
  )
}
