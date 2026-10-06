'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { barrelParts } from './build'
import { C, folk, heading, merged, part, place, rand, type Pt } from './kit'
import { INN, LANE, nearest, PADDOCK, ROAD, THUMB, WRECK } from './map'

const WALK = 9
const PORT = 3
const IDLE: [number, number, number][] = [
  [INN.x + 10, INN.y + 150, 0],
  [INN.x - 110, INN.y + 140, 0.4],
  [INN.x - 75, INN.y + 140, -0.3],
  [PADDOCK.x + 60, PADDOCK.y + 50, -0.6],
  [THUMB.x, THUMB.y, -0.5],
]
const ALL = WALK + PORT + IDLE.length + 1
const CHASE = ALL - 1
const S_WRECK = nearest(WRECK.x + 120, WRECK.y)

const o = new THREE.Object3D()
const pt: Pt = { x: 0, y: 0, dx: 0, dy: 0 }

function walker() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, 0, 14)
  p.push(part(new THREE.CylinderGeometry(1.5, 1.5, 44, 4).rotateZ(0.6), C.wood, -10, 40, -6))
  p.push(part(new THREE.SphereGeometry(8, 6, 5), C.teal, -22, 58, -6))
  return merged(p)
}

function reader() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, 0, 14)
  p.push(part(new THREE.BoxGeometry(46, 34, 1.5), '#fff3dc', 0, 26, 24))
  p.push(part(new THREE.TorusGeometry(10, 1.6, 4, 16), C.red, 0, 26, 25))
  p.push(part(new THREE.BoxGeometry(5, 5, 1), C.ink, 10, 26, 25.5))
  p.push(part(new THREE.ConeGeometry(14, 16, 8), '#ffb8a6', 0, 38, 0))
  return merged(p)
}

function wheel() {
  const p: THREE.BufferGeometry[] = [part(new THREE.TorusGeometry(15, 3, 5, 14), '#5a3424', 0, 0, 0)]
  for (let k = 0; k < 3; k++) p.push(part(new THREE.BoxGeometry(30, 2.5, 2.5).rotateZ((k * Math.PI) / 3), C.wood, 0, 0, 0))
  p.push(part(new THREE.CylinderGeometry(5, 5, 6, 6).rotateX(Math.PI / 2), C.band, 0, 0, 0))
  return merged(p)
}

function seeds() {
  const r = rand(77)
  return Array.from({ length: WALK }, (_, i) => ({ s: r() * ROAD.length, v: (18 + r() * 22) * (i % 3 ? -1 : 1), side: i % 2 ? 1 : -1, ph: r() * 9, k: 0.85 + r() * 0.3 }))
}

function chase(t: number, P: THREE.InstancedMesh, wheel: THREE.Mesh | null) {
  const cyc = (t % 16) / 16
  const roll = Math.min(cyc / 0.32, 1)
  const ease = 1 - (1 - roll) ** 2
  const ws = S_WRECK + ease * 620
  ROAD.at(ws, pt)
  const tip = cyc < 0.32 ? 0 : Math.min(1, (cyc - 0.32) / 0.05)
  const back = cyc > 0.45 ? (cyc - 0.45) / 0.55 : 0
  if (wheel) {
    if (back > 0) {
      const cs = ws - back * 620
      ROAD.at(cs, pt)
      place(wheel, pt.x + pt.dy * 70, pt.y - pt.dx * 70, 1, heading(-pt.dx, -pt.dy), 52)
      wheel.rotateX(1.2)
    } else {
      place(wheel, pt.x + pt.dy * 70, pt.y - pt.dx * 70, 1, heading(pt.dx, pt.dy), 15 * (1 - tip))
      wheel.rotateZ(-ease * 40)
      wheel.rotateX(tip * 1.45 + Math.sin(t * 9) * 0.12 * (1 - tip) * roll)
    }
  }
  const lag = Math.max(0, Math.min(1, (cyc - 0.04) / 0.42))
  const run = cyc > 0.45 ? ws - back * 620 : S_WRECK + (1 - (1 - lag) ** 1.4) * 600
  ROAD.at(run, pt)
  const dir = cyc > 0.45 ? -1 : 1
  place(o, pt.x + pt.dy * 70, pt.y - pt.dx * 70, 1, heading(pt.dx * dir, pt.dy * dir), Math.abs(Math.sin(t * (cyc > 0.45 ? 6 : 13))) * 7)
  P.setMatrixAt(CHASE, o.matrix)
}

export function Folk({ clock, fear, reduced }: { clock: RefObject<number>; fear: RefObject<number>; reduced: boolean }) {
  const geos = useMemo(() => {
    const k: THREE.BufferGeometry[] = []
    barrelParts(k, 0, -13, 0, 13, true)
    return { walker: walker(), reader: reader(), wheel: wheel(), barrel: merged(k).rotateY(Math.PI / 2) }
  }, [])
  useEffect(() => () => Object.values(geos).forEach((g) => g.dispose()), [geos])
  const seed = useMemo(() => seeds(), [])
  const st = useRef<{ walk: { s: number; v: number }[]; port: number[]; rs: number } | null>(null)
  const people = useRef<THREE.InstancedMesh>(null)
  const barrels = useRef<THREE.InstancedMesh>(null)
  const map = useRef<THREE.Mesh>(null)
  const rim = useRef<THREE.Mesh>(null)

  useFrame((_, dt) => {
    if (!st.current) st.current = { walk: seed.map((w) => ({ s: w.s, v: w.v })), port: [0, 0.33, 0.66], rs: 0 }
    const S = st.current
    const f = fear.current
    const step = Math.min(dt, 0.1) * (reduced ? 0.08 : 1)
    const t = clock.current
    const L = ROAD.length
    const P = people.current
    if (!P) return
    for (let i = 0; i < WALK; i++) {
      const w = S.walk[i]
      const d = seed[i]
      const v = f > 0.3 ? -Math.abs(d.v) * 2.4 : d.v
      w.s = (w.s + v * step + L) % L
      ROAD.at(w.s, pt)
      const off = d.side * (HALF_OFF + Math.sin(t * 0.7 + d.ph) * 6)
      const grow = Math.min(1, Math.min(w.s, L - w.s) / 150)
      const dir = v > 0 ? 1 : -1
      place(o, pt.x - pt.dy * off, pt.y + pt.dx * off, grow * d.k, heading(pt.dx * dir, pt.dy * dir), Math.abs(Math.sin(t * 7 * d.k + d.ph)) * 5)
      P.setMatrixAt(i, o.matrix)
    }
    for (let j = 0; j < PORT; j++) {
      S.port[j] = (S.port[j] + step * 0.022 * (1 + f)) % 1
      const s = LANE.length * (1 - S.port[j])
      LANE.at(s, pt)
      const grow = Math.min(1, Math.min(s, LANE.length - s) / 80)
      const roll = s / 13
      place(o, pt.x, pt.y, grow, heading(-pt.dx, -pt.dy), 13)
      o.rotateZ(roll)
      o.updateMatrix()
      barrels.current?.setMatrixAt(j, o.matrix)
      LANE.at(Math.min(LANE.length, s + 42), pt)
      place(o, pt.x, pt.y, grow, heading(-pt.dx, -pt.dy), Math.abs(Math.sin(t * 6 + j)) * 4)
      P.setMatrixAt(WALK + j, o.matrix)
    }
    IDLE.forEach(([x, y, turn], k) => {
      const hop = k === 4 ? Math.abs(Math.sin(t * 2.2)) * 10 : Math.max(0, Math.sin(t * 1.3 + k * 2)) * 5
      place(o, x, y, 1, turn + Math.sin(t * 0.9 + k) * 0.25, hop)
      if (f > 0.5 && k < 3) o.scale.setScalar(0.001)
      o.updateMatrix()
      P.setMatrixAt(WALK + PORT + k, o.matrix)
    })
    chase(t, P, rim.current)
    P.instanceMatrix.needsUpdate = true
    if (barrels.current) barrels.current.instanceMatrix.needsUpdate = true
    if (map.current) {
      S.rs = (S.rs + step * 26) % L
      ROAD.at(S.rs, pt)
      const grow = Math.min(1, Math.min(S.rs, L - S.rs) / 150)
      const stop = Math.sin(t * 0.5) > 0.7 ? 1 : 0
      place(map.current, pt.x + pt.dy * 40, pt.y - pt.dx * 40, grow, heading(pt.dx, pt.dy) + stop * Math.sin(t * 5) * 0.5, (1 - stop) * Math.abs(Math.sin(t * 6)) * 4)
    }
  })

  return (
    <group>
      <instancedMesh ref={people} args={[geos.walker, undefined, ALL]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={barrels} args={[geos.barrel, undefined, PORT]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </instancedMesh>
      <mesh ref={map} geometry={geos.reader}>
        <meshStandardMaterial vertexColors roughness={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rim} geometry={geos.wheel}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </mesh>
    </group>
  )
}

const HALF_OFF = 118
