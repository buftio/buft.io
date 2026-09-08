'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { Group } from 'three'
import { Explosion } from './explosion'
import { Celebration } from './celebration'
import { Crowd } from './crowd'
import { Opponent } from './opponents'
import { Wall } from './wall'
import { grenadeHand } from './throw-pose'
import {
  Clay,
  Instanced,
  palette,
  type Item,
  type Vec3,
} from '../marketdata/models/clay'
import { along, pathLength } from './game'
import { WORLD_HEIGHT, type Orb, type Point, type SceneState } from './types'
import {
  at,
  Ground,
  Pitch,
  Rails,
  Reservoir,
  Surroundings,
  Trooper,
} from './stage'

const grenadeColor = '#c77750'
const resting: Orb[] = Array.from({ length: 24 }, (_, id) => ({
  id,
  spin: 0,
  x: 84 + (id % 4) * 2.5,
  y: 57 - Math.floor(id / 4) * 2.7,
}))

function Rig() {
  const { get, size, setDpr, invalidate } = useThree()
  useLayoutEffect(() => {
    const { camera, gl } = get()
    camera.position.set(0, 0, 300)
    camera.lookAt(0, 0, 0)
    camera.zoom = Math.min(size.width / 100, size.height / WORLD_HEIGHT)
    camera.updateProjectionMatrix()
    setDpr(
      Math.min(
        window.devicePixelRatio,
        1.5,
        gl.capabilities.maxTextureSize / Math.max(1, size.height),
      ),
    )
    invalidate()
  }, [get, size.width, size.height, setDpr, invalidate])
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    onReady()
  })
  return null
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#fff4dc', '#7b9288', 1.1]} />
      <directionalLight
        position={[-70, 160, 220]}
        intensity={2.4}
        color="#fff1d7"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={1}
        shadow-camera-far={700}
        shadow-bias={-0.0003}
        shadow-normalBias={0.05}
        shadow-radius={4}
      />
    </>
  )
}

function Grenade({ point }: { point: Point }) {
  return (
    <group position={at(point, 1.2)}>
      <Clay shape="sphere" color={grenadeColor} size={2.4} />
      <Clay
        shape="torus"
        color={palette.ink}
        size={2.5}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <Clay
        shape="cylinder"
        color={palette.steel}
        size={[0.9, 0.8, 0.9]}
        position={[0, 1.4, 0]}
      />
    </group>
  )
}

function Aim({ points }: { points: Point[] }) {
  const items = useMemo<Item[]>(
    () =>
      points.map((p, i) => ({
        position: at(p, 1),
        scale: 1.1 - (i / Math.max(1, points.length)) * 0.7,
      })),
    [points],
  )
  return items.length ? (
    <Instanced shape="sphere" color="#3e4a3a" items={items} />
  ) : null
}

function Balls({ orbs }: { orbs: Orb[] }) {
  const items = useMemo<Item[]>(
    () =>
      orbs.map((o) => ({
        position: at(o, o.held ? 6 : 0),
        scale: 2.8,
      })),
    [orbs],
  )
  const patches = useMemo<Item[]>(
    () =>
      orbs.flatMap((o) =>
        [0, 2.1, 4.2].map((k) => ({
          position: [
            o.x - 50 + Math.cos(o.spin + k) * 1.05,
            135 - o.y + Math.sin(o.spin + k) * 1.05,
            o.held ? 6.7 : 0.7,
          ] as Vec3,
          scale: [0.9, 0.9, 0.5] as Vec3,
        })),
      ),
    [orbs],
  )
  if (!items.length) return null
  return (
    <>
      <Instanced shape="sphere" color="#f5f1e6" items={items} />
      <Instanced shape="sphere" color={palette.ink} items={patches} />
    </>
  )
}

function Football({ point }: { point: Point }) {
  return (
    <group position={at(point, 0)}>
      <Clay shape="sphere" color="#f5f1e6" size={2.8} />
      {[0.4, 2.5, 4.6].map((a) => (
        <Clay
          key={a}
          shape="sphere"
          color={palette.ink}
          size={[1, 1, 0.5]}
          position={[Math.cos(a) * 1.1, Math.sin(a) * 1.1, 0.85]}
        />
      ))}
    </group>
  )
}
const playerBlue = '#3d6fa5',
  playerBase = '#274b73'

function Player({ point, wiggle }: { point: Point; wiggle: boolean }) {
  const body = useRef<Group>(null)
  const clock = useRef(0)
  const invalidate = useThree((s) => s.invalidate)
  useLayoutEffect(() => {
    if (wiggle || !body.current) return
    body.current.rotation.z = 0
    body.current.position.y = 2.2
    body.current.scale.set(1, 1, 1)
    invalidate()
  }, [wiggle, invalidate])
  useFrame((_, delta) => {
    if (!wiggle || !body.current) return
    clock.current += Math.min(delta, 0.05)
    const t = clock.current
    const beat = Math.sin(t * 5)
    body.current.rotation.z = beat * 0.09
    body.current.position.y = 2.2 + Math.max(0, Math.sin(t * 10)) * 0.35
    body.current.scale.set(1 + beat * 0.03, 1 - beat * 0.03, 1)
    invalidate()
  })
  return (
    <group position={at(point, -1.5)}>
      <Clay
        shape="cylinder"
        color={playerBase}
        size={[5.4, 1.2, 5.4]}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0.6]}
      />
      <group ref={body} position={[0, 2.2, 0]}>
        <Clay
          shape="cylinder"
          color="#f3e6cf"
          size={[1.05, 3.2, 1.05]}
          position={[-1.1, -1.1, 1.7]}
          rotation={[0.35, 0, 0]}
        />
        <Clay
          shape="cylinder"
          color="#f3e6cf"
          size={[1.05, 3.2, 1.05]}
          position={[1.1, -1.1, 1.7]}
          rotation={[-0.35, 0, 0]}
        />
        <Clay
          shape="sphere"
          color={playerBlue}
          size={[4.4, 3, 2.2]}
          position={[0, 0, 2.4]}
        />
        <Clay
          shape="sphere"
          color="#c78d63"
          size={2.25}
          position={[0, 0.4, 4.4]}
        />
        <Clay
          shape="sphere"
          color={playerBase}
          size={[2.45, 1.25, 1.1]}
          position={[0, -0.5, 5]}
        />
      </group>
    </group>
  )
}

function KickAim({ points }: { points: Point[] }) {
  const items = useMemo<Item[]>(
    () =>
      points.map((p, i) => ({
        position: at(p, 0.2),
        scale: 1.25 - (i / Math.max(1, points.length)) * 0.75,
      })),
    [points],
  )
  return items.length ? (
    <Instanced shape="sphere" color="#fff6e0" items={items} />
  ) : null
}

function Trace({ points, color }: { points: Point[]; color: string }) {
  const items = useMemo<Item[]>(() => {
    if (points.length < 2) return []
    const total = pathLength(points)
    const dots: Item[] = []
    for (let d = 0; d <= total; d += 2.6)
      dots.push({ position: at(along(points, d), -0.9), scale: 1 })
    return dots
  }, [points])
  return items.length ? (
    <Instanced shape="sphere" color={color} items={items} />
  ) : null
}

function Outcome({ state }: { state: SceneState }) {
  if (state.outcome === 'goal') return <Celebration reduced={state.reduced} />
  if ((state.outcome === 'saved' || state.outcome === 'lost') && state.football)
    return (
      <group position={at(state.football, 2)}>
        <Clay
          shape="slab"
          color={palette.red}
          size={[4.6, 0.8, 0.5]}
          rotation={[0, 0, Math.PI / 4]}
        />
        <Clay
          shape="slab"
          color={palette.red}
          size={[4.6, 0.8, 0.5]}
          rotation={[0, 0, -Math.PI / 4]}
        />
      </group>
    )
  return null
}

function World({ state }: { state: SceneState }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => invalidate(), [state, invalidate])
  const orbs = state.wallBroken ? state.balls : resting
  const holding = !state.grenade && !state.wallBroken
  const traceColor =
    state.outcome === 'goal'
      ? '#f3efe0'
      : state.outcome === 'saved' || state.outcome === 'lost'
        ? palette.red
        : '#d8c9a3'
  return (
    <>
      <Ground />
      <Surroundings />
      <Trooper progress={state.throwProgress} strength={state.throwStrength} />
      <Wall
        bricks={state.wallBricks}
        broken={state.wallBroken}
        reduced={state.reduced}
      />
      <Reservoir open={state.wallBroken} />
      <Rails feeding={!state.football} />
      <Pitch />
      <Crowd
        cheering={state.outcome === 'goal'}
        reduced={state.reduced}
        pokes={state.fanPokes}
      />
      {holding && (
        <Grenade
          point={grenadeHand(state.throwProgress, state.throwStrength)}
        />
      )}
      {state.grenade && <Grenade point={state.grenade} />}
      <Aim points={state.aim} />
      {state.explosion && (
        <Explosion blast={state.explosion} reduced={state.reduced} />
      )}
      <Balls orbs={orbs} />
      <Player
        point={state.player}
        wiggle={
          !!state.football &&
          state.outcome === 'setup' &&
          !state.kickDragging &&
          !state.reduced
        }
      />
      <Opponent kind="keeper" point={state.keeper} reduced={state.reduced} />
      {state.defenders.map((defender, i) => (
        <Opponent
          key={i}
          kind="defender"
          index={i}
          point={defender}
          reduced={state.reduced}
        />
      ))}
      <Trace points={state.trace} color={traceColor} />
      <KickAim points={state.kickAim} />
      {state.football && <Football point={state.football} />}
      <Outcome state={state} />
    </>
  )
}

export default function Scene({
  state,
  onReady,
}: {
  state: SceneState
  onReady: () => void
}) {
  return (
    <Canvas
      orthographic
      shadows="percentage"
      frameloop="demand"
      resize={{ offsetSize: true, debounce: 0 }}
      camera={{ position: [0, 0, 300], zoom: 8, near: 1, far: 600 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true }}
    >
      <Rig />
      <Ready onReady={onReady} />
      <Lights />
      <World state={state} />
    </Canvas>
  )
}
