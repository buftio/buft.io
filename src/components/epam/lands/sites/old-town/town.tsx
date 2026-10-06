'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { FACE_Y, handShape, LAMP_Y, TOWER_SIZE, townShape, VANE_Y, vaneShape } from './buildings'
import { bodyMatrix, roofMatrix } from './homes'
import { TILT } from './kit'
import type { LiveRef } from './live'
import { HOUSES } from './plan'
import { bodyShape, gableShape, hipShape } from './shapes'
import { cobbles, streetShape, waterShape } from './street'

const WALLS = ['#fff0e2', '#e4f7f0', '#f6e0fa', '#fff3c8', '#ffe0d8'].map((c) => new THREE.Color(c))
const ROOFS = ['#e8664a', '#d9573f', '#f08a5d', '#c9503c', '#e8664a', '#f2a65a', '#16b3a0', '#d9573f', '#b5473a'].map(
  (c) => new THREE.Color(c),
)
const SHUT = new THREE.Color('#8f8496')
const FULL = new THREE.Color('#ffffff')
const LAMP = new THREE.Color('#ffd36b')
const ALARM = new THREE.Color('#ff3b3b')
const GABLES = HOUSES.filter((h) => !h.hip)
const HIPS = HOUSES.filter((h) => h.hip)

const out = new THREE.Matrix4()
const tinted = (s: THREE.WebGLProgramParametersWithUniforms) => {
  s.fragmentShader = s.fragmentShader.replace(
    '#include <emissivemap_fragment>',
    '#include <emissivemap_fragment>\n\ttotalEmissiveRadiance *= diffuseColor.rgb;',
  )
}

export function Houses({ live }: { live: LiveRef }) {
  const body = useMemo(() => bodyShape(), [])
  const gable = useMemo(() => gableShape(), [])
  const hip = useMemo(() => hipShape(), [])
  useEffect(() => () => [body, gable, hip].forEach((g) => g.dispose()), [body, gable, hip])
  const bodies = useRef<THREE.InstancedMesh>(null)
  const gables = useRef<THREE.InstancedMesh>(null)
  const hips = useRef<THREE.InstancedMesh>(null)
  const walls = useRef<THREE.MeshStandardMaterial>(null)
  const shade = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    const b = bodies.current
    const g = gables.current
    const p = hips.current
    const d = shade.current
    if (!b || !g || !p || !d) return
    HOUSES.forEach((h, k) => d.setMatrixAt(k, out.makeScale(h.w * 0.62, h.d * 0.5 + h.h * 0.12, 1).setPosition(h.x + h.w * 0.22, -h.y - h.d * 0.12, 1.2)))
    d.instanceMatrix.needsUpdate = true
    HOUSES.forEach((h, k) => {
      b.setMatrixAt(k, bodyMatrix(h, out))
      b.setColorAt(k, WALLS[h.wall])
    })
    GABLES.forEach((h, k) => {
      g.setMatrixAt(k, roofMatrix(h, out))
      g.setColorAt(k, ROOFS[h.roof])
    })
    HIPS.forEach((h, k) => {
      p.setMatrixAt(k, roofMatrix(h, out))
      p.setColorAt(k, ROOFS[(h.roof + 3) % ROOFS.length])
    })
    for (const mesh of [b, g, p]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
      mesh.computeBoundingSphere()
    }
  }, [])

  useFrame(() => {
    const w = walls.current
    if (w) w.color.copy(FULL).lerp(SHUT, live.current.alarm * 0.6)
  })

  return (
    <group>
      <instancedMesh ref={shade} args={[undefined, undefined, HOUSES.length]} frustumCulled={false} renderOrder={43}>
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial color="#1d0c2a" transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[body, undefined, HOUSES.length]} frustumCulled={false}>
        <meshStandardMaterial ref={walls} vertexColors flatShading roughness={0.9} emissive="#9a9a9a" onBeforeCompile={tinted} />
      </instancedMesh>
      <instancedMesh ref={gables} args={[gable, undefined, GABLES.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={hips} args={[hip, undefined, HIPS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

export function Ground() {
  const street = useMemo(() => streetShape(), [])
  const water = useMemo(() => waterShape(), [])
  const map = useMemo(() => cobbles(), [])
  useEffect(() => () => [street, water, map].forEach((g) => g.dispose()), [street, water, map])
  return (
    <group>
      <mesh geometry={street} renderOrder={42}>
        <meshStandardMaterial map={map} vertexColors roughness={1} />
      </mesh>
      <mesh geometry={water} renderOrder={44}>
        <meshBasicMaterial color="#e2577a" transparent opacity={0.62} />
      </mesh>
    </group>
  )
}

export function Town({ live, at }: { live: LiveRef; at: [number, number] }) {
  const town = useMemo(() => townShape(), [])
  const hour = useMemo(() => handShape(0.24, 0.07), [])
  const minute = useMemo(() => handShape(0.36, 0.045), [])
  const vane = useMemo(() => vaneShape(), [])
  useEffect(() => () => [town, hour, minute, vane].forEach((g) => g.dispose()), [town, hour, minute, vane])
  const big = useRef<THREE.Mesh>(null)
  const small = useRef<THREE.Mesh>(null)
  const turn = useRef<THREE.Mesh>(null)
  const lamp = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    const { t, alarm } = live.current
    if (big.current) big.current.rotation.z = -t * 0.31
    if (small.current) small.current.rotation.z = -t * 0.026
    if (turn.current) turn.current.rotation.y = Math.sin(t * 0.23) * 1.6 + Math.sin(t * 1.7) * 0.15
    const blink = alarm > 0.3 ? 0.5 + 0.5 * Math.sin(t * 9) : 1
    if (lamp.current) lamp.current.color.copy(LAMP).lerp(ALARM, alarm)
    if (glow.current) glow.current.color.copy(LAMP).lerp(ALARM, alarm)
    if (halo.current) halo.current.scale.setScalar((0.55 + 0.08 * Math.sin(t * 2.3) + alarm * 2.4) * blink)
  })

  return (
    <group>
      <mesh geometry={town}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} side={THREE.DoubleSide} emissive="#6a6a6a" onBeforeCompile={tinted} />
      </mesh>
      <group position={[at[0], -at[1], 0]} quaternion={TILT} scale={TOWER_SIZE}>
        <mesh ref={small} geometry={hour} position={[0, FACE_Y, 0.53]}>
          <meshBasicMaterial vertexColors />
        </mesh>
        <mesh ref={big} geometry={minute} position={[0, FACE_Y, 0.535]}>
          <meshBasicMaterial vertexColors />
        </mesh>
        <mesh ref={turn} geometry={vane} position={[0, VANE_Y, 0]}>
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, LAMP_Y, 0]}>
          <sphereGeometry args={[0.2, 12, 8]} />
          <meshBasicMaterial ref={lamp} color={LAMP} />
        </mesh>
        <mesh ref={halo} position={[0, LAMP_Y, 0.3]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial ref={glow} color="#ffe9a8" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  )
}
