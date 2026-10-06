'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { flame, halo, PQ } from './kit'
import { BRAZIERS, LAUNCHER, PYRES, rand, smooth, type Mood } from './plan'
import { chute } from './props'

const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const col = new THREE.Color()
const FLAT = new THREE.Quaternion()
const UPV = new THREE.Vector3(0, 1, 0).applyQuaternion(PQ)
const GOLDEN = new THREE.Color('#ffc247')
const RED = new THREE.Color('#ff4a12')
const ASH = new THREE.Color('#b9a9c4')
const FIRE = new THREE.Color('#ff8a2a')
const WASH = new THREE.Color('#ff6a1a')
const BLACK = new THREE.Color('#000000')

const F = 8
const SP = 14
const G = -800
const RELAY = [0, 2, 1, 3, 4]
const PUFFS = 6
const FLAMES = PYRES.length + BRAZIERS.length
const HALOS = F + FLAMES + 1
const MOUTH = { x: LAUNCHER[0] + 55, y: -LAUNCHER[1] + 110 }

type Flare = { born: number; vx: number; vy: number; x: number; y: number; dud: boolean; hot: number; seed: number }
type Ref = { mood: RefObject<Mood>; reduced: boolean }

const hide = (mesh: THREE.InstancedMesh, i: number) => mesh.setMatrixAt(i, m.makeScale(0, 0, 0))

export function Sky({ mood, reduced }: Ref) {
  const map = useMemo(() => halo(), [])
  const fireGeo = useMemo(() => flame(), [])
  const chuteGeo = useMemo(() => chute(), [])
  useEffect(() => () => [map, fireGeo, chuteGeo].forEach((x) => x.dispose()), [map, fireGeo, chuteGeo])
  const halos = useRef<THREE.InstancedMesh>(null)
  const flames = useRef<THREE.InstancedMesh>(null)
  const smoke = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const chutes = useRef<THREE.InstancedMesh>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const pool = useRef<Flare[]>(Array.from({ length: F }, (_, k) => ({ born: -99, vx: 0, vy: 0, x: 0, y: 0, dud: false, hot: 0, seed: k })))
  const clock = useRef({ t: 0, next: 2, n: 0 })

  useFrame((state, dt) => {
    const hl = halos.current
    const fl = flames.current
    const sm = smoke.current
    const hd = heads.current
    const ch = chutes.current
    const sp = sparks.current
    if (!hl || !fl || !sm || !hd || !ch || !sp) return
    const ck = clock.current
    ck.t += Math.min(dt, 0.1) * (reduced ? 0.05 : 1)
    const t = ck.t
    const { alarm, stand } = mood.current
    const lod = Math.min(2.2, Math.max(1, 0.13 / state.camera.zoom))

    if (t > ck.next) {
      const f = pool.current[ck.n++ % F]
      const r = rand(ck.n * 3.1)
      const hot = smooth(0.05, 0.3, alarm)
      const wall = hot > 0.5 && ck.n % 3 !== 0
      const b = BRAZIERS[Math.floor(rand(ck.n) * BRAZIERS.length)]
      f.born = t
      f.seed = ck.n
      f.hot = hot
      f.dud = hot < 0.5 && r < 0.3
      f.x = wall ? b[0] : MOUTH.x
      f.y = wall ? -b[1] + 80 : MOUTH.y
      f.vx = f.dud ? 40 : wall ? b[0] * 0.25 + (rand(ck.n + 1) - 0.3) * 300 : 150 + rand(ck.n + 2) * 300 + hot * 250
      f.vy = f.dud ? 620 : 1150 + rand(ck.n + 4) * 350 + hot * 350
      ck.next = t + (hot > 0.5 ? 0.45 + rand(ck.n) * 0.9 - stand * 0.3 : 6 + rand(ck.n + 6) * 6)
    }

    pool.current.forEach((f, i) => {
      const age = t - f.born
      const apex = f.vy / -G
      const tint = col.copy(GOLDEN).lerp(RED, f.hot)
      const big = 1 + f.hot * 0.5
      const ax = f.x + f.vx * apex
      const ay = f.y + f.vy * apex + 0.5 * G * apex * apex
      if (age > apex + 7 || (f.dud && age > apex * 2.2)) {
        hide(hd, i)
        hide(ch, i)
        hide(hl, i)
        for (let j = 0; j < SP; j++) hide(sp, i * SP + j)
        return
      }
      if (age < apex || f.dud) {
        const x = f.x + f.vx * age
        const y = f.y + f.vy * age + 0.5 * G * age * age
        v.set(x, y, 1400)
        hd.setMatrixAt(i, m.compose(v, FLAT, s.setScalar(13 * lod)))
        hd.setColorAt(i, tint)
        hide(ch, i)
        hl.setMatrixAt(i, m.compose(v.setZ(1390), FLAT, s.set(240 * lod, 240 * lod, 1)))
        hl.setColorAt(i, col.copy(tint).multiplyScalar(0.7))
        for (let j = 0; j < SP; j++) {
          const back = age - j * 0.035
          const puff = f.dud && age > apex && j < 5
          if (back < 0 || (j > 7 && !puff)) {
            hide(sp, i * SP + j)
            continue
          }
          const px = puff ? ax + Math.cos(j * 1.3) * (age - apex) * 90 : f.x + f.vx * back
          const py = puff ? ay + Math.sin(j * 1.3) * (age - apex) * 60 + (age - apex) * 30 : f.y + f.vy * back + 0.5 * G * back * back
          const r = puff ? 14 * (1 - (age - apex) / (apex * 1.2)) : (9 - j) * 1.3
          sp.setMatrixAt(i * SP + j, m.compose(v.set(px, py, 1380), FLAT, s.setScalar(Math.max(0, r) * lod)))
          sp.setColorAt(i * SP + j, puff ? ASH : tint)
        }
        return
      }
      const tau = age - apex
      const fade = 1 - smooth(5.5, 7, tau)
      const hx = ax + Math.sin(tau * 1.3 + f.seed) * 40
      const hy = ay - 55 * tau
      v.set(hx, hy, 1400)
      hd.setMatrixAt(i, m.compose(v, FLAT, s.setScalar(11 * lod * fade * (1 + Math.sin(tau * 25) * 0.15))))
      hd.setColorAt(i, tint)
      q.setFromEuler(e.set(0, 0, Math.sin(tau * 1.3 + f.seed) * 0.25)).premultiply(PQ)
      ch.setMatrixAt(i, m.compose(v.set(hx, hy + 6, 1410), q, s.setScalar(26 * fade)))
      const flash = Math.max(0, 1 - tau / 0.7)
      const r = (260 + flash * 620) * big * lod
      hl.setMatrixAt(i, m.compose(v.set(hx, hy, 1390), FLAT, s.set(r, r, 1)))
      hl.setColorAt(i, col.copy(tint).multiplyScalar((0.35 + flash * 0.5) * fade))
      for (let j = 0; j < SP; j++) {
        const a = ((j + rand(f.seed * 3 + j) * 0.8) / SP) * Math.PI * 2 + f.seed
        const sp0 = (260 + rand(f.seed * 7 + j) * 160) * big
        const life = tau / (1.3 + rand(f.seed + j * 5) * 0.9)
        if (life > 1) {
          hide(sp, i * SP + j)
          continue
        }
        const d = sp0 * tau * (1 - life * 0.45)
        v.set(ax + Math.cos(a) * d, ay + Math.sin(a) * d * 0.8 - 220 * tau * tau, 1385)
        sp.setMatrixAt(i * SP + j, m.compose(v, FLAT, s.setScalar(20 * (1 - life * 0.7) * big * lod)))
        sp.setColorAt(i * SP + j, col.copy(GOLDEN).lerp(RED, f.hot).lerp(BLACK, life * 0.3))
      }
    })

    const wave = (t * 0.6) % (RELAY.length + 2)
    PYRES.forEach((p, k) => {
      const idx = RELAY.indexOf(k)
      const lit = Math.max(k === 2 ? 0.7 : 0, smooth(0.06 + idx * 0.12, 0.12 + idx * 0.12, alarm))
      const boost = lit > 0.9 && alarm > 0.5 ? Math.exp(-((wave - idx) ** 2) * 2) : 0
      const flick = 1 + Math.sin(t * 11 + k * 2) * 0.1 + Math.sin(t * 6.3 + k) * 0.08
      const size = 62 * lit * (1 + boost * 0.5)
      v.set(p[0], -p[1], 0).addScaledVector(UPV, 95 * 0.95)
      q.setFromEuler(e.set(0, Math.sin(t * 0.9 + k) * 0.25, Math.sin(t * 3 + k) * 0.08)).premultiply(PQ)
      fl.setMatrixAt(k, m.compose(v, q, s.set(size, size * flick, size)))
      fl.setColorAt(k, col.set('#ffffff').lerp(FIRE, boost * 0.4))
      const glow = (300 + boost * 300) * lit * lod
      hl.setMatrixAt(F + k, m.compose(v.set(p[0], -p[1] + 140, 20), FLAT, s.set(glow, glow, 1)))
      hl.setColorAt(F + k, col.copy(FIRE).multiplyScalar(0.55 * flick))
      for (let j = 0; j < PUFFS; j++) {
        const life = (t * 0.17 + j / PUFFS + k * 0.37) % 1
        const sz = (26 + life * 110) * Math.sqrt(1 - life) * smooth(0.3, 0.9, lit)
        v.set(p[0] - life * 380 + Math.sin(life * 7 + j) * 30, -p[1] + 230 + life * 820, 900 + j)
        sm.setMatrixAt(k * PUFFS + j, m.compose(v, FLAT, s.set(sz, sz * 0.85, sz)))
      }
    })
    BRAZIERS.forEach((b, j) => {
      const i = PYRES.length + j
      const size = (14 + alarm * 20) * (1 + Math.sin(t * 13 + j * 3) * 0.12)
      v.set(b[0], -b[1], 0).addScaledVector(UPV, 55 * 1.35)
      q.setFromEuler(e.set(0, 0, Math.sin(t * 4 + j) * 0.1)).premultiply(PQ)
      fl.setMatrixAt(i, m.compose(v, q, s.set(size, size * (1.1 + alarm * 0.4), size)))
      fl.setColorAt(i, col.set('#ffffff'))
      const glow = (110 + alarm * 200) * lod
      hl.setMatrixAt(F + i, m.compose(v.set(b[0], -b[1] + 70, 20), FLAT, s.set(glow, glow, 1)))
      hl.setColorAt(F + i, col.copy(FIRE).multiplyScalar(0.3 + alarm * 0.4))
    })
    const pulse = alarm * (0.16 + 0.07 * Math.sin(t * 2.4))
    hl.setMatrixAt(HALOS - 1, m.compose(v.set(700, 450, 10), FLAT, s.set(4200, 4200, 1)))
    hl.setColorAt(HALOS - 1, col.copy(WASH).multiplyScalar(pulse))
    for (const x of [hl, fl, sm, hd, ch, sp]) {
      x.instanceMatrix.needsUpdate = true
      if (x.instanceColor) x.instanceColor.needsUpdate = true
    }
  })

  return (
    <group>
      <instancedMesh ref={halos} args={[undefined, undefined, HALOS]} frustumCulled={false} renderOrder={44}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={map} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={smoke} args={[undefined, undefined, PYRES.length * PUFFS]} frustumCulled={false} renderOrder={47}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#8a7894" transparent opacity={0.28} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={flames} args={[fireGeo, undefined, FLAMES]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={chutes} args={[chuteGeo, undefined, F]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={sparks} args={[undefined, undefined, F * SP]} frustumCulled={false} renderOrder={49}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, F]} frustumCulled={false} renderOrder={49}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
