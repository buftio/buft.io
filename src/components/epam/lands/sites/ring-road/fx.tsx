'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { LAMPS } from './build'
import { glowDisc, merged, rand, TILT } from './kit'
import { CAMP, INN, POST, TOLL, VEIN } from './map'
import { board, signQuad, signTexture } from './signs'

const PUFFS = 8
const BEADS = 26
const AMBER = new THREE.Color('#ffae42')
const DIM = new THREE.Color('#5a2a1a')
const o = new THREE.Object3D()
const v = new THREE.Vector3()
const pt = { x: 0, y: 0, dx: 0, dy: 0 }

function at(dx: number, dy: number, x: number, y: number, z: number) {
  return v.set(x, y, z).applyQuaternion(TILT).add(new THREE.Vector3(dx, -dy, 0)).clone()
}

const CHIMNEY = at(INN.x, INN.y, 105, 432, -46)
const BULBS = [...LAMPS.map(([x, y]) => at(x, y, 0, 92, 0)), at(CAMP.x, CAMP.y, 0, 22, 0)]
const WINDOWS: [number, number, number, number][] = [
  [-100, 70, 56, 50],
  [100, 70, 56, 50],
  [-108, 180, 44, 42],
  [0, 180, 44, 42],
  [108, 180, 44, 42],
]

function windows() {
  const parts = WINDOWS.map(([x, y, w, h]) => {
    const g = new THREE.PlaneGeometry(w * 1.5, h * 1.5)
    g.deleteAttribute('uv')
    const p = at(INN.x, INN.y, x, y, 100)
    return g.applyQuaternion(TILT).translate(p.x, p.y, p.z)
  })
  return merged(parts)
}

function bead() {
  const g = new THREE.CircleGeometry(15, 14)
  const n = g.getAttribute('position').count
  const rgb = new Float32Array(n * 3)
  for (let i = 0; i < n; i++) rgb.set(i ? [0.78, 0.1, 0.2] : [1, 0.5, 0.5], i * 3)
  g.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  return g.scale(1, 0.8, 1)
}

function signs() {
  return merged([
    board(3, 170, POST.x, POST.y, 248, -0.25, 0.04),
    board(4, 170, POST.x, POST.y, 214, 0.3, -0.05),
    board(5, 190, POST.x, POST.y, 178, -0.1, 0.02),
    board(5, 190, -870, -1500, 120, 0.2, 0),
  ])
}

export function Fx({ clock, fear }: { clock: RefObject<number>; fear: RefObject<number> }) {
  const geos = useMemo(
    () => ({ glow: glowDisc(), puff: new THREE.IcosahedronGeometry(1, 1), win: windows(), bead: bead(), signs: signs(), inn: signQuad(0, 150, 2), spin: signQuad(6, 170), toll: signQuad(2, 210), free: signQuad(7, 210) }),
    [],
  )
  const tex = useMemo(() => signTexture(), [])
  const sign = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, alphaTest: 0.3 }), [tex])
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose())
      tex.dispose()
      sign.dispose()
    },
    [geos, tex, sign],
  )
  const seed = useMemo(() => {
    const r = rand(3)
    return { beads: Array.from({ length: BEADS }, () => [r(), (r() - 0.5) * 22, r() * 6] as const), lamps: BULBS.map(() => r() * 9) }
  }, [])
  const puffs = useRef<THREE.InstancedMesh>(null)
  const beads = useRef<THREE.InstancedMesh>(null)
  const lamps = useRef<THREE.InstancedMesh>(null)
  const lampMat = useRef<THREE.MeshBasicMaterial>(null)
  const winMat = useRef<THREE.MeshBasicMaterial>(null)
  const halo = useRef<THREE.MeshBasicMaterial>(null)
  const swing = useRef<THREE.Group>(null)
  const spin = useRef<THREE.Mesh>(null)
  const toll = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = clock.current
    const f = fear.current
    const zoom = state.camera.zoom
    const far = Math.min(1, Math.max(0, (0.16 - zoom) / 0.08))
    const P = puffs.current
    if (P) {
      for (let i = 0; i < PUFFS; i++) {
        const k = (t * 0.22 + i / PUFFS) % 1
        const s = (10 + k * 34) * Math.sin(Math.PI * Math.min(1, k * 1.15)) * (1 - f)
        o.position.set(CHIMNEY.x + k * 70 + Math.sin(t + i) * 10, CHIMNEY.y + k * 240, CHIMNEY.z + 5)
        o.scale.setScalar(Math.max(0.001, s))
        o.rotation.set(0, 0, i)
        o.updateMatrix()
        P.setMatrixAt(i, o.matrix)
      }
      P.instanceMatrix.needsUpdate = true
    }
    const B = beads.current
    if (B) {
      seed.beads.forEach(([u, lat, ph], i) => {
        const k = (u + t * 0.035) % 1
        VEIN.at(k * 1600, pt)
        const fade = Math.min(1, k * 8, (1 - k) * 8)
        o.position.set(pt.x - pt.dy * lat, -(pt.y + pt.dx * lat), 4)
        o.rotation.set(0, 0, Math.atan2(-pt.dy, pt.dx) + Math.sin(t * 2 + ph) * 0.4)
        o.scale.setScalar(Math.max(0.001, fade))
        o.updateMatrix()
        B.setMatrixAt(i, o.matrix)
      })
      B.instanceMatrix.needsUpdate = true
    }
    const G = lamps.current
    if (G) {
      BULBS.forEach((b, i) => {
        const fire = i === BULBS.length - 1 ? 1.5 + Math.sin(t * 13) * 0.15 + Math.sin(t * 7.7) * 0.12 : 1
        const s = (34 + Math.sin(t * 9 + seed.lamps[i]) * 3 + Math.sin(t * 5.3 + i) * 2) * (1 + far * 2.4) * fire
        o.position.copy(b)
        o.rotation.set(0, 0, 0)
        o.scale.setScalar(s * (1 - f * 0.85))
        o.updateMatrix()
        G.setMatrixAt(i, o.matrix)
      })
      G.instanceMatrix.needsUpdate = true
    }
    if (lampMat.current) lampMat.current.color.copy(AMBER).lerp(DIM, f).multiplyScalar(0.55 + far * 0.45)
    if (winMat.current) winMat.current.color.copy(AMBER).multiplyScalar((0.5 + Math.sin(t * 7) * 0.04 + Math.sin(t * 2.3) * 0.05) * (1 - f))
    if (halo.current) halo.current.opacity = far * 0.35 * (1 - f * 0.7)
    if (swing.current) swing.current.rotation.z = Math.sin(t * 1.6) * 0.12 + Math.sin(t * 0.7) * 0.06
    if (spin.current) spin.current.rotation.y = f > 0.3 ? Math.PI : t * 0.9 + Math.sin(t * 0.4) * 2
    if (toll.current) toll.current.geometry = f > 0.3 ? geos.free : geos.toll
  })

  return (
    <group>
      <mesh geometry={geos.glow} position={[INN.x, -INN.y + 60, 3]} scale={520} renderOrder={41}>
        <meshBasicMaterial ref={halo} vertexColors color="#ffb050" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} toneMapped={false} />
      </mesh>
      <mesh geometry={geos.signs} material={sign} />
      <Stand at={[INN.x, INN.y]} size={1}>
        <group ref={swing} position={[-250, 196, 96]}>
          <mesh geometry={geos.inn} position={[0, -30, 0]} material={sign} />
        </group>
      </Stand>
      <Stand at={[POST.x, POST.y]} size={1}>
        <mesh ref={spin} geometry={geos.spin} position={[0, 285, 0]} material={sign} />
      </Stand>
      <Stand at={[TOLL.x, TOLL.y]} size={1}>
        <mesh ref={toll} geometry={geos.toll} position={[0, 236, 0]} material={sign} />
      </Stand>
      <instancedMesh ref={puffs} args={[geos.puff, undefined, PUFFS]} frustumCulled={false}>
        <meshStandardMaterial color="#efe6f2" roughness={1} transparent opacity={0.85} depthWrite={false} flatShading />
      </instancedMesh>
      <instancedMesh ref={beads} args={[geos.bead, undefined, BEADS]} frustumCulled={false} renderOrder={42}>
        <meshBasicMaterial vertexColors depthWrite={false} depthTest={false} />
      </instancedMesh>
      <mesh geometry={geos.win} renderOrder={47}>
        <meshBasicMaterial ref={winMat} color="#ffae42" blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <instancedMesh ref={lamps} args={[geos.glow, undefined, BULBS.length]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial ref={lampMat} vertexColors blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
