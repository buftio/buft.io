'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { beadGeometry, boatGeometry, cartGeometry, folkGeometry, gateGeometry, glowTexture, quayGeometry, shadowTexture, staticGeometry, wheelGeometry } from './red-aqueduct/build'
import { ACROSS, ALONG, ARC_T0, ARC_T1, GATE_X, H2, MILLS, RIVER_T0, RIVER_T1, WALK, WHEEL_R, WHEEL_Z, craneAt, damAt, deckAt, hash, lift, millAt, river, spot, standMatrix } from './red-aqueduct/layout'
import { CARGO, CHANNEL_BEADS, FOLK, PUFFS, RIVER_BEADS, beadFade, beadPos, folkAt, folkFrame, folkSize, front, newLife, pose, step, wave, type Life } from './red-aqueduct/life'

const BEADS = RIVER_BEADS + CHANNEL_BEADS
const GLOW_TURN = Math.atan2(-0.702, -0.712)
const m = new THREE.Matrix4()
const r = new THREE.Matrix4()
const v = new THREE.Vector3()
const w = new THREE.Vector3()
const sc = new THREE.Vector3()
const q0 = new THREE.Quaternion()
const tint = new THREE.Color()
const BEAD_TONES = ['#a8102f', '#b8183c', '#c42048', '#9a0c2a', '#d8345a']
const CARGO_TONES = ['#ffd36b', '#fbf3e6', '#fbf3e6', '#fbf3e6', '#ffd36b', '#ffd36b', '#d8264a', '#ffd36b', '#ffd36b']
const CARRY_SLOT = [-1, 0, 1, 2, 3, 4, 5, 6]

function Glow({ tex, refMesh, refMat }: { tex: THREE.Texture; refMesh: RefObject<THREE.Mesh | null>; refMat: RefObject<THREE.MeshBasicMaterial | null> }) {
  return (
    <mesh ref={refMesh} renderOrder={47} rotation={[0, 0, GLOW_TURN]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial ref={refMat} map={tex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

export default function Scene({ land, reduced }: SceneProps) {
  const still = useMemo(() => staticGeometry(), [])
  const wheel = useMemo(() => wheelGeometry(), [])
  const gateShape = useMemo(() => gateGeometry(), [])
  const folk = useMemo(() => folkGeometry(), [])
  const cart = useMemo(() => cartGeometry(), [])
  const boat = useMemo(() => boatGeometry(), [])
  const bead = useMemo(() => beadGeometry(), [])
  const quay = useMemo(() => quayGeometry(), [])
  const glow = useMemo(() => glowTexture(), [])
  const dusk = useMemo(() => shadowTexture(), [])
  const ribbon = useRef<THREE.MeshBasicMaterial>(null)
  const bank = useRef<THREE.MeshBasicMaterial>(null)
  const shadow = useRef<THREE.MeshBasicMaterial>(null)
  const top = useMemo(() => {
    const a = lift(deckAt((ARC_T0 + ARC_T1) / 2), ALONG, 0, H2 + 14, 0, new THREE.Vector3())
    return [a.x, a.y, a.z + 20] as [number, number, number]
  }, [])
  const shade = useMemo(() => {
    const a = deckAt((ARC_T0 + ARC_T1) / 2 + 40)
    return [a[0] + 30, -a[1] - 40, 1] as [number, number, number]
  }, [])
  useEffect(
    () => () => {
      for (const g of [still, wheel, gateShape, folk, cart, boat, bead, quay]) g.dispose()
      glow.dispose()
      dusk.dispose()
    },
    [still, wheel, gateShape, folk, cart, boat, bead, quay, glow, dusk],
  )

  const life = useRef<Life | null>(null)
  const wheels = useRef<THREE.InstancedMesh>(null)
  const beads = useRef<THREE.InstancedMesh>(null)
  const folks = useRef<THREE.InstancedMesh>(null)
  const cargo = useRef<THREE.InstancedMesh>(null)
  const carts = useRef<THREE.InstancedMesh>(null)
  const puffs = useRef<THREE.InstancedMesh>(null)
  const boats = useRef<THREE.InstancedMesh>(null)
  const gate = useRef<THREE.Mesh>(null)
  const flag = useRef<THREE.Mesh>(null)
  const riverGlow = useRef<THREE.Mesh>(null)
  const riverMat = useRef<THREE.MeshBasicMaterial>(null)
  const chanGlow = useRef<THREE.Mesh>(null)
  const chanMat = useRef<THREE.MeshBasicMaterial>(null)

  useEffect(() => {
    const b = beads.current
    const c = cargo.current
    if (!b || !c) return
    for (let i = 0; i < BEADS; i++) b.setColorAt(i, tint.set(BEAD_TONES[Math.floor(hash(i + 7) * BEAD_TONES.length)]))
    for (let i = 0; i < CARGO; i++) c.setColorAt(i, tint.set(CARGO_TONES[i]))
    if (b.instanceColor) b.instanceColor.needsUpdate = true
    if (c.instanceColor) c.instanceColor.needsUpdate = true
  }, [])

  useFrame((state, delta) => {
    life.current ??= newLife()
    const s = life.current
    const dt = Math.min(0.05, delta) * (reduced ? 0.12 : 1)
    if (s.time >= s.check) {
      s.check = s.time + 1
      s.danger = threat(land.x, land.y, land.radius)
    }
    step(s, dt, s.danger)
    const wm = wheels.current
    const bm = beads.current
    const fm = folks.current
    const cm = cargo.current
    const km = carts.current
    const pm = puffs.current
    const bo = boats.current
    if (!wm || !bm || !fm || !cm || !km || !pm || !bo) return
    const zoom = state.camera.zoom
    const icon = Math.min(1, Math.max(0, (0.13 - zoom) / 0.055))
    const ws = 1 + 0.7 * icon
    for (let k = 0; k < 3; k++) {
      standMatrix(millAt(k), ALONG, 1, m)
      r.makeRotationZ(s.spin[k]).scale(sc.set(ws, ws, ws)).setPosition(0, (WHEEL_R + 4) * ws, WHEEL_Z + 170 * icon)
      wm.setMatrixAt(k, m.multiply(r))
    }
    standMatrix(damAt(), ACROSS, 1, m)
    r.makeRotationZ(s.spin[3]).scale(sc.set(0.32, 0.32, 0.32)).setPosition(GATE_X - 30, 212, -30)
    wm.setMatrixAt(3, m.multiply(r))
    wm.instanceMatrix.needsUpdate = true

    for (let i = 0; i < BEADS; i++) {
      const p = beadPos(s, i, w)
      const g = (i < RIVER_BEADS ? (1 + 0.4 * wave(s, s.river[i])) * beadFade(s.river[i]) : 0.85) * (1 - icon)
      bm.setMatrixAt(i, m.compose(p, q0, sc.set(g, g, g)))
    }
    bm.instanceMatrix.needsUpdate = true

    for (let i = 0; i < CARGO; i++) cm.setMatrixAt(i, m.makeScale(0, 0, 0))
    for (let i = 0; i < FOLK.length; i++) {
      const kind = FOLK[i].kind
      const ride = kind === 'hauler' ? km : kind === 'boat' ? bo : null
      const carry = folkFrame(s, i, m, ride ? r : null)
      fm.setMatrixAt(i, m)
      if (ride) ride.setMatrixAt(i === 10 || i === 17 ? 0 : 1, r)
      const slot = CARRY_SLOT[i] ?? -1
      if (carry < 0 || slot < 0) continue
      const k = folkSize.value / 30
      if (carry === 0) v.set(17 * k, 2 * k, 12 * k).add(folkAt)
      else if (carry === 1 || carry === 3) v.set(0, 24 * k, 28 * k).add(folkAt)
      else v.set(0, -6, -4).add(folkAt)
      const size = carry === 2 ? 1 : (carry === 3 ? 26 : 20) * k
      pose(m, v, size)
      if (carry === 2) m.multiply(r.makeScale(44, 10, 44))
      cm.setMatrixAt(slot, m)
    }
    const hoist = (s.time % 7) / 7
    const hs = hoist < 0.85 ? (1 - s.alarm) * 22 : 0
    lift(craneAt(), ALONG, 0, 14 + (H2 + 20) * Math.min(1, hoist / 0.8), 92, v)
    cm.setMatrixAt(8, pose(m, v, hs))
    for (const mesh of [fm, cm, km, bo]) mesh.instanceMatrix.needsUpdate = true

    for (let i = 0; i < PUFFS; i++) {
      if (i < 15) {
        const a = s.puff[i]
        const k = i % 3
        lift(millAt(k), 0, 30 + a * 46 + (hash(i) - 0.5) * 16, H2 + 214 + a * 130, -40, v)
        const size = 26 * (1 + 1.5 * icon) * (0.35 + a) * (a < 0.7 ? 1 : (1 - a) / 0.3) * (1 - s.alarm)
        pm.setMatrixAt(i, pose(m, v, size))
      } else {
        const a = (s.time - s.sneeze) / 1.4
        const ang = ((i - 15) / 7) * Math.PI * 2
        lift(deckAt(MILLS[1] + 30), ALONG, Math.cos(ang) * a * 46, H2 + 30 + Math.sin(ang) * a * 30 + a * 24, WALK + 12, v)
        pm.setMatrixAt(i, pose(m, v, a < 1 && s.flee[8] < 0.5 ? 22 * (1 - a) * Math.min(1, a * 6) : 0))
      }
    }
    pm.instanceMatrix.needsUpdate = true

    if (gate.current) gate.current.position.y = 62 + s.gate * 104
    if (flag.current) {
      flag.current.position.y = 300 + s.alarm * 110
      flag.current.scale.setScalar(Math.max(0.001, s.alarm))
      flag.current.rotation.y = Math.sin(s.time * 4) * 0.3
    }
    const f = front(s)
    const on = f > RIVER_T0 && f < RIVER_T1 + 200
    const fade = on ? Math.min(1, (RIVER_T1 + 200 - f) / 400) : 0
    const big = 1 + 0.7 * icon
    if (ribbon.current) ribbon.current.opacity = 0.85 * icon * (1 - 0.7 * s.alarm)
    if (bank.current) {
      bank.current.opacity = 0.9 * Math.min(1, Math.max(0, (0.17 - zoom) / 0.06))
      bank.current.visible = bank.current.opacity > 0.01
    }
    if (shadow.current) shadow.current.opacity = 0.35 + 0.35 * icon
    if (riverGlow.current && riverMat.current) {
      const ft = Math.min(f, RIVER_T1)
      const [c, h] = river(ft)
      const [x, y] = spot(ft, c)
      riverGlow.current.position.set(x, -y, 7)
      riverGlow.current.scale.set(520 * big, (2 * h + 80) * big, 1)
      riverMat.current.opacity = (zoom < 0.15 ? 0.9 : 0.5) * fade
    }
    if (chanGlow.current && chanMat.current) {
      const ct = Math.min(f, ARC_T1)
      lift(deckAt(ct), ALONG, 0, H2 + 18, 0, w)
      chanGlow.current.position.copy(w).setZ(w.z + 10)
      chanGlow.current.scale.set(380 * big, 120 * big, 1)
      chanMat.current.opacity = f < ARC_T1 + 100 ? 0.95 * (on ? 1 : 0) : 0
    }
  })

  return (
    <group>
      <mesh position={shade} rotation={[0, 0, GLOW_TURN]} scale={[(ARC_T1 - ARC_T0) * 1.15, 300, 1]} renderOrder={44}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={shadow} map={dusk} transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh geometry={quay} renderOrder={44}>
        <meshBasicMaterial ref={bank} vertexColors transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={top} rotation={[0, 0, GLOW_TURN]} scale={[(ARC_T1 - ARC_T0) * 1.2, 90, 1]} renderOrder={47}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial ref={ribbon} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh geometry={still} renderOrder={45}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={wheels} args={[wheel, undefined, 4]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={beads} args={[bead, undefined, BEADS]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial roughness={0.5} emissive="#3a0010" />
      </instancedMesh>
      <instancedMesh ref={folks} args={[folk, undefined, FOLK.length]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={cargo} args={[undefined, undefined, CARGO]} frustumCulled={false} renderOrder={48}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={carts} args={[cart, undefined, 2]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={boats} args={[boat, undefined, 2]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={puffs} args={[undefined, undefined, PUFFS]} frustumCulled={false} renderOrder={49}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color="#fffaf2" flatShading roughness={1} emissive="#3a3530" />
      </instancedMesh>
      <Stand at={damAt()} size={1} turn={ACROSS}>
        <mesh ref={gate} geometry={gateShape} position={[GATE_X, 62, 30]} renderOrder={46}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </mesh>
        <mesh ref={flag} position={[GATE_X - 102, 300, 6]} renderOrder={46}>
          <planeGeometry args={[60, 34]} />
          <meshBasicMaterial color="#ff2d55" side={THREE.DoubleSide} />
        </mesh>
      </Stand>
      <Glow tex={glow} refMesh={riverGlow} refMat={riverMat} />
      <Glow tex={glow} refMesh={chanGlow} refMat={chanMat} />
    </group>
  )
}
