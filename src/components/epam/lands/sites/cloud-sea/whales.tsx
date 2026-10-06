'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { flatAt, heading, pose } from './kit'
import { SHOAL } from './map'
import { puff, tail, whale } from './models'

const N = 18
const EVERY = 7.5

type Pod = { cx: number; cy: number; gx: number; gy: number; rx: number; ry: number; speed: number; phase: number; h: number; s: number; rider: boolean; beat: number }

const POD: Pod[] = [
  { cx: SHOAL[0], cy: SHOAL[1], gx: 750, gy: 250, rx: 1400, ry: 380, speed: 0.03, phase: 0, h: 480, s: 235, rider: true, beat: 0.9 },
  { cx: -500, cy: -1500, gx: -200, gy: -800, rx: 1250, ry: 300, speed: -0.024, phase: 2, h: 560, s: 220, rider: true, beat: 0.7 },
  { cx: SHOAL[0], cy: SHOAL[1], gx: 750, gy: 250, rx: 1400, ry: 380, speed: 0.03, phase: -0.22, h: 600, s: 110, rider: false, beat: 1.8 },
]
const RIDERS = POD.filter((w) => w.rider).length

type Spot = { x: number; y: number; h: number; a: number; bank: number; nod: number; flap: number }

const body = new THREE.Matrix4()
const local = new THREE.Matrix4()
const seed = new THREE.Vector3()
const spots: Spot[] = POD.map(() => ({ x: 0, y: 0, h: 0, a: 0, bank: 0, nod: 0, flap: 0 }))

function swim(w: Pod, t: number, fear: number, out: Spot) {
  const a = t * w.speed + w.phase
  const r = 1 - fear * 0.6
  const cx = w.cx + (w.gx - w.cx) * fear
  const cy = w.cy + (w.gy - w.cy) * fear
  out.x = cx + Math.cos(a) * w.rx * r
  out.y = cy + Math.sin(a) * w.ry * r
  out.a = heading(-Math.sin(a) * w.rx * Math.sign(w.speed), Math.cos(a) * w.ry * Math.sign(w.speed))
  out.h = w.h - fear * 160 + Math.sin(t * w.beat * 0.55) * 30
  out.nod = Math.sin(t * w.beat) * (w.rider ? 0.06 : 0.12)
  out.flap = Math.sin(t * w.beat + 1.2) * (w.rider ? 0.38 : 0.55)
  out.bank = 0.12
}

export function Whales({ clock, shade, alarm }: { clock: RefObject<number>; shade: THREE.Texture; alarm: RefObject<number> }) {
  const shapes = useMemo(() => ({ big: whale(true), small: whale(false), tail: tail(), puff: puff() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const big = useRef<THREE.InstancedMesh>(null)
  const small = useRef<THREE.InstancedMesh>(null)
  const tails = useRef<THREE.InstancedMesh>(null)
  const puffs = useRef<THREE.InstancedMesh>(null)
  const shadows = useRef<THREE.InstancedMesh>(null)
  const spout = useRef({ x: 0, y: 0, h: 0, at: -99, last: -1 })

  useFrame(() => {
    const t = clock.current
    const fear = alarm.current
    const tl = tails.current
    const fl = shadows.current
    const bg = big.current
    const sm = small.current
    if (!tl || !fl || !bg || !sm) return
    let riders = 0
    let calves = 0
    const sp = spout.current
    const beat = Math.floor(t / EVERY)
    POD.forEach((w, k) => {
      const at = spots[k]
      swim(w, t, fear, at)
      if (!w.rider) {
        const roll = (t % 26) / 26
        const wide = 1 + Math.sin(t * 0.21) * 0.15
        at.x += (at.x - w.cx - (w.gx - w.cx) * fear) * (wide - 1)
        at.h += Math.sin(t * 1.1) * 30
        at.bank = roll > 0.88 && fear < 0.3 ? ((roll - 0.88) / 0.12) * Math.PI * 2 : 0.15
      }
      body.copy(pose(at.x, at.y, at.h, w.s, at.a, at.bank, at.nod))
      if (w.rider) bg.setMatrixAt(riders++, body)
      else sm.setMatrixAt(calves++, body)
      local.makeRotationZ(at.flap).setPosition(-1.35, 0, 0)
      tl.setMatrixAt(k, local.premultiply(body))
      fl.setMatrixAt(k, flatAt(at.x, at.y, 3, w.s * 3.6, w.s * 1.5))
      if (k === beat % 2 && beat !== sp.last && fear < 0.5) {
        sp.last = beat
        seed.set(1.0, 0.85, 0).applyMatrix4(body)
        sp.x = seed.x
        sp.y = seed.y
        sp.h = seed.z
        sp.at = t
      }
    })
    for (const m of [tl, fl, bg, sm]) m.instanceMatrix.needsUpdate = true
    const pm = puffs.current
    if (!pm) return
    const age = t - sp.at
    for (let k = 0; k < N; k++) {
      const a = age - k * 0.07
      const live = a > 0 && a < 4.2
      const u = live ? a / 4.2 : 0
      const side = Math.sin(k * 2.4) * (30 + u * 120)
      const up = (1 - (1 - u) ** 3) * 280 * (0.7 + 0.3 * Math.cos(k * 1.7))
      const s = live ? (14 + 22 * Math.sin(Math.PI * Math.min(1, u * 1.4)) + (k % 3) * 4) * (1 - u * 0.6) : 0
      seed.set(sp.x + side, sp.y + up, sp.h + up * 0.3)
      local.makeScale(s, s, s).setPosition(seed)
      pm.setMatrixAt(k, local)
    }
    pm.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={shadows} args={[undefined, undefined, POD.length]} frustumCulled={false} renderOrder={41}>
        <planeGeometry />
        <meshBasicMaterial map={shade} transparent opacity={0.5} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={big} args={[shapes.big, undefined, RIDERS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={small} args={[shapes.small, undefined, POD.length - RIDERS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={tails} args={[shapes.tail, undefined, POD.length]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={puffs} args={[shapes.puff, undefined, N]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={1} emissive="#8c84b8" emissiveIntensity={0.4} flatShading />
      </instancedMesh>
    </group>
  )
}
