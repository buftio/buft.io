'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { crew, type Folk } from './crew'
import { at, stand, TILT } from './kit'
import { CLOD, DERRICK_TIP, DOWN, HOIST, LIFT, LOOP_LEN, OUT_LEN, QUARRY, ride, snort, SPIN, TURN, walk, WALK_LEN } from './layout'
import { blockGeometry, folkGeometry, gondolaGeometry, hammerGeometry } from './models'

const F = 38
const G = 8
const PUFFS = 18
const BLOCKS = G + 5 + 2
const NEAR = 0.11
const CUTTERS = 11

const tmp = new THREE.Matrix4()
const pose = new THREE.Matrix4()
const swing = new THREE.Matrix4()
const pos = new THREE.Vector3()
const ahead = new THREE.Vector3()
const scale = new THREE.Vector3()
const tip = new THREE.Vector3()
const rot = new THREE.Matrix4()
const rideAt = new THREE.Matrix4()
const basketAt = new THREE.Matrix4()
const hoistEnd = new THREE.Vector3()
const HOIST_TIP = new THREE.Vector3(HOIST.tx, HOIST.ty, HOIST.tz).applyMatrix4(QUARRY)
const gold = new THREE.Color('#ffc94d')
const shade = new THREE.Color()
const puffAt = new Float32Array(PUFFS).fill(-9)
const puffPos = new Float32Array(PUFFS * 3)
const last = new Float32Array(64)
const NOSE = at(stand(CLOD.x, CLOD.y, CLOD.s, 0, LIFT), 0, 0.75, 1.95)

function puff(t: number, j: number, x: number, y: number, z: number) {
  puffPos[j * 3] = x
  puffPos[j * 3 + 1] = y
  puffPos[j * 3 + 2] = z
  puffAt[j] = t
}

function place(out: THREE.Matrix4, base: THREE.Matrix4, x: number, y: number, z: number, face: number, lean = 0, s = F) {
  out.copy(base).multiply(tmp.makeTranslation(x, y, z)).multiply(tmp.makeRotationY(face))
  if (lean) out.multiply(tmp.makeRotationX(lean))
  return out.multiply(tmp.makeScale(s, s, s))
}

function hang(out: THREE.Matrix4, p: THREE.Vector3, turn: number, sway: number) {
  out.compose(p, TILT, scale.set(1, 1, 1)).multiply(tmp.makeRotationY(turn)).multiply(tmp.makeRotationZ(sway))
  return out
}

const phase = (t: number, f: Folk) => (t * f.rate + f.seed) % 1
const swingOf = (p: number) => (p < 0.78 ? -1.7 * Math.sin((p / 0.78) * Math.PI * 0.5) : -1.7 + 3.2 * ((p - 0.78) / 0.22))

export function Life({ alarm, reduced }: { alarm: RefObject<number>; reduced: boolean }) {
  const folks = useMemo(() => crew(), [])
  const geo = useMemo(() => ({ folk: folkGeometry(), hammer: hammerGeometry(), gondola: gondolaGeometry(), block: blockGeometry() }), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  const folkMesh = useRef<THREE.InstancedMesh>(null)
  const hammerMesh = useRef<THREE.InstancedMesh>(null)
  const blockMesh = useRef<THREE.InstancedMesh>(null)
  const gondolaMesh = useRef<THREE.InstancedMesh>(null)
  const puffMesh = useRef<THREE.InstancedMesh>(null)
  const ropes = useRef<THREE.BufferGeometry>(null)
  const clock = useRef({ t: 0, cable: 0, feet: 0, snort: 0, ready: false })

  useFrame((state, delta) => {
    const fm = folkMesh.current
    const hm = hammerMesh.current
    const bm = blockMesh.current
    const gm = gondolaMesh.current
    const pm = puffMesh.current
    const rg = ropes.current
    if (!fm || !hm || !bm || !gm || !pm || !rg) return
    const c = clock.current
    const a = alarm.current ?? 0
    const dt = Math.min(delta, 0.1) * (reduced ? 0.08 : 1)
    c.t += dt
    c.cable += dt * 70 * (1 + a * 1.6)
    c.feet += dt * 26 * (1 + a * 1.2)
    const t = c.t
    if (!c.ready) {
      for (let i = 0; i < BLOCKS; i++) bm.setColorAt(i, shade.setHSL(0.94, 0.6 + (i % 3) * 0.08, 0.86 + (i % 2) * 0.05))
      bm.setColorAt(BLOCKS - 1, gold)
      c.ready = true
    }
    const near = state.camera.zoom > NEAR
    fm.visible = hm.visible = bm.visible = pm.visible = near

    let gi = 0
    let bi = 0
    for (let i = 0; i < G; i++) {
      const d = c.cable + (i * LOOP_LEN) / G
      const s = ((d % LOOP_LEN) + LOOP_LEN) % LOOP_LEN
      ride(d, pos)
      hang(pose, pos, SPIN, Math.sin(t * 1.3 + i * 2.1) * 0.08)
      gm.setMatrixAt(gi++, pose)
      if (i === 1) rideAt.copy(pose)
      const load = i !== 1 && s < OUT_LEN ? Math.min(1, s / 60, (OUT_LEN - s) / 60) : 0
      bm.setMatrixAt(bi++, tmp.copy(pose).multiply(swing.makeTranslation(0, -60, 0)).multiply(rot.makeScale(54 * load || 1e-5, 34 * load || 1e-5, 40 * load || 1e-5)))
    }

    const depth = 150 + 120 * (1 - Math.cos(t * 0.35))
    tip.copy(DERRICK_TIP).addScaledVector(DOWN, depth)
    hang(pose, tip, Math.PI, Math.sin(t * 0.9) * 0.12)
    gm.setMatrixAt(gi++, pose)
    basketAt.copy(pose)

    const cycle = (t * 0.09) % 1
    const drop = cycle < 0.7 ? cycle / 0.7 : 1 - (cycle - 0.7) / 0.3
    hoistEnd.copy(HOIST_TIP).addScaledVector(DOWN, 60 + 380 * drop)
    const hoisted = cycle < 0.7 ? 1 : 0
    bm.setMatrixAt(bi++, hang(pose, ahead.copy(hoistEnd).addScaledVector(DOWN, 28), TURN, 0).multiply(tmp.makeScale(80 * hoisted || 1e-5, 50 * hoisted || 1e-5, 60 * hoisted || 1e-5)))

    const rp = rg.getAttribute('position') as THREE.BufferAttribute
    rp.setXYZ(0, HOIST_TIP.x, HOIST_TIP.y, HOIST_TIP.z)
    rp.setXYZ(1, hoistEnd.x, hoistEnd.y, hoistEnd.z)
    rp.setXYZ(2, DERRICK_TIP.x, DERRICK_TIP.y, DERRICK_TIP.z)
    rp.setXYZ(3, tip.x, tip.y, tip.z)
    rp.needsUpdate = true

    const sn = snort(t)
    if (near && sn < c.snort) for (let j = 0; j < 3; j++) puff(t + j * 0.12, PUFFS - 1 - j, NOSE.x + (j - 1) * 30, NOSE.y - 20 - j * 25, NOSE.z + 40)
    c.snort = sn
    const shove = sn < 0.5 ? Math.sin((sn / 0.5) * Math.PI * 0.5) * 55 : Math.max(0, 1 - (sn - 0.5) / 3.5) * 55
    let hi = 0
    let carry = 0
    folks.forEach((f, k) => {
      const nerves = a * Math.abs(Math.sin(t * 9 + f.seed * 3)) * 7
      if (f.job === 'cut') {
        const p = phase(t, f)
        const angle = swingOf(p)
        const calm = 1 - Math.min(1, a * 2)
        place(pose, f.base, f.x, f.y + nerves, f.z, f.face, p > 0.78 ? 0.06 * calm : 0)
        fm.setMatrixAt(k, pose)
        hm.setMatrixAt(hi++, tmp.copy(pose).multiply(swing.makeTranslation(0.5, 0.45, 0.25)).multiply(rot.makeRotationX(angle * calm + 0.2 * (1 - calm))))
        if (near && calm > 0.5 && p < last[k] && hi <= CUTTERS) {
          const j = Math.floor(t * 97 + k) % PUFFS
          ahead.set(0.1, 0.1, 0.95).applyMatrix4(pose)
          puff(t, j, ahead.x, ahead.y, ahead.z)
        }
        last[k] = p
        return
      }
      if (f.job === 'carry') {
        const i = carry++
        const d = (c.feet + i * ((2 * WALK_LEN) / 5)) % (2 * WALK_LEN)
        const back = d > WALK_LEN
        const along = back ? 2 * WALK_LEN - d : d
        walk(along, pos)
        walk(along + (back ? -2 : 2), ahead)
        const face = Math.atan2(ahead.x - pos.x, -(ahead.y - pos.y) / 0.77)
        const hop = Math.abs(Math.sin(c.feet * 0.35 + i)) * 5
        pose.compose(pos, TILT, scale.set(1, 1, 1)).multiply(tmp.makeTranslation(0, hop, 0)).multiply(tmp.makeRotationY(face)).multiply(tmp.makeScale(F, F, F))
        fm.setMatrixAt(k, pose)
        const s = back ? 0 : 1
        bm.setMatrixAt(bi++, tmp.copy(pose).multiply(swing.makeTranslation(0, 1.25, 0)).multiply(rot.makeScale(1.3 * s || 1e-5, 0.75 * s || 1e-5, s || 1e-5)))
        return
      }
      if (f.job === 'ride' || f.job === 'basket') {
        const at = f.job === 'ride' ? rideAt : basketAt
        fm.setMatrixAt(k, tmp.copy(at).multiply(swing.makeTranslation(0, -92 + Math.abs(Math.sin(t * 2 + f.seed)) * 4, 0)).multiply(rot.makeScale(F, F, F)))
        return
      }
      let face = f.face
      let x = f.x
      let z = f.z
      let hop = nerves
      let lean = 0
      if (f.job === 'boss') {
        const pace = Math.sin(t * 0.25)
        x = pace * 170
        face = a > 0.5 ? 0.6 : Math.cos(t * 0.25) > 0 ? Math.PI / 2 : -Math.PI / 2
        if (Math.abs(Math.cos(t * 0.25)) < 0.25) face = 0
      }
      if (f.job === 'pull') lean = Math.max(0, Math.sin(t * 2.4)) * 0.55 * (1 - a)
      if (f.job === 'lunch') hop += Math.max(0, Math.sin(t * 5 + f.seed)) * 2
      if (f.job === 'stack' || f.job === 'load') lean = Math.max(0, Math.sin(t * f.rate * 3 + f.seed)) * 0.35
      if (f.job === 'push') {
        lean = (0.45 + Math.sin(t * 7 + f.seed) * 0.05) * (1 - a) * (sn < 0.5 ? 0 : 1)
        x -= Math.sin(face) * shove
        z -= Math.cos(face) * shove
        if (sn < 0.8) hop += Math.sin((sn / 0.8) * Math.PI) * 14
      }
      if (f.job === 'wait') hop += Math.max(0, Math.sin(t * 6 + f.seed)) * 2.5
      if (f.job === 'bribe') hop += Math.max(0, Math.sin(t * 2.2)) * 6
      if (f.job === 'crank') {
        place(pose, f.base, x, f.y, f.z, face)
        hm.setMatrixAt(hi++, tmp.copy(pose).multiply(swing.makeTranslation(-0.5, 0.5, 0.2)).multiply(rot.makeRotationX(t * 3)))
      }
      place(pose, f.base, x, f.y + hop, z, face, lean)
      fm.setMatrixAt(k, pose)
      if (f.job === 'lunch') bm.setMatrixAt(BLOCKS - 1, tmp.copy(pose).multiply(swing.makeTranslation(0.3, 0.55, 0.45)).multiply(rot.makeScale(0.4, 0.22, 0.3)))
    })

    for (let j = 0; j < PUFFS; j++) {
      const age = (t - puffAt[j]) / 0.8
      const r = age >= 0 && age < 1 ? 24 * Math.sin(age * Math.PI) : 0
      pos.set(puffPos[j * 3], puffPos[j * 3 + 1] + age * 18, puffPos[j * 3 + 2] + 10)
      pm.setMatrixAt(j, pose.compose(pos, TILT, scale.set(r || 1e-5, r || 1e-5, r || 1e-5)))
    }

    gm.count = gi
    hm.count = hi
    for (const m of [fm, hm, bm, gm, pm]) {
      m.instanceMatrix.needsUpdate = true
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  })

  const ropeInit = useMemo(() => new Float32Array(12), [])
  return (
    <group>
      <instancedMesh ref={gondolaMesh} args={[geo.gondola, undefined, G + 1]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.7} />
      </instancedMesh>
      <instancedMesh ref={blockMesh} args={[geo.block, undefined, BLOCKS]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={folkMesh} args={[geo.folk, undefined, folks.length]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={hammerMesh} args={[geo.hammer, undefined, CUTTERS + 1]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={puffMesh} args={[undefined, undefined, PUFFS]} frustumCulled={false} renderOrder={49}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#fff3f7" transparent opacity={0.9} depthWrite={false} />
      </instancedMesh>
      <lineSegments frustumCulled={false} renderOrder={46}>
        <bufferGeometry ref={ropes}>
          <bufferAttribute attach="attributes-position" args={[ropeInit, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#2a1630" />
      </lineSegments>
    </group>
  )
}
