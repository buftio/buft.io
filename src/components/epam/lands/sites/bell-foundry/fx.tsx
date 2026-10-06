'use client'

import { useFrame } from '@react-three/fiber'
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  type RefObject,
} from 'react'
import * as THREE from 'three'
import { dunk, pourState, RINGS, TINGS, type Life } from './clock'
import { lift, path, UP } from './kit'
import {
  BARRELS,
  COOL,
  COTTAGE,
  CRANE,
  GANTRY,
  KILNS,
  PIT,
  RELAYS,
  RUNNEL,
} from './layout'

const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const s = new THREE.Vector3()
const q = new THREE.Quaternion()
const c = new THREE.Color()
const GOLD = new THREE.Color('#ffbb2e')
const ECHO = new THREE.Color('#ffe39a')
const RED = new THREE.Color('#ff3b2a')
const MINT = new THREE.Color('#7dffe6')
const HOT = new THREE.Color('#ffe9a8')
const GLOB = new THREE.Color('#ff9a30')
const SOOT = new THREE.Color('#4a3346')
const ASH = new THREE.Color('#c7b4c9')
const STEAM = new THREE.Color('#fbf4ff')
const ORIGIN = lift(GANTRY, 0, 450, 0).setZ(3)
export const LIFE = 5
export const SPEED = 480
export const RELAY_AT = RELAYS.map(
  ([x, y]) => (Math.hypot(x - ORIGIN.x, -y - ORIGIN.y) - 110) / SPEED,
)
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const frac = (x: number) => x - Math.floor(x)
const SEG = 128
const COS = Float32Array.from({ length: SEG + 1 }, (_, i) =>
  Math.cos((i / SEG) * Math.PI * 2),
)
const SIN = Float32Array.from({ length: SEG + 1 }, (_, i) =>
  Math.sin((i / SEG) * Math.PI * 2),
)
const SHAPE = [
  [1, 0],
  [0.22, 1],
  [0, 1],
]

function wave() {
  const g = new THREE.RingGeometry(0.5, 1, SEG, 2)
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const n = g.getAttribute('position').count
  g.setAttribute(
    'color',
    new THREE.BufferAttribute(
      Float32Array.from({ length: n * 4 }, (_, i) =>
        i % 4 === 3 ? SHAPE[Math.floor(i / 4 / (SEG + 1))][1] : 1,
      ),
      4,
    ),
  )
  return g
}

function spread(g: THREE.BufferGeometry, rad: number, width: number) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute
  const arr = pos.array as Float32Array
  for (let j = 0; j < 3; j++) {
    const r = rad - SHAPE[j][0] * width
    for (let i = 0; i <= SEG; i++) {
      const k = (j * (SEG + 1) + i) * 3
      arr[k] = COS[i] * r
      arr[k + 1] = SIN[i] * r
    }
  }
  pos.needsUpdate = true
}

export function Ripples({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(() => Array.from({ length: RINGS }, wave), [])
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos])
  const bands = useRef<(THREE.Mesh | null)[]>([])
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const r = ref.current
    if (!r) return
    for (let i = 0; i < TINGS + RELAYS.length; i++)
      r.setColorAt(i, c.setRGB(0, 0, 0))
  }, [])
  useFrame(({ camera }) => {
    const L = life.current
    const r = ref.current
    if (!r || !r.instanceColor) return
    const width = Math.min(240, 15 / camera.zoom + 12)
    bands.current.forEach((band, i) => {
      if (!band) return
      const age = L.t - L.strikes[i]
      const live = age >= 0 && age < LIFE
      band.visible = live
      if (!live) return
      const rad = 110 + SPEED * age
      spread(band.geometry, rad, Math.min(rad, width * (i % 2 ? 0.55 : 1)))
      const mat = band.material as THREE.MeshBasicMaterial
      mat.opacity = Math.pow(1 - age / LIFE, 0.7) * (i % 2 ? 0.6 : 0.95)
      mat.color.copy(i % 2 ? ECHO : GOLD).lerp(RED, L.alarm)
    })
    for (let i = 0; i < TINGS; i++) {
      const age = L.t - L.tings[i]
      const live = age >= 0 && age < 0.9
      const [x, y] = COOL[L.tingBell[i]]
      const rad = 40 + 190 * age
      r.setMatrixAt(
        i,
        live
          ? m.compose(p.set(x, -y, 3), q.identity(), s.set(rad, rad * 0.8, 1))
          : ZERO,
      )
      r.setColorAt(i, c.copy(MINT).multiplyScalar(live ? 1 - age / 0.9 : 0))
    }
    RELAY_AT.forEach((delay, k) => {
      const age = L.t - L.hit - delay
      const live = age >= 0 && age < 1.1
      const [x, y] = RELAYS[k]
      const rad = 50 + 260 * age
      r.setMatrixAt(
        TINGS + k,
        live
          ? m.compose(p.set(x, -y, 3), q.identity(), s.set(rad, rad * 0.8, 1))
          : ZERO,
      )
      r.setColorAt(
        TINGS + k,
        c
          .copy(MINT)
          .lerp(RED, L.alarm)
          .multiplyScalar(live ? 1 - age / 1.1 : 0),
      )
    })
    r.instanceMatrix.needsUpdate = true
    r.instanceColor.needsUpdate = true
  })
  return (
    <group>
      {Array.from({ length: RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(b) => void (bands.current[i] = b)}
          geometry={geos[i]}
          position={ORIGIN}
          visible={false}
          frustumCulled={false}
          renderOrder={48}
        >
          <meshBasicMaterial
            vertexColors
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
      <instancedMesh
        ref={ref}
        args={[undefined, undefined, TINGS]}
        frustumCulled={false}
        renderOrder={48}
      >
        <ringGeometry args={[0.92, 1, 48]} />
        <meshBasicMaterial
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </instancedMesh>
    </group>
  )
}

const POUR = 14
const GLOBS = 10
const STRIKE = 10
const HEAD = lift(CRANE, -238 * Math.cos(1), 0, 238 * Math.sin(1))
const HIT = lift(GANTRY, 150, 440, 30)
const flow = path(RUNNEL)

export function Sparks({ life }: { life: RefObject<Life> }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const n = POUR + GLOBS + STRIKE
  useLayoutEffect(() => {
    const r = ref.current
    if (!r) return
    for (let i = 0; i < n; i++)
      r.setColorAt(i, i >= POUR && i < POUR + GLOBS ? GLOB : HOT)
    if (r.instanceColor) r.instanceColor.needsUpdate = true
  }, [n])
  useFrame(() => {
    const L = life.current
    const r = ref.current
    if (!r) return
    const st = pourState(L.pour)
    for (let i = 0; i < POUR; i++) {
      const ph = frac(L.t * 1.4 + i * 0.137)
      const a = i * 2.39
      const v = 50 + (i % 5) * 18
      const size = st.flow * 7 * (1 - ph)
      p.copy(HEAD)
        .add(s.set(Math.cos(a) * v * ph, Math.sin(a) * v * ph * 0.6, 6))
        .addScaledVector(UP, 150 * ph - 170 * ph * ph)
      r.setMatrixAt(
        i,
        m.compose(p, q.identity(), s.setScalar(Math.max(0.001, size))),
      )
    }
    for (let i = 0; i < GLOBS; i++) {
      flow(frac(L.t * 0.55 + i / GLOBS), p)
      p.set(p.x, -p.y, 5)
      const size = st.runnel * (10 + (i % 3) * 3)
      r.setMatrixAt(
        POUR + i,
        m.compose(p, q.identity(), s.setScalar(Math.max(0.001, size))),
      )
    }
    const age = L.t - L.hit
    for (let i = 0; i < STRIKE; i++) {
      const live = age >= 0 && age < 0.7
      const a = (i / STRIKE) * Math.PI * 2 + i
      const v = 220 + (i % 3) * 70
      const size = live ? 9 * (1 - age / 0.7) : 0
      p.copy(HIT).add(s.set(Math.cos(a) * v * age, Math.sin(a) * v * age, 10))
      r.setMatrixAt(
        POUR + GLOBS + i,
        m.compose(p, q.identity(), s.setScalar(Math.max(0.001, size))),
      )
    }
    r.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, n]}
      frustumCulled={false}
      renderOrder={49}
    >
      <circleGeometry args={[1, 7]} />
      <meshBasicMaterial
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  )
}

type Vent = {
  at: THREE.Vector3
  size: number
  rise: number
  n: number
  steam: boolean
  kiln: boolean
  speed: number
  barrel?: number
}

function vents(): Vent[] {
  const out: Vent[] = KILNS.map((k, i) => ({
    at: lift(k, 0, k.h, 0),
    size: k.h * 0.13,
    rise: k.h * 1.5,
    n: 8,
    steam: false,
    kiln: true,
    speed: 0.11 + i * 0.02,
  }))
  out.push({
    at: lift(COTTAGE, 60, 395, 0),
    size: 26,
    rise: 260,
    n: 3,
    steam: false,
    kiln: false,
    speed: 0.15,
  })
  COOL.forEach(([x, y, h]) =>
    out.push({
      at: lift({ at: [x, y], size: 1 }, 0, h * 0.9, 0),
      size: h * 0.12,
      rise: h * 1.4,
      n: 2,
      steam: true,
      kiln: false,
      speed: 0.22,
    }),
  )
  out.push({
    at: new THREE.Vector3(PIT[0], -PIT[1], 6),
    size: 34,
    rise: 260,
    n: 4,
    steam: true,
    kiln: false,
    speed: 0.3,
  })
  BARRELS.forEach((b, i) =>
    out.push({
      at: lift({ at: b, size: 1 }, 0, 80, 0),
      size: 26,
      rise: 220,
      n: 4,
      steam: true,
      kiln: false,
      speed: 0.6,
      barrel: i,
    }),
  )
  return out
}

export function Smoke({ life }: { life: RefObject<Life> }) {
  const list = useMemo(() => vents(), [])
  const n = list.reduce((a, v) => a + v.n, 0)
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const r = ref.current
    if (!r) return
    for (let i = 0; i < n; i++) r.setColorAt(i, SOOT)
  }, [n])
  useFrame(() => {
    const L = life.current
    const r = ref.current
    if (!r || !r.instanceColor) return
    const pit = pourState(L.pour).pit
    const d = dunk(L.t)
    const hiss = d.since > 0 && d.since < 1.6 ? 1 - d.since / 1.6 : 0
    let i = 0
    for (const v of list) {
      for (let k = 0; k < v.n; k++, i++) {
        const ph = frac(L.t * v.speed + k / v.n + v.at.x * 0.001)
        const gain = v.kiln
          ? 1 - L.dim
          : v.barrel !== undefined
            ? v.barrel === d.side
              ? hiss
              : 0
            : v.n === 4
              ? pit
              : 1
        const grow =
          v.size *
          (0.35 + 1.5 * ph) *
          Math.min(1, ph * 8) *
          (1 - Math.max(0, (ph - 0.7) / 0.3)) *
          gain
        p.copy(v.at)
          .addScaledVector(UP, v.rise * ph)
          .add(
            s.set(
              ph * ph * v.rise * 0.35 + Math.sin(ph * 6 + k) * v.size * 0.3,
              0,
              8,
            ),
          )
        r.setMatrixAt(
          i,
          m.compose(p, q.identity(), s.setScalar(Math.max(0.001, grow))),
        )
        r.setColorAt(i, v.steam ? STEAM : c.copy(SOOT).lerp(ASH, ph))
      }
    }
    r.instanceMatrix.needsUpdate = true
    r.instanceColor.needsUpdate = true
  })
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, n]}
      frustumCulled={false}
      renderOrder={49}
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        flatShading
        roughness={1}
        transparent
        opacity={0.88}
        depthWrite={false}
      />
    </instancedMesh>
  )
}
