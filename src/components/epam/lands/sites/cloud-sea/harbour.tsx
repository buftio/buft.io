'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { C, eyes, folk, lift as up, merged, part, pose, unlift } from './kit'
import { HARBOUR, HARBOUR_SIZE, MAST_H } from './map'
import { fluff } from './models'

const S = HARBOUR_SIZE
const MZ = -1.4
const TOP = 0.3 + MAST_H
const FOLK = 34
const CREW = 4
const v = new THREE.Vector3()
const m = new THREE.Matrix4()
const calm = new THREE.Color(C.teal)
const red = new THREE.Color('#ff3b4e')
const lit = new THREE.Color()

function ground(x: number, y: number, z: number) {
  return unlift(v.set(x, y, z).applyMatrix4(pose(HARBOUR[0], HARBOUR[1], 0, S)))
}

export const DOCK = ground(0, TOP + 0.35, MZ)
const LIFT_FOOT = ground(0.55, 0.3, MZ + 0.75)
const PILE = ground(-1.55, 0.3, 0.75)
const SOCK = ground(2.5, 2.55, -1.1)
const ALARM = ground(-2.45, 3.7, -0.9)
const KID = ground(0.6, 0.3, 2.6)
const kiteTip = new THREE.Vector3()

function mast(p: THREE.BufferGeometry[]) {
  const legs = 4
  for (let k = 0; k < legs; k++) {
    const a = (k / legs) * Math.PI * 2 + Math.PI / 4
    const g = new THREE.CylinderGeometry(0.05, 0.07, MAST_H, 5)
    const lean = Math.atan2(0.42, MAST_H)
    g.rotateZ(lean)
    g.rotateY(-a)
    p.push(part(g, C.wall, Math.cos(a) * 0.36, 0.3 + MAST_H / 2, MZ + Math.sin(a) * 0.36))
  }
  for (let y = 1.2; y < MAST_H; y += 1.15) {
    const r = 0.6 - (y / MAST_H) * 0.42
    p.push(part(new THREE.TorusGeometry(r, 0.04, 4, 4).rotateX(Math.PI / 2).rotateY(Math.PI / 4), C.teal, 0, 0.3 + y, MZ))
  }
  p.push(part(new THREE.CylinderGeometry(0.42, 0.3, 0.2, 10), C.stone, 0, TOP - 0.05, MZ))
  p.push(part(new THREE.ConeGeometry(0.3, 0.45, 10), C.teal, 0, TOP + 0.28, MZ))
  p.push(part(new THREE.SphereGeometry(0.14, 8, 6), C.brass, 0, TOP + 0.35, MZ + 0.15))
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), C.ink, 0, TOP + 0.85, MZ))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.6, -0.12), new THREE.Vector2(0, -0.26)])), C.mint, 0.02, TOP + 1.22, MZ))
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(0.06, 6, 4), C.gold, s * 0.42, TOP + 0.02, MZ + 0.1))
}

function hut(p: THREE.BufferGeometry[]) {
  const [x, z] = [1.65, 0.55]
  p.push(part(new THREE.BoxGeometry(1.3, 1.0, 1.0), C.stone, x, 0.8, z))
  p.push(part(new THREE.ConeGeometry(1.0, 0.7, 4), C.teal, x, 1.65, z, Math.PI / 4))
  p.push(part(new THREE.BoxGeometry(0.3, 0.48, 0.03), C.ink, x - 0.3, 0.54, z + 0.5))
  p.push(part(new THREE.TorusGeometry(0.16, 0.04, 4, 12), C.brass, x + 0.3, 0.95, z + 0.51))
  p.push(part(new THREE.CircleGeometry(0.13, 12), '#9fe8ff', x + 0.3, 0.95, z + 0.51))
  eyes(p, x, 1.22, z + 0.48, 0.17, 0.12)
  p.push(part(new THREE.CylinderGeometry(0.11, 0.11, 0.4, 8), C.wall, x + 0.4, 2.0, z - 0.2))
  p.push(part(new THREE.SphereGeometry(0.16, 8, 6).scale(1.4, 0.8, 1), C.cloud, x + 0.5, 2.32, z - 0.2))
}

function deck(p: THREE.BufferGeometry[]) {
  p.push(part(new THREE.CylinderGeometry(3.0, 2.7, 0.3, 28), C.wall, 0, 0.15, 0))
  p.push(part(new THREE.CylinderGeometry(2.88, 2.88, 0.04, 28), C.plank, 0, 0.31, 0))
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2
    if (Math.abs(Math.sin(a) - 1) < 0.05) continue
    p.push(part(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 4), C.wood, Math.cos(a) * 2.85, 0.5, Math.sin(a) * 2.85))
  }
  p.push(part(new THREE.TorusGeometry(2.85, 0.035, 4, 40).rotateX(Math.PI / 2), C.wood, 0, 0.7, 0))
  p.push(part(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 4), C.ink, 2.5, 1.45, -1.1))
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 3.4, 3), C.ink, -2.45, 2.0, -0.9))
  for (const [x, z, r] of [[-1.6, 0.9, 0.42], [-1.1, 1.2, 0.38], [-2.0, 0.4, 0.36], [-1.5, 0.45, 0.36], [-1.45, 0.75, 0.33]])
    p.push(part(new THREE.SphereGeometry(r, 10, 7), C.cloud, x, 0.3 + r * (x === -1.45 ? 2.2 : 0.9), z))
  for (const [x, z] of [[0.9, 1.6], [1.25, 1.75]]) p.push(part(new THREE.BoxGeometry(0.4, 0.34, 0.4), C.wood, x, 0.48, z, x))
  p.push(part(new THREE.CylinderGeometry(0.15, 0.15, 0.32, 8), C.gold, 0.85, 0.8, 1.55))
  folk(p, 0.6, 0.31, 2.6, 0.42, C.gold, 0.4)
}

function harbourGeometry() {
  const p: THREE.BufferGeometry[] = []
  deck(p)
  mast(p)
  hut(p)
  return merged(p).applyMatrix4(pose(HARBOUR[0], HARBOUR[1], 0, S))
}

function cage() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(0.62, 0.06, 0.62), C.wood, 0, 0, 0))
  p.push(part(new THREE.BoxGeometry(0.62, 0.06, 0.62), C.teal, 0, 0.72, 0))
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) p.push(part(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 4), C.ink, x * 0.29, 0.36, z * 0.29))
  folk(p, -0.1, 0.03, 0.05, 0.38, C.coral, 0.3)
  p.push(part(new THREE.SphereGeometry(0.2, 8, 6), C.cloud, 0.15, 0.25, -0.05))
  return merged(p)
}

function sock() {
  const g = new THREE.CylinderGeometry(0.16, 0.06, 0.9, 10, 4, true).rotateZ(Math.PI / 2).translate(0.45, 0, 0)
  const p = [g, new THREE.TorusGeometry(0.16, 0.025, 4, 10).rotateY(Math.PI / 2)].map((s, k) =>
    k ? part(s, C.ink) : part(s, C.coral),
  )
  const pos = p[0].getAttribute('position')
  const col = p[0].getAttribute('color')
  for (let i = 0; i < pos.count; i++) if (Math.floor(pos.getX(i) * 4.4) % 2) col.setXYZ(i, 1, 1, 1)
  return merged(p)
}

function kite() {
  const p: THREE.BufferGeometry[] = []
  const d = new THREE.Shape([new THREE.Vector2(0, 0.6), new THREE.Vector2(0.4, 0), new THREE.Vector2(0, -0.75), new THREE.Vector2(-0.4, 0)])
  p.push(part(new THREE.ShapeGeometry(d), C.coral))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.6), new THREE.Vector2(0.4, 0), new THREE.Vector2(0, 0)])), C.gold, 0, 0, 0.01))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, -0.75), new THREE.Vector2(-0.4, 0), new THREE.Vector2(0, 0)])), C.gold, 0, 0, 0.01))
  for (let k = 0; k < 4; k++) p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0.1), new THREE.Vector2(0.12, 0), new THREE.Vector2(0, -0.1), new THREE.Vector2(-0.12, 0)])), k % 2 ? C.teal : C.mint, Math.sin(k) * 0.1, -0.95 - k * 0.3, 0))
  return merged(p)
}

function crewman() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, 0, 1, C.teal, 0)
  return merged(p)
}

export function Harbour({ clock, alarm }: { clock: RefObject<number>; alarm: RefObject<number> }) {
  const shapes = useMemo(() => ({ base: harbourGeometry(), cage: cage(), sock: sock(), kite: kite(), crew: crewman(), bale: fluff(), dot: new THREE.SphereGeometry(1, 10, 7) }), [])
  useEffect(() => () => Object.values(shapes).forEach((g) => g.dispose()), [shapes])
  const lift = useRef<THREE.Mesh>(null)
  const wind = useRef<THREE.Mesh>(null)
  const crew = useRef<THREE.InstancedMesh>(null)
  const bales = useRef<THREE.InstancedMesh>(null)
  const flag = useRef<THREE.Mesh>(null)
  const kiteRef = useRef<THREE.Mesh>(null)
  const string = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3)), [])
  useEffect(() => () => string.dispose(), [string])
  const flagMat = useRef<THREE.MeshStandardMaterial>(null)

  useFrame(() => {
    const t = clock.current
    const fear = alarm.current
    const u = (t % 18) / 18
    const ride = u < 0.4 ? u / 0.4 : u < 0.5 ? 1 : u < 0.9 ? 1 - (u - 0.5) / 0.4 : 0
    const y = 0.35 + (MAST_H - 1.3) * (0.5 - Math.cos(ride * Math.PI) / 2)
    lift.current?.matrix.copy(pose(HARBOUR[0], HARBOUR[1], 0, S).multiply(m.makeTranslation(0.55, y, MZ + 0.75)))
    wind.current?.matrix.copy(pose(SOCK[0], SOCK[1], SOCK[2], S, 2.6 + Math.sin(t * 1.7) * 0.25, Math.sin(t * 3) * 0.2, -0.25 + Math.sin(t * 2.3) * 0.12, 0.85 + Math.sin(t * 2.9) * 0.12, 1, 1))
    const c = crew.current
    const b = bales.current
    if (c && b) {
      for (let k = 0; k < CREW; k++) {
        const w = ((t * 0.09 + k / CREW) % 1) * 2
        const back = w > 1
        const s = back ? 2 - w : w
        const x = LIFT_FOOT[0] + (PILE[0] - LIFT_FOOT[0]) * s + Math.sin(k * 3.1) * 60 * Math.sin(s * Math.PI)
        const yy = LIFT_FOOT[1] + (PILE[1] - LIFT_FOOT[1]) * s + Math.cos(k * 2.3) * 40 * Math.sin(s * Math.PI)
        const hop = Math.abs(Math.sin(t * 7 + k)) * 8
        const turn = back ? 0.9 : -2.2
        const busy = fear > 0.4
        c.setMatrixAt(k, pose(busy ? LIFT_FOOT[0] + k * 30 - 45 : x, busy ? LIFT_FOOT[1] + 20 : yy, LIFT_FOOT[2] + hop, FOLK, busy ? 0 : turn))
        b.setMatrixAt(k, pose(x, yy, LIFT_FOOT[2] + hop + FOLK * 1.25, back || busy ? 0 : 20, t))
      }
      c.instanceMatrix.needsUpdate = true
      b.instanceMatrix.needsUpdate = true
    }
    const blink = fear > 0.05 ? (Math.sin(t * 9) > 0 ? 1 : 0.35) : 0.25
    lit.copy(calm).lerp(red, Math.min(1, fear * 3))
    flagMat.current?.color.copy(lit)
    flagMat.current?.emissive.copy(lit).multiplyScalar(blink)
    flag.current?.matrix.copy(pose(ALARM[0], ALARM[1], ALARM[2] + Math.sin(t * (1 + fear * 4)) * 8, 20))
    const kx = KID[0] + 260 + Math.sin(t * 0.7) * 70 + Math.sin(t * 1.9) * 20
    const ky = KID[1] - 230 + Math.cos(t * 0.5) * 40
    const kh = 330 + Math.sin(t * 1.1) * 35 - fear * 260
    kiteRef.current?.matrix.copy(pose(kx, ky, kh, 44, 0, 0, Math.sin(t * 1.6) * 0.35))
    const pos = string.getAttribute('position') as THREE.BufferAttribute
    up(kiteTip, KID[0] + 8, KID[1], KID[2] + 26)
    pos.setXYZ(0, kiteTip.x, kiteTip.y, kiteTip.z)
    up(kiteTip, kx, ky, kh - 4)
    pos.setXYZ(1, kiteTip.x, kiteTip.y, kiteTip.z)
    pos.needsUpdate = true
  })

  return (
    <group>
      <mesh geometry={shapes.base} renderOrder={44}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </mesh>
      <mesh ref={lift} geometry={shapes.cage} matrixAutoUpdate={false} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial vertexColors roughness={0.8} />
      </mesh>
      <mesh ref={wind} geometry={shapes.sock} matrixAutoUpdate={false} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial vertexColors roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={crew} args={[shapes.crew, undefined, CREW]} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={bales} args={[shapes.bale, undefined, CREW]} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial vertexColors roughness={0.95} emissive="#8c84b8" emissiveIntensity={0.35} />
      </instancedMesh>
      <mesh ref={kiteRef} geometry={shapes.kite} matrixAutoUpdate={false} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={string} frustumCulled={false} renderOrder={46}>
        <lineBasicMaterial color={C.ink} />
      </lineSegments>
      <mesh ref={flag} geometry={shapes.dot} matrixAutoUpdate={false} frustumCulled={false} renderOrder={45}>
        <meshStandardMaterial ref={flagMat} color={C.teal} emissive={C.teal} emissiveIntensity={1} roughness={0.5} />
      </mesh>
    </group>
  )
}
