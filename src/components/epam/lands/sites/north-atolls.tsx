'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { SceneProps } from '../registry'
import { threat } from '../threat'
import { Beacon } from './north-atolls/beacon'
import { Beads } from './north-atolls/beads'
import { Fleet } from './north-atolls/fleet'
import { C, flat, rgba } from './north-atolls/kit'
import { Life } from './north-atolls/life'
import { ATOLL, HAWSER, type P, ROAD } from './north-atolls/map'
import { harbourGeometry } from './north-atolls/props'

const LIFT = 7

function shallows(at: P, r: number, wide: number, pts: [number, number][], cols: [number, number, number, number][]) {
  const n = 48
  const inner = rgba('#3fd9c0', 0.55)
  const outer = rgba(C.mint, 0)
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI * 2
    const a1 = ((k + 1) / n) * Math.PI * 2
    const p = (a: number, rr: number): [number, number] => [at[0] + Math.cos(a) * rr, at[1] + Math.sin(a) * rr]
    pts.push(p(a0, r), p(a0, r + wide), p(a1, r + wide), p(a0, r), p(a1, r + wide), p(a1, r))
    cols.push(inner, outer, outer, inner, outer, inner)
  }
}

function ribbon(path: P[], w: number, color: string, a: number, pts: [number, number][], cols: [number, number, number, number][]) {
  const c = rgba(color, a)
  for (let k = 0; k < path.length - 1; k++) {
    const [x0, y0] = path[k]
    const [x1, y1] = path[k + 1]
    const d = Math.hypot(x1 - x0, y1 - y0)
    const nx = (-(y1 - y0) / d) * w
    const ny = ((x1 - x0) / d) * w
    pts.push([x0 + nx, y0 + ny], [x0 - nx, y0 - ny], [x1 - nx, y1 - ny], [x0 + nx, y0 + ny], [x1 - nx, y1 - ny], [x1 + nx, y1 + ny])
    for (let j = 0; j < 6; j++) cols.push(c)
  }
}

function decals() {
  const pts: [number, number][] = []
  const cols: [number, number, number, number][] = []
  shallows(ATOLL.light.at, ATOLL.light.r * 0.96, 260, pts, cols)
  shallows(ATOLL.count.at, ATOLL.count.r * 0.96, 220, pts, cols)
  shallows(ATOLL.pen.at, ATOLL.pen.r * 0.96, 170, pts, cols)
  ribbon(ROAD.slice(0, 4), 22, C.sand, 0.9, pts, cols)
  ribbon(ROAD.slice(0, 4), 26, C.wood, 0.35, pts, cols)
  ribbon(ROAD.slice(3), 24, C.blush, 0.3, pts, cols)
  ribbon(HAWSER, 5, '#7a4a3a', 0.55, pts, cols)
  return flat(pts, cols, 0.6)
}

export default function Scene({ land, reduced }: SceneProps) {
  const harbour = useMemo(() => harbourGeometry(), [])
  const sea = useMemo(() => decals(), [])
  useEffect(() => () => [harbour, sea].forEach((g) => g.dispose()), [harbour, sea])
  const clock = useRef(0)
  const alarm = useRef(0)
  const calm = useRef(1)
  const fear = useRef(0)
  const polled = useRef(0)

  useFrame((state, dt) => {
    const step = Math.min(dt, 0.1)
    if (state.clock.elapsedTime - polled.current > 1) {
      polled.current = state.clock.elapsedTime
      fear.current = threat(land.x, land.y, land.radius)
    }
    alarm.current += (Math.min(1, fear.current * 4) - alarm.current) * step
    calm.current = 1 - alarm.current * 0.75
    clock.current += step * (reduced ? 0.12 : 1)
  })

  return (
    <group position={[0, 0, LIFT]}>
      <mesh geometry={sea} renderOrder={40}>
        <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={harbour}>
        <meshStandardMaterial vertexColors flatShading roughness={0.75} side={THREE.DoubleSide} />
      </mesh>
      <Fleet reduced={reduced} calm={calm} />
      <Beads reduced={reduced} clock={clock} />
      <Life clock={clock} alarm={alarm} />
      <Beacon reduced={reduced} clock={clock} alarm={alarm} />
    </group>
  )
}
