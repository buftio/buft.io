'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { sample, stand, track, wrap } from './kit'
import { BABY, BODY, EYES, NOSE, SNOUT } from './map'
import { CORAL, eyeWhite, fin, lid, pupil, tongue, zed } from './models'

type Live = { alarm: RefObject<number>; reduced: boolean }

const p = new THREE.Vector3()
const t = new THREE.Vector3()
const n = new THREE.Vector3()
const w = new THREE.Vector3()
const m = new THREE.Matrix4()
const r = new THREE.Matrix4()
const o = new THREE.Matrix4()
const q = new THREE.Quaternion()
const s = new THREE.Vector3()
const calm = new THREE.Color('#ffffff')
const hot = new THREE.Color('#ff6a4a')
const tint = new THREE.Color()
const X = new THREE.Vector3(1, 0, 0)

type Fin = { body: 0 | 1; u: number; h: number; l: number; off: number }

function fins() {
  const body = track(BODY)
  const baby = track(BABY, false, 64)
  const list: Fin[] = []
  const a = Math.floor(body.len / 88)
  for (let k = 1; k <= a; k++) {
    const u = k / (a + 1)
    list.push({ body: 0, u, h: (270 - 150 * u) * (k % 2 ? 1 : 0.78), l: 150 - 50 * u, off: 75 - 25 * u })
  }
  const b = Math.floor(baby.len / 36)
  for (let k = 1; k < b; k++) list.push({ body: 1, u: k / b, h: 44 - 20 * (k / b), l: 36, off: 14 })
  return { body, baby, list }
}

export function Crest({ alarm, reduced }: Live) {
  const geo = useMemo(() => fin(), [])
  useEffect(() => () => geo.dispose(), [geo])
  const spec = useMemo(() => fins(), [])
  const mesh = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const im = mesh.current
    if (!im) return
    const time = reduced ? 0 : state.clock.elapsedTime
    const a = alarm.current
    const far = Math.min(2.2, Math.max(1, 0.2 / state.camera.zoom))
    tint.copy(calm).lerp(hot, a)
    spec.list.forEach((f, k) => {
      sample(f.body ? spec.baby : spec.body, f.u, p, t)
      n.set(-t.y, t.x, 0)
      const breath = 1 + 0.16 * Math.sin(time * (0.9 + a * 4) - f.u * 9 + f.body * 2)
      const h = f.h * breath * (1 + 0.45 * a) * (f.body ? 1 : far)
      p.addScaledVector(n, f.off).setZ(18)
      n.multiplyScalar(0.6).setZ(0.8).normalize()
      w.crossVectors(t, n)
      m.makeBasis(t, n, w)
      q.setFromRotationMatrix(m)
      im.setMatrixAt(k, m.compose(p, q, s.set(f.l * (f.body ? 1 : Math.sqrt(far)), h, 1)))
      im.setColorAt(k, tint)
    })
    im.instanceMatrix.needsUpdate = true
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={mesh} args={[geo, undefined, spec.list.length]} frustumCulled={false} renderOrder={46}>
      <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

function diamonds() {
  const body = track(BODY, false, 512)
  const pos: number[] = []
  const col: number[] = []
  const jade = new THREE.Color('#0d8c7c')
  const gold = new THREE.Color('#ffc23a')
  for (const [wide, z, c] of [[54, 6, jade], [30, 8, gold]] as const)
    for (let i = 0; i < body.n; i++) {
      const u0 = i / body.n
      const u1 = (i + 1) / body.n
      const quad = [u0, u1].map((u) => {
        sample(body, u, p, t)
        const k = (u * body.len) / 130
        const hw = wide * (1 - Math.abs(2 * (k - Math.floor(k)) - 1)) * (1 - 0.45 * u)
        return [p.x - t.y * hw, p.y + t.x * hw, p.x + t.y * hw, p.y - t.x * hw]
      })
      const [a, b] = quad
      pos.push(a[0], a[1], z, a[2], a[3], z, b[0], b[1], z, a[2], a[3], z, b[2], b[3], z, b[0], b[1], z)
      for (let v = 0; v < 6; v++) col.push(c.r, c.g, c.b)
    }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

export function Back() {
  const geo = useMemo(() => diamonds(), [])
  useEffect(() => () => geo.dispose(), [geo])
  return (
    <mesh geometry={geo} renderOrder={44}>
      <meshBasicMaterial vertexColors opacity={0.8} transparent side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

const EYE = [
  { at: EYES[0], r: 82, baby: false },
  { at: EYES[1], r: 82, baby: false },
  { at: [-44, -238] as [number, number], r: 17, baby: true },
  { at: [-12, -250] as [number, number], r: 17, baby: true },
]

export function Eyes({ alarm, reduced }: Live) {
  const geo = useMemo(() => ({ white: eyeWhite(), pupil: pupil(), lid: lid(CORAL) }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const base = useMemo(() => EYE.map((e) => stand(e.at[0], e.at[1], e.r, 0, e.r * 0.6)), [])
  const whites = useRef<THREE.InstancedMesh>(null)
  const pupils = useRef<THREE.InstancedMesh>(null)
  const lids = useRef<THREE.InstancedMesh>(null)

  useFrame((state) => {
    const [wh, pi, li] = [whites.current, pupils.current, lids.current]
    if (!wh || !pi || !li) return
    const time = reduced ? 0 : state.clock.elapsedTime
    const a = alarm.current
    const far = Math.min(2.2, Math.max(1, 0.18 / state.camera.zoom))
    const peek = Math.max(0, Math.sin(time * 0.55) - 0.93) * 12
    EYE.forEach((e, k) => {
      const blink = Math.sin(time * 1.3 + k * 0.4) > 0.985 ? 1 : 0
      const sleepy = e.baby ? -2.4 + blink * 3 : -0.6 - (k === 1 ? peek : 0)
      const open = sleepy + (-2.5 - sleepy) * a
      const g = e.baby ? 1 : far
      o.multiplyMatrices(base[k], m.makeScale(g, g, g))
      o.elements[14] += (g - 1) * e.r
      wh.setMatrixAt(k, o)
      li.setMatrixAt(k, r.multiplyMatrices(o, m.makeRotationX(open)))
      const lx = e.baby ? -0.3 + Math.sin(time * 2) * 0.1 : -0.32 + 0.6 * a + (k === 1 ? peek * 0.2 : 0)
      const ly = e.baby ? 0.05 : 0.7 - 0.7 * a
      const big = 1 - 0.3 * a
      p.set(lx, 0.62 - ly * 0.5, 0.52 + ly * 0.6).normalize().multiplyScalar(0.84)
      m.compose(p, q.setFromAxisAngle(X, -0.87), s.set(big, big, 1))
      pi.setMatrixAt(k, r.multiplyMatrices(o, m))
    })
    for (const im of [wh, pi, li]) im.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh ref={whites} args={[geo.white, undefined, EYE.length]} frustumCulled={false} renderOrder={46}>
        <meshStandardMaterial vertexColors roughness={0.35} />
      </instancedMesh>
      <instancedMesh ref={pupils} args={[geo.pupil, undefined, EYE.length]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={lids} args={[geo.lid, undefined, EYE.length]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={0.6} side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

export function Snore({ alarm, reduced }: Live) {
  const bubble = useRef<THREE.Mesh>(null)
  const lick = useRef<THREE.Mesh>(null)
  const zz = useRef<THREE.InstancedMesh>(null)
  const geo = useMemo(() => ({ tongue: tongue(), zed: zed() }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])

  useFrame((state) => {
    const [b, l, z] = [bubble.current, lick.current, zz.current]
    if (!b || !l || !z) return
    const time = reduced ? 1.5 : state.clock.elapsedTime
    const a = alarm.current
    const cycle = time / 5.5
    const k = wrap(cycle)
    const big = Math.floor(cycle) % 3 === 2 ? 1.6 : 1
    const grow = k < 0.7 ? k / 0.7 : k < 0.92 ? 1 - ((k - 0.7) / 0.22) * 0.8 : 0.2
    const pop = big > 1 && k > 0.7
    const rad = pop ? 0 : (40 + 100 * grow * big) * (1 - a)
    b.scale.setScalar(Math.max(0.001, rad))
    b.position.set(NOSE[0][0] - rad * 0.35, -NOSE[0][1] - rad * 0.75, 40)
    const f = wrap(time / (3.8 - a * 2.6))
    const out = f < 0.16 ? Math.sin((f / 0.16) * Math.PI) : 0
    l.scale.set(60, 170 * out + 0.001, 1)
    l.rotation.z = Math.PI + Math.sin(time * 30) * 0.12 * out
    for (let i = 0; i < 3; i++) {
      const u = wrap(time * 0.16 + i / 3)
      const size = (50 + 110 * u) * Math.sin(Math.min(1, u * 1.25) * Math.PI) * (1 - a) + 0.001
      p.set(640 + u * 380 + Math.sin(u * 7 + i) * 40, 380 + u * 560, 60)
      z.setMatrixAt(i, m.compose(p, q.setFromAxisAngle(w.set(0, 0, 1), -0.25 + Math.sin(time + i) * 0.15), s.set(size, size, 1)))
    }
    z.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <mesh ref={bubble} renderOrder={49}>
        <sphereGeometry args={[1, 20, 14]} />
        <meshStandardMaterial color="#e4fbff" emissive="#9fe6ff" emissiveIntensity={0.5} roughness={0.05} opacity={0.78} transparent depthWrite={false} />
      </mesh>
      <instancedMesh ref={zz} args={[geo.zed, undefined, 3]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial color="#0d8c7c" side={THREE.DoubleSide} />
      </instancedMesh>
      <mesh ref={lick} geometry={geo.tongue} position={[SNOUT[0], -SNOUT[1] + 30, 8]} renderOrder={46}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
