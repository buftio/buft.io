'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PATROL } from './crowd'
import { dress } from './kinds'
import { army } from './warriors'

const PITCH = 0.8726646
const VIEW = 0.6
const SPIN = 0.9
const SWAY = 0.8
const FRAME = 2.3
const UP = new THREE.Vector3(0, Math.cos(PITCH), Math.sin(PITCH))
const X = new THREE.Vector3(1, 0, 0)
const view = new THREE.Quaternion().setFromAxisAngle(X, -VIEW)
const spin = new THREE.Quaternion()

function Figure({ kind, still }: { kind: number; still: boolean }) {
  const troop = useMemo(() => {
    const t = army(1, 0, !still)
    t.solid.uniforms.uShadow.value = 0
    t.fine.instanceCount = 1
    return t
  }, [still])
  useEffect(
    () => () => {
      troop.fine.dispose()
      troop.rough.dispose()
      troop.solid.dispose()
    },
    [troop],
  )
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const zoom = state.size.height / FRAME
    if (state.camera.zoom !== zoom) {
      state.camera.zoom = zoom
      state.camera.updateProjectionMatrix()
    }
    const t = still ? 0 : state.clock.elapsedTime
    const look = troop.fine.getAttribute('aLook') as THREE.BufferAttribute
    look.setXYZW(0, dress(PATROL, kind), t, 0.6, 0)
    look.needsUpdate = true
    m.quaternion
      .copy(view)
      .multiply(spin.setFromAxisAngle(UP, SWAY * Math.sin(t * SPIN)))
  })
  return (
    <mesh
      ref={mesh}
      geometry={troop.fine}
      material={troop.solid}
      frustumCulled={false}
      position={[0, -0.85, 0]}
    />
  )
}

export function Miniature({ kind }: { kind: number }) {
  const still = useMemo(
    () =>
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )
  return (
    <Canvas
      className="e-mini"
      orthographic
      frameloop={still ? 'demand' : 'always'}
      camera={{ position: [0, 0, 10] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Figure kind={kind} still={still} />
    </Canvas>
  )
}
