'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { Stand } from '../../stand'
import { barrelParts, canvasParts, shellParts, snailParts, wagonParts } from './build'
import { C, folk, heading, merged, part, place, rand, type Pt } from './kit'
import { nearest, ROAD, TOLL } from './map'

const N = 7
const GAP = 270
const LAT = -18
const STOP = 160
const CANVAS = ['#fff3dc', '#ffe0e6', '#dff7ef', '#efe4ff', '#fff3dc', '#fde2c4', '#e4f1ff']
const SHELL = ['#c9b6f2', '#ffb8a6', '#9fe3cf', '#ffd98a', '#f2a7d0', '#b8d4ff', '#d8c49a']
const S_TOLL = nearest(-360, 400)

const o = new THREE.Object3D()
const m = new THREE.Matrix4()
const local = new THREE.Matrix4()
const qn = new THREE.Quaternion()
const v = new THREE.Vector3()
const sv = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const pt: Pt = { x: 0, y: 0, dx: 0, dy: 0 }
const col = new THREE.Color()
const BOOTH = new THREE.Vector3()

function barrier() {
  const p: THREE.BufferGeometry[] = []
  for (let i = 0; i < 10; i++) p.push(part(new THREE.BoxGeometry(26, 8, 8), i % 2 ? C.white : C.red, -13 - i * 26, 0, 0))
  p.push(part(new THREE.BoxGeometry(26, 18, 14), C.ink, 16, 0, 0))
  p.push(part(new THREE.SphereGeometry(6, 6, 4), '#ffd36b', -262, 0, 0))
  return merged(p)
}

function courier() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.TorusGeometry(15, 3.5, 5, 14), C.ink, 0, 15, 0))
  p.push(part(new THREE.CylinderGeometry(2, 2, 30, 4), C.ink, 0, 34, 0))
  folk(p, 0, 46, 0, 13)
  p.push(part(new THREE.BoxGeometry(20, 16, 10), C.teal, -12, 58, -12))
  p.push(part(new THREE.BoxGeometry(26, 4, 6), C.red, -20, 76, 0))
  p.push(part(new THREE.ConeGeometry(11, 10, 6), C.red, 0, 78, 0))
  return merged(p)
}

type Car = { s: number; v: number; max: number; ph: number }

export function Traffic({ clock, fear, reduced }: { clock: RefObject<number>; fear: RefObject<number>; reduced: boolean }) {
  const geos = useMemo(() => {
    const w: THREE.BufferGeometry[] = []
    wagonParts(w)
    const c: THREE.BufferGeometry[] = []
    canvasParts(c)
    const s: THREE.BufferGeometry[] = []
    snailParts(s, false)
    const h: THREE.BufferGeometry[] = []
    shellParts(h)
    const k: THREE.BufferGeometry[] = []
    barrelParts(k, 0, -9, 0, 9)
    return { wagon: merged(w), canvas: merged(c), snail: merged(s), shell: merged(h), barrier: barrier(), courier: courier(), coin: new THREE.CylinderGeometry(9, 9, 3, 10).rotateX(Math.PI / 2) }
  }, [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const st = useRef<{ cars: Car[]; paid: number; t: number; open: number; coin: number; payer: number; cs: number; cwait: number } | null>(null)
  const wagons = useRef<THREE.InstancedMesh>(null)
  const canvases = useRef<THREE.InstancedMesh>(null)
  const snails = useRef<THREE.InstancedMesh>(null)
  const shells = useRef<THREE.InstancedMesh>(null)
  const arm = useRef<THREE.Group>(null)
  const coin = useRef<THREE.Mesh>(null)
  const runner = useRef<THREE.Mesh>(null)

  useEffect(() => {
    for (let i = 0; i < N; i++) {
      canvases.current?.setColorAt(i, col.set(CANVAS[i]))
      shells.current?.setColorAt(i, col.set(SHELL[i]))
    }
    for (const x of [canvases.current, shells.current]) if (x?.instanceColor) x.instanceColor.needsUpdate = true
  }, [])

  useFrame((_, dt) => {
    if (!st.current) {
      const r = rand(21)
      const cars = Array.from({ length: N }, (_, i) => ({ s: 300 + i * ((ROAD.length - 300) / N), v: 0, max: 30 + r() * 16, ph: r() * 9 }))
      st.current = { cars, paid: -1, t: 0, open: 0, coin: -1, payer: -1, cs: ROAD.length, cwait: 0 }
      place(o, TOLL.x, TOLL.y, 1)
      BOOTH.set(0, 72, 44).applyMatrix4(o.matrix)
    }
    const S = st.current
    const f = fear.current
    const step = Math.min(dt, 0.1) * (reduced ? 0.08 : 1)
    const t = clock.current
    const L = ROAD.length
    const rush = 1 + f * 2.2
    const cars = S.cars
    for (let i = 0; i < N; i++) {
      const c = cars[i]
      const ahead = cars[(i + N - 1) % N]
      let limit = -Infinity
      const gap = (c.s - ahead.s + L) % L
      if (gap < L / 2) limit = c.s - (gap - GAP)
      if (f < 0.3 && S.paid !== i && c.s > S_TOLL + 20 && c.s - S_TOLL < 500) limit = Math.max(limit, S_TOLL + STOP)
      const want = Math.max(0, Math.min(c.max * rush, (c.s - limit) * 1.2))
      c.v += (want - c.v) * Math.min(1, step * 2.5)
      c.s -= c.v * step
      if (c.s < -60) c.s += L + 120
      if (S.payer < 0 && S.paid < 0 && f < 0.3 && c.s > S_TOLL && c.s < S_TOLL + STOP + 6 && c.v < 4) {
        S.payer = i
        S.coin = 0
      }
      if (S.paid === i && c.s < S_TOLL - 100) S.paid = -1
    }
    if (S.coin >= 0) {
      S.coin += step / 1.3
      if (S.coin >= 1) {
        S.coin = -1
        S.paid = S.payer
        S.payer = -1
      }
    }
    const up = f >= 0.3 || S.paid >= 0
    S.open += ((up ? 1 : 0) - S.open) * Math.min(1, step * 4)
    if (arm.current) arm.current.rotation.z = -S.open * 1.35

    for (let i = 0; i < N; i++) {
      const c = cars[i]
      ROAD.at(c.s, pt)
      const turn = heading(-pt.dx, -pt.dy)
      const grow = Math.min(1, Math.max(0, Math.min(c.s + 60, L + 60 - c.s) / 160))
      place(o, pt.x - pt.dy * LAT, pt.y + pt.dx * LAT, grow, turn)
      const bob = Math.sin(t * 6 + c.ph) * Math.min(1, c.v / 10) * 1.2
      o.position.y += bob
      o.updateMatrix()
      wagons.current?.setMatrixAt(i, o.matrix)
      canvases.current?.setMatrixAt(i, o.matrix)
      const crawl = Math.sin(t * 3.2 + c.ph) * 0.09 * Math.min(1, c.v / 8) + f * 0.12
      local.compose(v.set(98 + crawl * 30, 0, 0), qn.identity(), sv.set(1 + crawl, 1 - crawl * 0.5, 1))
      m.multiplyMatrices(o.matrix, local)
      snails.current?.setMatrixAt(i, m)
      local.compose(v.set(98 + crawl * 12, Math.abs(Math.sin(t * 3.2 + c.ph)) * 2, 0), qn.identity(), sv.set(1, 1, 1))
      m.multiplyMatrices(o.matrix, local)
      shells.current?.setMatrixAt(i, m)
      if (S.payer === i && coin.current) {
        a.set(56, 70, 0).applyMatrix4(o.matrix)
        b.copy(BOOTH)
        const k = Math.max(0, S.coin)
        coin.current.position.lerpVectors(a, b, k)
        coin.current.position.y += Math.sin(k * Math.PI) * 90
        coin.current.rotation.y = k * 14
      }
    }
    if (coin.current) coin.current.visible = S.coin >= 0
    for (const x of [wagons.current, canvases.current, snails.current, shells.current]) if (x) x.instanceMatrix.needsUpdate = true

    if (runner.current) {
      if (S.cwait > 0) S.cwait -= step
      else S.cs -= step * (240 + f * 200)
      if (S.cs < -80) {
        S.cs = L + 80
        S.cwait = 6 + (t % 5)
      }
      ROAD.at(S.cs, pt)
      const weave = 52 + Math.sin(t * 2.3) * 14
      const duck = Math.max(0, 1 - Math.abs(S.cs - S_TOLL) / 60) * (1 - S.open)
      const grow = Math.min(1, Math.max(0, Math.min(S.cs + 60, L + 60 - S.cs) / 120))
      place(runner.current, pt.x + pt.dy * weave, pt.y - pt.dx * weave, grow, heading(-pt.dx, -pt.dy))
      runner.current.scale.y = grow * (1 - duck * 0.45)
      runner.current.position.y += Math.abs(Math.sin(t * 14)) * 3
    }
  })

  return (
    <group>
      <instancedMesh ref={wagons} args={[geos.wagon, undefined, N]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={canvases} args={[geos.canvas, undefined, N]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.9} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={snails} args={[geos.snail, undefined, N]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={shells} args={[geos.shell, undefined, N]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.35} />
      </instancedMesh>
      <Stand at={[TOLL.x, TOLL.y]} size={1}>
        <group ref={arm} position={[-40, 40, 10]}>
          <mesh geometry={geos.barrier}>
            <meshStandardMaterial vertexColors roughness={0.6} />
          </mesh>
        </group>
      </Stand>
      <mesh ref={coin} geometry={geos.coin} visible={false}>
        <meshBasicMaterial color="#ffd36b" toneMapped={false} />
      </mesh>
      <mesh ref={runner} geometry={geos.courier} matrixAutoUpdate>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </mesh>
    </group>
  )
}
