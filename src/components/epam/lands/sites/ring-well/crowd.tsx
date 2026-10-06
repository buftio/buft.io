'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { folk, hood, PASTEL, poles, queuePath } from './build'
import { rand, TILT, UP } from './kit'
import { FIRE, HEAP, RING } from './place'

const RIM = 26
const LINE = 34
const CAMPERS = 5
const ALL = RIM + LINE + CAMPERS
const COINS = 24
const SPLASH = 10
const MOTES = 40
const SIZE = 15
const STEP = 3

const o = new THREE.Object3D()
const qy = new THREE.Quaternion()
const yAxis = new THREE.Vector3(0, 1, 0)
const col = new THREE.Color()
const GOLD = new THREE.Color('#ffb800')
const SPARK = new THREE.Color('#fff2b0')
const cur = { x: 0, y: 0, dx: 0, dy: 0 }
const BRIGHT = ['#ff5c8a', '#16b3a0', '#ffb800', '#8f6bff', '#ff8a3c', '#3cc8ff']

type Coin = { on: boolean; t0: number; ax: number; ay: number; bx: number; by: number; spin: number }

function seeds() {
  const r = rand(11)
  return {
    base: Array.from({ length: RIM }, (_, i) => (i / RIM) * Math.PI * 2 + r() * 0.2),
    pace: Array.from({ length: ALL }, () => 0.6 + r() * 0.8),
    wob: Array.from({ length: ALL }, () => r() * 10),
    mote: Array.from({ length: MOTES }, () => [r(), 0.12 + r() * 0.1, r() * 6] as const),
  }
}

function state() {
  return {
    px: new Float32Array(RIM),
    py: new Float32Array(RIM),
    coins: Array.from({ length: COINS }, (): Coin => ({ on: false, t0: 0, ax: 0, ay: 0, bx: 0, by: 0, spin: 0 })),
    splash: Array.from({ length: SPLASH }, () => ({ t0: -9, x: 0, y: 0 })),
    next: 0,
    k: 0,
    s: 0,
    r: rand(5),
  }
}

function hash(i: number, c: number) {
  const s = Math.sin(i * 127.1 + c * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function Crowd({ clock, fear }: { clock: RefObject<number>; fear: RefObject<number> }) {
  const geos = useMemo(
    () => ({ body: folk('hood'), hood: hood(), coin: new THREE.CylinderGeometry(13, 13, 4, 12).rotateX(Math.PI / 2), ring: new THREE.RingGeometry(0.75, 1, 28), mote: new THREE.OctahedronGeometry(1), ribbon: new THREE.PlaneGeometry(1, 1).translate(0.5, 0, 0) }),
    [],
  )
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const seed = useMemo(() => seeds(), [])
  const tops = useMemo(() => poles(), [])
  const st = useRef<ReturnType<typeof state>>(null)
  const bodies = useRef<THREE.InstancedMesh>(null)
  const hoods = useRef<THREE.InstancedMesh>(null)
  const coins = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const motes = useRef<THREE.InstancedMesh>(null)
  const ribbons = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    for (let i = 0; i < ALL; i++) hoods.current?.setColorAt(i, col.set(PASTEL[i % PASTEL.length]))
    for (let i = 0; i < tops.length * 2; i++) ribbons.current?.setColorAt(i, col.set(BRIGHT[(i * 5) % BRIGHT.length]))
    for (const m of [hoods.current, ribbons.current]) if (m?.instanceColor) m.instanceColor.needsUpdate = true
  }, [tops])

  useFrame((state3, dt) => {
    const s = (st.current ??= state())
    const t = clock.current
    const f = fear.current
    const zoom = state3.camera.zoom
    const near = zoom > 0.12
    const b = bodies.current
    const h = hoods.current
    if (!b || !h) return
    b.visible = h.visible = near
    s.s += Math.min(dt, 0.1) * (1 + f * 1.5)
    if (near) walk(s, seed, t, b, h)
    toss(s, t, f, coins.current, rings.current, near)
    rise(seed, t, f, motes.current)
    flutter(tops, t, ribbons.current, near)
  })

  return (
    <group>
      <instancedMesh ref={bodies} args={[geos.body, undefined, ALL]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={hoods} args={[geos.hood, undefined, ALL]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={coins} args={[geos.coin, undefined, COINS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial color="#ffd36b" emissive="#c88a00" emissiveIntensity={0.6} metalness={0.4} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[geos.ring, undefined, SPLASH]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={motes} args={[geos.mote, undefined, MOTES]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={ribbons} args={[geos.ribbon, undefined, tops.length * 2]} frustumCulled={false}>
        <meshStandardMaterial side={THREE.DoubleSide} roughness={0.8} />
      </instancedMesh>
    </group>
  )
}

function put(m: THREE.InstancedMesh, i: number, x: number, y: number, lift: number, turn: number, size: number) {
  o.position.set(x, -y, 0).addScaledVector(UP, lift)
  o.quaternion.copy(TILT).multiply(qy.setFromAxisAngle(yAxis, turn))
  o.scale.setScalar(size)
  o.updateMatrix()
  m.setMatrixAt(i, o.matrix)
}

function walk(s: ReturnType<typeof state>, seed: ReturnType<typeof seeds>, t: number, b: THREE.InstancedMesh, h: THREE.InstancedMesh) {
  for (let i = 0; i < RIM; i++) {
    const a = seed.base[i] + s.s * 0.055 * seed.pace[i] + 0.25 * Math.sin(t * 0.3 + seed.wob[i])
    const x = RING.x + Math.cos(a) * RING.rx
    const y = RING.y + Math.sin(a) * RING.ry
    s.px[i] = x
    s.py[i] = y
    const turn = Math.atan2(-Math.sin(a) * RING.rx, Math.cos(a) * RING.ry)
    const bob = Math.abs(Math.sin(t * 6 * seed.pace[i] + seed.wob[i])) * 3
    put(b, i, x, y, bob, turn, SIZE)
    put(h, i, x, y, bob, turn, SIZE)
  }
  const L = queuePath.length
  const gap = L / LINE
  for (let j = 0; j < LINE; j++) {
    const i = RIM + j
    const base = j * gap
    const lag = (1 - base / L) * 1.6 + seed.wob[i] * 0.05
    const tau = Math.max(0, t - lag) / STEP
    const fr = tau % 1
    const shuffle = Math.floor(tau) + Math.min(1, fr * 2.2) ** 0.7
    const d = (base + shuffle * gap * 0.5) % L
    queuePath.at(d, cur)
    const size = SIZE * Math.min(1, d / 50, (L - d) / 50)
    const moving = fr < 0.45 ? 1 : 0
    const bob = moving * Math.abs(Math.sin(t * 9 + seed.wob[i])) * 3
    const turn = moving ? Math.atan2(cur.dx, cur.dy) : Math.atan2(cur.dx, cur.dy) * 0.4 + Math.sin(t * 0.7 + seed.wob[i]) * 0.6
    put(b, i, cur.x, cur.y, bob, turn, size)
    put(h, i, cur.x, cur.y, bob, turn, size)
  }
  for (let k = 0; k < CAMPERS; k++) {
    const a = (k / CAMPERS) * Math.PI * 2 + 0.3
    const x = FIRE.x + Math.cos(a) * 95
    const y = FIRE.y + Math.sin(a) * 70
    const turn = Math.atan2(FIRE.x - x, FIRE.y - y) + Math.sin(t * 1.5 + k) * 0.25
    const lift = Math.abs(Math.sin(t * 2.4 + k * 1.7)) * 3
    put(b, RIM + LINE + k, x, y, lift, turn, SIZE)
    put(h, RIM + LINE + k, x, y, lift, turn, SIZE)
  }
  b.instanceMatrix.needsUpdate = h.instanceMatrix.needsUpdate = true
}

function toss(s: ReturnType<typeof state>, t: number, f: number, cm: THREE.InstancedMesh | null, rm: THREE.InstancedMesh | null, near: boolean) {
  if (!cm || !rm) return
  if (t > s.next) {
    s.next = t + (0.5 + s.r() * 1.1) / (1 + f * 4)
    const c = s.coins[s.k++ % COINS]
    const i = Math.floor(s.r() * RIM)
    const a = s.r() * Math.PI * 2
    const d = Math.sqrt(s.r()) * 0.75
    Object.assign(c, { on: true, t0: t, ax: s.px[i], ay: s.py[i], bx: HEAP.x + Math.cos(a) * d * HEAP.rx, by: HEAP.y + Math.sin(a) * d * HEAP.ry, spin: 8 + s.r() * 8 })
  }
  cm.visible = near
  s.coins.forEach((c, i) => {
    const u = (t - c.t0) / 1.1
    if (c.on && u >= 1) {
      c.on = false
      const sp = s.splash[i % SPLASH]
      Object.assign(sp, { t0: t, x: c.bx, y: c.by })
    }
    const live = c.on && u >= 0
    o.position.set(c.ax + (c.bx - c.ax) * u, -(c.ay + (c.by - c.ay) * u), 60 * u).addScaledVector(UP, 45 * (1 - u) + 220 * 4 * u * (1 - u))
    o.rotation.set(t * c.spin, i, 0)
    o.scale.setScalar(live ? 1.2 : 0)
    o.updateMatrix()
    cm.setMatrixAt(i, o.matrix)
  })
  s.splash.forEach((sp, i) => {
    const u = Math.min(1, (t - sp.t0) / 0.9)
    o.position.set(sp.x, -sp.y, 75)
    o.rotation.set(0, 0, 0)
    o.scale.setScalar(u < 1 ? 14 + 70 * u : 0)
    o.updateMatrix()
    rm.setMatrixAt(i, o.matrix)
    rm.setColorAt(i, col.copy(SPARK).multiplyScalar((1 - u) * 1.4))
  })
  cm.instanceMatrix.needsUpdate = rm.instanceMatrix.needsUpdate = true
  if (rm.instanceColor) rm.instanceColor.needsUpdate = true
}

function rise(seed: ReturnType<typeof seeds>, t: number, f: number, m: THREE.InstancedMesh | null) {
  if (!m) return
  for (let i = 0; i < MOTES; i++) {
    const [ph, rate, sway] = seed.mote[i]
    const life = t * rate * (1 + f * 2) + ph
    const c = Math.floor(life)
    const u = life - c
    const a = hash(i, c) * Math.PI * 2
    const d = Math.sqrt(hash(i + 50, c)) * 0.8
    o.position.set(HEAP.x + Math.cos(a) * d * HEAP.rx + Math.sin(t + sway) * 14, -(HEAP.y + Math.sin(a) * d * HEAP.ry), 80).addScaledVector(UP, u * (420 + f * 300))
    o.rotation.set(t, t * 1.3 + i, 0)
    o.scale.setScalar(3 + 3 * Math.sin(u * Math.PI))
    o.updateMatrix()
    m.setMatrixAt(i, o.matrix)
    m.setColorAt(i, col.copy(GOLD).multiplyScalar(Math.sin(u * Math.PI) * (0.8 + f * 0.6)))
  }
  m.instanceMatrix.needsUpdate = true
  if (m.instanceColor) m.instanceColor.needsUpdate = true
}

function flutter(tops: [number, number][], t: number, m: THREE.InstancedMesh | null, near: boolean) {
  if (!m) return
  m.visible = near
  if (!near) return
  tops.forEach(([x, y], k) => {
    for (let j = 0; j < 2; j++) {
      const i = k * 2 + j
      o.position.set(x, -y, 0).addScaledVector(UP, 104 - j * 22)
      o.quaternion.copy(TILT).multiply(qy.setFromAxisAngle(yAxis, Math.sin(t * 2.2 + k * 0.9 + j) * 0.6 + 0.2))
      o.rotateZ(-0.25 - j * 0.15 + Math.sin(t * 3.1 + k) * 0.08)
      o.scale.set(80 - j * 18, 20, 1)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
  })
  m.instanceMatrix.needsUpdate = true
}
