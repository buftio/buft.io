'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { strip } from './atlas'
import { MOOR } from './data'
import { boost, BUTTER, CORAL, CREAM, INK, merged, part, TEAL, type Mood } from './kit'
import { folkGeometry } from './shapes'

export const BALLOON = 240
export const POLE = 1.05
const TIP = (-50 * Math.PI) / 180
const DRIFT = 1.15
const STRIPES = [CORAL, CREAM, TEAL, CREAM]
const LOFT = 2.8

function envelope() {
  const pts = [
    [0.18, 0], [0.32, 0.12], [0.62, 0.45], [0.88, 0.85], [0.98, 1.2], [0.95, 1.55], [0.8, 1.85], [0.52, 2.07], [0.2, 2.17], [0, 2.19],
  ].map(([x, y]) => new THREE.Vector2(x, y))
  const g = new THREE.LatheGeometry(pts, 24).toNonIndexed()
  const pos = g.getAttribute('position')
  const col = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let k = 0; k < pos.count; k += 3) {
    const x = (pos.getX(k) + pos.getX(k + 1) + pos.getX(k + 2)) / 3
    const z = (pos.getZ(k) + pos.getZ(k + 1) + pos.getZ(k + 2)) / 3
    const a = (Math.atan2(x, z) + Math.PI) / (Math.PI * 2)
    c.set(STRIPES[Math.floor(a * 24) % 4])
    for (let i = 0; i < 3; i++) col.set([c.r, c.g, c.b], (k + i) * 3)
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3))
  g.deleteAttribute('uv')
  g.translate(0, LOFT, 0)
  return g
}

function rig() {
  const P: THREE.BufferGeometry[] = [envelope()]
  P.push(part(new THREE.CylinderGeometry(0.3, 0.26, 0.3, 12), '#d9a35a', 0, 2.05, 0))
  P.push(part(new THREE.TorusGeometry(0.3, 0.035, 6, 16), CREAM, 0, 2.2, 0, 0, Math.PI / 2))
  for (const a of [0.6, 2.2, 3.8, 5.4]) {
    const x = Math.sin(a)
    const z = Math.cos(a)
    const from = new THREE.Vector3(x * 0.29, 2.2, z * 0.29)
    const to = new THREE.Vector3(x * 0.2, LOFT + 0.02, z * 0.2)
    const rope = new THREE.CylinderGeometry(0.01, 0.01, from.distanceTo(to), 4)
    rope.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()))
    P.push(part(rope, INK, (from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2))
  }
  P.push(part(new THREE.SphereGeometry(0.12, 10, 8), BUTTER, 0, LOFT + 2.21, 0))
  for (const side of [-1, 1]) P.push(part(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 4), INK, side * 0.25, 1.78, 0.1))
  return merged(P)
}

function pole() {
  const P: THREE.BufferGeometry[] = []
  for (let k = 0; k < 6; k++) P.push(part(new THREE.CylinderGeometry(0.035, 0.035, POLE / 6, 8), k % 2 ? CORAL : CREAM, 0, (k + 0.5) * (POLE / 6), 0))
  P.push(part(new THREE.SphereGeometry(0.07, 10, 8), BUTTER, 0, POLE + 0.03, 0))
  P.push(part(new THREE.CylinderGeometry(0.16, 0.2, 0.06, 12), '#c98f5e', 0, 0.03, 0))
  return merged(P)
}

export function Balloon({ mood, reduced, map }: { mood: RefObject<Mood>; reduced: boolean; map: THREE.Texture }) {
  const body = useMemo(() => rig(), [])
  const post = useMemo(() => pole(), [])
  const crier = useMemo(() => folkGeometry(), [])
  const banner = useMemo(() => strip(0, 1.9, 0.475), [])
  const tether = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3))
    return new THREE.Line(g, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.7 }))
  }, [])
  useEffect(
    () => () => {
      ;[body, post, crier, banner, tether.geometry].forEach((g) => g.dispose())
      ;(tether.material as THREE.Material).dispose()
    },
    [body, post, crier, banner, tether],
  )
  const line = useRef<THREE.Line>(null)
  const ship = useRef<THREE.Group>(null)
  const whole = useRef<THREE.Group>(null)
  const gavel = useRef<THREE.Group>(null)
  const man = useRef<THREE.Mesh>(null)
  const clock = useRef(0)
  const loose = useRef(0)

  useFrame((_, dt) => {
    clock.current += reduced ? dt * 0.05 : dt
    const t = clock.current
    const s = ship.current
    const g = gavel.current
    const m = man.current
    const rope = line.current
    const all = whole.current
    if (!s || !g || !m || !rope || !all) return
    all.scale.setScalar(1 + boost(mood.current.zoom) * 0.6)
    const free = mood.current.t > 0.3
    loose.current = Math.max(0, Math.min(4, loose.current + (free ? dt * 0.12 : -dt)))
    const l = loose.current
    s.position.set(DRIFT + Math.sin(t * 0.31) * 0.06 - l * l * 1.4, Math.sin(t * 0.57) * 0.05 + l * 1.6, 0)
    s.rotation.z = Math.sin(t * 0.43) * 0.035
    s.visible = l < 3.9
    const bang = (t * 0.8) % 1
    g.rotation.z = bang < 0.15 ? -1.1 + bang * 7 : 0.2 - Math.min(1, (bang - 0.15) * 3) * 1.3
    m.position.y = 2.24 + (bang < 0.15 ? 0.03 : 0)
    const p = rope.geometry.getAttribute('position') as THREE.BufferAttribute
    p.setXYZ(0, 0, POLE, 0)
    p.setXYZ(1, s.position.x, s.position.y + 1.9, 0)
    p.needsUpdate = true
    rope.visible = !free
  })

  return (
    <Stand at={[MOOR.x, MOOR.y]} size={BALLOON}>
      <group ref={whole}>
        <mesh geometry={post} renderOrder={46}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
        <primitive ref={line} object={tether} renderOrder={46} />
        <group ref={ship}>
          <mesh geometry={body} renderOrder={47}>
            <meshStandardMaterial vertexColors flatShading roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={man} geometry={crier} position={[0, 2.24, 0.04]} scale={0.25} renderOrder={47}>
            <meshStandardMaterial vertexColors flatShading roughness={0.7} />
          </mesh>
          <group ref={gavel} position={[0.16, 2.35, 0.12]}>
            <mesh position={[0, 0.1, 0]} renderOrder={47}>
              <boxGeometry args={[0.025, 0.2, 0.025]} />
              <meshStandardMaterial color="#8a5a3c" />
            </mesh>
            <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 2]} renderOrder={47}>
              <cylinderGeometry args={[0.045, 0.045, 0.13, 8]} />
              <meshStandardMaterial color="#8a5a3c" />
            </mesh>
          </group>
          <mesh geometry={banner} position={[0, 1.4, 0.15]} rotation={[TIP, 0, 0]} renderOrder={47}>
            <meshBasicMaterial map={map} transparent side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
    </Stand>
  )
}
