'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Plane, Raycaster, Vector2, Vector3, type Mesh } from 'three'
import {
  BELT,
  build,
  canBuild,
  grab,
  isOpen,
  release,
  remove,
  type Game,
} from './factory'
import { Items, eachItem, heightOf } from './items'
import {
  BORDER,
  GATE,
  H,
  W,
  inside,
  siteAt,
  toWorld,
  type Cell,
  type Dir,
  type Kind,
  type Site,
} from './map'
import type { Signal, Tool } from './world'

export type Look = { site: Site } | { item: Kind }

type Props = {
  game: RefObject<Game>
  tool: Tool
  onSignal: (signal: Signal) => void
  onInspect: (look: Look) => void
}

const ground = new Plane(new Vector3(0, 1, 0), 0)
const ray = new Raycaster()
const ndc = new Vector2()
const hit = new Vector3()
const seen = new Vector3()
const WALL = toWorld(BORDER, 0)[0]
const DOOR = toWorld(...GATE)[1]
const REACH = 0.5 + 0.28
const SLACK = 0.3

const toCell = (x: number, z: number): Cell => [
  Math.floor(x + W / 2),
  Math.floor(z + H / 2),
]

function dirTo(from: Cell, to: Cell): Dir {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 0 : 2
  return dy > 0 ? 1 : 3
}

/** Moves a carried item toward the cursor; the border stops it unless it lines up with an open gate. */
function slide(
  from: { x: number; z: number },
  to: { x: number; z: number },
  open: boolean,
) {
  if (Math.abs(from.x - WALL) < REACH)
    return {
      x: to.x,
      z: Math.min(DOOR + SLACK, Math.max(DOOR - SLACK, to.z)),
      blocked: false,
    }
  const side = Math.sign(from.x - WALL)
  const face = WALL + side * REACH
  if ((to.x - face) * side >= 0) return { ...to, blocked: false }
  if (open && Math.abs(to.z - DOOR) <= SLACK) return { ...to, blocked: false }
  return { x: face, z: to.z, blocked: true }
}

export function Input({ game, tool, onSignal, onInspect }: Props) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const hand = useRef<{ x: number; z: number } | null>(null)
  const lit = useRef<number | null>(null)
  const cursor = useRef<Mesh>(null)
  const [hover, setHover] = useState<Cell | null>(null)

  useEffect(() => {
    const state = game.current
    let down: {
      id: number
      x: number
      y: number
      cell: Cell
      moved: boolean
    } | null = null
    let last: Cell | null = null
    let broke = false
    let bumped = false
    let press = 0
    const place = (cell: Cell, dir: Dir) => {
      if (build(state, cell[0], cell[1], dir)) return true
      if (!broke && canBuild(state, ...cell) && state.wallet < BELT) {
        broke = true
        onSignal('broke')
      }
      return false
    }
    const pick = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect()
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? hit.clone() : null
    }
    const aim = (cursor: string) => canvas.style.setProperty('cursor', cursor)
    const nearest = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect()
      let best: { id: number; kind: Kind; d: number } | null = null
      eachItem(state, 0, null, ({ item, x, y, z }) => {
        seen.set(x, y + heightOf(item.kind) / 2, z).project(camera)
        const sx = rect.left + ((seen.x + 1) / 2) * rect.width
        const sy = rect.top + ((1 - seen.y) / 2) * rect.height
        const d = Math.hypot(sx - event.clientX, sy - event.clientY)
        if (d < 40 && (!best || d < best.d))
          best = { id: item.id, kind: item.kind, d }
      })
      return best as { id: number; kind: Kind; d: number } | null
    }
    const inspect = (event: { clientX: number; clientY: number }) => {
      const found = nearest(event)
      const point = pick(event)
      const site = point ? siteAt(...toCell(point.x, point.z)) : null
      if (found) onInspect({ item: found.kind })
      else if (site) onInspect({ site })
    }
    const lay = (cell: Cell) => {
      if (!last) return
      let at = last
      while (at[0] !== cell[0] || at[1] !== cell[1]) {
        const dir = dirTo(at, cell)
        const next: Cell = [
          at[0] + [1, 0, -1, 0][dir],
          at[1] + [0, 1, 0, -1][dir],
        ]
        build(state, at[0], at[1], dir)
        if (place(next, dir)) onSignal('built')
        at = next
      }
      last = cell
    }
    const carry = (point: Vector3) => {
      if (!hand.current) return
      const moved = slide(hand.current, point, isOpen(state))
      hand.current = { x: moved.x, z: moved.z }
      if (moved.blocked && !bumped) {
        bumped = true
        if (!isOpen(state)) state.denied = state.time
        onSignal('denied')
      }
      if (!moved.blocked) bumped = false
    }
    const cancel = (id?: number) => {
      clearTimeout(press)
      if (!down || (id !== undefined && down.id !== id)) return
      if (state.held) release(state, -1, -1)
      hand.current = null
      aim('')
      down = null
      last = null
    }
    const onDown = (event: PointerEvent) => {
      if (event.button > 0 || down) return
      const point = pick(event)
      if (!point) return
      const cell = toCell(point.x, point.z)
      down = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cell,
        moved: false,
      }
      broke = false
      bumped = false
      if (event.pointerType === 'touch') {
        const at = { clientX: event.clientX, clientY: event.clientY }
        press = window.setTimeout(() => {
          if (!down || down.moved) return
          cancel(down.id)
          inspect(at)
        }, 550)
      }
      if (tool === 'hand') {
        const found = nearest(event)
        if (found && grab(state, found.id)) {
          hand.current = { x: point.x, z: point.z }
          lit.current = null
          aim('grabbing')
          onSignal('lift')
        }
      } else if (tool === 'belt') last = cell
      else if (remove(state, ...cell)) onSignal('built')
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      const point = pick(event)
      const cell = point ? toCell(point.x, point.z) : null
      if (tool === 'hand') {
        const found = state.held ? null : nearest(event)
        lit.current = found?.id ?? null
        aim(state.held ? 'grabbing' : found ? 'grab' : '')
      }
      setHover((old) =>
        cell && inside(...cell)
          ? old && old[0] === cell[0] && old[1] === cell[1]
            ? old
            : cell
          : null,
      )
      if (!down || down.id !== event.pointerId || !point || !cell) return
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) {
        down.moved = true
        clearTimeout(press)
      }
      if (tool === 'hand') carry(point)
      if (
        tool === 'belt' &&
        last &&
        (cell[0] !== last[0] || cell[1] !== last[1])
      )
        lay(cell)
      if (tool === 'remove' && remove(state, ...cell)) onSignal('built')
    }
    const onUp = (event: PointerEvent) => {
      if (!down || down.id !== event.pointerId) return
      clearTimeout(press)
      const point = pick(event)
      const cell = hand.current
        ? toCell(hand.current.x, hand.current.z)
        : point
          ? toCell(point.x, point.z)
          : down.cell
      if (tool === 'hand' && state.held) {
        const result = release(state, ...cell)
        onSignal(
          result !== 'taken'
            ? result
            : siteAt(...cell) === 'bank'
              ? 'coin'
              : 'sold',
        )
        hand.current = null
        aim('')
      }
      if (tool === 'belt' && !down.moved) {
        const belt = state.belts.get(cell[1] * W + cell[0])
        const dir = belt ? (((belt.dir + 1) % 4) as Dir) : 0
        if (place(cell, dir)) onSignal('built')
      }
      down = null
      last = null
    }
    const onMenu = (event: MouseEvent) => {
      event.preventDefault()
      cancel()
      inspect(event)
    }
    const onCancel = (event: PointerEvent) => cancel(event.pointerId)
    const onBlur = () => cancel()
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('lostpointercapture', onCancel)
    canvas.addEventListener('contextmenu', onMenu)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('blur', onBlur)
    return () => {
      clearTimeout(press)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('lostpointercapture', onCancel)
      canvas.removeEventListener('contextmenu', onMenu)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('blur', onBlur)
      if (state.held) release(state, -1, -1)
      lit.current = null
      aim('')
    }
  }, [camera, canvas, game, tool, onSignal, onInspect])

  const ok =
    hover &&
    (tool === 'remove'
      ? game.current.belts.get(hover[1] * W + hover[0])?.fixed === false
      : canBuild(game.current, ...hover))
  return (
    <>
      <Items game={game} hand={hand} lit={lit} />
      {hover && tool !== 'hand' && (
        <mesh
          ref={cursor}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[hover[0] - W / 2 + 0.5, 0.13, hover[1] - H / 2 + 0.5]}
        >
          <planeGeometry args={[0.96, 0.96]} />
          <meshBasicMaterial
            color={!ok ? '#e8574a' : tool === 'remove' ? '#e8574a' : '#4fd18b'}
            transparent
            opacity={ok ? 0.45 : 0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </>
  )
}
