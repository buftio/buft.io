'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { BRASS, envelope, folk, glowTexture, LIGHT, merged, PARCH, part, PITCH_Q, board, signTexture, TEAL, UP, URGENT } from './labyrinth/kit'
import { CHUTES, GATE, routeGeometry, routeGlowGeometry, SLING, SPIRE, TURNSTILE, WELL } from './labyrinth/maze'
import { armGeometry, gateGeometry, keeperGeometry, KEEPER_AT, signGeometry, SPIRE_S, staticGeometry, turnstileGeometry, wheelGeometry, WHEEL_Y } from './labyrinth/props'
import { RUNNERS, SLINGER, where } from './labyrinth/runners'

const N = RUNNERS.length
const POPS = 7
const AIR = 3
const TRAIL = 5
const FIXED = 4
const GLOWS = N * (TRAIL + 1) + POPS + AIR + FIXED
const MARKS = 4
const TINTS = ['#ffffff', '#d8c8ff', '#ffd9f0', '#c7f5ff'].map((c) => new THREE.Color(c))
const BEACON: [number, number, number] = [SPIRE[0], -SPIRE[1] + UP.y * 8 * SPIRE_S, UP.z * 8 * SPIRE_S]

const m4 = new THREE.Matrix4()
const v3 = new THREE.Vector3()
const sc = new THREE.Vector3()
const q = new THREE.Quaternion()
const qz = new THREE.Quaternion()
const FLAT = new THREE.Quaternion()
const ZA = new THREE.Vector3(0, 0, 1)
const c1 = new THREE.Color()
const c2 = new THREE.Color()
const DIM = new THREE.Color('#2c3a6a')
const CHUTE = new THREE.Color('#2f6f88')
const ENV_OK = new THREE.Color('#ffffff')
const ENV_HOT = new THREE.Color('#ffb3b8')
const HIDE = new THREE.Matrix4().makeScale(0, 0, 0)

function bodyGeometry() {
  const p: THREE.BufferGeometry[] = []
  folk(p, 0, 0, { cap: TEAL, look: 0.3 })
  p.push(part(new THREE.BoxGeometry(0.34, 0.3, 0.16), PARCH, 0.44, 0.38, 0.12, 0.3))
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.62, 4), BRASS, 0.2, 0.62, 0.2, 0, 0.9))
  return merged(p)
}

function envGeometry() {
  const p: THREE.BufferGeometry[] = []
  envelope(p)
  return merged(p)
}

const lean = (dir: number, wob: number) => q.copy(PITCH_Q).multiply(qz.setFromAxisAngle(ZA, -dir * 0.22 + wob))

function sling(g: THREE.Object3D | null, a: THREE.Object3D | null, leg: number, u: number) {
  if (!g || !a) return
  const open = leg === 1 ? Math.min(1, u * 1.6) : leg === 2 ? 1 : leg === 3 ? 1 - u : 0
  g.rotation.y = -open * 1.45
  a.rotation.x = leg === 3 ? 0.5 + u * 0.25 : leg === 4 ? (u < 0.1 ? 0.75 - (u / 0.1) * 2.6 : -1.85 + ((u - 0.1) / 0.9) * 2.35) : 0.5
}

export default function Scene({ land, reduced }: SceneProps) {
  const geo = useMemo(
    () => ({
      base: staticGeometry(),
      routes: routeGeometry(),
      lines: routeGlowGeometry(),
      signs: signGeometry(),
      wheel: wheelGeometry(),
      keeper: keeperGeometry(),
      arm: armGeometry(),
      gate: gateGeometry(),
      turn: turnstileGeometry(),
      body: bodyGeometry(),
      env: envGeometry(),
      mark: board(4, 1, 1),
      glow: new THREE.PlaneGeometry(1, 1),
    }),
    [],
  )
  const tex = useMemo(() => ({ glow: glowTexture(), sign: signTexture() }), [])
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(tex).forEach((t) => t.dispose())
    },
    [geo, tex],
  )

  const bodies = useRef<THREE.InstancedMesh>(null)
  const envs = useRef<THREE.InstancedMesh>(null)
  const glows = useRef<THREE.InstancedMesh>(null)
  const marks = useRef<THREE.InstancedMesh>(null)
  const wheel = useRef<THREE.Mesh>(null)
  const keeper = useRef<THREE.Mesh>(null)
  const arm = useRef<THREE.Mesh>(null)
  const gate = useRef<THREE.Mesh>(null)
  const turn = useRef<THREE.Mesh>(null)
  const lines = useRef<THREE.MeshBasicMaterial>(null)
  const dash = useRef<THREE.MeshBasicMaterial>(null)
  const clock = useRef({ t: 0, next: 0, threat: 0 })

  useFrame((state, delta) => {
    const k = clock.current
    const [b, e, g, m] = [bodies.current, envs.current, glows.current, marks.current]
    if (!b || !e || !g || !m) return
    if (state.clock.elapsedTime > k.next) {
      k.next = state.clock.elapsedTime + 1
      k.threat = threat(land.x, land.y, land.radius)
    }
    const hot = k.threat
    k.t += reduced ? 0 : Math.min(delta, 0.1) * (1 + hot * 0.9)
    const t = k.t
    const lod = Math.min(4, Math.max(1, Math.pow(0.25 / state.camera.zoom, 0.85)))
    if (dash.current) dash.current.opacity = Math.min(0.4, Math.max(0.14, 0.4 - (state.camera.zoom - 0.3) * 0.5))
    if (lines.current) lines.current.opacity = Math.min(0.5, Math.max(0, (0.3 - state.camera.zoom) * 2.4))
    const letter = c1.copy(LIGHT_C).lerp(URGENT_C, Math.min(1, hot * 1.6))
    let gi = 0
    let mi = 0
    const glow = (x: number, y: number, z: number, s: number, c: THREE.Color) => {
      g.setMatrixAt(gi, m4.compose(v3.set(x, y, z), FLAT, sc.set(s, s, 1)))
      g.setColorAt(gi++, c)
    }

    RUNNERS.forEach((r, i) => {
      const s = where(r, t)
      const size = r.size * s.scale
      const [x, y, lift, carry, ask, dir, leg, u, moving] = [s.x, -s.y, s.lift, s.carry, s.ask, s.dir, s.leg, s.u, s.moving]
      const bob = moving ? Math.sin(t * 9 + i) * 0.12 : Math.sin(t * 2 + i) * 0.05
      v3.set(x, y, 0).addScaledVector(UP, lift)
      b.setMatrixAt(i, m4.compose(v3, lean(dir, bob), sc.set(size, size, size)))
      b.setColorAt(i, TINTS[r.tint])
      const hold = size * 1.55 + (moving ? Math.abs(Math.sin(t * 9 + i)) * 4 : 0)
      v3.addScaledVector(UP, hold)
      const es = carry ? 54 * s.scale : 0
      e.setMatrixAt(i, m4.compose(v3, lean(0, Math.sin(t * 5 + i * 2) * 0.18), sc.set(es, es, es)))
      e.setColorAt(i, hot > 0.25 ? ENV_HOT : ENV_OK)
      const [ex, ey, ez] = [v3.x, v3.y, v3.z]
      glow(ex, ey, ez + 4, carry ? (125 + Math.sin(t * 7 + i) * 15) * lod * s.scale : 0, letter)
      for (let j = 1; j <= TRAIL; j++) {
        const p = where(r, t - j * 0.11)
        const on = carry && moving && p.moving && p.carry
        v3.set(p.x, -p.y, 0).addScaledVector(UP, p.lift + hold)
        glow(v3.x, v3.y, v3.z, on ? (70 - j * 10) * lod * p.scale : 0, letter)
      }
      if (ask && mi < MARKS) {
        v3.set(ex, ey, ez).addScaledVector(UP, 52 + Math.abs(Math.sin(t * 3 + i)) * 10)
        const ms = 64 * s.scale * Math.min(2.2, Math.max(1, 0.55 / state.camera.zoom))
        m.setMatrixAt(mi++, m4.compose(v3, PITCH_Q, sc.set(ms, ms, ms)))
      }
      if (i === SLINGER) sling(gate.current, arm.current, leg, u)
    })
    for (; mi < MARKS; mi++) m.setMatrixAt(mi, HIDE)

    for (let i = 0; i < POPS; i++) {
      const [[cx, cy], cr] = CHUTES[i % 2]
      const period = 2.3 + (i % 3) * 0.45
      const p = (((t + i * 0.77) / period) % 1 + 1) % 1
      const u = Math.min(1, p / 0.55)
      const a = 1.2 + i * 0.9
      const d = cr + 50 + (i % 3) * 45
      const x = cx + Math.cos(a) * d * u
      const y = -(cy + Math.sin(a) * d * 0.7 * u)
      v3.set(x, y, 0).addScaledVector(UP, 4 * (180 + (i % 2) * 90) * u * (1 - u) + 6)
      const s = (p > 0.88 ? (1 - p) / 0.12 : Math.min(1, p * 8)) * 40
      q.copy(PITCH_Q).multiply(qz.setFromAxisAngle(ZA, u * 7 + i))
      e.setMatrixAt(N + i, m4.compose(v3, q, sc.set(s, s, s)))
      e.setColorAt(N + i, ENV_OK)
      glow(v3.x, v3.y, v3.z, s * 2.2 * lod, letter)
    }

    for (let i = 0; i < AIR; i++) {
      const a = t * (0.55 + i * 0.12) + (i * Math.PI * 2) / AIR
      const h = (6.2 + i * 0.5) * SPIRE_S
      v3.set(SPIRE[0] + Math.cos(a) * (260 + i * 50), -SPIRE[1] + Math.sin(a) * 90, 0).addScaledVector(UP, h)
      q.copy(PITCH_Q).multiply(qz.setFromAxisAngle(ZA, Math.cos(a) * 0.5))
      e.setMatrixAt(N + POPS + i, m4.compose(v3, q, sc.set(46, 46 * (0.6 + 0.4 * Math.abs(Math.sin(t * 9 + i))), 46)))
      e.setColorAt(N + POPS + i, hot > 0.25 ? ENV_HOT : ENV_OK)
      glow(v3.x, v3.y, v3.z, 70 * lod, letter)
    }

    const pulse = 0.5 + 0.5 * Math.sin(t * (hot > 0.2 ? 9 : 2.2))
    glow(BEACON[0], BEACON[1], BEACON[2], (260 + pulse * 120) * lod, c2.copy(letter).multiplyScalar(0.6 + pulse * 0.6))
    for (const [[cx, cy], cr] of CHUTES) glow(cx, -cy, 8, cr * (1.7 + Math.sin(t * 3 + cx) * 0.25), CHUTE)
    glow(WELL[0][0], -WELL[0][1], 8, WELL[1] * 2.2, DIM)

    for (const mesh of [b, e, g, m]) {
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    if (wheel.current) wheel.current.rotation.y = t * (0.35 + hot)
    if (keeper.current) {
      keeper.current.rotation.z = Math.sin(t * 1.4) * 0.14
      keeper.current.rotation.y = Math.sin(t * 0.37) * 0.7
    }
    if (turn.current) turn.current.rotation.y = t * 0.9
  })

  return (
    <group>
      <mesh geometry={geo.routes} renderOrder={44}>
        <meshBasicMaterial ref={dash} color={LIGHT} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.lines} renderOrder={44}>
        <meshBasicMaterial ref={lines} map={tex.glow} vertexColors color={LIGHT} transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.base}>
        <meshStandardMaterial vertexColors flatShading roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geo.signs}>
        <meshBasicMaterial map={tex.sign} transparent side={THREE.DoubleSide} />
      </mesh>
      <Stand at={SPIRE} size={SPIRE_S}>
        <mesh ref={wheel} geometry={geo.wheel} position={[0, WHEEL_Y, 0]}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
        <mesh ref={keeper} geometry={geo.keeper} position={KEEPER_AT} scale={0.42}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <Stand at={[GATE[0] - 132, GATE[1]]} size={40}>
        <mesh ref={gate} geometry={geo.gate}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <Stand at={TURNSTILE} size={40}>
        <mesh ref={turn} geometry={geo.turn}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <Stand at={SLING} size={60}>
        <mesh ref={arm} geometry={geo.arm} position={[0, 1.15, 0]}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <instancedMesh ref={bodies} args={[geo.body, undefined, N]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={envs} args={[geo.env, undefined, N + POPS + AIR]} frustumCulled={false} renderOrder={46}>
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={glows} args={[geo.glow, undefined, GLOWS]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial map={tex.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </instancedMesh>
      <instancedMesh ref={marks} args={[geo.mark, undefined, MARKS]} frustumCulled={false} renderOrder={48}>
        <meshBasicMaterial map={tex.sign} color={URGENT} transparent depthTest={false} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

const LIGHT_C = new THREE.Color(LIGHT)
const URGENT_C = new THREE.Color(URGENT)
