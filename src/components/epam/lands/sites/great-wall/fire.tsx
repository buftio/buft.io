'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { flameGeometry, pennantGeometry, puffGeometry, waveGeometry } from './folk'
import { along, BEACONS, clock, FLAGS, frame, H, KITCHEN, LAMPS, PITCH, pop, rand, SITES, T, type Mood } from './space'

const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const col = new THREE.Color()
const CALM = new THREE.Color('#1ff0cc').multiplyScalar(1.5)
const ALARM = new THREE.Color('#ff4a2a').multiplyScalar(1.5)
const STOVE = new THREE.Color('#ffb02e').multiplyScalar(1.4)
const HOT = new THREE.Color('#ffffff')
const FLAT = new THREE.Quaternion()

const K = frame(SITES.kitchen)
const FIRES = [
  ...BEACONS.map((b) => {
    const f = frame(b.u)
    return { x: f.x, y: b.h + 40, z: f.z, size: b.r * 0.42 }
  }),
  { x: K.x, y: KITCHEN.h + 22, z: K.z + 62, size: 18 },
  ...LAMPS.map((u) => {
    const f = along(u)
    return { x: f.x - f.nx * (T / 2 - 6), y: H + 40, z: f.z - f.nz * (T / 2 - 6), size: 9 }
  }),
]
const SPARKS = 24

function haloTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 64, 64)
  }
  return new THREE.CanvasTexture(c)
}

export function Beacons({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const geo = useMemo(() => flameGeometry(), [])
  const map = useMemo(() => haloTexture(), [])
  useEffect(() => () => [geo, map].forEach((x) => x.dispose()), [geo, map])
  const flames = useRef<THREE.InstancedMesh>(null)
  const halos = useRef<THREE.InstancedMesh>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const phase = useRef(0)

  useFrame((state, dt) => {
    const a = flames.current
    const b = halos.current
    const c = sparks.current
    if (!a || !b || !c) return
    const t = clock(state.clock.elapsedTime, reduced)
    const alarm = mood.current.alarm
    phase.current += (dt * (reduced ? 0.06 : 1)) / (9 - 5.5 * alarm)
    const n = BEACONS.length
    const ph = (phase.current % 1) * (n + 3) - 1
    const zoom = state.camera.zoom
    const glow = Math.min(760, Math.max(240, 52 / zoom))
    const lod = Math.min(2.2, Math.max(1, 0.16 / zoom))
    FIRES.forEach((f, k) => {
      const beacon = k < n
      const boost = beacon ? Math.exp(-((ph - k) ** 2) * 3) : 0
      const flick = 1 + Math.sin(t * 13 + k * 2.1) * 0.12 + Math.sin(t * 7.3 + k) * 0.08
      const size = f.size * (1 + boost * 0.7) * (beacon ? (1 + alarm * 0.4) * lod : 1)
      pop(f.x, f.y, f.z, v)
      q.setFromEuler(e.set(0, t * 0.6 + k, Math.sin(t * 3 + k) * 0.1, 'YXZ')).premultiply(PITCH)
      a.setMatrixAt(k, m.compose(v, q, s.set(size, size * flick, size)))
      col.copy(beacon ? CALM : STOVE)
      if (beacon) col.lerp(ALARM, alarm)
      a.setColorAt(k, col.lerp(HOT, boost * 0.45))
      if (!beacon) return
      for (let j = 0; j < SPARKS / n; j++) {
        const i = k * (SPARKS / n) + j
        const life = (t * (0.5 + alarm * 0.6) + rand(i) * 3) % 1
        const sx = f.x + Math.sin(t * 2 + i * 1.7) * 14 * life - life * life * 60
        pop(sx, f.y + f.size * 1.4 + life * (140 + rand(i + 4) * 80), f.z + 4, v)
        const r = 5 * (1 - life) * (1 + boost)
        c.setMatrixAt(i, m.compose(v, PITCH, s.set(r, r, r)))
        c.setColorAt(i, col)
      }
      pop(f.x, f.y + f.size * 1.1 * lod, f.z + 2, v)
      const r = glow * (1 + boost * 0.6 + alarm * 0.3)
      b.setMatrixAt(k, m.compose(v.setZ(v.z + 8), FLAT, s.set(r, r, 1)))
      b.setColorAt(k, col)
    })
    for (const mesh of [a, b, c]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={halos} args={[undefined, undefined, BEACONS.length]} frustumCulled={false} renderOrder={44}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={map} transparent opacity={0.8} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={flames} args={[geo, undefined, FIRES.length]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={sparks} args={[undefined, undefined, SPARKS]} frustumCulled={false} renderOrder={48}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

const PUFFS = 16
const CHIM = { x: K.x - K.tx * 95 + K.nx * 70, y: KITCHEN.h + 222, z: K.z - K.tz * 95 + K.nz * 70 }
const POT = { x: K.x, y: KITCHEN.h + 70, z: K.z + 20 }
const SMOKE = new THREE.Color('#d8c6dc')
const STEAM = new THREE.Color('#fff7e6')

export function Steam({ reduced }: { reduced: boolean }) {
  const geo = useMemo(() => puffGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock(state.clock.elapsedTime, reduced)
    for (let k = 0; k < PUFFS; k++) {
      const chim = k % 2 === 0
      const life = chim ? 7 : 4.5
      const x = ((t + k * 0.83 + rand(k) * 2) % life) / life
      const src = chim ? CHIM : POT
      const sway = Math.sin(t * 0.8 + k) * 14 * x
      const r = (chim ? 18 + x * 62 : 10 + x * 34) * Math.sin(Math.PI * Math.min(1, x * 1.15)) ** 0.6
      pop(src.x - x * x * (chim ? 260 : 90) + sway, src.y + x * (chim ? 420 : 160), src.z, v)
      mesh.setMatrixAt(k, m.compose(v, FLAT, s.set(r, r, r)))
      mesh.setColorAt(k, chim ? SMOKE : STEAM)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, PUFFS]} frustumCulled={false} renderOrder={49}>
      <meshStandardMaterial roughness={1} transparent opacity={0.62} depthWrite={false} />
    </instancedMesh>
  )
}

const TEALS = [new THREE.Color('#16b3a0'), new THREE.Color('#7dffe6'), new THREE.Color('#e0679b')]

export function Pennants({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const geo = useMemo(() => pennantGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock(state.clock.elapsedTime, reduced)
    const gust = 1 + mood.current.alarm * 1.5
    FLAGS.forEach((f, k) => {
      const w = Math.sin(t * 3.1 * gust + k * 1.7) * 0.5 + Math.sin(t * 1.3 + k) * 0.5
      pop(f.x, f.y, f.z, v)
      q.setFromEuler(e.set(0, 0.35 + w * 0.35, 0, 'YXZ')).premultiply(PITCH)
      mesh.setMatrixAt(k, m.compose(v, q, s.set(f.size * (0.88 + w * 0.12), f.size, f.size)))
      mesh.setColorAt(k, TEALS[k < 6 ? 0 : k % 3])
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, FLAGS.length]} frustumCulled={false} renderOrder={47}>
      <meshBasicMaterial side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

const WAVES = Array.from({ length: 13 }, (_, k) => {
  for (let i = 0; i < 40; i++) {
    const x = -1700 + rand(k * 31 + i) * 3500
    const y = -1800 + rand(k * 17 + i * 3) * 1800
    if (y < -95 + 0.45 * x - 260 && Math.hypot(x, y) < 1900) return { x, y, life: 9 + rand(k) * 6, size: 50 + rand(k + 9) * 50 }
  }
  return { x: 900, y: -1200, life: 10, size: 60 }
})

export function Waves({ reduced }: { reduced: boolean }) {
  const geo = useMemo(() => waveGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    const t = clock(state.clock.elapsedTime, reduced)
    WAVES.forEach((w, k) => {
      const x = ((t + k * 1.7) % w.life) / w.life
      const r = w.size * Math.sin(Math.PI * x) * (0.6 + x * 0.6)
      v.set(w.x - x * 70, -(w.y + x * 135), 1)
      mesh.setMatrixAt(k, m.compose(v, FLAT, s.set(r * 1.4, r, 1)))
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, WAVES.length]} frustumCulled={false} renderOrder={41}>
      <meshBasicMaterial color="#9d8bc4" transparent opacity={0.35} depthWrite={false} />
    </instancedMesh>
  )
}
