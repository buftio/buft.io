'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { phase, reelAge, REEL_T, REELS, type Life } from './clock'
import { air, folkGeometry, orient, TILT } from './kit'
import { CAPSTAN, FIELD, HANDLOOM, HAUL, LENGTH, LONG, MID, ROLL, STALLS, VATS, WIDTH } from './layout'
import { fellY } from './loom'
import { path, yarn } from './threads'

const SIZE = 30
const N = 56
const m = new THREE.Matrix4()
const p = new THREE.Vector3()
const v = new THREE.Vector3()
const s = new THREE.Vector3()
const q = new THREE.Quaternion()
const z = new THREE.Quaternion()
const ZA = new THREE.Vector3(0, 0, 1)
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const frac = (x: number) => x - Math.floor(x)
const ping = (x: number) => 1 - Math.abs(1 - 2 * frac(x))
const haul = path(HAUL)
const lane = path([
  [-1450, 420],
  [-1100, 380],
  [-800, 470],
  [-560, 300],
])
const fronts = STALLS.map(({ at }) => [at[0], at[1] + 80] as [number, number])
const hash = (k: number) => frac(Math.sin(k * 91.7 + 3.1) * 43758.5)


function put(mesh: THREE.InstancedMesh, i: number, at: THREE.Vector3, turn: number, lean: number, size: number) {
  orient(turn, q).multiply(z.setFromAxisAngle(ZA, lean))
  mesh.setMatrixAt(i, size > 0.5 ? m.compose(at, q, s.setScalar(size)) : ZERO)
}

const ground = (dx: number, dy: number, hop = 0) => air(dx, dy, hop, p)

export function Crowd({ life }: { life: RefObject<Life> }) {
  const geo = useMemo(() => folkGeometry(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const ref = useRef<THREE.InstancedMesh>(null)

  useFrame(() => {
    const f = ref.current
    const L = life.current
    if (!f) return
    f.visible = L.zoom > 0.1
    if (!f.visible) return
    const t = L.t
    const ph = phase(t)
    const stay = SIZE
    const away = SIZE * (1 - L.flee * 0.9)
    const gone = L.flee * 700
    const fy = fellY(ph.p)
    let i = 0

    for (let k = 0; k < 3; k++) {
      const sway = Math.sin(t * 2.4 + k * 2)
      put(f, i++, air(MID - 340 + k * 340 + sway * 8, -fy, 370 + Math.abs(sway) * 6, p), sway * 0.3, sway * 0.25, SIZE)
    }
    const sw = Math.sin(t * (1.9 + L.alarm))
    for (const side of [-1, 1]) {
      const near = Math.max(0, sw * side)
      put(f, i++, air(MID + side * (WIDTH / 2 + 110), -fy + 30, near * 14, p), -side * 0.9, side * near * 0.4, SIZE)
    }
    for (let k = 0; k < 4; k++) {
      const x = MID + Math.sin(t * 0.13 + k * 1.9) * (WIDTH / 2 - 60)
      const d = Math.max(60, ph.p * LENGTH - 60)
      const y = FIELD.south - 40 - frac(0.1 + k * 0.23 + Math.sin(t * 0.05 + k) * 0.2) * d
      const step = t * 6 + k
      put(f, i++, ground(x, y, Math.abs(Math.sin(step)) * 5), Math.cos(t * 0.13 + k * 1.9) > 0 ? 1.2 : -1.2, Math.sin(step) * 0.1, stay)
    }
    const spin = ph.back ? ph.wind * Math.PI * 6 : 0
    for (let k = 0; k < 4; k++) {
      const a = k * (Math.PI / 2) - spin + 0.22
      v.set(Math.cos(a) * 128, 0, -Math.sin(a) * 128).applyQuaternion(TILT)
      const step = ph.back ? Math.abs(Math.sin(t * 9 + k)) * 5 : 0
      put(f, i++, v.add(ground(CAPSTAN[0], CAPSTAN[1], step)), a, ph.back ? 0.3 : 0, stay)
    }
    for (let k = 0; k < REELS; k++) {
      const age = reelAge(t, k)
      const u = age / REEL_T
      for (let c = 0; c < 4; c++) {
        if (u >= 1) {
          f.setMatrixAt(i++, ZERO)
          continue
        }
        haul(u, v)
        const h = v.z
        const side = c % 2 ? 1 : -1
        const fore = (c < 2 ? -0.3 : 0.3) * LONG
        const wide = side * (ROLL + 22)
        const step = t * 7 + k + c
        const x = v.x + Math.sin(h) * fore + Math.cos(h) * wide
        const y = v.y + Math.cos(h) * fore - Math.sin(h) * wide
        put(f, i++, ground(x, y, Math.abs(Math.sin(t * 7 + k)) * 4), h, Math.sin(step) * 0.12, stay)
      }
    }
    VATS.forEach(({ at, r, h }, vi) => {
      const count = vi === 2 ? 2 : 3
      for (let k = 0; k < count; k++) {
        const stir = Math.sin(t * 2 + k * 2.1 + vi)
        if (vi === 0) {
          const a = Math.PI + (k - 1) * 0.75
          put(f, i++, air(at[0] + Math.sin(a) * r * 0.95, at[1] - Math.cos(a) * r * 0.95 * -1, h, p), 0, stir * 0.2, stay)
        } else if (vi === 1) {
          const a = (k - 1) * 0.9
          put(f, i++, ground(at[0] + Math.sin(a) * (r + 40), at[1] + Math.cos(a) * (r + 40) * 0.6), -a, 0.3 + stir * 0.3, stay)
        } else {
          const sd = k ? 1 : -1
          put(f, i++, ground(at[0] + sd * (r + 50), at[1] + 10, Math.max(0, stir) * 3), -sd * 0.7, sd * stir * 0.15, stay)
        }
      }
    })
    for (let k = 0; k < 10; k++) {
      const c = t / (6 + hash(k) * 4) + hash(k + 20) * 10
      const seg = Math.floor(c)
      const fr = frac(c)
      const w = Math.min(1, fr * 1.6)
      const e = w * w * (3 - 2 * w)
      const A = fronts[Math.floor(hash(seg * 7 + k) * 4)]
      const B = fronts[Math.floor(hash(seg * 7 + k + 7) * 4)]
      const ox = (hash(k + 40) - 0.5) * 90
      const x = A[0] + (B[0] - A[0]) * e + ox
      const y = A[1] + (B[1] - A[1]) * e + (hash(k + 60) - 0.5) * 40
      const walking = w < 1 && A !== B
      const step = t * 8 + k
      const flee = L.flee
      put(
        f,
        i++,
        ground(x - flee * 900, y, walking ? Math.abs(Math.sin(step)) * 4 : 0),
        walking ? Math.atan2(B[0] - A[0], B[1] - A[1]) : 0,
        walking ? Math.sin(step) * 0.1 : Math.sin(t + k) * 0.08,
        SIZE * (1 - flee * 0.9),
      )
    }
    STALLS.forEach(({ at }, k) => {
      const bob = Math.sin(t * 3 + k)
      put(f, i++, ground(at[0] + 80 - gone, at[1] + 30, Math.max(0, bob) * 6), -0.5, bob * 0.1, away)
    })
    for (let k = 0; k < 4; k++) {
      const u = ping(t / (40 + k * 7) + k * 0.3)
      lane(u, v)
      const step = t * 7 + k
      const dir = frac(t / (40 + k * 7) + k * 0.3) < 0.5 ? 1 : -1
      put(f, i++, ground(v.x, v.y + (k - 1.5) * 18, Math.abs(Math.sin(step)) * 4), dir > 0 ? v.z : v.z + Math.PI, Math.sin(step) * 0.1, away)
    }
    for (let k = 0; k < 2; k++) {
      const x = FIELD.x0 + ping(t / 30 + k * 0.5) * WIDTH
      put(f, i++, ground(x, FIELD.north + 60), Math.sin(t / 30) > 0 ? 1.3 : -1.3, Math.sin(t * 7) * 0.1, stay)
    }
    const nod = Math.sin(t * 4)
    put(f, i++, ground(HANDLOOM[0], HANDLOOM[1] + 50), Math.PI, nod * 0.12, stay)
    const lw = ping(t / 14)
    put(f, i++, ground(260 + lw * 70 - gone, 1300 - lw * 40, Math.abs(Math.sin(t * 7)) * 4), lw > 0.5 ? -1 : 1, 0.15, away)
    yarn(t - 0.9, v)
    yarn(t - 0.8, p)
    const dx = p.x - v.x
    const dy = p.y - v.y
    const run = t * 11
    put(f, i++, ground(v.x - gone, v.y, Math.abs(Math.sin(run)) * 7), Math.atan2(dx, dy), 0.25 + Math.sin(run) * 0.1, away)
    for (; i < N; i++) f.setMatrixAt(i, ZERO)
    f.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false} renderOrder={48}>
      <meshStandardMaterial vertexColors roughness={0.7} />
    </instancedMesh>
  )
}
