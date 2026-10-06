'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { cargo, cart, folk, PQ, upright } from './kit'
import { stack, wheel } from './props'
import { CHECK, PYRES, rand, REST, road, roadU, signal, smooth, type Mood } from './plan'

const v = new THREE.Vector3()
const q = new THREE.Quaternion()
const s = new THREE.Vector3()
const m = new THREE.Matrix4()
const UPV = new THREE.Vector3(0, 1, 0).applyQuaternion(PQ)
const pt = { x: 0, y: 0, dx: 0, dy: 0 }

const CARTS = 16
const LEN = 5600
const TINTS = ['#ffffff', '#ffe2ec', '#e2fff6', '#fff1cf', '#e8e0ff'].map((x) => new THREE.Color(x))
const FOLK = CARTS + 1 + REST.length
const GRANDPA = CARTS
const U_CHECK = roadU(CHECK[0])
const U_GATE = roadU(1300)
const EXIT = { x: -2500, y: -330 }

type Ref = { mood: RefObject<Mood>; reduced: boolean }

export function Carts({ mood, reduced }: Ref) {
  const cartGeo = useMemo(() => cart(), [])
  const loadGeo = useMemo(() => cargo(), [])
  const folkGeo = useMemo(() => folk(), [])
  const stackGeo = useMemo(() => stack(), [])
  const cheeseGeo = useMemo(() => wheel(), [])
  useEffect(() => () => [cartGeo, loadGeo, folkGeo, stackGeo, cheeseGeo].forEach((g) => g.dispose()), [cartGeo, loadGeo, folkGeo, stackGeo, cheeseGeo])
  const carts = useRef<THREE.InstancedMesh>(null)
  const loads = useRef<THREE.InstancedMesh>(null)
  const folks = useRef<THREE.InstancedMesh>(null)
  const tall = useRef<THREE.Mesh>(null)
  const cheese = useRef<THREE.Mesh>(null)
  const dist = useRef(Float32Array.from({ length: CARTS }, (_, k) => (k / CARTS + rand(k) * 0.03) * LEN))
  const shown = useRef(new Float32Array(CARTS))
  const pa = useRef({ d: 0 })

  useFrame((state, dt) => {
    const a = carts.current
    const b = loads.current
    const f = folks.current
    const tl = tall.current
    const ch = cheese.current
    if (!a || !b || !f || !tl || !ch) return
    const step = Math.min(dt, 0.1) * (reduced ? 0.05 : 1)
    const t = reduced ? state.clock.elapsedTime * 0.05 : state.clock.elapsedTime
    const { alarm, stand } = mood.current
    const active = 7 + 9 * alarm
    const rush = 1 + alarm * 1.6
    let gate = 0
    for (let k = 0; k < CARTS; k++) {
      const pace = (0.8 + rand(k + 2) * 0.4) * rush
      dist.current[k] += step * 58 * pace
      const u = (dist.current[k] / LEN) % 1
      const want = k < active && stand < 0.9 ? 1 : 0
      shown.current[k] += (want - shown.current[k]) * Math.min(1, step * 0.8)
      const edge = smooth(0, 0.03, u) * (1 - smooth(0.96, 1, u))
      const sc = shown.current[k] * edge
      road(u, pt)
      if (sc > 0.5 && pt.x > CHECK[0] - 60 && pt.x < CHECK[0] + 330) gate = 1
      const turn = Math.atan2(-pt.dy, pt.dx)
      const bump = Math.abs(Math.sin(t * 7 * pace + k)) * 4
      const roll = Math.sin(t * 5 * pace + k) * 0.06
      const side = (rand(k + 7) - 0.5) * 40
      const nx = -pt.dy
      const ny = pt.dx
      const cx = pt.x + nx * side
      const cy = pt.y + ny * side
      upright(q, turn, roll)
      v.set(cx, -cy, 0).addScaledVector(UPV, bump * 0.4)
      m.compose(v, q, s.setScalar(21 * sc))
      a.setMatrixAt(k, m)
      b.setMatrixAt(k, m)
      b.setColorAt(k, TINTS[k % TINTS.length])
      if (k === 0) tl.matrix.copy(m).multiply(m.makeRotationZ(Math.sin(t * 3.1) * 0.12 + roll))
      upright(q, Math.atan2(pt.dx, pt.dy) * 0.55 - Math.PI * 0.05, Math.sin(t * 7 * pace + k) * 0.12)
      v.set(cx + pt.dx * 112, -(cy + pt.dy * 112), 0).addScaledVector(UPV, bump * 2.2)
      f.setMatrixAt(k, m.compose(v, q, s.setScalar(18 * sc)))
    }
    tl.matrixWorldNeedsUpdate = true
    signal.gate = gate

    const g = pa.current
    const flee = smooth(0.2, 0.35, alarm)
    g.d += step * (0.012 + flee * 0.02)
    const cyc = g.d % 1
    let u = U_CHECK
    let carry = false
    let look = 0
    if (flee > 0.5) u = U_CHECK + 0.5 * ((g.d * 2) % 1)
    else if (cyc < 0.42) u = U_CHECK + (U_GATE - U_CHECK) * smooth(0, 0.42, cyc)
    else if (cyc < 0.55) {
      u = U_GATE
      look = Math.sin(cyc * 90)
      carry = cyc > 0.5
    } else {
      u = U_GATE + (U_CHECK - U_GATE) * smooth(0.55, 1, cyc)
      carry = true
    }
    road(u, pt)
    const back = cyc < 0.42 && flee < 0.5
    const gx = pt.x - pt.dy * 70
    const gy = pt.y + pt.dx * 70
    const walking = (cyc < 0.42 || cyc > 0.55) && cyc < 0.99
    upright(q, back ? Math.atan2(-pt.dx, -pt.dy) * 0.5 : Math.atan2(pt.dx, pt.dy) * 0.5 + look * 0.8, Math.sin(t * 9) * 0.1)
    v.set(gx, -gy, 0).addScaledVector(UPV, walking ? Math.abs(Math.sin(t * (flee > 0.5 ? 16 : 6))) * 7 : 0)
    f.setMatrixAt(GRANDPA, m.compose(v, q, s.setScalar(17)))
    v.addScaledVector(UPV, 48 + Math.sin(t * 6) * 2)
    q.copy(PQ)
    ch.position.copy(v)
    ch.quaternion.copy(q)
    ch.scale.setScalar(carry || flee > 0.5 ? 16 : 0.001)

    REST.forEach((r, j) => {
      const fire = j < 4 ? PYRES[2] : PYRES[3]
      const go = smooth(0.35 + j * 0.06, 0.65 + j * 0.06, alarm)
      const x = r[0] + (EXIT.x - r[0]) * go
      const y = r[1] + (EXIT.y - r[1]) * go
      const turn = go > 0.02 ? Math.atan2(EXIT.x - r[0], EXIT.y - r[1]) * 0.5 : Math.atan2(fire[0] - r[0], fire[1] - r[1]) * 0.6
      const chat = Math.max(0, Math.sin(t * (1.5 + rand(j) * 2) + j * 2)) * 6
      upright(q, turn, Math.sin(t * 1.1 + j) * 0.08)
      v.set(x, -y, 0).addScaledVector(UPV, go > 0.02 && go < 0.98 ? Math.abs(Math.sin(t * 12 + j)) * 10 : chat)
      const sc = 17 * (1 - smooth(0.9, 1, go))
      f.setMatrixAt(CARTS + 1 + j, m.compose(v, q, s.setScalar(sc)))
    })
    for (const x of [a, b, f]) x.instanceMatrix.needsUpdate = true
    if (b.instanceColor) b.instanceColor.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={carts} args={[cartGeo, undefined, CARTS]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={loads} args={[loadGeo, undefined, CARTS]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={folks} args={[folkGeo, undefined, FOLK]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <mesh ref={tall} geometry={stackGeo} matrixAutoUpdate={false} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
      <mesh ref={cheese} geometry={cheeseGeo} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </mesh>
    </group>
  )
}
