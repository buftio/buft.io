'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { PITCH } from '../../stand'
import { ISLES, onLand, rim, shore } from './isles'
import { boat, hands } from './kit'
import { STOP, WAIT, rng } from './plan'

const FERRIES = 8
const CREW = 5
const WAKE = 140
const SWELL = 150
const LIFE = 2.6
const SIN50 = Math.sin((50 * Math.PI) / 180)

const qPitch = new THREE.Quaternion().setFromEuler(PITCH)
const qTurn = new THREE.Quaternion()
const qRoll = new THREE.Quaternion()
const q = new THREE.Quaternion()
const Y = new THREE.Vector3(0, 1, 0)
const X = new THREE.Vector3(1, 0, 0)
const at = new THREE.Vector3()
const sc = new THREE.Vector3()
const m = new THREE.Matrix4()
const local = new THREE.Matrix4()
const out = new THREE.Matrix4()
const ID = new THREE.Quaternion()

type Ferry = { from: number; to: number; x0: number; y0: number; x1: number; y1: number; t: number; dur: number; wait: number; hx: number; hy: number; x: number; y: number; puff: number }
type Foam = { x: number; y: number; vx: number; vy: number; born: number }

function links() {
  const near: number[][] = ISLES.map(() => [])
  ISLES.forEach((A, a) =>
    ISLES.forEach((B, b) => {
      if (b <= a || a === WAIT || b === WAIT || Math.hypot(A[0], A[1]) > 1400 || Math.hypot(B[0], B[1]) > 1400) return
      const t = Math.atan2(B[1] - A[1], B[0] - A[0])
      const d = Math.hypot(B[0] - A[0], B[1] - A[1])
      const gap = d - rim(A, t) - rim(B, t + Math.PI)
      if (gap < 70 || gap > 650) return
      const [x0, y0] = shore(A, t, 20)
      const [x1, y1] = shore(B, t + Math.PI, 20)
      for (let i = 1; i < 12; i++) if (onLand(x0 + ((x1 - x0) * i) / 12, y0 + ((y1 - y0) * i) / 12, 14)) return
      near[a].push(b)
      near[b].push(a)
    }),
  )
  return near
}

function sea() {
  const roll = rng(7)
  const pts = new Float32Array(SWELL * 3)
  let n = 0
  while (n < SWELL) {
    const a = roll() * Math.PI * 2
    const r = Math.sqrt(roll()) * 1450
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (onLand(x, y, 30)) continue
    pts.set([x, y, roll()], n * 3)
    n++
  }
  return pts
}

function sail(f: Ferry, near: number[][], danger: number, roll: () => number) {
  const opts = near[f.to]
  const hub = f.to !== STOP && opts.includes(STOP) && roll() < 0.35
  const next =
    danger > 0.05
      ? opts.reduce((w, k) => (ISLES[k][0] < ISLES[w][0] ? k : w), opts[0])
      : hub
        ? STOP
        : opts[Math.floor(roll() * opts.length)]
  const A = ISLES[f.to]
  const B = ISLES[next]
  const t = Math.atan2(B[1] - A[1], B[0] - A[0])
  ;[f.x0, f.y0] = shore(A, t, 22)
  ;[f.x1, f.y1] = shore(B, t + Math.PI, 22)
  f.from = f.to
  f.to = next
  f.t = 0
  f.dur = Math.hypot(f.x1 - f.x0, f.y1 - f.y0) / (danger > 0.05 ? 150 : 80 + roll() * 30)
  f.wait = danger > 0.05 ? 0.3 : 0.8 + roll() * roll() * 7
}

export function Fleet({ danger, reduced }: { danger: RefObject<number>; reduced: boolean }) {
  const shapes = useMemo(() => {
    const hull = boat()
    hull.translate(0, 16, 0)
    return { hull, crew: hands(true), mitts: hands(false), foam: new THREE.CircleGeometry(1, 10) }
  }, [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const near = useMemo(() => links(), [])
  const swell = useMemo(() => sea(), [])
  const ports = useMemo(() => near.map((n, k) => (n.length ? k : -1)).filter((k) => k >= 0), [near])
  const boats = useRef<THREE.InstancedMesh>(null)
  const crew = useRef<THREE.InstancedMesh>(null)
  const foam = useRef<THREE.InstancedMesh>(null)
  const raise = useRef<THREE.InstancedMesh>(null)
  const fleet = useRef<Ferry[] | null>(null)
  const wakes = useRef<Foam[] | null>(null)
  const head = useRef(0)
  const dice = useRef<(() => number) | null>(null)

  useFrame((state, delta) => {
    const B = boats.current
    const Cr = crew.current
    const F = foam.current
    const R = raise.current
    if (!B || !Cr || !F || !R) return
    const roll = (dice.current ??= rng(23))
    if (!fleet.current) {
      fleet.current = Array.from({ length: FERRIES }, (_, i) => {
        const f: Ferry = { from: 0, to: ports[(i * 7) % ports.length], x0: 0, y0: 0, x1: 0, y1: 0, t: 0, dur: 1, wait: 0, hx: 1, hy: 0, x: 0, y: 0, puff: 0 }
        sail(f, near, 0, roll)
        f.t = roll()
        f.wait = 0
        return f
      })
      wakes.current = Array.from({ length: WAKE }, () => ({ x: 0, y: 0, vx: 0, vy: 0, born: -99 }))
    }
    const fl = fleet.current
    const wk = wakes.current ?? []
    const time = state.clock.elapsedTime
    const dt = reduced ? 0 : Math.min(delta, 0.1)
    const zoom = state.camera.zoom
    const k = THREE.MathUtils.clamp(0.3 / zoom, 1, 2.8)
    const d = danger.current ?? 0
    fl.forEach((f, i) => {
      if (f.wait > 0) f.wait -= dt
      else {
        f.t += dt / f.dur
        if (f.t >= 1) sail(f, near, d, roll)
      }
      const e = THREE.MathUtils.smootherstep(Math.min(f.t, 1), 0, 1)
      const moving = f.wait <= 0 && f.t < 1
      f.x = f.x0 + (f.x1 - f.x0) * e
      f.y = f.y0 + (f.y1 - f.y0) * e
      const len = Math.hypot(f.x1 - f.x0, f.y1 - f.y0) || 1
      f.hx = (f.x1 - f.x0) / len
      f.hy = (f.y1 - f.y0) / len
      f.puff -= dt
      if (!reduced && moving && f.puff <= 0 && e > 0.04 && e < 0.96) {
        f.puff = 0.11
        for (const s of [-1, 1]) {
          const w = wk[head.current++ % WAKE]
          w.x = f.x - f.hx * 60 * k
          w.y = f.y - f.hy * 60 * k
          w.vx = -f.hx * 6 - f.hy * s * 34
          w.vy = -f.hy * 6 + f.hx * s * 34
          w.born = time
        }
      }
      const tw = reduced ? 0 : time
      qTurn.setFromAxisAngle(Y, Math.atan2(-f.hy / SIN50, f.hx))
      qRoll.setFromAxisAngle(X, Math.sin(tw * 2.2 + i * 1.7) * (moving ? 0.07 : 0.03))
      q.copy(qPitch).multiply(qTurn).multiply(qRoll)
      m.compose(at.set(f.x, -f.y, 6), q, sc.set(k, k, k))
      B.setMatrixAt(i, m)
      for (let j = 0; j < CREW; j++) {
        const bob = Math.sin(tw * (moving ? 9 : 2.5) + j * 1.3 + i) * (moving ? 3 : 1)
        local.compose(at.set(-60 + j * 30, bob, j % 2 ? 8 : 15), ID, sc.set(1, 1, 1))
        Cr.setMatrixAt(i * CREW + j, out.multiplyMatrices(m, local))
      }
    })
    wk.forEach((w, i) => {
      const age = time - w.born
      const life = age < LIFE ? age / LIFE : 1
      const s = life >= 1 ? 0 : (5 + age * 5) * (1 - life) * Math.sqrt(k)
      F.setMatrixAt(i, m.compose(at.set(w.x + w.vx * age, -(w.y + w.vy * age), 3), ID, sc.set(s, s, 1)))
    })
    const tw = reduced ? 0 : time
    const fast = d > 0.05
    const speed = fast ? 340 : 150
    const phi = 0.7 + tw * 0.02
    const cx = Math.cos(phi)
    const cy = Math.sin(phi)
    const front = ((tw * speed) % 3000) - 1500
    const ks = THREE.MathUtils.clamp(0.22 / zoom, 1, 2)
    for (let i = 0; i < SWELL; i++) {
      const x = swell[i * 3]
      const y = swell[i * 3 + 1]
      const along = x * cx + y * cy + swell[i * 3 + 2] * 60
      const gap = fast ? 750 : 1500
      const off = ((((along - front) % gap) + gap * 1.5) % gap) - gap / 2
      const r = Math.exp(-((off / 110) ** 2))
      const s = r < 0.04 ? 0 : r * ks * 1.7
      R.setMatrixAt(i, m.compose(at.set(x, -y, 3), qPitch, sc.set(s, s, s)))
    }
    for (const mesh of [B, Cr, F, R]) mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={foam} args={[shapes.foam, undefined, WAKE]} frustumCulled={false} renderOrder={43}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={raise} args={[shapes.mitts, undefined, SWELL]} frustumCulled={false} renderOrder={44}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={crew} args={[shapes.crew, undefined, FERRIES * CREW]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={boats} args={[shapes.hull, undefined, FERRIES]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}
