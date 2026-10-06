'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { diggerGeometry, pilgrimGeometry, puffGeometry, touristGeometry, whaleGeometry, workerGeometry } from './whale-rib/folk'
import { glowTexture, groundGeometry, ribbonGeometry, signGeometry, signTexture } from './whale-rib/ground'
import { animate, COUNT, type Rig } from './whale-rib/life'
import { DERRICK } from './whale-rib/plan'
import { boomGeometry, loadGeometry, ropeGeometry, staticGeometry } from './whale-rib/props'

function build() {
  return {
    still: staticGeometry(),
    ground: groundGeometry(),
    ribbon: ribbonGeometry(),
    signs: signGeometry(),
    digger: diggerGeometry(),
    worker: workerGeometry(),
    pilgrim: pilgrimGeometry(),
    tourist: touristGeometry(),
    puff: puffGeometry(),
    whale: whaleGeometry(),
    boom: boomGeometry(),
    load: loadGeometry(),
    rope: ropeGeometry(),
    plane: new THREE.PlaneGeometry(1, 1),
  }
}

export default function Scene({ land, reduced }: SceneProps) {
  const geo = useMemo(() => build(), [])
  const tex = useMemo(() => ({ sign: signTexture(), glow: glowTexture() }), [])
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(tex).forEach((t) => t.dispose())
    },
    [geo, tex],
  )

  const digger = useRef<THREE.InstancedMesh>(null)
  const worker = useRef<THREE.InstancedMesh>(null)
  const pilgrim = useRef<THREE.InstancedMesh>(null)
  const tourist = useRef<THREE.InstancedMesh>(null)
  const puff = useRef<THREE.InstancedMesh>(null)
  const glow = useRef<THREE.InstancedMesh>(null)
  const boom = useRef<THREE.Group>(null)
  const rope = useRef<THREE.Mesh>(null)
  const load = useRef<THREE.Mesh>(null)
  const tug = useRef<THREE.Mesh>(null)
  const whale = useRef<THREE.Mesh>(null)
  const ribbon = useRef<THREE.Mesh>(null)
  const rig = useRef<Rig | null>(null)
  const hit = useRef(0)
  const calm = useRef(0)
  const next = useRef(0)

  const ready = () => {
    if (rig.current) return rig.current
    const [d, w, p, t, f, g] = [digger, worker, pilgrim, tourist, puff, glow].map((x) => x.current)
    if (!d || !w || !p || !t || !f || !g || !boom.current || !rope.current || !load.current || !tug.current || !whale.current || !ribbon.current) return null
    rig.current = { digger: d, worker: w, pilgrim: p, tourist: t, puff: f, glow: g, boom: boom.current, rope: rope.current, load: load.current, tug: tug.current, whale: whale.current, ribbon: ribbon.current }
    return rig.current
  }

  useLayoutEffect(() => {
    const r = ready()
    if (r) animate(r, 5, 0.25, 0)
  })

  useFrame((state) => {
    const r = ready()
    if (!r) return
    const now = state.clock.elapsedTime
    if (now > next.current) {
      next.current = now + 1
      hit.current = threat(land.x, land.y, land.radius)
    }
    calm.current += (Math.min(1, hit.current * 2) - calm.current) * 0.02
    animate(r, reduced ? 5 + now * 0.05 : now, state.camera.zoom, calm.current)
  })

  const lit = <meshStandardMaterial vertexColors flatShading roughness={0.75} />

  return (
    <group>
      <mesh ref={whale} geometry={geo.whale} renderOrder={40}>
        <meshBasicMaterial vertexColors transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh geometry={geo.ground} renderOrder={41}>
        <meshBasicMaterial vertexColors depthWrite={false} />
      </mesh>
      <mesh ref={ribbon} geometry={geo.ribbon} renderOrder={42} visible={false}>
        <meshBasicMaterial vertexColors transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={tug} geometry={geo.plane} renderOrder={43}>
        <meshBasicMaterial color="#5a3620" />
      </mesh>
      <mesh geometry={geo.still}>{lit}</mesh>
      <mesh geometry={geo.signs}>
        <meshBasicMaterial map={tex.sign} side={THREE.DoubleSide} />
      </mesh>
      <Stand at={DERRICK} size={230}>
        <group ref={boom} position={[0, 1.6, 0]}>
          <mesh geometry={geo.boom}>{lit}</mesh>
          <mesh ref={rope} geometry={geo.rope} position={[1.6, 0.25, 0]}>
            <meshStandardMaterial color="#5a3620" />
          </mesh>
          <mesh ref={load} geometry={geo.load}>
            {lit}
          </mesh>
        </group>
      </Stand>
      <instancedMesh ref={digger} args={[geo.digger, undefined, COUNT.digger]} frustumCulled={false}>
        {lit}
      </instancedMesh>
      <instancedMesh ref={worker} args={[geo.worker, undefined, COUNT.worker]} frustumCulled={false}>
        {lit}
      </instancedMesh>
      <instancedMesh ref={pilgrim} args={[geo.pilgrim, undefined, COUNT.pilgrim]} frustumCulled={false}>
        {lit}
      </instancedMesh>
      <instancedMesh ref={tourist} args={[geo.tourist, undefined, COUNT.tourist]} frustumCulled={false}>
        {lit}
      </instancedMesh>
      <instancedMesh ref={puff} args={[geo.puff, undefined, COUNT.puff]} frustumCulled={false}>
        <meshStandardMaterial flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={glow} args={[geo.plane, undefined, COUNT.glow]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial map={tex.glow} transparent depthWrite={false} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}
