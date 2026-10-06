'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { PITCH, Stand } from '../stand'
import { field, threat } from '../threat'
import { type Cell, cells } from './honeycomb-basin/cells'
import { combGeometry, combMaterial } from './honeycomb-basin/comb'
import { Hive, type Rig } from './honeycomb-basin/hive'
import * as kit from './honeycomb-basin/kit'
import { EDGE, MOTHER, PIPE_R, PRESS, SKEP, type P, pipeCurve } from './honeycomb-basin/layout'
import { Comb, rng } from './honeycomb-basin/state'

const FOLK = 29
const CLAMPS = 26

const mother = (c: Cell) => Math.hypot(c.x, c.y) < MOTHER
const fade = (c: Cell) => {
  const wobble = 220 * Math.sin(c.x * 0.0031 + c.y * 0.0017) * Math.cos(c.y * 0.0023 - 1)
  const k = Math.min(1, Math.max(0, (EDGE - Math.hypot(c.x, c.y) - wobble) / (EDGE * 0.32)))
  return k * k * (3 - 2 * k)
}

function build() {
  const list = cells()
  const curve = pipeCurve()
  const pts = curve.getSpacedPoints(700)
  const tan = pts.map((_, i) => curve.getTangentAt(i / (pts.length - 1)))
  const tube = new THREE.TubeGeometry(curve, 180, PIPE_R, 8)
  const shadow = tube.clone().scale(1, 1, 0.04).translate(14, -20, 0.5)
  return {
    list,
    pipe: { pts, tan, length: curve.getLength() },
    geos: {
      comb: combGeometry(list, mother, fade),
      tube,
      shadow,
      skep: kit.skep(),
      wheel: kit.wheel(),
      press: kit.press(),
      screw: kit.screw(),
      folk: kit.folk(),
      bucket: kit.bucket(),
      ladle: kit.ladle(),
      paddle: kit.paddle(),
      bee: kit.bee(),
      wings: kit.wings(),
      clamp: kit.clamp(),
      ball: new THREE.SphereGeometry(1, 8, 5),
      puff: new THREE.SphereGeometry(1, 10, 6),
      queen: kit.queen(),
      asleep: kit.queenAsleep(),
      awake: kit.queenAwake(),
      zed: kit.zed(),
    },
    combMat: combMaterial(),
  }
}

function lookup(land: SceneProps['land']) {
  const war = field.war
  if (!war) return { centre: null, open: false }
  let best: { x: number; y: number } | null = null
  for (const d of war.deposits)
    if (Math.hypot(d.x - land.x, d.y - land.y) < 1500 && (!best || Math.hypot(d.x - land.x, d.y - land.y) < Math.hypot(best.x - land.x, best.y - land.y))) best = d
  if (!best) return { centre: null, open: false }
  const at = best
  return { centre: [at.x - land.x, at.y - land.y] as P, open: war.mines.some((m) => Math.hypot(m.x - at.x, m.y - at.y) < 300) }
}

export default function Scene({ land, reduced }: SceneProps) {
  const built = useMemo(() => build(), [])
  useEffect(
    () => () => {
      Object.values(built.geos).forEach((g) => g.dispose())
      built.combMat.dispose()
    },
    [built],
  )
  const { geos } = built
  const comb = useRef<THREE.Mesh>(null)
  const folk = useRef<THREE.InstancedMesh>(null)
  const bucket = useRef<THREE.InstancedMesh>(null)
  const ladle = useRef<THREE.InstancedMesh>(null)
  const paddle = useRef<THREE.InstancedMesh>(null)
  const gold = useRef<THREE.InstancedMesh>(null)
  const bee = useRef<THREE.InstancedMesh>(null)
  const wing = useRef<THREE.InstancedMesh>(null)
  const smoke = useRef<THREE.InstancedMesh>(null)
  const clamp = useRef<THREE.InstancedMesh>(null)
  const wheel = useRef<THREE.Group>(null)
  const screw = useRef<THREE.Group>(null)
  const queen = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const asleep = useRef<THREE.Mesh>(null)
  const awake = useRef<THREE.Mesh>(null)
  const zz = useRef<THREE.InstancedMesh>(null)
  const hive = useRef<Hive | null>(null)
  const rig = useRef<Rig | null>(null)
  const clock = useRef({ t: 0, poll: -9, threat: 0, open: false, centre: null as P | null })

  useFrame((state, delta) => {
    if (!rig.current) {
      const r = { comb: comb.current, folk: folk.current, bucket: bucket.current, ladle: ladle.current, paddle: paddle.current, gold: gold.current, bee: bee.current, wing: wing.current, smoke: smoke.current, clamp: clamp.current, wheel: wheel.current, screw: screw.current, queen: queen.current, body: body.current, asleep: asleep.current, awake: awake.current, zz: zz.current }
      if (Object.values(r).some((p) => !p)) return
      rig.current = r as Rig
    }
    const live = rig.current
    const c = clock.current
    c.t += Math.min(delta, 0.1) * (reduced ? 0.06 : 1)
    if (c.t - c.poll > 1) {
      c.poll = c.t
      c.threat = threat(land.x, land.y, land.radius)
      Object.assign(c, lookup(land))
    }
    hive.current ??= new Hive(new Comb(built.list, live.comb.geometry, mother, fade, rng(7)), built.pipe)
    hive.current.step(c.t, Math.min(delta, 0.1), live, state.camera.zoom, c.threat, c.open, c.centre)
  })

  const standard = (color: string, extra = {}) => <meshStandardMaterial color={color} roughness={0.6} {...extra} />
  return (
    <group>
      <mesh ref={comb} geometry={geos.comb} material={built.combMat} renderOrder={41} frustumCulled={false} />
      <mesh geometry={geos.shadow} renderOrder={42}>
        <meshBasicMaterial color="#3a1d3a" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <instancedMesh ref={gold} args={[geos.ball, undefined, 140]} renderOrder={46} frustumCulled={false}>
        {standard('#ffb62e', { emissive: '#ff8a00', emissiveIntensity: 0.7, roughness: 0.3 })}
      </instancedMesh>
      <mesh geometry={geos.tube} renderOrder={47}>
        {standard('#ffc24a', { transparent: true, opacity: 0.5, roughness: 0.12, metalness: 0.2, emissive: '#a35a00', emissiveIntensity: 0.35, depthWrite: false })}
      </mesh>
      <instancedMesh ref={clamp} args={[geos.clamp, undefined, CLAMPS]} renderOrder={47} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} metalness={0.3} />
      </instancedMesh>
      <Stand at={SKEP.at} size={SKEP.size}>
        <mesh geometry={geos.skep} renderOrder={48}>
          <meshStandardMaterial vertexColors roughness={0.75} side={THREE.DoubleSide} />
        </mesh>
        <group ref={wheel} position={[0.98, 0.5, 0.55]} rotation={[0, 0.5, 0]}>
          <mesh geometry={geos.wheel} renderOrder={48}>
            <meshStandardMaterial vertexColors roughness={0.7} />
          </mesh>
        </group>
      </Stand>
      <Stand at={PRESS.at} size={PRESS.size}>
        <mesh geometry={geos.press} renderOrder={48}>
          <meshStandardMaterial vertexColors roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <group ref={screw}>
          <mesh geometry={geos.screw} renderOrder={48}>
            <meshStandardMaterial vertexColors roughness={0.6} />
          </mesh>
        </group>
      </Stand>
      <instancedMesh ref={smoke} args={[geos.puff, undefined, 10]} renderOrder={49} frustumCulled={false}>
        {standard('#fff3d6', { transparent: true, opacity: 0.7, roughness: 1, depthWrite: false })}
      </instancedMesh>
      <group ref={queen}>
        <group ref={body} rotation={PITCH}>
          <mesh geometry={geos.queen} renderOrder={44}>
            <meshStandardMaterial vertexColors roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
          <mesh ref={asleep} geometry={geos.asleep} renderOrder={44}>
            <meshStandardMaterial vertexColors roughness={0.6} />
          </mesh>
          <mesh ref={awake} geometry={geos.awake} renderOrder={44} visible={false}>
            <meshStandardMaterial vertexColors roughness={0.4} />
          </mesh>
        </group>
      </group>
      <instancedMesh ref={zz} args={[geos.zed, undefined, 3]} renderOrder={49} frustumCulled={false}>
        <meshBasicMaterial color="#16b3a0" transparent opacity={0.85} depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={folk} args={[geos.folk, undefined, FOLK]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={bucket} args={[geos.bucket, undefined, 16]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.4} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={ladle} args={[geos.ladle, undefined, 8]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={paddle} args={[geos.paddle, undefined, 10]} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={bee} args={[geos.bee, undefined, 36]} renderOrder={49} frustumCulled={false}>
        <meshStandardMaterial vertexColors roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={wing} args={[geos.wings, undefined, 36]} renderOrder={49} frustumCulled={false}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}
