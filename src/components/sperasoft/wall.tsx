'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Instanced, pick, type Item } from '../marketdata/models/clay'
import type { WallBrick } from './types'
import { at, Block, rand } from './stage'

const bricks = ['#c9a482', '#b8916c', '#d3b08d']

const BRICK = 2.85
const GROUND = 60.5
const brickColor = (brick: WallBrick) =>
  pick(bricks, Math.floor(rand(brick.id, 7) * bricks.length))
function brickItems(list: WallBrick[]): Item[] {
  return list.map((brick) => ({
    position: at(brick, 0),
    scale: [BRICK, BRICK, 4],
    color: brickColor(brick),
  }))
}
const DEBRIS_LIFE = 0.9
type Debris = {
  chunks: (WallBrick & { vx: number; vy: number; spin: number })[]
  start: number
}
function scatter(removed: WallBrick[]): Debris['chunks'] {
  const cx = removed.reduce((sum, b) => sum + b.x, 0) / removed.length
  const cy = removed.reduce((sum, b) => sum + b.y, 0) / removed.length
  return removed.map((brick) => {
    const dx = brick.x - cx + (rand(brick.id, 11) - 0.5) * 3
    const dy = cy - brick.y + (rand(brick.id, 12) - 0.3) * 3
    const norm = Math.hypot(dx, dy) || 1
    const speed = 14 + rand(brick.id, 13) * 12
    return {
      ...brick,
      vx: (dx / norm) * speed,
      vy: (dy / norm) * speed + 8,
      spin: (rand(brick.id, 14) - 0.5) * 14,
    }
  })
}
function debrisItems(debris: Debris, age: number): Item[] {
  const fade = 1 - Math.min(1, Math.max(0, (age - 0.35) / (DEBRIS_LIFE - 0.35)))
  const scale = Math.max(0.01, BRICK * 0.9 * fade)
  const floor = 135 - GROUND + scale / 2
  return debris.chunks.map((chunk, i) => ({
    position: [
      chunk.x - 50 + chunk.vx * age,
      Math.max(floor, 135 - chunk.y + chunk.vy * age - 60 * age * age),
      2.5 + (i % 3) * 0.5,
    ],
    rotation: [0, 0, chunk.spin * age],
    scale: [scale, scale, 3],
    color: brickColor(chunk),
  }))
}
function rubbleItems(): Item[] {
  return Array.from({ length: 14 }, (_, i) => {
    const w = 1.4 + rand(i, 1) * 1.4,
      h = 1.1 + rand(i, 2) * 0.9
    const lift = i % 5 === 0 ? h * 0.9 : 0
    return {
      position: [
        68 + rand(i, 0) * 13 - 50,
        135 - (60.5 - h / 2 - lift),
        -1.5 + rand(i, 3) * 3,
      ],
      rotation: [0, 0, (rand(i, 4) - 0.5) * 0.9],
      scale: [w, h, 2.6],
      color: pick(bricks, i),
    }
  })
}
export function Wall({
  bricks: standing,
  broken,
  reduced,
}: {
  bricks: WallBrick[]
  broken: boolean
  reduced: boolean
}) {
  const invalidate = useThree((s) => s.invalidate)
  const previous = useRef(standing)
  const [debris, setDebris] = useState<(Debris & { age: number }) | null>(null)
  useEffect(() => {
    const before = previous.current
    previous.current = standing
    if (before === standing || reduced) return
    const kept = new Set(standing.map((brick) => brick.id))
    const removed = before.filter((brick) => !kept.has(brick.id))
    if (!removed.length) return
    setDebris({ chunks: scatter(removed), start: performance.now(), age: 0 })
    invalidate()
  }, [standing, reduced, invalidate])
  useFrame(() => {
    if (!debris) return
    const elapsed = (performance.now() - debris.start) / 1000
    if (elapsed >= DEBRIS_LIFE || reduced) {
      setDebris(null)
      return
    }
    setDebris({ ...debris, age: elapsed })
    invalidate()
  })
  const items = useMemo(
    () => (broken ? rubbleItems() : brickItems(standing)),
    [broken, standing],
  )
  const falling = useMemo(
    () => (debris ? debrisItems(debris, debris.age) : null),
    [debris],
  )
  return (
    <>
      {items.length > 0 && <Instanced items={items} />}
      {falling && falling.length > 0 && <Instanced items={falling} />}
      {broken && <Block x={[70.1, 81.9]} y={[59, 62]} color="#b8916c" />}
    </>
  )
}
