'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { giantShape } from './giants'
import { CORAL, GOLD, MINT, rng, stand, TEAL, TILT, UP_Y, UP_Z, WHITE } from './kit'
import { DETAIL, type LiveRef } from './live'
import { along, BATH, FANS, GIANT_AT, LENGTH, LOOP, MARCHERS, PLAZA, SPRING, type Spot } from './plan'
import { confettiShape, flagShape, folkShape, helmetShape, tubaShape } from './shapes'

const SPEED = 46
const GIANT = 150
const M = MARCHERS.length
const F = FANS.length
const BATHERS = (() => {
  const r = rng(11)
  const [ax, ay, bx, by] = BATH
  const out = Array.from({ length: 7 }, (_, k) => {
    const t = 0.12 + (k / 6) * 0.76
    return { x: ax + (bx - ax) * t + (r() - 0.5) * 50, y: ay + (by - ay) * t + (r() - 0.5) * 60, phase: r() * 6 }
  })
  out.push({ x: SPRING[0] - 10, y: SPRING[1] + 5, phase: 2 })
  return out
})()
const COUNT = M + F + BATHERS.length
const HELMETS = MARCHERS.flatMap((m, k) => (m.kind === 'recruit' || m.kind === 'drum' ? [k] : []))
const FLAGS = MARCHERS.flatMap((m, k) => ((m.kind === 'recruit' && m.lat !== 0) || m.kind === 'drum' ? [k] : []))
const TUBAS = MARCHERS.flatMap((m, k) => (m.kind === 'band' ? [k] : []))
const TINTS = ['#ffffff', '#e4dcff', '#ffd9e8', '#d9f5ff', '#fff1d0'].map((c) => new THREE.Color(c))
const SPARKS = 150
const PAPER = [CORAL, TEAL, GOLD, MINT, '#ff8fb0', WHITE, '#b48be0'].map((c) => new THREE.Color(c))
const SHOWER = (() => {
  const r = rng(23)
  return Array.from({ length: SPARKS }, () => {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * (PLAZA.r + 60)
    return { x: PLAZA.x + Math.cos(a) * d, y: PLAZA.y + Math.sin(a) * d, phase: r() * 400, spin: 2 + r() * 4, c: Math.floor(r() * PAPER.length) }
  })
})()

const m = new THREE.Matrix4()
const zero = new THREE.Matrix4().makeScale(0, 0, 0)
const e = new THREE.Euler()
const o: Spot = { x: 0, y: 0, tx: 0, ty: 0 }

const fade = (s: number) => Math.max(0, Math.min(1, s / 70, (LENGTH - s) / 70))

export function Parade({ live }: { live: LiveRef }) {
  const folk = useMemo(() => folkShape(), [])
  const helmet = useMemo(() => helmetShape(), [])
  const flag = useMemo(() => flagShape(), [])
  const tuba = useMemo(() => tubaShape(), [])
  const paper = useMemo(() => confettiShape(), [])
  const giants = useMemo(() => [0, 1, 2, 3].map(giantShape), [])
  useEffect(() => () => [folk, helmet, flag, tuba, paper, ...giants].forEach((g) => g.dispose()), [folk, helmet, flag, tuba, paper, giants])
  const crowd = useRef<THREE.InstancedMesh>(null)
  const helmets = useRef<THREE.InstancedMesh>(null)
  const flags = useRef<THREE.InstancedMesh>(null)
  const tubas = useRef<THREE.InstancedMesh>(null)
  const sparks = useRef<THREE.InstancedMesh>(null)
  const tall = useRef<(THREE.Mesh | null)[]>([])
  const lead = useRef(2550)
  const where = useRef(new Float32Array(8))

  useLayoutEffect(() => {
    const c = crowd.current
    const p = sparks.current
    if (!c || !p) return
    for (let k = 0; k < COUNT; k++) c.setColorAt(k, k < M ? TINTS[0] : TINTS[k % TINTS.length])
    SHOWER.forEach((s, k) => p.setColorAt(k, PAPER[s.c]))
    for (const mesh of [c, p]) if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  useFrame(() => {
    const { t, dt, alarm, zoom } = live.current
    const c = crowd.current
    const hel = helmets.current
    const fl = flags.current
    const tu = tubas.current
    const sp = sparks.current
    if (!c || !hel || !fl || !tu || !sp) return
    lead.current = (lead.current + dt * SPEED * (1 + alarm * 2.5)) % LOOP
    const head = lead.current
    const gx = where.current
    tall.current.forEach((g, k) => {
      if (!g) return
      const s = head - GIANT_AT[k]
      const f = fade(s)
      g.visible = f > 0
      gx[k * 2] = 1e5
      if (!f) return
      along(s, o)
      gx[k * 2] = o.x
      gx[k * 2 + 1] = o.y
      const d = Math.hypot(o.x - PLAZA.x, o.y - PLAZA.y)
      const twirl = d < 190 ? (1 - d / 190) * Math.PI * 2 * (k % 2 ? -1 : 1) : 0
      const hop = Math.abs(Math.sin(t * 4.2 + k * 1.3)) * 9
      g.position.set(o.x, -o.y + hop * UP_Y, hop * UP_Z)
      g.quaternion.setFromEuler(e.set(0, twirl + Math.sin(t * 1.1 + k) * 0.25, Math.sin(t * 2.1 + k * 2) * 0.07)).premultiply(TILT)
      g.scale.setScalar(GIANT * f)
    })
    const detail = zoom >= DETAIL
    for (const mesh of [c, hel, fl, tu]) mesh.visible = detail
    sp.visible = detail && alarm < 0.5
    if (!detail) return
    MARCHERS.forEach((w, k) => {
      let s = head - w.o
      let lat = w.lat
      if (w.kind === 'kid') {
        s += Math.sin(t * 0.9 + w.phase) * 90
        lat = lat * (0.6 + 0.5 * Math.sin(t * 1.6 + w.phase))
      }
      const f = fade(s)
      if (!f) {
        c.setMatrixAt(k, zero)
        return
      }
      along(s, o)
      const step = t * (w.kind === 'kid' ? 11 : 7) + w.phase
      const hop = Math.abs(Math.sin(step)) * (w.kind === 'drum' ? 10 : 5)
      const x = o.x - o.ty * lat
      const y = o.y + o.tx * lat
      c.setMatrixAt(k, stand(m, x, y - hop * UP_Y, hop * UP_Z, w.s * f, w.s * f, w.s * f, 0, Math.sin(step) * 0.14))
    })
    FANS.forEach((n, k) => {
      let near = 0
      for (let g = 0; g < 4; g++) near = Math.max(near, 1 - Math.hypot(gx[g * 2] - n.x, gx[g * 2 + 1] - n.y) / 420)
      const step = t * (6 + n.tint * 5) + n.phase
      const hop = Math.abs(Math.sin(step)) * (2 + near * 16)
      const v = n.s * (1 - alarm)
      c.setMatrixAt(M + k, stand(m, n.x, n.y - hop * UP_Y, hop * UP_Z, v, v, v, 0, Math.sin(step * 0.5) * (0.05 + near * 0.2)))
    })
    BATHERS.forEach((b, k) => {
      const bob = Math.sin(t * 1.3 + b.phase) * 3
      c.setMatrixAt(M + F + k, stand(m, b.x, b.y - bob, 0, 26, 26, 26, 0, Math.sin(t * 0.7 + b.phase) * 0.2))
    })
    const copy = (mesh: THREE.InstancedMesh, list: number[]) => {
      list.forEach((i, k) => {
        c.getMatrixAt(i, m)
        mesh.setMatrixAt(k, m)
      })
      mesh.instanceMatrix.needsUpdate = true
    }
    copy(hel, HELMETS)
    copy(fl, FLAGS)
    copy(tu, TUBAS)
    c.instanceMatrix.needsUpdate = true
    if (!sp.visible) return
    SHOWER.forEach((p, k) => {
      const h = 340 - ((t * 55 + p.phase) % 340)
      const x = p.x + Math.sin(t * 1.3 + p.phase) * 18
      sp.setMatrixAt(k, stand(m, x, p.y - h * UP_Y, h * UP_Z + 4, 11, 11, 11, t * p.spin, t * p.spin * 0.7))
    })
    sp.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={crowd} args={[folk, undefined, COUNT]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={helmets} args={[helmet, undefined, HELMETS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={flags} args={[flag, undefined, FLAGS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={tubas} args={[tuba, undefined, TUBAS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading metalness={0.3} roughness={0.4} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={sparks} args={[paper, undefined, SPARKS]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
      {giants.map((g, k) => (
        <mesh
          key={k}
          ref={(el) => {
            tall.current[k] = el
          }}
          geometry={g}
          visible={false}
        >
          <meshStandardMaterial vertexColors flatShading roughness={0.75} />
        </mesh>
      ))}
    </group>
  )
}
