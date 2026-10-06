'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { BEACH, buildPath, NEEDLE, PINS, SAG_POST, SPOOL } from './red-thread/data'
import {
  barrelGeometry,
  beachGeometry,
  beadGeometry,
  headGeometry,
  needleGeometry,
  pinGeometry,
  potGeometry,
  riderGeometry,
  ringGeometry,
  ropeGeometry,
  sagPostGeometry,
  spoolGeometry,
  thimbleGeometry,
  workerGeometry,
} from './red-thread/geo'
import { animate, CARTS, COUNT, makeState, placePins, type Rig, type State } from './red-thread/motion'
import { decalGeometry, signGeometry, signTexture, threadGeometry } from './red-thread/thread'

function build() {
  const path = buildPath()
  return {
    path,
    geo: {
      thread: threadGeometry(path),
      bold: threadGeometry(path, 60, 5),
      decal: decalGeometry(path),
      sign: signGeometry(),
      pin: pinGeometry(),
      head: headGeometry(),
      spool: spoolGeometry(),
      barrel: barrelGeometry(),
      beach: beachGeometry(),
      needle: needleGeometry(),
      post: sagPostGeometry(),
      thimble: thimbleGeometry(),
      pot: potGeometry(),
      rider: riderGeometry(),
      worker: workerGeometry(),
      ring: ringGeometry(),
      bead: beadGeometry(),
      rope: ropeGeometry(),
      disc: new THREE.CircleGeometry(1, 16),
    },
  }
}

export default function Scene({ land, reduced }: SceneProps) {
  const kit = useMemo(() => build(), [])
  const tex = useMemo(() => signTexture(), [])
  useEffect(
    () => () => {
      Object.values(kit.geo).forEach((g) => g.dispose())
      tex.dispose()
    },
    [kit, tex],
  )

  const carts = useRef<THREE.InstancedMesh>(null)
  const riders = useRef<THREE.InstancedMesh>(null)
  const workers = useRef<THREE.InstancedMesh>(null)
  const pots = useRef<THREE.InstancedMesh>(null)
  const heads = useRef<THREE.InstancedMesh>(null)
  const beads = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const shadows = useRef<THREE.InstancedMesh>(null)
  const pins = useRef<THREE.InstancedMesh>(null)
  const rope = useRef<THREE.Mesh>(null)
  const barrel = useRef<THREE.Mesh>(null)
  const thin = useRef<THREE.Mesh>(null)
  const bold = useRef<THREE.Mesh>(null)
  const rig = useRef<Rig | null>(null)
  const state = useRef<State | null>(null)
  const dim = useRef(0)
  const hit = useRef(0)
  const next = useRef(0)

  const ready = () => {
    if (rig.current) return rig.current
    const list = [carts, riders, workers, pots, heads, beads, rings, shadows] as const
    if (list.some((x) => !x.current) || !rope.current || !barrel.current) return null
    const [c, r, w, p, h, b, g, s] = list.map((x) => x.current as THREE.InstancedMesh)
    rig.current = { carts: c, riders: r, workers: w, pots: p, heads: h, beads: b, rings: g, shadows: s, rope: rope.current, barrel: barrel.current }
    return rig.current
  }

  const sim = () => {
    state.current ??= makeState(kit.path)
    return state.current
  }

  useLayoutEffect(() => {
    if (pins.current) placePins(pins.current)
    const r = ready()
    if (r) animate(r, kit.path, sim(), 0, 0, 0, 1)
  })

  useFrame((s, delta) => {
    const r = ready()
    if (!r) return
    const now = s.clock.elapsedTime
    if (now > next.current) {
      next.current = now + 1
      hit.current = threat(land.x, land.y, land.radius)
    }
    dim.current += (Math.min(1, hit.current * 2) - dim.current) * 0.02
    const dt = reduced ? 0 : Math.min(0.05, delta)
    const zoom = s.camera.zoom
    animate(r, kit.path, sim(), reduced ? 0 : now, dt, dim.current, zoom)
    if (thin.current && bold.current) {
      thin.current.visible = zoom >= 0.13
      bold.current.visible = zoom < 0.13
    }
  })

  const g = kit.geo
  return (
    <group>
      <mesh geometry={g.decal} renderOrder={41}>
        <meshBasicMaterial vertexColors transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <instancedMesh ref={shadows} args={[g.disc, undefined, COUNT.shadows]} frustumCulled={false} renderOrder={41}>
        <meshBasicMaterial color="#3a1840" transparent opacity={0.16} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[g.ring, undefined, COUNT.rings]} frustumCulled={false} renderOrder={42}>
        <meshBasicMaterial transparent depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={beads} args={[g.bead, undefined, COUNT.beads]} frustumCulled={false} renderOrder={43}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <mesh ref={thin} geometry={g.thread}>
        <meshStandardMaterial vertexColors roughness={0.55} />
      </mesh>
      <mesh ref={bold} geometry={g.bold} visible={false}>
        <meshStandardMaterial vertexColors roughness={0.55} />
      </mesh>
      <instancedMesh ref={pins} args={[g.pin, undefined, PINS.length]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.45} metalness={0.2} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[g.head, undefined, PINS.length]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={carts} args={[g.thimble, undefined, CARTS]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.4} metalness={0.25} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={pots} args={[g.pot, undefined, COUNT.pots]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.5} />
      </instancedMesh>
      <instancedMesh ref={riders} args={[g.rider, undefined, COUNT.riders]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={workers} args={[g.worker, undefined, COUNT.workers]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <mesh ref={rope} geometry={g.rope}>
        <meshStandardMaterial vertexColors roughness={0.6} />
      </mesh>
      <mesh geometry={g.sign} renderOrder={47}>
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
      <Stand at={SPOOL} size={1}>
        <mesh geometry={g.spool}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
        <mesh ref={barrel} geometry={g.barrel}>
          <meshStandardMaterial vertexColors flatShading roughness={0.65} />
        </mesh>
      </Stand>
      <Stand at={BEACH} size={1}>
        <mesh geometry={g.beach}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
      </Stand>
      <Stand at={NEEDLE} size={1}>
        <mesh geometry={g.needle}>
          <meshStandardMaterial vertexColors flatShading roughness={0.4} metalness={0.2} />
        </mesh>
      </Stand>
      <Stand at={SAG_POST} size={1}>
        <mesh geometry={g.post}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
      </Stand>
    </group>
  )
}
