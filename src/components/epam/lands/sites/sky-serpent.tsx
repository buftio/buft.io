'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { bodyGeometry, shadowGeometry } from './sky-serpent/body'
import { COUNT, pegSpots, ropeColors } from './sky-serpent/cast'
import { clamp, smooth } from './sky-serpent/kit'
import { animate, type Rig } from './sky-serpent/life'
import * as G from './sky-serpent/models'
import { flex, spine } from './sky-serpent/spine'

const EAST = { x: 40500, y: 15500, r: 6500 }
const NODE = { x: 27000, y: 21000, r: 21000 }
const CALM = new THREE.Color('#ffb347')
const ALARM = new THREE.Color('#ff6a4d')

function halo() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    r.addColorStop(0, 'rgba(255,255,255,1)')
    r.addColorStop(0.5, 'rgba(255,255,255,0.55)')
    r.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  }
  return new THREE.CanvasTexture(c)
}

function build() {
  return {
    body: bodyGeometry(),
    shadow: shadowGeometry(),
    head: G.headGeometry(),
    eye: G.eyeGeometry(),
    lid: G.lidGeometry(),
    tuft: G.tuftGeometry(),
    girth: G.girthGeometry(),
    house: G.houseGeometry(),
    folk: G.folkGeometry(),
    bird: G.birdGeometry(),
    wing: G.wingGeometry(),
    nest: G.nestGeometry(),
    zed: G.zedGeometry(),
    puff: G.puffGeometry(),
    rope: G.ropeGeometry(),
    bead: new THREE.SphereGeometry(1, 8, 6),
    feather: G.featherGeometry(),
    peg: G.pegGeometry(),
    leg: G.legGeometry(),
    bucket: G.bucketGeometry(),
  }
}

export default function Scene({ reduced }: SceneProps) {
  const geo = useMemo(() => build(), [])
  const tex = useMemo(() => halo(), [])
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo])
  useEffect(() => () => tex.dispose(), [tex])
  const aura = useRef<THREE.MeshBasicMaterial>(null)
  const sp = useRef(spine())
  const pegs = useRef<[number, number][] | null>(null)
  const head = useRef<THREE.Group>(null)
  const feather = useRef<THREE.Mesh>(null)
  const names = ['lids', 'tufts', 'girths', 'houses', 'folk', 'birds', 'wings', 'nests', 'zeds', 'puffs', 'ropes', 'beads', 'pegs', 'legs', 'buckets'] as const
  const inst = useRef<Partial<Record<(typeof names)[number], THREE.InstancedMesh>>>({})
  const rig = useRef<Rig | null>(null)
  const clock = useRef({ breath: 0, wake: 0, goal: 0, next: 0, base: -1 })

  const ref = (k: (typeof names)[number]) => (m: THREE.InstancedMesh | null) => {
    if (m) inst.current[k] = m
  }

  const ready = () => {
    if (rig.current) return rig.current
    const i = inst.current
    if (!head.current || !feather.current || names.some((k) => !i[k])) return null
    const all = i as Record<(typeof names)[number], THREE.InstancedMesh>
    ropeColors(all.ropes)
    rig.current = { body: geo.body, shadow: geo.shadow, head: head.current, feather: feather.current, ...all }
    return rig.current
  }

  useFrame((state, dt) => {
    const r = ready()
    if (!r) return
    const c = clock.current
    const time = reduced ? 2 : state.clock.elapsedTime
    if (state.clock.elapsedTime >= c.next) {
      c.next = state.clock.elapsedTime + 1
      const all = threat(NODE.x, NODE.y, NODE.r)
      if (all <= 0) c.base = -1
      else if (c.base < 0) c.base = all
      c.goal = all > 0 ? clamp(Math.max(0.3 + 0.7 * smooth((all / c.base - 1) / 0.8), threat(EAST.x, EAST.y, EAST.r) * 6)) : 0
    }
    const step = reduced ? 0 : Math.min(dt, 0.1)
    c.wake = reduced ? c.goal : c.wake + (c.goal - c.wake) * Math.min(1, step * 0.4)
    c.breath = (c.breath + step / (5.6 - 2.4 * c.wake)) % 1
    if (!pegs.current) {
      flex(sp.current, 0, 0, 0)
      pegs.current = pegSpots(sp.current)
    }
    animate(r, sp.current, { time, breath: c.breath, wake: c.wake, zoom: state.camera.zoom, pegs: pegs.current })
    if (aura.current) aura.current.color.lerpColors(CALM, ALARM, c.wake)
    if (aura.current) aura.current.opacity = (0.5 + 0.14 * Math.sin(c.breath * Math.PI * 2) + 0.2 * c.wake) * clamp(1.25 - state.camera.zoom * 0.7, 0.55, 1)
    for (const k of names) if (k !== 'lids') r[k].instanceMatrix.needsUpdate = true
  })

  const solid = <meshStandardMaterial vertexColors flatShading roughness={0.7} side={THREE.DoubleSide} />
  const bright = <meshBasicMaterial vertexColors toneMapped={false} />
  return (
    <group>
      <mesh position={[0, 30, 1]} rotation-z={0.55} scale={[2700, 1500, 1]} renderOrder={40}>
        <planeGeometry />
        <meshBasicMaterial ref={aura} map={tex} color="#ffb347" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <mesh geometry={geo.shadow} frustumCulled={false} renderOrder={41}>
        <meshBasicMaterial color="#3a2a66" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh geometry={geo.body} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.55} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>
      <group ref={head} rotation-order="ZYX">
        <mesh geometry={geo.head}>{solid}</mesh>
        <mesh geometry={geo.eye} position={[G.EYE.x, G.EYE.y, G.EYE.z]}>{bright}</mesh>
        <mesh geometry={geo.eye} position={[G.EYE.x, -G.EYE.y, G.EYE.z]}>{bright}</mesh>
        <instancedMesh ref={ref('lids')} args={[geo.lid, undefined, 2]} frustumCulled={false}>
          {solid}
        </instancedMesh>
        <mesh ref={feather} geometry={geo.feather} scale={64}>
          <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
      </group>
      <instancedMesh ref={ref('legs')} args={[geo.leg, undefined, COUNT.legs]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('buckets')} args={[geo.bucket, undefined, COUNT.buckets]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('tufts')} args={[geo.tuft, undefined, COUNT.tufts]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('girths')} args={[geo.girth, undefined, COUNT.girths]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('nests')} args={[geo.nest, undefined, COUNT.nests]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('houses')} args={[geo.house, undefined, COUNT.houses]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={ref('ropes')} args={[geo.rope, undefined, COUNT.ropes]} frustumCulled={false}>
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={ref('beads')} args={[geo.bead, undefined, COUNT.beads]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial color="#ffd36b" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={ref('pegs')} args={[geo.peg, undefined, COUNT.pegs]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={ref('folk')} args={[geo.folk, undefined, COUNT.folk]} frustumCulled={false}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('birds')} args={[geo.bird, undefined, COUNT.birds]} frustumCulled={false} renderOrder={47}>
        {solid}
      </instancedMesh>
      <instancedMesh ref={ref('wings')} args={[geo.wing, undefined, COUNT.wings]} frustumCulled={false} renderOrder={47}>
        <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={ref('puffs')} args={[geo.puff, undefined, COUNT.puffs]} frustumCulled={false} renderOrder={48}>
        <meshStandardMaterial vertexColors roughness={1} emissive="#8a80b0" emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh ref={ref('zeds')} args={[geo.zed, undefined, COUNT.zeds]} frustumCulled={false} renderOrder={49}>
        <meshBasicMaterial color="#5b4fb0" side={THREE.DoubleSide} depthTest={false} />
      </instancedMesh>
    </group>
  )
}
