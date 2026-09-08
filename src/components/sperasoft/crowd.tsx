'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import { Color, Matrix4, Object3D, type InstancedMesh } from 'three'
import { clay, geo } from '../marketdata/models/clay'
import { at } from './stage'
import { fans } from './fan-layout'

type Parts = { head: InstancedMesh; body: InstancedMesh; arm: InstancedMesh }

const IDLE_ARM = Math.PI - 0.35
const RAISED_ARM = 0.38
const ARM_LENGTH = 2
const SHOULDER = { x: 0.95, y: 2.1 }
const CHEER_RATE = 4

const root = new Object3D()
const part = new Object3D()
const matrix = new Matrix4()
const tint = new Color()
const annoyedColor = new Color('#d94c3d')

function place(
  mesh: InstancedMesh,
  index: number,
  position: [number, number, number],
  rotation: number,
  scale: [number, number, number],
) {
  part.position.set(...position)
  part.rotation.set(0, 0, rotation)
  part.scale.set(...scale)
  part.updateMatrix()
  matrix.multiplyMatrices(root.matrix, part.matrix)
  mesh.setMatrixAt(index, matrix)
}

function pose(
  { head, body, arm }: Parts,
  time: number,
  level: number,
  annoyed: number[],
) {
  fans.forEach((fan, i) => {
    const anger = Math.min(1, (annoyed[i] ?? 0) * 2)
    const mood = level * (1 - anger)
    const beat = time * fan.rate + fan.phase
    const idleBob = Math.sin(beat * 2) * 0.12
    const jump = Math.abs(Math.sin(time * 5.2 * fan.rate + fan.phase)) * 1.8
    const lift = idleBob * (1 - mood) + jump * mood
    const lean =
      Math.sin(beat * 0.7) * 0.05 * (1 - mood) +
      Math.sin(time * 19 + fan.phase) * 0.13 * anger
    const swing = Math.sin(beat) * 0.12 * (1 - mood)
    const wave = Math.sin(time * 8 + fan.phase) * 0.22 * mood
    const base = at({ x: fan.x, y: fan.y }, 0)
    root.position.set(base[0], base[1] + lift, base[2])
    root.rotation.set(0, 0, lean)
    root.scale.setScalar(fan.size)
    root.updateMatrix()
    place(body, i, [0, 1.15, 0], 0, [1.7, 2.3, 1.4])
    place(
      head,
      i,
      [Math.sin(time * 22) * 0.25 * anger, 3.05, 0.1],
      Math.sin(time * 18) * 0.2 * anger,
      [1.5, 1.5, 1.5],
    )
    head.setColorAt(i, tint.set(fan.skin).lerp(annoyedColor, anger * 0.75))
    for (const side of [-1, 1]) {
      const happyAngle =
        IDLE_ARM + (RAISED_ARM - IDLE_ARM) * mood + swing + wave
      const protestAngle = side === 1 ? 0.8 + Math.sin(time * 17) * 0.4 : 2.15
      const angle = -side * (happyAngle * (1 - anger) + protestAngle * anger)
      place(
        arm,
        i * 2 + (side + 1) / 2,
        [
          side * SHOULDER.x - Math.sin(angle) * (ARM_LENGTH / 2),
          SHOULDER.y + Math.cos(angle) * (ARM_LENGTH / 2),
          0,
        ],
        angle,
        [0.55, ARM_LENGTH, 0.55],
      )
    }
  })
  for (const mesh of [head, body, arm]) mesh.instanceMatrix.needsUpdate = true
  if (head.instanceColor) head.instanceColor.needsUpdate = true
}

function paint({ head, body, arm }: Parts) {
  fans.forEach((fan, i) => {
    head.setColorAt(i, tint.set(fan.skin))
    body.setColorAt(i, tint.set(fan.shirt))
    arm.setColorAt(i * 2, tint.set(fan.shirt))
    arm.setColorAt(i * 2 + 1, tint.set(fan.shirt))
  })
  for (const mesh of [head, body, arm])
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
}

export function Crowd({
  cheering,
  reduced,
  pokes,
}: {
  cheering: boolean
  reduced: boolean
  pokes: number[]
}) {
  const heads = useRef<InstancedMesh>(null)
  const bodies = useRef<InstancedMesh>(null)
  const arms = useRef<InstancedMesh>(null)
  const cheer = useRef(cheering ? 1 : 0)
  const clock = useRef(0)
  const previousPokes = useRef(pokes)
  const annoyed = useRef<number[]>(fans.map(() => 0))
  const invalidate = useThree((state) => state.invalidate)
  const parts = (): Parts | null =>
    heads.current && bodies.current && arms.current
      ? { head: heads.current, body: bodies.current, arm: arms.current }
      : null

  useLayoutEffect(() => {
    const meshes = parts()
    if (!meshes) return
    paint(meshes)
    pose(meshes, 0, cheer.current, annoyed.current)
  }, [])

  useLayoutEffect(() => {
    const meshes = parts()
    if (!meshes || !reduced) return
    cheer.current = cheering ? 1 : 0
    pose(meshes, 0, cheer.current, annoyed.current)
    invalidate()
  }, [cheering, reduced, invalidate])

  useLayoutEffect(() => {
    pokes.forEach((count, i) => {
      if (count !== previousPokes.current[i]) annoyed.current[i] = 2.1
    })
    previousPokes.current = pokes
    const meshes = parts()
    if (meshes)
      pose(
        meshes,
        reduced ? 0.13 : clock.current,
        cheer.current,
        annoyed.current,
      )
    invalidate()
    if (!reduced) return
    const timer = setTimeout(() => {
      annoyed.current.fill(0)
      const current = parts()
      if (current) pose(current, 0, cheer.current, annoyed.current)
      invalidate()
    }, 2100)
    return () => clearTimeout(timer)
  }, [pokes, reduced, invalidate])

  useFrame((_, delta) => {
    const meshes = parts()
    if (!meshes || reduced) return
    const dt = Math.min(delta, 0.05)
    clock.current += dt
    annoyed.current = annoyed.current.map((age) => Math.max(0, age - dt))
    const target = cheering ? 1 : 0
    cheer.current +=
      Math.sign(target - cheer.current) *
      Math.min(Math.abs(target - cheer.current), dt * CHEER_RATE)
    pose(meshes, clock.current, cheer.current, annoyed.current)
    invalidate()
  })

  return (
    <>
      <instancedMesh
        ref={bodies}
        args={[geo.cylinder, clay('#ffffff', 'crowd'), fans.length]}
        castShadow
        receiveShadow
        dispose={null}
      />
      <instancedMesh
        ref={heads}
        args={[geo.sphere, clay('#ffffff', 'crowd'), fans.length]}
        castShadow
        receiveShadow
        dispose={null}
      />
      <instancedMesh
        ref={arms}
        args={[geo.cylinder, clay('#ffffff', 'crowd'), fans.length * 2]}
        castShadow
        receiveShadow
        dispose={null}
      />
    </>
  )
}
