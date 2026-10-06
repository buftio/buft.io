'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { berryGeometry, bushGeometry, pickerGeometry, sentryGeometry } from './folk'
import { along, BEACONS, clock, frame, GATE_D, heapAt, SCOPE, H, INK, KITCHEN, LEN, merged, part, PITCH, pop, rand, BEADS, SHEAR, SITES, spin, T, type Mood } from './space'

const SEE = 0.11
const BIG = 1.3
const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()

function place(mesh: THREE.InstancedMesh, k: number, x: number, y: number, z: number, yaw: number, size: number, pitch = 0, roll = 0) {
  pop(x, y, z, v)
  q.setFromEuler(e.set(pitch, yaw, roll, 'YXZ')).premultiply(PITCH)
  mesh.setMatrixAt(k, m.compose(v, q, s.set(size, size, size)))
}

type Walker = { u0: number; u1: number; off: number; speed: number; pause: number; phase: number }

const gap = (r: number) => (r + 30) / LEN
const R = Object.fromEntries(BEACONS.map((b) => [b.u, b.r]))
const SEGS: [number, number, number][] = [
  [SITES.t0 + gap(R[SITES.t0]), SITES.t1 - gap(R[SITES.t1]), 3],
  [SITES.t1 + gap(R[SITES.t1]), SITES.gate - gap(275), 2],
  [SITES.gate + gap(275), SITES.t2 - gap(R[SITES.t2]), 3],
  [SITES.t2 + gap(R[SITES.t2]), SITES.kitchen - gap(KITCHEN.r), 2],
  [SITES.kitchen + gap(KITCHEN.r), SITES.t3 - gap(R[SITES.t3]), 2],
]

const WALKERS: Walker[] = SEGS.flatMap(([a, b, n], j) =>
  Array.from({ length: n }, (_, i) => {
    const w = (b - a) / n
    const r = rand(j * 7 + i)
    return {
      u0: a + w * i + w * 0.05,
      u1: a + w * (i + 1) - w * 0.05,
      off: (r - 0.5) * T * 0.3,
      speed: 22 + r * 16,
      pause: 2.5 + rand(i * 3 + j) * 4,
      phase: rand(j * 13 + i * 5) * 40,
    }
  }),
)

const KIDS: [number, number][] = [
  [SCOPE[0] - 50, SCOPE[1] + 105],
  [SCOPE[0] - 66, SCOPE[1] + 140],
]
const PIP = SITES.t1 + gap(R[SITES.t1]) + 60 / LEN
const NAP = SITES.t2 - gap(R[SITES.t2]) - 10 / LEN

function pace(w: Walker, t: number, look: number) {
  const L = Math.abs(w.u1 - w.u0) * LEN
  const walk = L / w.speed
  const cyc = 2 * (walk + w.pause)
  const k = (t + w.phase) % cyc
  const f = along(w.u0)
  const fwd = Math.atan2(f.tx, f.tz)
  const back = fwd + Math.PI
  const stop = (from: number, to: number, x: number) => (x < w.pause / 2 ? spin(from, look, x / 0.6) : spin(look, to, (x - w.pause + 0.6) / 0.6))
  if (k < w.pause) return { u: w.u0, yaw: stop(back, fwd, k), moving: 0 }
  if (k < w.pause + walk) return { u: w.u0 + (w.u1 - w.u0) * ((k - w.pause) / walk), yaw: fwd, moving: 1 }
  if (k < 2 * w.pause + walk) return { u: w.u1, yaw: stop(fwd, back, k - w.pause - walk), moving: 0 }
  return { u: w.u1 + (w.u0 - w.u1) * ((k - 2 * w.pause - walk) / walk), yaw: back, moving: 1 }
}

export function Sentries({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const geo = useMemo(() => sentryGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)
  const count = WALKERS.length + 4

  useFrame((state) => {
    const mesh = ref.current
    if (!mesh) return
    mesh.visible = state.camera.zoom > SEE
    if (!mesh.visible) return
    const t = clock(state.clock.elapsedTime, reduced)
    const alarm = mood.current.alarm
    WALKERS.forEach((w, k) => {
      const out = along(w.u0)
      const look = spin(Math.atan2(out.nx, out.nz), Math.atan2(out.nx, out.nz) + Math.PI, alarm)
      const p = pace(w, t * (1 + alarm * 0.8), look)
      const f = along(p.u)
      const step = t * 9 + w.phase
      const bob = p.moving * Math.abs(Math.sin(step)) * 4
      place(mesh, k, f.x + f.nx * w.off, H + 6 + bob, f.z + f.nz * w.off, p.yaw, BIG, 0, p.moving * Math.sin(step) * 0.12)
    })
    const pip = along(PIP)
    const hop = Math.abs(Math.sin(t * (4 + alarm * 6))) * (3 + alarm * 14)
    const peek = Math.atan2(pip.nx, pip.nz) + Math.PI + Math.sin(t * 0.7) * 0.5
    place(mesh, WALKERS.length, pip.x - pip.nx * T * 0.3, H + 6 + hop, pip.z - pip.nz * T * 0.3, peek, 0.85)
    const nap = along(NAP)
    const breath = 1 + Math.sin(t * 1.3) * 0.05 * (1 - alarm)
    const lie = 1.25 * (1 - alarm)
    place(mesh, WALKERS.length + 1, nap.x + nap.nx * 20, H + 8, nap.z + nap.nz * 20, Math.atan2(nap.tx, nap.tz) - 0.3, breath * BIG, 0, lie)
    KIDS.forEach(([x, z], i) => {
      const fidget = Math.abs(Math.sin(t * (2.6 + i) + i * 2)) * (6 + alarm * 10)
      place(mesh, WALKERS.length + 2 + i, x, 14 + fidget, z, 2.7 + Math.sin(t * 0.5 + i) * 0.4, 0.62)
    })
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, count]} frustumCulled={false} renderOrder={47}>
      <meshStandardMaterial vertexColors flatShading roughness={0.7} />
    </instancedMesh>
  )
}

type Route = { xs: Float32Array; zs: Float32Array; cum: Float32Array; len: number; bead: number }

function route(bead: number, long: boolean): Route {
  const k = frame(SITES.kitchen)
  const g = frame(SITES.gate)
  const pts: [number, number][] = []
  if (long) {
    pts.push([k.x - k.nx * (KITCHEN.r + 40) - k.tx * 40, k.z - k.nz * (KITCHEN.r + 40) - k.tz * 40])
    const from = SITES.kitchen - gap(KITCHEN.r + 30)
    const to = SITES.gate + gap(220)
    for (let i = 0; i <= 8; i++) {
      const f = frame(from + ((to - from) * i) / 8)
      pts.push([f.x - f.nx * (T / 2 + 95), f.z - f.nz * (T / 2 + 95)])
    }
  } else {
    const [hx, hz] = heapAt()
    pts.push([hx + g.tx * 40 - g.nx * 30, hz + g.tz * 40 - g.nz * 30])
  }
  for (const o of [-(GATE_D / 2 + 60), 0, GATE_D / 2 + 70]) pts.push([g.x + g.nx * o, g.z + g.nz * o])
  const [bx, by] = BEADS[bead]
  pts.push([bx - 18, by + 26])
  const cum = new Float32Array(pts.length)
  for (let i = 1; i < pts.length; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return { xs: Float32Array.from(pts, (p) => p[0]), zs: Float32Array.from(pts, (p) => p[1]), cum, len: cum[pts.length - 1], bead }
}

const PICKERS = [1, 5, 7, 9, 3].map((b) => route(b, true)).concat([0, 2, 4, 6, 8, 10].map((b) => route(b, false)))
const SPEED = 46
const PICK = 4
const DROP = 3
const walkAt = { x: 0, z: 0, dx: 0, dz: 1 }

function walkOn(r: Route, d: number) {
  let i = 1
  while (i < r.cum.length - 1 && r.cum[i] < d) i++
  const seg = r.cum[i] - r.cum[i - 1] || 1
  const k = Math.min(1, Math.max(0, (d - r.cum[i - 1]) / seg))
  walkAt.dx = r.xs[i] - r.xs[i - 1]
  walkAt.dz = r.zs[i] - r.zs[i - 1]
  walkAt.x = r.xs[i - 1] + walkAt.dx * k
  walkAt.z = r.zs[i - 1] + walkAt.dz * k
  return walkAt
}

function portcullisGeometry() {
  const f = frame(SITES.gate)
  const p: THREE.BufferGeometry[] = []
  const out = -GATE_D / 2 - 9
  for (let i = -3; i <= 3; i++) {
    const x = f.x + f.tx * i * 17 + f.nx * out
    const z = f.z + f.tz * i * 17 + f.nz * out
    p.push(part(new THREE.BoxGeometry(5, 150, 5), '#5a4a66', x, -75, z, f.turn))
    p.push(part(new THREE.ConeGeometry(4, 10, 4), '#c9d2dc', x, -154, z, f.turn))
  }
  for (const y of [-30, -80, -125]) p.push(part(new THREE.BoxGeometry(124, 6, 6), INK, f.x + f.nx * out, y, f.z + f.nz * out, f.turn))
  return merged(p)
}

const lift = new THREE.Matrix4()
const squash = new THREE.Matrix4()

export function Pickers({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const body = useMemo(() => pickerGeometry(), [])
  const load = useMemo(() => berryGeometry(), [])
  const bush = useMemo(() => bushGeometry(), [])
  const gateGeo = useMemo(() => portcullisGeometry(), [])
  useEffect(() => () => [body, load, bush, gateGeo].forEach((g) => g.dispose()), [body, load, bush, gateGeo])
  const folk = useRef<THREE.InstancedMesh>(null)
  const loads = useRef<THREE.InstancedMesh>(null)
  const bushes = useRef<THREE.InstancedMesh>(null)
  const gate = useRef<THREE.Mesh>(null)
  const picked = useRef(new Float32Array(BEADS.length).fill(-99))
  const open = useRef(1)
  const pickT = useRef(0)

  useFrame((state, dt) => {
    const [a, b, c, g] = [folk.current, loads.current, bushes.current, gate.current]
    if (!a || !b || !c || !g) return
    const t = clock(state.clock.elapsedTime, reduced)
    pickT.current += dt * (reduced ? 0.06 : 1) * (1 + mood.current.alarm * 1.5)
    const pt = pickT.current
    const near = state.camera.zoom > SEE
    a.visible = near
    b.visible = near
    let want = 0
    const gf = frame(SITES.gate)
    PICKERS.forEach((r, k) => {
      const walk = r.len / SPEED
      const cyc = 2 * walk + PICK + DROP
      const x = (pt + k * 7.3 + rand(k) * cyc) % cyc
      let d = 0
      let carry = 0
      let bend = 0
      let dir = 1
      if (x < walk) d = (x / walk) * r.len
      else if (x < walk + PICK) {
        d = r.len
        bend = Math.max(0, Math.sin((x - walk) * 3.2)) * 0.6
        carry = x - walk > PICK * 0.6 ? 1 : 0
        if (x - walk > PICK * 0.5) picked.current[r.bead] = pt
      } else if (x < 2 * walk + PICK) {
        d = r.len * (1 - (x - walk - PICK) / walk)
        carry = 1
        dir = -1
      } else carry = 0
      const w = walkOn(r, d)
      const yaw = Math.atan2(w.dx * dir, w.dz * dir)
      const moving = bend || x >= 2 * walk + PICK ? 0 : 1
      const step = t * 8 + k
      const y = moving * Math.abs(Math.sin(step)) * 3
      const dg = Math.hypot(w.x - gf.x, w.z - gf.z)
      want = Math.max(want, 1 - Math.min(1, Math.max(0, (dg - 160) / 160)))
      place(a, k, w.x, y, w.z, yaw, 1, bend, moving * Math.sin(step) * 0.1)
      place(b, k, w.x, y, w.z, yaw, carry, bend, moving * Math.sin(step) * 0.1)
    })
    BEADS.forEach(([x, z], k) => {
      const grow = Math.min(1, Math.max(0.15, (pt - picked.current[k] - 3) / 14))
      place(c, k, x, 0, z, 0, 1.5 * grow * (1 + Math.sin(t * 2 + k) * 0.04))
    })
    for (const mesh of [a, b, c]) mesh.instanceMatrix.needsUpdate = true
    const goal = mood.current.alarm > 0.5 ? 0 : want
    open.current += (goal - open.current) * Math.min(1, dt * 2.5)
    const k = 1 - 0.82 * open.current
    g.matrix.copy(SHEAR).multiply(lift.makeTranslation(0, 150, 0)).multiply(squash.makeScale(1, k, 1))
  })

  return (
    <group>
      <instancedMesh ref={bushes} args={[bush, undefined, BEADS.length]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={folk} args={[body, undefined, PICKERS.length]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={loads} args={[load, undefined, PICKERS.length]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </instancedMesh>
      <mesh ref={gate} geometry={gateGeo} matrixAutoUpdate={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </mesh>
    </group>
  )
}
