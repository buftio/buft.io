'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { cartGeometry, cookGeometry, kiteGeometry, sentryGeometry } from './folk'
import { along, BEACONS, clock, frame, H, INK, KITCHEN, LEN, PITCH, pop, SITES, T, type Mood } from './space'

const v = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const ROLL = new THREE.Quaternion()
const Z = new THREE.Vector3(0, 0, 1)

const T2 = BEACONS.find((x) => x.u === SITES.t2) ?? BEACONS[1]
const F2 = frame(T2.u)
const HOME = new THREE.Vector3(860, 930, 760)
const BOWS = 9
const KITE = 1.7
const STRING = 28
const BOW_COLORS = ['#e0679b', '#fbe9f2', '#16b3a0'].map((c) => new THREE.Color(c))

function bowGeometry() {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, -14, 9, 0, -14, -9, 0, 0, 0, 0, 14, -9, 0, 14, 9, 0], 3))
  g.computeVertexNormals()
  return g
}

export function Kite({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const geo = useMemo(() => {
    const rider = sentryGeometry()
    const k = kiteGeometry(rider)
    rider.dispose()
    return k
  }, [])
  const bow = useMemo(() => bowGeometry(), [])
  const line = useMemo(() => {
    const g = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(STRING * 3), 3))
    const l = new THREE.Line(g, new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.75 }))
    l.frustumCulled = false
    l.renderOrder = 48
    return l
  }, [])
  useEffect(
    () => () => {
      ;[geo, bow, line.geometry].forEach((g) => g.dispose())
      ;(line.material as THREE.Material).dispose()
    },
    [geo, bow, line],
  )
  const kite = useRef<THREE.Mesh>(null)
  const tail = useRef<THREE.InstancedMesh>(null)
  const str = useRef<THREE.Line>(null)

  useFrame((state) => {
    const [k, tl, ln] = [kite.current, tail.current, str.current]
    if (!k || !tl || !ln) return
    const t = clock(state.clock.elapsedTime, reduced)
    const reel = mood.current.alarm * 0.5
    pop(F2.x, T2.h + 60, F2.z, a)
    b.set(HOME.x + Math.sin(t * 0.37) * 70 + Math.sin(t * 0.91) * 25, HOME.y + Math.sin(t * 0.53) * 50, HOME.z)
    b.lerp(a, reel)
    const roll = Math.sin(t * 0.6) * 0.14 + Math.sin(t * 1.7) * 0.04
    k.position.copy(b)
    k.rotation.set(0, 0, roll)
    k.scale.setScalar(KITE)
    ROLL.setFromAxisAngle(Z, roll)
    for (let i = 0; i < BOWS; i++) {
      const w = Math.sin(t * 2.4 - i * 0.7) * (6 + i * 2.5)
      v.set((-34 - i * 30 + w * 0.3) * KITE, (-120 - i * 10 + w) * KITE, 1).applyQuaternion(ROLL).add(b)
      q.setFromAxisAngle(Z, Math.sin(t * 3 - i) * 0.5)
      tl.setMatrixAt(i, m.compose(v, q, s.set(1.4 * KITE, 1.4 * KITE, 1)))
      tl.setColorAt(i, BOW_COLORS[i % 3])
    }
    tl.instanceMatrix.needsUpdate = true
    if (tl.instanceColor) tl.instanceColor.needsUpdate = true
    const pos = ln.geometry.getAttribute('position') as THREE.BufferAttribute
    const sag = 220 * (1 - reel)
    v.set(0, 40 * KITE, 0).applyQuaternion(ROLL).add(b)
    for (let i = 0; i < STRING; i++) {
      const f = i / (STRING - 1)
      pos.setXYZ(i, a.x + (v.x - a.x) * f, a.y + (v.y - a.y) * f - Math.sin(Math.PI * f) * sag, a.z + (v.z - a.z) * f)
    }
    pos.needsUpdate = true
  })

  return (
    <group>
      <primitive ref={str} object={line} />
      <mesh ref={kite} geometry={geo} frustumCulled={false} renderOrder={49}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={tail} args={[bow, undefined, BOWS]} frustumCulled={false} renderOrder={49}>
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

const KF = frame(SITES.kitchen)
const CART_A = SITES.kitchen - (KITCHEN.r + 40) / LEN
const CART_B = SITES.t2 + (T2.r + 40) / LEN

export function Kitchen({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const cookGeo = useMemo(() => cookGeometry(), [])
  const cartGeo = useMemo(() => cartGeometry(), [])
  useEffect(() => () => [cookGeo, cartGeo].forEach((g) => g.dispose()), [cookGeo, cartGeo])
  const cook = useRef<THREE.Mesh>(null)
  const cart = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const [c, w] = [cook.current, cart.current]
    if (!c || !w) return
    const near = state.camera.zoom > 0.11
    c.visible = near
    w.visible = near
    if (!near) return
    const t = clock(state.clock.elapsedTime, reduced)
    const taste = Math.max(0, Math.sin(t * 0.45)) ** 10
    const stir = Math.sin(t * 2.2) * 0.5 * (1 - taste)
    pop(KF.x - 4 + KF.nx * 50, KITCHEN.h + 4, KF.z - 30 + KF.nz * 50, c.position)
    c.quaternion.setFromEuler(e.set(taste * 0.5, stir, Math.sin(t * 2.2 + 1) * 0.06, 'YXZ')).premultiply(PITCH)
    const trip = 16
    const rest = 4
    const cyc = 2 * (trip + rest)
    const x = (t * (1 + mood.current.alarm)) % cyc
    let k = 0
    let dir = 1
    if (x < rest) k = 0
    else if (x < rest + trip) k = (x - rest) / trip
    else if (x < 2 * rest + trip) k = 1
    else {
      k = 1 - (x - 2 * rest - trip) / trip
      dir = -1
    }
    const ease = k * k * (3 - 2 * k)
    const f = along(CART_A + (CART_B - CART_A) * ease)
    const off = T * 0.2
    pop(f.x + f.nx * off, H + 8 + (k > 0 && k < 1 ? Math.abs(Math.sin(t * 10)) * 1.5 : 0), f.z + f.nz * off, w.position)
    const turn = Math.atan2(-f.tz * dir, f.tx * dir)
    w.quaternion.setFromEuler(e.set(0, turn, 0, 'YXZ')).premultiply(PITCH)
  })

  return (
    <group>
      <mesh ref={cook} geometry={cookGeo} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
      <mesh ref={cart} geometry={cartGeo} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </mesh>
    </group>
  )
}
