'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { glow, LAMPS } from './moat'
import {
  barrelsGeometry, boatmanGeometry, hullGeometry, jarsGeometry, keeperGeometry, LAMP_H, pipGeometry, postGeometry,
  starGeometry, WAND, wandGeometry,
} from './models'
import { bank, LEN, yawOf } from './path'
import { done, ease, flat, hide, lift, stand } from './util'

const S0 = 0.05
const DS = 0.9 / (LAMPS - 1)
const BANK = -55
const POST = 130
const TRIP = LAMPS - 1
const SEG = 7.5
const PAUSE = 2
const LAG = 10.5
const KEEPER = 54
const PIP = 38
export const DOCK_N = 0.22
export const DOCK_S = 0.8
const BOATS = [
  { v: 52, speed: 64, at: 0, size: 104 },
  { v: 228, speed: 52, at: 0.37, size: 96 },
  { v: 110, speed: 78, at: 0.62, size: 100 },
  { v: 169, speed: 58, at: 0.18, size: 92 },
  { v: 286, speed: 70, at: 0.83, size: 94 },
]
const DOCK = 6
const PUFFS = 6
const HALOS = LAMPS + 1 + BOATS.length + 1
const WARM = new THREE.Color('#ffc65a')
const COLD = new THREE.Color('#3a3157')
const PALE = new THREE.Color('#dbe8ff')
const BEACON = new THREE.Color('#fff2b0')
const tint = new THREE.Color()
const hull = new THREE.Matrix4()
const v3 = new THREE.Vector3()

type Walk = { pos: number; lamp: number; dir: number; pausing: boolean; f: number; lap: number }

function walk(t: number, out: Walk) {
  const c = t / SEG
  const lap = Math.floor(c / (2 * TRIP))
  const w = c - lap * 2 * TRIP
  const i = Math.floor(w)
  const f = w - i
  out.dir = i < TRIP ? 1 : -1
  out.lamp = out.dir > 0 ? i : 2 * TRIP - i
  const p = PAUSE / SEG
  out.pausing = f < p
  out.f = out.pausing ? f / p : (f - p) / (1 - p)
  out.pos = out.lamp + out.dir * (out.pausing ? 0 : ease(out.f))
  out.lap = lap
  return out
}

const sOf = (pos: number) => S0 + pos * DS
const snuffs = (lamp: number, dir: number) => (lamp * 5 + (dir > 0 ? 1 : 2)) % 3 === 0 && lamp > 0 && lamp < TRIP

export type Shared = { hope: RefObject<number>; moon: { x: number; y: number; z: number; size: number } }

export function Life({ hope, moon, reduced, tex }: Shared & { reduced: boolean; tex: THREE.Texture }) {
  const geo = useMemo(
    () => ({
      post: postGeometry(),
      flame: new THREE.OctahedronGeometry(0.5, 1),
      halo: new THREE.PlaneGeometry(1, 1),
      hull: hullGeometry(),
      man: boatmanGeometry(),
      jars: jarsGeometry(),
      barrels: barrelsGeometry(),
      star: starGeometry(),
      keeper: keeperGeometry(),
      wand: wandGeometry(),
      pip: pipGeometry(),
      puff: new THREE.IcosahedronGeometry(0.5, 1),
    }),
    [],
  )
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  const postsRef = useRef<THREE.InstancedMesh>(null)
  const flamesRef = useRef<THREE.InstancedMesh>(null)
  const halosRef = useRef<THREE.InstancedMesh>(null)
  const hullsRef = useRef<THREE.InstancedMesh>(null)
  const menRef = useRef<THREE.InstancedMesh>(null)
  const jarsRef = useRef<THREE.InstancedMesh>(null)
  const barrelsRef = useRef<THREE.InstancedMesh>(null)
  const starsRef = useRef<THREE.InstancedMesh>(null)
  const folkRef = useRef<THREE.InstancedMesh>(null)
  const wandRef = useRef<THREE.InstancedMesh>(null)
  const pipRef = useRef<THREE.InstancedMesh>(null)
  const puffsRef = useRef<THREE.InstancedMesh>(null)
  const state = useRef({
    lit: Float32Array.from({ length: LAMPS }, (_, k) => (snuffs(k, 1) ? 0 : 1)),
    want: Float32Array.from({ length: LAMPS }, (_, k) => (snuffs(k, 1) ? 0 : 1)),
    key: -1,
    lightKey: -1,
    puffAt: new Float32Array(PUFFS).fill(-99),
    puffX: new Float32Array(PUFFS),
    puffY: new Float32Array(PUFFS),
    puffZ: new Float32Array(PUFFS),
    next: 0,
    hide: 0,
    a: { pos: 0, lamp: 0, dir: 1, pausing: false, f: 0, lap: 0 } as Walk,
    b: { pos: 0, lamp: 0, dir: 1, pausing: false, f: 0, lap: 0 } as Walk,
  })

  useEffect(() => {
    const posts = postsRef.current
    if (!posts) return
    for (let k = 0; k < LAMPS; k++) {
      const p = bank(S0 + k * DS, BANK)
      stand(posts, k, p.x, p.y, POST)
      glow.at[k] = (S0 + k * DS) * LEN
    }
    done(posts)
  }, [])

  useFrame((frame, dt) => {
    const t = reduced ? 40 : frame.clock.elapsedTime + 30
    const st = state.current
    const h = hope.current
    const flames = flamesRef.current
    const halos = halosRef.current
    const hulls = hullsRef.current
    const men = menRef.current
    const jars = jarsRef.current
    const barrels = barrelsRef.current
    const stars = starsRef.current
    const folk = folkRef.current
    const wand = wandRef.current
    const pip = pipRef.current
    const puffs = puffsRef.current
    if (!flames || !halos || !hulls || !men || !jars || !barrels || !stars || !folk || !wand || !pip || !puffs) return

    const a = walk(t, st.a)
    const b = walk(t - LAG, st.b)
    const lightKey = a.lap * 1000 + a.lamp * 2 + (a.dir > 0 ? 0 : 1)
    if (a.pausing && a.f > 0.55 && lightKey !== st.lightKey) {
      st.lightKey = lightKey
      st.want[a.lamp] = 1
    }
    const key = b.lap * 1000 + b.lamp * 2 + (b.dir > 0 ? 0 : 1)
    if (b.pausing && b.f > 0.5 && key !== st.key) {
      st.key = key
      if (snuffs(b.lamp, b.dir) && st.want[b.lamp] > 0.5) {
        st.want[b.lamp] = 0
        const p = bank(sOf(b.lamp), BANK)
        const l = lift(p.x, p.y, 0, LAMP_H, 0, POST)
        const n = st.next++ % PUFFS
        st.puffAt[n] = t
        st.puffX[n] = l.x
        st.puffY[n] = l.y
        st.puffZ[n] = l.z
      }
    }
    const fled = h < 0.7
    st.hide += ((fled ? 1 : 0) - st.hide) * Math.min(1, dt * 2)

    for (let k = 0; k < LAMPS; k++) {
      const s = S0 + k * DS
      const dark = s > 1 - (1 - h) * 1.6
      const goal = dark ? 0 : st.want[k]
      st.lit[k] += (goal - st.lit[k]) * Math.min(1, dt * (goal > st.lit[k] ? 3 : 6))
      const lit = st.lit[k]
      const p = bank(s, BANK)
      const l = lift(p.x, p.y, 0, LAMP_H, 0, POST)
      const fl = 1 + 0.08 * Math.sin(t * 9 + k * 2.1) * lit
      stand(flames, k, l.x, l.y, 40 * fl, t * 0.5 + k, 0, l.z)
      flames.setColorAt(k, tint.copy(COLD).lerp(WARM, lit))
      flat(halos, k, l.x, l.y, l.z + 20, 210 * lit * fl)
      halos.setColorAt(k, tint.copy(WARM).multiplyScalar(0.75 * lit))
      glow.lit[k] = lit
    }

    const kp = bank(sOf(a.pos), -150)
    const kx = kp.x
    const ky = kp.y
    const gone = st.hide > 0.5
    const meet = Math.abs(a.pos - b.pos) < 0.35 && a.dir !== b.dir
    const step = a.pausing ? 0 : Math.abs(Math.sin(a.f * Math.PI * 9))
    if (gone) hide(folk, 0)
    else stand(folk, 0, kx, ky, KEEPER, 0, meet ? Math.sin(t * 30) * 0.15 : Math.sin(a.f * Math.PI * 9) * 0.07 * (a.pausing ? 0 : 1), step * 7)
    const reach = a.pausing ? Math.sin(Math.min(1, a.f * 1.6) * Math.PI) : 0
    const tilt = -(-0.28 + 0.6 * reach)
    const hand = lift(kx, ky, 0.42, 0.35, 0.2, KEEPER)
    if (gone) hide(wand, 0)
    else stand(wand, 0, hand.x, hand.y, KEEPER, 0, tilt, hand.z + step * 7)
    const tip = lift(hand.x, hand.y, -Math.sin(tilt) * WAND, Math.cos(tilt) * WAND, 0, KEEPER)
    flat(halos, LAMPS, tip.x, tip.y, tip.z + hand.z + 30, gone ? 0 : 70 + 20 * Math.sin(t * 11))
    halos.setColorAt(LAMPS, WARM)

    const pp = bank(sOf(b.pos), -185)
    const hop = meet ? Math.abs(Math.sin(t * 9)) * 60 : b.pausing ? Math.abs(Math.sin(b.f * Math.PI * 2)) * 10 : Math.abs(Math.sin(b.f * Math.PI * 12)) * 6
    if (gone) hide(pip, 0)
    else stand(pip, 0, pp.x - (meet ? 40 : 0), pp.y, PIP, 0, b.pausing ? -0.2 * Math.sin(b.f * Math.PI) : 0, hop)

    for (let n = 0; n < PUFFS; n++) {
      const age = (t - st.puffAt[n]) / 1.8
      if (age < 0 || age > 1) {
        hide(puffs, n)
        continue
      }
      const k = n * 3
      stand(puffs, n, st.puffX[n] + Math.sin(age * 6 + k) * 10, st.puffY[n] - age * 70, (14 + 30 * age) * (1 - age * age), 0, 0, st.puffZ[n] + 10)
    }

    BOATS.forEach((o, k) => {
      const run = ((DOCK_S - DOCK_N) * LEN) / o.speed
      const cyc = 2 * (run + DOCK)
      let c = ((t + o.at * cyc) % cyc + cyc) % cyc
      let s: number
      let dir: number
      let jarsOn: boolean
      if (st.hide > 0.01) c = c * (1 - st.hide)
      if (c < run) {
        s = DOCK_N + (DOCK_S - DOCK_N) * ease(c / run)
        dir = 1
        jarsOn = true
      } else if (c < run + DOCK) {
        s = DOCK_S
        dir = 1
        jarsOn = c < run + DOCK / 2
      } else if (c < 2 * run + DOCK) {
        s = DOCK_S - (DOCK_S - DOCK_N) * ease((c - run - DOCK) / run)
        dir = -1
        jarsOn = false
      } else {
        s = DOCK_N
        dir = -1
        jarsOn = c > 2 * run + DOCK * 1.5
      }
      if (st.hide > 0.01) s = s + (DOCK_N - 0.06 + k * 0.025 - s) * st.hide
      const p = bank(s, o.v)
      const x = p.x
      const y = p.y
      const yaw = yawOf(p.tx * dir, p.ty * dir)
      const roll = Math.sin(t * 1.3 + k * 2) * 0.06
      const bob = 4 + Math.sin(t * 1.7 + k) * 3
      stand(hulls, k, x, y, o.size, yaw, roll, bob)
      hulls.getMatrixAt(k, hull)
      if (jarsOn) {
        jars.setMatrixAt(k, hull)
        hide(barrels, k)
      } else {
        barrels.setMatrixAt(k, hull)
        hide(jars, k)
      }
      v3.set(0.3, 0.36, 0).applyMatrix4(hull)
      const sway = Math.sin(t * 2.2 + k * 1.7)
      stand(men, k, v3.x, -v3.y, o.size, 0, sway * 0.12, v3.z)
      v3.set(-0.36, 1.55, 0).applyMatrix4(hull)
      stand(stars, k, v3.x, -v3.y, o.size * 0.32, Math.sin(t * 0.8 + k) * 0.6, 0, v3.z)
      const tw = 0.85 + 0.15 * Math.sin(t * 5 + k * 3)
      flat(halos, LAMPS + 1 + k, v3.x, -v3.y, v3.z + 20, o.size * 1.4 * tw * (0.5 + 0.5 * h))
      halos.setColorAt(LAMPS + 1 + k, PALE)
    })

    const pulse = 1 + 0.12 * Math.sin(t * 1.4) + (1 - h) * (0.8 + 0.5 * Math.sin(t * 6))
    flat(halos, HALOS - 1, moon.x, moon.y, moon.z + 30, moon.size * pulse)
    halos.setColorAt(HALOS - 1, tint.copy(BEACON).multiplyScalar(0.32 + (1 - h) * 0.7))

    done(flames, halos, hulls, men, jars, barrels, stars, folk, wand, pip, puffs)
  })

  const solid = <meshStandardMaterial vertexColors flatShading roughness={0.75} />
  return (
    <group>
      <instancedMesh ref={postsRef} args={[geo.post, undefined, LAMPS]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={flamesRef} args={[geo.flame, undefined, LAMPS]} frustumCulled={false} renderOrder={46}>
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={hullsRef} args={[geo.hull, undefined, BOATS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} emissive="#4a3d10" />
      </instancedMesh>
      <instancedMesh ref={jarsRef} args={[geo.jars, undefined, BOATS.length]} frustumCulled={false}>
        <meshBasicMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={barrelsRef} args={[geo.barrels, undefined, BOATS.length]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={menRef} args={[geo.man, undefined, BOATS.length]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={starsRef} args={[geo.star, undefined, BOATS.length]} frustumCulled={false}>
        <meshBasicMaterial color="#ffe58f" />
      </instancedMesh>
      <instancedMesh ref={folkRef} args={[geo.keeper, undefined, 1]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={wandRef} args={[geo.wand, undefined, 1]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={pipRef} args={[geo.pip, undefined, 1]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={puffsRef} args={[geo.puff, undefined, PUFFS]} frustumCulled={false}>
        <meshStandardMaterial color="#c9c0d8" flatShading transparent opacity={0.8} />
      </instancedMesh>
      <instancedMesh ref={halosRef} args={[geo.halo, undefined, HALOS]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial map={tex} transparent depthWrite={false} depthTest={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  )
}
