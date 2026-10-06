'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { SPOT } from './build'
import { fogged } from './fog'
import { animated, seepMaterial, state, tick } from './fortress-shade'
import { PROP, seepGeometry } from './seeps'
import type { War } from './sim'
import { DEPOSITS, siteAt } from './sites'

const PITCH = new THREE.Quaternion().setFromEuler(
  new THREE.Euler((50 * Math.PI) / 180, 0, 0),
)
const FLAT = new THREE.Quaternion()
const RISE = 0.6
const place = new THREE.Matrix4()
const at = new THREE.Vector3()
const size = new THREE.Vector3()

const grow = (u: number) =>
  u >= 1 ? 1 : 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2

export function Deposits({
  war,
  dawn,
  reduced,
}: {
  war: War
  dawn: RefObject<number>
  reduced: boolean
}) {
  const count = war.deposits.length
  const plate = useMemo(() => {
    const shape = new THREE.PlaneGeometry(2.4, 2.4)
    shape.setAttribute(
      'aRich',
      new THREE.InstancedBufferAttribute(
        Float32Array.from(war.deposits, (d) => d.rich),
        1,
      ),
    )
    return shape
  }, [war])
  const seep = useMemo(() => seepMaterial(), [])
  const look = useMemo(() => {
    const material = animated(0.75)
    fogged(material)
    return material
  }, [])
  const props = useMemo(
    () =>
      war.deposits.map((d) => {
        const site = siteAt(DEPOSITS, d)
        const shape = site && seepGeometry(site.id)
        shape?.setAttribute('aState', state(1, [1, 1, 0]))
        return shape ?? null
      }),
    [war],
  )
  useEffect(
    () => () => [plate, seep, look, ...props].forEach((x) => x?.dispose()),
    [plate, seep, look, props],
  )
  const spots = useRef<THREE.InstancedMesh>(null)
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([])
  const born = useRef<number[]>([])

  useFrame((frame) => {
    const rings = spots.current
    if (!rings) return
    const now = frame.clock.elapsedTime
    const t = reduced ? 0 : now
    ;(rings.material as THREE.ShaderMaterial).uniforms.uTime.value = t
    war.deposits.forEach((d, k) => {
      const on = d.known && d.x <= dawn.current
      if (on && born.current[k] === undefined)
        born.current[k] = reduced ? -1e9 : now
      const u = on ? grow((now - born.current[k]) / RISE) : 0
      const v = SPOT * u
      rings.setMatrixAt(
        k,
        place.compose(at.set(d.x, -d.y, 0), FLAT, size.set(v, v, 1)),
      )
      const mesh = meshes.current[k]
      if (!mesh) return
      mesh.visible = on
      tick(mesh, t)
      mesh.setMatrixAt(
        0,
        place.compose(at.set(d.x, -d.y, 0), PITCH, size.setScalar(PROP * u)),
      )
      mesh.instanceMatrix.needsUpdate = true
    })
    rings.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={spots}
        args={[plate, seep, count]}
        frustumCulled={false}
        renderOrder={56}
      />
      {props.map(
        (shape, k) =>
          shape && (
            <instancedMesh
              key={k}
              ref={(mesh) => {
                meshes.current[k] = mesh
              }}
              args={[shape, look, 1]}
              frustumCulled={false}
              renderOrder={58}
            />
          ),
      )}
    </group>
  )
}
