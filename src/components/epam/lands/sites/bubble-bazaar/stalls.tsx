'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { strip } from './atlas'
import { STAGE_SIZE } from './actors'
import { SHADY, STAGE, STALLS } from './data'
import {
  blobGeometry,
  podiumGeometry,
  shadyGeometry,
  stallGeometry,
} from './shapes'
import { boost, kickAt, pose, type Mood } from './kit'

const KINDS = [0, 1, 2, 3]
const SHADY_SIZE = 115
const TIP = (-50 * Math.PI) / 180
const mat = new THREE.Matrix4()

function Kind({ kind, mood }: { kind: number; mood: RefObject<Mood> }) {
  const geo = useMemo(() => stallGeometry(kind), [kind])
  useEffect(() => () => geo.dispose(), [geo])
  const mesh = useRef<THREE.InstancedMesh>(null)
  const fold = useRef(-1)
  const list = STALLS.filter((st) => st.kind === kind)
  useFrame(() => {
    const m = mesh.current
    const f = Math.min(1, mood.current.t * 3)
    const b = boost(mood.current.zoom)
    const key = f + b * 10
    if (!m || Math.abs(key - fold.current) < 0.002) return
    fold.current = key
    list.forEach((st, k) =>
      m.setMatrixAt(
        k,
        pose(
          mat,
          st.x,
          st.y,
          0,
          st.size * (1 + b * 0.8),
          ((k % 3) - 1) * 0.12,
          1 - f * 0.55,
        ),
      ),
    )
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={mesh}
      args={[geo, undefined, list.length]}
      frustumCulled={false}
      renderOrder={46}
    >
      <meshStandardMaterial
        vertexColors
        flatShading
        roughness={0.75}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  )
}

function Shady({
  mood,
  reduced,
  map,
}: {
  mood: RefObject<Mood>
  reduced: boolean
  map: THREE.Texture
}) {
  const tent = useMemo(() => shadyGeometry(), [])
  const blob = useMemo(() => blobGeometry(), [])
  const sign = useMemo(() => strip(1, 1.7, 0.425), [])
  useEffect(
    () => () => [tent, blob, sign].forEach((g) => g.dispose()),
    [tent, blob, sign],
  )
  const goo = useRef<THREE.Mesh>(null)
  const jar = useRef<THREE.Group>(null)
  const lid = useRef<THREE.Mesh>(null)
  const whole = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime * (reduced ? 0.1 : 1)
    const g = goo.current
    const j = jar.current
    const l = lid.current
    if (!g || !j || !l || !whole.current) return
    whole.current.scale.setScalar(1 + boost(mood.current.zoom) * 0.8)
    const threat = mood.current.t
    const kick = kickAt(t)
    const loose = threat > 0.22
    const grow = 1 + Math.min(1, threat * 3) * 2.2
    g.scale.set(
      0.27 * grow * (1 + Math.sin(t * 5) * 0.06),
      0.27 * grow * (1 - Math.sin(t * 5) * 0.06 + kick * 0.25),
      0.27 * grow,
    )
    g.position.set(
      -0.12 + Math.sin(t * 1.7) * 0.03,
      0.38 + kick * 0.12 + (loose ? -0.33 : 0),
      0.3 + (loose ? 0.45 : 0),
    )
    g.rotation.y = Math.sin(t * 0.9) * 0.5
    j.visible = !loose
    j.position.y = kick * 0.08
    j.rotation.z = kick * Math.sin(t * 30) * 0.08
    l.position.y = 0.76 + kick * 0.22
    l.rotation.z = kick * 0.5
  })

  return (
    <Stand at={[SHADY.x, SHADY.y]} size={SHADY_SIZE} turn={-0.15}>
      <group ref={whole}>
        <mesh geometry={tent} renderOrder={46}>
          <meshStandardMaterial
            vertexColors
            flatShading
            roughness={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={goo} geometry={blob} renderOrder={46}>
          <meshStandardMaterial
            vertexColors
            roughness={0.25}
            emissive="#3d5a00"
            emissiveIntensity={0.35}
          />
        </mesh>
        <group ref={jar} position={[0, 0, 0]}>
          <mesh position={[-0.12, 0.555, 0.3]} renderOrder={48}>
            <cylinderGeometry args={[0.2, 0.2, 0.36, 16, 1, true]} />
            <meshStandardMaterial
              color="#d9f4ff"
              transparent
              opacity={0.35}
              roughness={0.1}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh ref={lid} position={[-0.12, 0.76, 0.3]} renderOrder={48}>
            <cylinderGeometry args={[0.22, 0.22, 0.05, 16]} />
            <meshStandardMaterial color="#c8ff3a" roughness={0.5} />
          </mesh>
        </group>
        <mesh
          geometry={sign}
          position={[0, 1.98, -0.4]}
          rotation={[TIP, 0, 0]}
          renderOrder={47}
        >
          <meshBasicMaterial map={map} transparent side={THREE.DoubleSide} />
        </mesh>
      </group>
    </Stand>
  )
}

function Podium() {
  const geo = useMemo(() => podiumGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <Stand at={[STAGE.x, STAGE.y]} size={STAGE_SIZE}>
      <mesh geometry={geo} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
    </Stand>
  )
}

export function Stalls({
  mood,
  reduced,
  map,
}: {
  mood: RefObject<Mood>
  reduced: boolean
  map: THREE.Texture
}) {
  return (
    <>
      {KINDS.map((k) => (
        <Kind key={k} kind={k} mood={mood} />
      ))}
      <Shady mood={mood} reduced={reduced} map={map} />
      <Podium />
    </>
  )
}
