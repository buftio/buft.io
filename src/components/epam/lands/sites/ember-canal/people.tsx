'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { bangGeometry, C, coinGeometry, folkGeometry, hatGeometry, ropeGeometry } from './geo'
import { bargeMatrix, GATES, type Mood, standQ } from './layout'
import { BOLLARD, CAMP, CAP_BOT, CAP_TOP, capAngle, cycle, FLEET, KEEPER, PITCH, smooth, TOW } from './map'

const FOLK = 14
const KID: [number, number] = [175, 30]
const HIDE: [number, number] = [255, -318]
const WATCH: [number, number][] = [
  [150, -50],
  [205, -78],
]
const HUDDLE: [number, number] = [10, 130]
const ROAST: [number, number, number][] = [
  [-70, 0, 10],
  [70, 0, 10],
]
const HATS: [string, number, number][] = [
  [C.brass, 1.15, 0.6],
  [C.brass, 1.15, 0.6],
  [C.char, 1, 2.1],
  [C.teal, 0.8, 0.5],
  [C.mint, 0.9, 0.7],
  [C.teal, 1, 1],
  ...Array.from({ length: 5 }, (): [string, number, number] => [C.ember, 0.9, 0.45]),
  [C.mint, 0.9, 1.3],
  [C.copper, 1, 0.5],
  [C.cream, 1.1, 1.5],
]

const m4 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const qz = new THREE.Quaternion()
const at = new THREE.Vector3()
const hat = new THREE.Vector3()
const size = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const coin = new THREE.Vector3()
const lift = new THREE.Vector3()
const lead = new THREE.Matrix4()
const CAPS = [CAP_TOP, CAP_BOT]
const lean = new Float32Array(FOLK)
const pos = Array.from({ length: FOLK }, () => new THREE.Vector3())
const Z = new THREE.Vector3(0, 0, 1)
const ZERO = new THREE.Vector3()
const ground = (out: THREE.Vector3, [x, y]: [number, number], h = 0) => out.set(x, -y, 0).add(lift.set(0, h, 0).applyQuaternion(PITCH))
const mix = (out: THREE.Vector3, p: [number, number], r: [number, number], f: number) => out.set(p[0] + (r[0] - p[0]) * f, -(p[1] + (r[1] - p[1]) * f), 0)
const hop = (out: THREE.Vector3, h: number) => out.add(lift.set(0, h, 0).applyQuaternion(PITCH))

export function People({ mood }: { mood: RefObject<Mood> }) {
  const shapes = useMemo(() => ({ folk: folkGeometry(), hat: hatGeometry(), bang: bangGeometry(false), ask: bangGeometry(true), coin: coinGeometry(), rope: ropeGeometry() }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const folk = useRef<THREE.InstancedMesh>(null)
  const hats = useRef<THREE.InstancedMesh>(null)
  const coins = useRef<THREE.Mesh>(null)
  const bangs = useRef<THREE.InstancedMesh>(null)
  const asks = useRef<THREE.Mesh>(null)
  const rope = useRef<THREE.Mesh>(null)

  useEffect(() => {
    const h = hats.current
    if (!h) return
    HATS.forEach(([col], k) => h.setColorAt(k, new THREE.Color(col)))
    if (h.instanceColor) h.instanceColor.needsUpdate = true
  }, [])

  useFrame((state) => {
    const big = Math.min(2.6, Math.max(1.5, 0.6 / state.camera.zoom))
    const m = mood.current
    const f = folk.current
    const h = hats.current
    const cn = coins.current
    const bg = bangs.current
    const ak = asks.current
    const rp = rope.current
    if (!m || !f || !h || !cn || !bg || !ak || !rp) return
    const t = m.now
    const alarm = 1 - m.calm
    const { c, p } = cycle(m.cyc)
    lean.fill(0)
    CAPS.forEach((cap, k) => {
      standQ(capAngle(k, c, p) + (k ? -0.35 : 0.35), q)
      pos[k].set(48, 0, 0).applyQuaternion(q).add(at.set(cap[0], -cap[1], 0))
      hop(pos[k], Math.abs(Math.sin(t * 6 + k)) * 3 * smooth(0.47, 0.5, p) * (1 - smooth(0.93, 0.96, p)))
    })
    bargeMatrix(((c % FLEET) + FLEET) % FLEET, c, p, m, lead)
    b.set(-8, 46, 18).applyMatrix4(lead)
    ground(a, KEEPER, 30)
    ground(pos[2], KEEPER)
    const argue = p < 0.42
    const hops = (p / 0.42) * 4
    const n = Math.floor(hops)
    if (argue) hop(pos[2], n % 2 ? 0 : Math.abs(Math.sin(t * 10)) * 8)
    let coinOn = 1
    let kidCarry = false
    if (argue) {
      const fr = hops - n
      coin.lerpVectors(n % 2 ? b : a, n % 2 ? a : b, fr)
      hop(coin, Math.sin(Math.PI * fr) * 55)
    } else if (p < 0.47) {
      const fr = ((p - 0.42) / 0.05) * 0.5
      coin.lerpVectors(a, b, fr)
      hop(coin, Math.sin(Math.PI * fr) * 55)
    } else if (p < 0.6) kidCarry = true
    else coinOn = 0
    const mid = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2
    if (p < 0.4) ground(pos[3], KID)
    else if (p < 0.47) {
      const fr = smooth(0.4, 0.47, p)
      pos[3].set(KID[0] + (mid - KID[0]) * fr, -KID[1] + (midY - 30 - -KID[1]) * fr, 0)
      hop(pos[3], smooth(0.44, 0.47, p) * 40)
    } else if (p < 0.6) {
      const fr = smooth(0.47, 0.58, p)
      pos[3].set(mid + (HIDE[0] - mid) * fr, midY - 30 + (-HIDE[1] - midY + 30) * fr, 0)
      hop(pos[3], (1 - smooth(0.47, 0.5, p)) * 40 + Math.abs(Math.sin(t * 22)) * 6)
    } else mix(pos[3], HIDE, KID, smooth(0.66, 0.95, p))
    if (kidCarry) coin.copy(pos[3]).add(lift.set(0, 44, 0).applyQuaternion(PITCH))
    WATCH.forEach((w, k) => {
      ground(pos[4 + k], w)
      hop(pos[4 + k], Math.abs(Math.sin(t * (2.2 + k * 0.7) + k)) * (p > 0.45 && p < 0.6 ? 12 : 3))
      lean[4 + k] = Math.sin(t * 1.4 + k) * 0.15
    })
    const stumble = Math.sin(Math.PI * smooth(0.55, 0.85, p)) * 22
    for (let k = 0; k < 5; k++) {
      const heave = Math.sin(t * 2.4 - k * 0.5)
      const d = k * TOW.step + 4 * heave - stumble * (1 - k * 0.12)
      pos[6 + k].set(TOW.from[0] + TOW.dir[0] * d, -(TOW.from[1] + TOW.dir[1] * d), 0)
      lean[6 + k] = -0.3 - 0.12 * heave + stumble * 0.02
    }
    ROAST.forEach(([x, y, z], k) => {
      pos[12 + k].set(x, y, z).applyQuaternion(PITCH).add(at.set(CAMP[0], -CAMP[1], 0))
      hop(pos[12 + k], Math.abs(Math.sin(t * (1.3 + k * 0.4) + k * 2)) * 2.5)
      lean[12 + k] = (k ? 0.12 : -0.12) + Math.sin(t * 0.8 + k) * 0.05
    })
    pos[11].set(0, 181, 6).applyMatrix4(GATES[0].matrix)
    hop(pos[11], Math.abs(Math.sin(t * (alarm > 0.3 ? 9 : 1.1))) * (alarm > 0.3 ? 14 : 2))
    for (let k = 2; k < 14; k++) {
      if (k === 11) continue
      if (alarm < 0.01) break
      ground(at, [HUDDLE[0] + ((k % 5) - 2) * 26, HUDDLE[1] + Math.floor(k / 5) * 18])
      pos[k].lerp(at, smooth(0, 0.6, alarm))
    }
    for (let k = 0; k < FOLK; k++) {
      q.copy(PITCH).multiply(qz.setFromAxisAngle(Z, lean[k]))
      f.setMatrixAt(k, m4.compose(pos[k], q, size.set(1, 1, 1)))
      const [, w, tall] = HATS[k]
      hat.set(0, 29, 0).applyQuaternion(q).add(pos[k])
      h.setMatrixAt(k, m4.compose(hat, q, size.set(w, tall, w)))
    }
    const calm = m.calm > 0.6
    cn.visible = coinOn > 0 && calm
    cn.position.copy(coin)
    cn.scale.setScalar(big)
    cn.quaternion.copy(PITCH).multiply(qz.setFromAxisAngle(at.set(0, 1, 0), t * 9))
    const bob = (1 + 0.08 * Math.sin(t * 12)) * big
    const say = (k: number, on: boolean, over: THREE.Vector3, up: number) => {
      const s = on && calm ? bob : 0
      bg.setMatrixAt(k, m4.compose(at.copy(over).add(lift.set(0, up, 0).applyQuaternion(PITCH)), PITCH, size.set(s, s, s)))
    }
    const scuffle = p > 0.47 && p < 0.64
    say(0, (argue && n % 2 === 0) || scuffle, pos[2], 70)
    say(1, scuffle, b, 40)
    ak.visible = argue && n % 2 === 1 && calm
    ak.position.copy(b).add(lift.set(0, 40, 0).applyQuaternion(PITCH))
    ak.scale.setScalar(bob)
    ground(a, BOLLARD, 20)
    b.copy(pos[6]).add(lift.set(0, 16, 0).applyQuaternion(PITCH))
    const len = a.distanceTo(b)
    rp.position.copy(a)
    rp.quaternion.setFromUnitVectors(at.set(1, 0, 0), b.sub(a).normalize())
    rp.scale.set(len, 1, 1)
    rp.visible = alarm < 0.3
    f.instanceMatrix.needsUpdate = h.instanceMatrix.needsUpdate = bg.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={folk} args={[shapes.folk, undefined, FOLK]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} transparent />
      </instancedMesh>
      <instancedMesh ref={hats} args={[shapes.hat, undefined, FOLK]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial flatShading roughness={0.6} transparent />
      </instancedMesh>
      <mesh ref={coins} geometry={shapes.coin} position={ZERO} renderOrder={49}>
        <meshStandardMaterial color={C.gold} emissive="#8a5a00" metalness={0.4} roughness={0.3} transparent />
      </mesh>
      <instancedMesh ref={bangs} args={[shapes.bang, undefined, 2]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial vertexColors transparent toneMapped={false} />
      </instancedMesh>
      <mesh ref={asks} geometry={shapes.ask} renderOrder={49}>
        <meshBasicMaterial vertexColors transparent toneMapped={false} />
      </mesh>
      <mesh ref={rope} geometry={shapes.rope} renderOrder={46}>
        <meshStandardMaterial color={C.hemp} roughness={0.9} transparent />
      </mesh>
    </group>
  )
}
