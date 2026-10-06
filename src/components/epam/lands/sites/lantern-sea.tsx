'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { Stand } from '../stand'
import { threat } from '../threat'
import { RAFT, SHACK } from './lantern-sea/data'
import {
  accordionGeometry,
  boatGeometry,
  folkGeometry,
  frameGeometry,
  netGeometry,
  noteGeometry,
  paperGeometry,
  postGeometry,
  raftGeometry,
  shackGeometry,
  rippleGeometry,
  zedGeometry,
} from './lantern-sea/geo'
import { animate, COUNT, G, L, SEG, SIZE, type Rig } from './lantern-sea/motion'

const NIGHT = 2500

function radial(stops: [number, number][]) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  if (g) {
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    for (const [at, alpha] of stops) r.addColorStop(at, `rgba(255,255,255,${alpha})`)
    g.fillStyle = r
    g.fillRect(0, 0, 128, 128)
  }
  return new THREE.CanvasTexture(c)
}

function build() {
  const lines = new THREE.BufferGeometry()
  lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SEG.n * 6), 3))
  return {
    paper: paperGeometry(),
    frame: frameGeometry(),
    folk: folkGeometry(),
    boat: boatGeometry(),
    net: netGeometry(),
    note: noteGeometry(),
    zed: zedGeometry(),
    raft: raftGeometry(),
    accordion: accordionGeometry(),
    shack: shackGeometry(),
    post: postGeometry(),
    plane: new THREE.PlaneGeometry(1, 1),
    ring: rippleGeometry(),
    lines,
  }
}

export default function Scene({ land, reduced }: SceneProps) {
  const geo = useMemo(() => build(), [])
  const tex = useMemo(
    () => ({
      glow: radial([[0, 1], [0.3, 0.5], [0.65, 0.14], [1, 0]]),
      night: radial([[0, 1], [0.45, 0.85], [0.78, 0.35], [1, 0]]),
    }),
    [],
  )
  useEffect(
    () => () => {
      Object.values(geo).forEach((g) => g.dispose())
      Object.values(tex).forEach((t) => t.dispose())
    },
    [geo, tex],
  )

  const paper = useRef<THREE.InstancedMesh>(null)
  const frame = useRef<THREE.InstancedMesh>(null)
  const glow = useRef<THREE.InstancedMesh>(null)
  const boats = useRef<THREE.InstancedMesh>(null)
  const folk = useRef<THREE.InstancedMesh>(null)
  const nets = useRef<THREE.InstancedMesh>(null)
  const rings = useRef<THREE.InstancedMesh>(null)
  const zeds = useRef<THREE.InstancedMesh>(null)
  const posts = useRef<THREE.InstancedMesh>(null)
  const band = useRef<THREE.InstancedMesh>(null)
  const notes = useRef<THREE.InstancedMesh>(null)
  const squeeze = useRef<THREE.Mesh>(null)
  const lines = useRef<THREE.LineSegments>(null)
  const rig = useRef<Rig | null>(null)
  const dim = useRef(0)
  const hit = useRef(0)
  const next = useRef(0)

  const ready = () => {
    if (rig.current) return rig.current
    const parts = [paper, frame, glow, boats, folk, nets, rings, zeds, posts, band, notes] as const
    if (parts.some((r) => !r.current) || !squeeze.current || !lines.current) return null
    const [p, f, g, b, k, n, r, z, s, d, o] = parts.map((x) => x.current as THREE.InstancedMesh)
    rig.current = { paper: p, frame: f, glow: g, boats: b, folk: k, nets: n, rings: r, zeds: z, posts: s, band: d, notes: o, squeeze: squeeze.current, lines: lines.current }
    return rig.current
  }

  useLayoutEffect(() => {
    const r = ready()
    if (r) animate(r, 20, 0.25, 0)
  })

  useFrame((state) => {
    const r = ready()
    if (!r) return
    const now = state.clock.elapsedTime
    if (now > next.current) {
      next.current = now + 1
      hit.current = threat(land.x, land.y, land.radius)
    }
    dim.current += (Math.min(1, hit.current * 1.6) - dim.current) * 0.02
    animate(r, reduced ? 20 : now, state.camera.zoom, dim.current)
  })

  return (
    <group>
      <mesh geometry={geo.plane} position={[0, 0, 0.6]} scale={[NIGHT * 2, NIGHT * 2, 1]} renderOrder={40}>
        <meshBasicMaterial
          map={tex.night}
          color="#4a5cc8"
          transparent
          opacity={0.7}
          depthWrite={false}
          premultipliedAlpha
          blending={THREE.CustomBlending}
          blendSrc={THREE.DstColorFactor}
          blendDst={THREE.OneMinusSrcAlphaFactor}
          toneMapped={false}
        />
      </mesh>
      <instancedMesh ref={glow} args={[geo.plane, undefined, G.n]} frustumCulled={false} renderOrder={41}>
        <meshBasicMaterial map={tex.glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[geo.ring, undefined, COUNT.rings]} frustumCulled={false} renderOrder={42}>
        <meshBasicMaterial vertexColors transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={nets} args={[geo.net, undefined, COUNT.boats]} frustumCulled={false} renderOrder={44}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </instancedMesh>
      <lineSegments ref={lines} geometry={geo.lines} frustumCulled={false} renderOrder={46}>
        <lineBasicMaterial color="#ff4fa3" transparent opacity={0.9} />
      </lineSegments>
      <instancedMesh ref={posts} args={[geo.post, undefined, COUNT.posts]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.8} />
      </instancedMesh>
      <instancedMesh ref={boats} args={[geo.boat, undefined, COUNT.boats]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.75} side={THREE.DoubleSide} />
      </instancedMesh>
      <instancedMesh ref={folk} args={[geo.folk, undefined, COUNT.folk]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={paper} args={[geo.paper, undefined, L.n]} frustumCulled={false}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={frame} args={[geo.frame, undefined, L.n]} frustumCulled={false}>
        <meshStandardMaterial vertexColors flatShading roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={zeds} args={[geo.zed, undefined, COUNT.zeds]} frustumCulled={false} renderOrder={47}>
        <meshBasicMaterial color="#f4f0ff" side={THREE.DoubleSide} />
      </instancedMesh>
      <Stand at={SHACK} size={SIZE.shack}>
        <mesh geometry={geo.shack}>
          <meshStandardMaterial vertexColors flatShading roughness={0.8} />
        </mesh>
      </Stand>
      <Stand at={RAFT} size={SIZE.raft}>
        <mesh geometry={geo.raft}>
          <meshStandardMaterial vertexColors flatShading roughness={0.7} />
        </mesh>
        <instancedMesh ref={band} args={[geo.folk, undefined, COUNT.band]} frustumCulled={false}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </instancedMesh>
        <mesh ref={squeeze} geometry={geo.accordion} position={[0, 0.2, 0.37]}>
          <meshStandardMaterial vertexColors flatShading roughness={0.6} />
        </mesh>
        <instancedMesh ref={notes} args={[geo.note, undefined, COUNT.notes]} frustumCulled={false} renderOrder={47}>
          <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
        </instancedMesh>
      </Stand>
    </group>
  )
}
