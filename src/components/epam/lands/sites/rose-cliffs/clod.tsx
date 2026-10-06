'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Kit, rng, TILT } from './kit'
import { CLOD, LIFT, snort } from './layout'
import { INK } from './models'

const HIDE = '#b32748'
const QUARTZ = '#ffc8da'
const BEADS = ['#d23a58', '#e65a74', '#c42c4c', '#a81f40']
const LEG = 0.42
const UP = new THREE.Vector3(0, 1, 0)
const CALM = new THREE.Color('#ffffff')
const HOT = new THREE.Color('#ff7a3d')

function lumpy(g: THREE.BufferGeometry) {
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = [p.getX(i), p.getY(i), p.getZ(i)]
    const k = 1 + 0.07 * Math.sin(3 * x + 1) * Math.sin(4 * y) * Math.sin(5 * z + 2)
    p.setXYZ(i, x * k, y * k, z * k)
  }
  g.computeVertexNormals()
  return g
}

function onShell(k: Kit, shape: THREE.BufferGeometry, color: string, n: THREE.Vector3, lift: number) {
  shape.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, n))
  k.add(shape, color, n.x * 1.3 * lift, 0.85 + n.y * 0.85 * lift, n.z * 1.1 * lift, { top: '#ffe0ea' })
}

function bodyGeometry() {
  const r = rng(7)
  const k = new Kit()
  k.add(lumpy(new THREE.IcosahedronGeometry(1, 2)), HIDE, 0, 0.85, 0, { sx: 1.3, sy: 0.85, sz: 1.1, top: '#d34868' })
  for (let i = 0; i < 38; i++) {
    const n = new THREE.Vector3(r() * 2 - 1, 0.15 + r() * 0.85, r() * 2 - 1.2).normalize()
    const g = new THREE.CylinderGeometry(0.15, 0.15, 0.07, 9)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, n))
    k.add(g, BEADS[i % 4], n.x * 1.3 * 0.98, 0.85 + n.y * 0.85 * 0.98, n.z * 1.1 * 0.98)
  }
  return k.build()
}

function spikeGeometry() {
  const k = new Kit()
  for (let i = 0; i < 9; i++) {
    const t = i / 8
    const n = new THREE.Vector3(Math.sin(i * 2.4) * 0.35, 1, -0.9 + t * 1.3).normalize()
    onShell(k, new THREE.ConeGeometry(0.11, 0.42 + (i % 3) * 0.14, 5), QUARTZ, n, 1.08)
  }
  return k.build()
}

function legGeometry() {
  const k = new Kit()
  for (const [x, z] of [[-0.75, -0.55], [0.75, -0.55], [-0.75, 0.5], [0.75, 0.5]])
    k.add(new THREE.CylinderGeometry(0.22, 0.26, 1, 8), '#8e1d3a', x, 0.5, z)
  return k.build()
}

function faceGeometry() {
  const k = new Kit()
  k.add(new THREE.SphereGeometry(0.55, 14, 10), '#c23a58', 0, 0, 0, { sx: 1, sy: 0.78, sz: 0.85, top: '#de5a78' })
  k.add(new THREE.SphereGeometry(0.22, 10, 8), '#9c1f3d', 0, -0.08, 0.42, { sx: 1.3 })
  for (const s of [-1, 1]) {
    k.add(new THREE.SphereGeometry(0.05, 6, 4), INK, s * 0.1, -0.06, 0.62)
    k.add(new THREE.SphereGeometry(0.25, 12, 8), '#ffffff', s * 0.26, 0.3, 0.32)
    k.add(new THREE.SphereGeometry(0.11, 8, 6), INK, s * 0.25, 0.26, 0.55)
    k.add(new THREE.ConeGeometry(0.08, 0.24, 5), QUARTZ, s * 0.3, 0.52, -0.05, { rz: -s * 0.3 })
    k.add(new THREE.SphereGeometry(0.16, 8, 6), '#a3233f', s * 0.52, 0.18, -0.12, { sz: 0.5, ry: s * 0.6 })
    k.box(0.2, 0.035, 0.05, INK, s * 0.09, -0.3, 0.42, { rz: s * -0.35 })
  }
  return k.build()
}

function lidGeometry() {
  return new Kit().add(new THREE.SphereGeometry(0.265, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#b8304f').build()
}

export function Clod({ alarm, reduced }: { alarm: RefObject<number>; reduced: boolean }) {
  const geo = useMemo(() => ({ body: bodyGeometry(), spikes: spikeGeometry(), legs: legGeometry(), face: faceGeometry(), lid: lidGeometry() }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const torso = useRef<THREE.Group>(null)
  const legs = useRef<THREE.Mesh>(null)
  const head = useRef<THREE.Group>(null)
  const lids = useRef<THREE.Group>(null)
  const glow = useRef<THREE.MeshStandardMaterial>(null)
  const clock = useRef(0)

  useFrame((_, delta) => {
    if (!torso.current || !legs.current || !head.current || !lids.current || !glow.current) return
    clock.current += Math.min(delta, 0.1) * (reduced ? 0.1 : 1)
    const t = clock.current
    const a = alarm.current ?? 0
    const leg = LEG + a * 0.9
    legs.current.scale.set(1, leg, 1)
    torso.current.position.y = leg - LEG
    torso.current.scale.set(1, 1 + Math.sin(t * 0.9) * 0.035 + (snort(t) < 0.7 ? Math.sin((snort(t) / 0.7) * Math.PI) * 0.08 : 0), 1 + Math.sin(t * 0.9) * 0.02)
    const glance = Math.max(0, Math.sin(t * 0.21) - 0.75) * 4
    head.current.rotation.y = (1 - a) * (Math.sin(t * 0.13) * 0.3 + glance * 0.7) + a * 0.55
    const s = snort(t)
    const huff = s < 0.7 ? Math.sin((s / 0.7) * Math.PI) : 0
    head.current.rotation.x = (1 - a) * 0.12 - a * 0.25 + Math.sin(t * 0.9) * 0.03 - huff * 0.35
    const blink = (t % 6.3) < 0.18 ? 1 : 0
    const lid = blink ? 1.2 : (1 - a) * (glance > 0.3 ? -1.1 : -0.55) - a * 1.6
    for (const l of lids.current.children) l.rotation.x = lid
    glow.current.color.lerpColors(CALM, HOT, a)
    glow.current.emissiveIntensity = a * (1.2 + Math.sin(t * 6) * 0.4)
  })

  return (
    <group position={[CLOD.x, -CLOD.y, LIFT]} quaternion={TILT} scale={CLOD.s}>
      <mesh ref={legs} geometry={geo.legs} scale={[1, LEG, 1]}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
      <group ref={torso}>
        <mesh geometry={geo.body}>
          <meshStandardMaterial vertexColors flatShading roughness={0.75} />
        </mesh>
        <mesh geometry={geo.spikes}>
          <meshStandardMaterial ref={glow} vertexColors flatShading roughness={0.3} emissive="#ff4a2a" emissiveIntensity={0} />
        </mesh>
        <group ref={head} position={[0, 0.78, 1.12]} scale={1.3}>
          <mesh geometry={geo.face}>
            <meshStandardMaterial vertexColors flatShading roughness={0.7} />
          </mesh>
          <group ref={lids}>
            {[-1, 1].map((s) => (
              <mesh key={s} geometry={geo.lid} position={[s * 0.26, 0.3, 0.32]}>
                <meshStandardMaterial vertexColors flatShading roughness={0.7} />
              </mesh>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}
