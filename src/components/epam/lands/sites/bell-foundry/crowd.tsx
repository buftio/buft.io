'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Stand } from '../../stand'
import * as THREE from 'three'
import { dunk, ramAngle, STRIKE, type Life } from './clock'
import { lift, orient, path, UP } from './kit'
import { BARRELS, CARRY, FORGE, GANTRY, QUENCH, ROAD, TEAM } from './layout'
import { cart, lump } from './models'
import { crowd, quencher } from './statics'

const SIZE = 20
const CARRIERS = 4
const CARTS = 3
const PITS: [number, number, number][] = [
  [-640, 440, 0.9],
  [-250, 520, -0.9],
  [-450, 640, 0.1],
]
const TUNERS: [number, number][] = [
  [520, 215],
  [620, 395],
]
const SMITH: [number, number] = [FORGE[0] - 60, FORGE[1] + 80]
const N = CARRIERS + PITS.length + 1 + TUNERS.length + CARTS * 2 + TEAM.length

const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const o = new THREE.Vector3()
const s = new THREE.Vector3()
const q = new THREE.Quaternion()
const z = new THREE.Quaternion()
const Z = new THREE.Vector3(0, 0, 1)
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const frac = (x: number) => x - Math.floor(x)
const carry = path(CARRY)
const road = path(ROAD)
const clamp = (a: number) => Math.max(-1.45, Math.min(1.45, a))

function set(
  mesh: THREE.InstancedMesh,
  i: number,
  at: THREE.Vector3,
  turn: number,
  lean: number,
  size: number,
  hop: number,
) {
  p.copy(at).addScaledVector(UP, hop)
  orient(turn, q).multiply(z.setFromAxisAngle(Z, lean))
  mesh.setMatrixAt(i, size > 0.01 ? m.compose(p, q, s.setScalar(size)) : ZERO)
}

function heading(
  f: (t: number, out: THREE.Vector3) => THREE.Vector3,
  t: number,
  dir: number,
) {
  f(Math.min(0.999, t + 0.01), o)
  const ox = o.x
  const oy = o.y
  f(Math.max(0, t - 0.01), o)
  return [(ox - o.x) * dir, (oy - o.y) * dir]
}

export function Crowd({ life }: { life: RefObject<Life> }) {
  const geos = useMemo(
    () => ({ folk: crowd(), lump: lump(), cart: cart() }),
    [],
  )
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const folk = useRef<THREE.InstancedMesh>(null)
  const lumps = useRef<THREE.InstancedMesh>(null)
  const carts = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const L = life.current
    const f = folk.current
    const l = lumps.current
    const w = carts.current
    if (!f || !l || !w) return
    const t = L.t
    const stay = SIZE * (1 - L.dim)
    let i = 0
    for (let k = 0; k < CARRIERS; k++, i++) {
      const u = frac(t / 18 + k / CARRIERS)
      const out = u < 0.5
      const along = out ? u * 2 : 2 - u * 2
      carry(along, p)
      const [dx, dy] = heading(carry, along, out ? 1 : -1)
      const step = t * 9 + k * 1.7
      const turn = clamp(Math.atan2(dx, dy))
      set(
        f,
        i,
        p.set(p.x, -p.y, 0),
        turn,
        Math.sin(step) * 0.12,
        stay,
        Math.abs(Math.sin(step)) * 6,
      )
      orient(turn, q)
      o.set(0, 1.15, 1.25).multiplyScalar(SIZE).applyQuaternion(q)
      p.add(o)
      l.setMatrixAt(
        k,
        out && stay > 0.01 ? m.compose(p, q, s.setScalar(SIZE * 0.9)) : ZERO,
      )
    }
    PITS.forEach(([x, y, turn], k) => {
      const rake = Math.sin(t * 2.2 + k * 2)
      set(
        f,
        i++,
        p.set(x + rake * 10, -y, 0),
        turn,
        rake * 0.18,
        stay,
        Math.max(0, rake) * 4,
      )
    })
    const hammer = frac(t * 1.4)
    set(
      f,
      i++,
      p.set(SMITH[0], -SMITH[1], 0),
      0.9,
      hammer < 0.2 ? -0.3 : 0.1,
      stay,
      hammer < 0.2 ? 8 : 0,
    )
    TUNERS.forEach(([x, y], k) => {
      const since = t - L.taps[k]
      const hop =
        since >= 0 && since < 0.35 ? Math.sin((since / 0.35) * Math.PI) * 14 : 0
      set(
        f,
        i++,
        p.set(x, -y, 0),
        k ? -0.5 : 0.5,
        Math.sin(t * 1.3 + k) * 0.08,
        stay,
        hop,
      )
    })
    for (let k = 0; k < CARTS; k++) {
      const u = frac(t / 30 + k / CARTS)
      const fade = Math.min(1, u * 14, (1 - u) * 14)
      road(u, p)
      const [dx, dy] = heading(road, u, 1)
      const cx = p.x
      const cy = p.y
      w.setMatrixAt(
        k,
        m.compose(
          p.set(cx, -cy, 0),
          orient(Math.atan2(-dy, dx), q),
          s.setScalar(70 * fade),
        ),
      )
      for (const side of [-1, 1]) {
        const step = t * 8 + k + side
        road(Math.min(0.999, u + 0.045), p)
        const n = Math.hypot(dx, dy) || 1
        p.set(p.x - (dy / n) * side * 22, -(p.y + (dx / n) * side * 22), 0)
        set(
          f,
          i++,
          p,
          clamp(Math.atan2(dx, dy)),
          0.2 + Math.sin(step) * 0.1,
          SIZE * fade,
          Math.abs(Math.sin(step)) * 5,
        )
      }
    }
    const ang = ramAngle(L.ram)
    const pull = Math.max(0, ang) / 0.5
    const after = L.ram > STRIKE ? Math.exp(-(L.ram - STRIKE) * 10) : 0
    TEAM.forEach((x, k) => {
      lift(GANTRY, x + pull * 40 + k * pull * 8, 0, 40 + k * 18, p)
      set(
        f,
        i++,
        p,
        -0.55,
        -pull * 0.45 + after * 0.5,
        SIZE,
        after * 6 + Math.abs(Math.sin(t * 6 + k)) * pull * 3,
      )
    })
    for (const mesh of [f, l, w]) mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={folk}
        args={[geos.folk, undefined, N]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.65} />
      </instancedMesh>
      <instancedMesh
        ref={lumps}
        args={[geos.lump, undefined, CARRIERS]}
        frustumCulled={false}
      >
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh
        ref={carts}
        args={[geos.cart, undefined, CARTS]}
        frustumCulled={false}
      >
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={0.45}
          metalness={0.2}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
    </group>
  )
}

const AIM = BARRELS.map(([x, y]) => Math.atan2(x - QUENCH[0], y - QUENCH[1]))

export function Quencher({ life }: { life: RefObject<Life> }) {
  const geo = useMemo(() => quencher(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const turn = useRef<THREE.Group>(null)
  const bow = useRef<THREE.Group>(null)
  useFrame(() => {
    const L = life.current
    if (!turn.current || !bow.current) return
    const d = dunk(L.t)
    const want = AIM[d.side]
    turn.current.rotation.y += (want - turn.current.rotation.y) * 0.08
    bow.current.rotation.x = d.depth * 0.55
    bow.current.position.y = -d.depth * 0.25
    bow.current.scale.setScalar(1 - L.dim)
  })
  return (
    <Stand at={QUENCH} size={20}>
      <group ref={turn}>
        <group ref={bow}>
          <mesh geometry={geo}>
            <meshStandardMaterial vertexColors flatShading roughness={0.65} />
          </mesh>
        </group>
      </group>
    </Stand>
  )
}
