'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { sample, track, TILT, UP, wrap } from './kit'
import { CHARMER, EGGS, JETTY, NOSE, ROAD, SHRINE, STROLL } from './map'
import { bow as bowGeo, charmer, folkBody, folkEyes, hat, kite, note } from './models'
import { KIDS, kid, pip } from './motion'

type Live = { alarm: RefObject<number>; reduced: boolean }
type Role = 'flyer' | 'kid' | 'rider' | 'crowd' | 'pilgrim' | 'monk' | 'nurse' | 'guard' | 'stroll' | 'fisher'
type Folk = { role: Role; i: number; body: string; hat: string | null; s: number }

const road = track(ROAD, false, 128)
const stroll = track(STROLL, true, 128)

const CAST: Folk[] = [
  ...Array.from({ length: KIDS }, (_, i) => ({ role: 'kid' as Role, i, body: i % 2 ? '#7a63e0' : '#6a55d0', hat: i % 3 ? '#16b3a0' : '#ffb43a', s: 32 })),
  { role: 'rider', i: 1, body: '#6a55d0', hat: '#ffb43a', s: 30 },
  { role: 'rider', i: 3, body: '#5b3fb8', hat: '#16b3a0', s: 30 },
  ...Array.from({ length: 5 }, (_, i) => ({ role: 'crowd' as Role, i, body: ['#3b2a8f', '#4b35a5', '#5b3fb8'][i % 3], hat: i % 2 ? '#f1d28a' : null, s: 30 })),
  ...Array.from({ length: 4 }, (_, i) => ({ role: 'pilgrim' as Role, i, body: '#4b35a5', hat: '#e8578f', s: 30 })),
  { role: 'monk', i: 0, body: '#3b2a8f', hat: '#ffb43a', s: 34 },
  { role: 'nurse', i: 0, body: '#5b3fb8', hat: '#ffffff', s: 32 },
  { role: 'guard', i: 1, body: '#3b2a8f', hat: '#16b3a0', s: 32 },
  { role: 'guard', i: 3, body: '#4b35a5', hat: '#16b3a0', s: 32 },
  ...Array.from({ length: 5 }, (_, i) => ({ role: 'stroll' as Role, i, body: ['#3b2a8f', '#5b3fb8', '#4b35a5'][i % 3], hat: '#f1d28a', s: 30 })),
  { role: 'fisher', i: 0, body: '#4b35a5', hat: '#f1d28a', s: 30 },
  { role: 'flyer', i: 0, body: '#6a55d0', hat: '#16b3a0', s: 28 },
]

const p = new THREE.Vector3()
const d = new THREE.Vector3()
const q = new THREE.Quaternion()
const tq = new THREE.Quaternion()
const bow = new THREE.Quaternion()
const X = new THREE.Vector3(1, 0, 0)
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()
const col = new THREE.Color()

const HAND: [number, number] = [-330, 10]

const face = (dx: number, dy: number) => Math.max(-1.35, Math.min(1.35, Math.atan2(dx, -dy)))

function place(f: Folk, time: number, a: number) {
  let turn = 0
  let nod = 0
  let show = 1
  if (f.role === 'kid') {
    const mode = kid(time, f.i, p, d)
    turn = face(d.x, d.y)
    if (mode === 2) nod = 0.5
    show = 1 - Math.min(1, a * 3)
  } else if (f.role === 'rider') {
    pip(time, f.i, p, d)
    p.y += 88
    p.z = 105 + Math.sin(time * 2 - f.i) * 8
    turn = face(d.x, d.y)
  } else if (f.role === 'crowd') {
    const ang = -0.9 - f.i * 0.42
    p.set(CHARMER[0] + Math.cos(ang) * 150, -CHARMER[1] + Math.sin(ang) * 110, 0)
    p.z = Math.abs(Math.sin(time * (2.2 + a * 6) + f.i)) * (6 + a * 40)
    turn = face(CHARMER[0] - p.x, -CHARMER[1] - p.y) * 0.6
  } else if (f.role === 'pilgrim') {
    const k = wrap(time * (0.018 + a * 0.05) + f.i * 0.25)
    const u = k < 0.5 ? k * 2 : 2 - k * 2
    sample(road, Math.min(1, u * 1.08), p, d)
    if (k >= 0.5) d.negate()
    p.x += (f.i % 2 ? 1 : -1) * 18
    p.z = Math.abs(Math.sin(time * 5 + f.i)) * 6
    turn = face(d.x, d.y)
    if (u > 0.93) nod = 0.5 + Math.sin(time * 3) * 0.4
  } else if (f.role === 'monk') {
    p.set(SHRINE[0] + 10, -SHRINE[1] - 110, 0)
    nod = 0.45 + Math.sin(time * 1.4) * 0.45
    turn = Math.PI
  } else if (f.role === 'nurse') {
    p.set(-120, 210, 0)
    p.z = Math.abs(Math.sin(time * 3)) * 5
    turn = 1.2
    nod = 0.2 + Math.sin(time * 1.5) * 0.15
  } else if (f.role === 'guard') {
    const e = EGGS[f.i]
    const k = Math.sin(time * 0.4 + f.i)
    p.set(e.at[0] + k * e.r * 0.9, -e.at[1] - e.r - 30, 0)
    turn = face(Math.cos(time * 0.4 + f.i), 0)
  } else if (f.role === 'stroll') {
    sample(stroll, wrap(time * (0.006 + a * 0.02) * (1 + f.i * 0.15) + f.i * 0.2), p, d)
    p.z = Math.abs(Math.sin(time * 5 + f.i)) * 5
    turn = face(d.x, d.y)
  } else if (f.role === 'flyer') {
    p.set(HAND[0] + Math.sin(time * 0.7) * 30, -HAND[1] - 10, Math.abs(Math.sin(time * 2.4)) * 6)
    turn = -0.5
  } else {
    p.set(JETTY[0] + 330, -JETTY[1] + 20, 0)
    p.z = Math.sin(time * 1.3) * 3
    nod = Math.sin(time * 0.7) > 0.8 ? 0.6 : 0.1
    turn = 1.2
  }
  q.copy(TILT).multiply(tq.setFromAxisAngle(UP, turn)).multiply(bow.setFromAxisAngle(X, nod))
  return m.compose(p, q, sc.setScalar(f.s * show + 0.001))
}

export function Folk({ alarm, reduced }: Live) {
  const geo = useMemo(() => ({ body: folkBody(), eyes: folkEyes(), hat: hat() }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const bodies = useRef<THREE.InstancedMesh>(null)
  const eyes = useRef<THREE.InstancedMesh>(null)
  const hats = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const [b, h] = [bodies.current, hats.current]
    if (!b || !h) return
    CAST.forEach((f, k) => {
      b.setColorAt(k, col.set(f.body))
      h.setColorAt(k, col.set(f.hat ?? '#ffffff'))
    })
    for (const im of [b, h]) if (im.instanceColor) im.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const [b, e, h] = [bodies.current, eyes.current, hats.current]
    if (!b || !e || !h) return
    const on = state.camera.zoom > 0.12
    b.visible = e.visible = h.visible = on
    if (!on) return
    const time = reduced ? 3 : state.clock.elapsedTime
    CAST.forEach((f, k) => {
      const mat = place(f, time, alarm.current)
      b.setMatrixAt(k, mat)
      e.setMatrixAt(k, mat)
      if (!f.hat) mat.scale(sc.setScalar(0))
      h.setMatrixAt(k, mat)
    })
    for (const im of [b, e, h]) im.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={bodies} args={[geo.body, undefined, CAST.length]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={eyes} args={[geo.eyes, undefined, CAST.length]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={hats} args={[geo.hat, undefined, CAST.length]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
    </group>
  )
}

const NOTES = 9
const TIP: [number, number] = [CHARMER[0] + 40, -CHARMER[1] + 26]
const AIM: [number, number] = [NOSE[0][0] - 60, -NOSE[0][1] - 40]
const gold = new THREE.Color('#ffc23a')
const red = new THREE.Color('#ff3d4a')

export function Charmer({ alarm, reduced }: Live) {
  const geo = useMemo(() => ({ man: charmer(), note: note() }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const man = useRef<THREE.Group>(null)
  const notes = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const [g, n] = [man.current, notes.current]
    if (!g || !n) return
    const time = reduced ? 2 : state.clock.elapsedTime
    const a = alarm.current
    g.rotation.z = Math.sin(time * (1.6 + a * 5)) * 0.08
    g.position.z = Math.abs(Math.sin(time * (1.6 + a * 5))) * 6
    col.copy(gold).lerp(red, a)
    for (let k = 0; k < NOTES; k++) {
      const u = wrap(time * (0.2 + a * 0.4) + k / NOTES)
      const x = TIP[0] + (AIM[0] - TIP[0]) * u
      const y = TIP[1] + (AIM[1] - TIP[1]) * u + Math.sin(u * 9 + k) * 40
      const s = 30 * Math.sin(Math.min(1, u * 1.3) * Math.PI) + 0.001
      n.setMatrixAt(k, m.compose(p.set(x, y, 70), q.setFromAxisAngle(d.set(0, 0, 1), Math.sin(time * 3 + k) * 0.3), sc.set(s, s, 1)))
      n.setColorAt(k, col)
    }
    n.instanceMatrix.needsUpdate = true
    if (n.instanceColor) n.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <group position={[CHARMER[0], -CHARMER[1], 0]}>
        <group ref={man}>
          <mesh geometry={geo.man} rotation={[(50 * Math.PI) / 180, 0.9, 0, 'XYZ']} scale={46} renderOrder={47}>
            <meshStandardMaterial vertexColors roughness={0.6} />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={notes} args={[geo.note, undefined, NOTES]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

const BOWS = 9
const tie = new THREE.Vector3()
const fly = new THREE.Vector3()
const ribbon = [new THREE.Color('#ffb43a'), new THREE.Color('#16b3a0'), new THREE.Color('#e8578f')]

export function Kite({ reduced }: { reduced: boolean }) {
  const geo = useMemo(() => ({ kite: kite(), bow: bowGeo(), cord: new THREE.PlaneGeometry(1, 1) }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const body = useRef<THREE.Mesh>(null)
  const bows = useRef<THREE.InstancedMesh>(null)
  const cord = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const b = bows.current
    if (!b) return
    for (let k = 0; k < BOWS; k++) b.setColorAt(k, ribbon[k % 3])
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const [k, b, c] = [body.current, bows.current, cord.current]
    if (!k || !b || !c) return
    const time = reduced ? 1 : state.clock.elapsedTime
    fly.set(-300 + Math.sin(time * 0.5) * 60, 250 + Math.sin(time * 1.0) * 30, 90)
    const lean = Math.sin(time * 0.5) * 0.35
    k.position.copy(fly)
    k.rotation.set(0, 0, lean)
    k.scale.set(80, 80, 1)
    tie.set(HAND[0] + Math.sin(time * 0.7) * 30 + 12, -HAND[1] + 14, 30)
    c.position.lerpVectors(tie, fly, 0.5)
    c.rotation.set(0, 0, Math.atan2(fly.y - tie.y, fly.x - tie.x))
    c.scale.set(tie.distanceTo(fly), 2.2, 1)
    for (let i = 0; i < BOWS; i++) {
      const u = (i + 1) / BOWS
      p.set(fly.x + Math.sin(time * 3 - i * 0.8) * 22 * u + Math.sin(lean) * 50, fly.y - 60 - u * 260, 88)
      b.setMatrixAt(i, m.compose(p, q.setFromAxisAngle(d.set(0, 0, 1), time * 2 + i), sc.set(26, 26, 1)))
    }
    b.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh ref={cord} geometry={geo.cord} renderOrder={48}>
        <meshBasicMaterial color="#3a2a40" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={body} geometry={geo.kite} renderOrder={49}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={bows} args={[geo.bow, undefined, BOWS]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
