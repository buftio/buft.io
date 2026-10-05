'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Plane, Raycaster, Vector2, Vector3 } from 'three'
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
import { BeltTile, Items, eachItem, heightOf, turnOf } from './items'
import {
  BORDER,
  GATE,
  H,
  W,
  siteAt,
  toWorld,
  type Cell,
  type Dir,
  type Kind,
  type Site,
} from './map'
import type { Signal } from './world'

export type Look = { site: Site } | { item: Kind }

type Props = {
  game: RefObject<Game>
  onSignal: (signal: Signal) => void
  onInspect: (look: Look) => void
}

const ground = new Plane(new Vector3(0, 1, 0), 0)
const lift = new Plane(new Vector3(0, 1, 0), 0)
const ROOFS = [1.2, 0.9, 0.6, 0.3]
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

/** Moves a carried item toward the cursor; the border stops it unless it crosses in line with an open gate. */
function slide(
  from: { x: number; z: number },
  to: { x: number; z: number },
  open: boolean,
) {
  const side = Math.sign(from.x - WALL) || -1
  const gap = Math.abs(from.x - WALL)
  const door = (z: number) => open && Math.abs(z - DOOR) <= SLACK
  if (gap < REACH && door(from.z))
    return {
      x: to.x,
      z: Math.min(DOOR + SLACK, Math.max(DOOR - SLACK, to.z)),
      blocked: false,
    }
  const limit = Math.min(REACH, gap)
  if ((to.x - WALL) * side >= limit) return { ...to, blocked: false }
  const face = WALL + side * limit
  const t = to.x === from.x ? 0 : (face - from.x) / (to.x - from.x)
  if (door(from.z + (to.z - from.z) * Math.max(0, Math.min(1, t))))
    return { ...to, blocked: false }
  return { x: face, z: to.z, blocked: true }
}

type Ghost = { cell: Cell; dir: Dir; ok: boolean | null; high: boolean }
type Tile = { at: Cell; dir: Dir; from: { cell: Cell; dir: Dir } | null }

const at = (cell: Cell) => cell[1] * W + cell[0]
const same = (a: Cell, b: Cell) => a[0] === b[0] && a[1] === b[1]

export function Input({ game, onSignal, onInspect }: Props) {
  const camera = useThree((state) => state.camera)
  const canvas = useThree((state) => state.gl.domElement)
  const hand = useRef<{ x: number; z: number } | null>(null)
  const lit = useRef<number | null>(null)
  const [ghost, setGhost] = useState<Ghost | null>(null)

  useEffect(() => {
    const state = game.current
    let down: {
      id: number
      x: number
      y: number
      cell: Cell
      moved: boolean
      touch: boolean
      from: 'workshop' | 'belt' | null
    } | null = null
    let tile: Tile | null = null
    let bumped = false
    let press = 0
    const pick = (event: { clientX: number; clientY: number }) => {
      const rect = canvas.getBoundingClientRect()
      ndc.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      )
      ray.setFromCamera(ndc, camera)
      return ray.ray.intersectPlane(ground, hit) ? hit.clone() : null
    }
    const under = (event: { clientX: number; clientY: number }) => {
      const point = pick(event)
      for (const h of ROOFS) {
        lift.constant = -h
        if (!ray.ray.intersectPlane(lift, hit)) continue
        const cell = toCell(hit.x, hit.z)
        if (siteAt(...cell)) return cell
      }
      return point ? toCell(point.x, point.z) : null
    }
    const workshop = (cell: Cell | null) =>
      !!cell && state.minted && siteAt(...cell) === 'workshop'
    const fits = (cell: Cell) =>
      canBuild(state, ...cell) && !state.belts.has(at(cell))
    const show = () =>
      setGhost(
        tile && {
          cell: tile.at,
          dir: tile.dir,
          ok: siteAt(...tile.at) ? null : fits(tile.at),
          high: !!siteAt(...tile.at),
        },
      )
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
      const cell = under(event)
      const site = cell ? siteAt(...cell) : null
      if (found) onInspect({ item: found.kind })
      else if (site && (site !== 'workshop' || state.minted))
        onInspect({ site })
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
    const take = (from: 'workshop' | 'belt', cell: Cell) => {
      if (from === 'workshop') {
        if (state.wallet < BELT) return onSignal('broke')
        state.at.bought = state.time
        state.hit.workshop = state.time
        tile = { at: cell, dir: 0, from: null }
      } else {
        const belt = state.belts.get(at(cell))
        if (!belt || !remove(state, ...cell)) return
        tile = { at: cell, dir: belt.dir, from: { cell, dir: belt.dir } }
      }
      aim('grabbing')
      onSignal('lift')
      show()
    }
    const put = (t: Tile) => {
      if (workshop(t.at)) return onSignal(t.from ? 'coin' : 'back')
      if (fits(t.at) && build(state, ...t.at, t.dir)) return onSignal('built')
      if (t.from) build(state, ...t.from.cell, t.from.dir)
      onSignal('back')
    }
    const cancel = (id?: number) => {
      clearTimeout(press)
      if (!down || (id !== undefined && down.id !== id)) return
      if (state.held) release(state, -1, -1)
      if (tile?.from) build(state, ...tile.from.cell, tile.from.dir)
      tile = null
      show()
      hand.current = null
      aim('')
      down = null
    }
    const onDown = (event: PointerEvent) => {
      if (event.button > 0 || down) return
      const point = pick(event)
      if (!point) return
      const cell = toCell(point.x, point.z)
      const aimed = under(event)
      down = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        cell,
        moved: false,
        touch: event.pointerType === 'touch',
        from: null,
      }
      bumped = false
      if (down.touch) {
        const spot = { clientX: event.clientX, clientY: event.clientY }
        press = window.setTimeout(() => {
          if (!down || down.moved) return
          cancel(down.id)
          inspect(spot)
        }, 550)
      }
      const found = nearest(event)
      if (found && grab(state, found.id)) {
        hand.current = { x: point.x, z: point.z }
        lit.current = null
        aim('grabbing')
        onSignal('lift')
      } else if (workshop(aimed)) {
        down.cell = aimed!
        down.from = 'workshop'
      } else if (state.belts.get(at(cell))?.fixed === false) down.from = 'belt'
      canvas.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      const point = pick(event)
      if (!down) {
        const found = state.held ? null : nearest(event)
        lit.current = found?.id ?? null
        const cell = point ? toCell(point.x, point.z) : null
        const belt = cell && state.belts.get(at(cell))?.fixed === false
        aim(found || belt || workshop(under(event)) ? 'grab' : '')
        return
      }
      if (down.id !== event.pointerId || !point) return
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) {
        down.moved = true
        clearTimeout(press)
      }
      if (hand.current) return carry(point)
      if (down.from && down.moved && !tile) {
        take(down.from, down.cell)
        down.from = null
      }
      if (!tile) return
      const aimed = under(event)
      const target = workshop(aimed) ? aimed! : toCell(point.x, point.z)
      if (same(target, tile.at)) return
      tile.dir = dirTo(tile.at, target)
      tile.at = target
      show()
    }
    const onUp = (event: PointerEvent) => {
      if (!down || down.id !== event.pointerId) return
      clearTimeout(press)
      if (state.held) {
        const point = pick(event)
        const aimed = under(event)
        const cell =
          hand.current && !bumped && aimed && siteAt(...aimed)
            ? aimed
            : hand.current
              ? toCell(hand.current.x, hand.current.z)
              : point
                ? toCell(point.x, point.z)
                : down.cell
        const result = release(state, ...cell)
        onSignal(
          result !== 'taken'
            ? result
            : siteAt(...cell) === 'bank'
              ? 'coin'
              : 'sold',
        )
      } else if (tile) put(tile)
      else if (down.from === 'belt' && !down.moved) {
        const belt = state.belts.get(at(down.cell))
        if (belt && build(state, ...down.cell, ((belt.dir + 1) % 4) as Dir))
          onSignal('built')
      }
      tile = null
      show()
      hand.current = null
      aim('')
      down = null
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
      if (tile?.from) build(state, ...tile.from.cell, tile.from.dir)
      lit.current = null
      aim('')
    }
  }, [camera, canvas, game, onSignal, onInspect])

  return (
    <>
      <Items game={game} hand={hand} lit={lit} />
      {ghost && (
        <group
          position={[
            ghost.cell[0] - W / 2 + 0.5,
            0,
            ghost.cell[1] - H / 2 + 0.5,
          ]}
        >
          <group
            position={[0, ghost.high ? 1.6 : 0.4, 0]}
            rotation={[0, turnOf(ghost.dir), 0]}
          >
            <BeltTile lifted />
          </group>
          {ghost.ok !== null && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.13, 0]}>
              <planeGeometry args={[0.96, 0.96]} />
              <meshBasicMaterial
                color={ghost.ok ? '#4fd18b' : '#e8574a'}
                transparent
                opacity={ghost.ok ? 0.45 : 0.3}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      )}
    </>
  )
}
