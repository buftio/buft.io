'use client'

import { useRef, type RefObject, type PointerEvent } from 'react'
import { WORLD_HEIGHT, type Orb, type Point } from './types'

type Props = {
  balls: Orb[]
  world: RefObject<HTMLDivElement | null>
  grab: (id: number) => boolean
  move: (id: number, point: Point) => void
  drop: (id: number, velocity: Point) => void
}
export function LooseBalls({ balls, world, grab, move, drop }: Props) {
  const drag = useRef<{
    id: number
    pointerId: number
    offset: Point
    last: Point
    time: number
    velocity: Point
  } | null>(null)
  const point = (event: PointerEvent): Point => {
    const rect = world.current!.getBoundingClientRect()
    return {
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * WORLD_HEIGHT,
    }
  }
  const finish = (pointerId: number, time: number, cancel = false) => {
    const held = drag.current
    if (!held || held.pointerId !== pointerId) return
    const velocity =
      !cancel && time - held.time < 100 ? held.velocity : { x: 0, y: 0 }
    drop(held.id, velocity)
    drag.current = null
  }
  return balls
    .filter((ball) => ball.loose)
    .map((ball) => (
      <button
        key={ball.id}
        className={`spera-loose-ball ${ball.held ? 'is-held' : ''}`}
        aria-label={`Loose football ${ball.id}. Drag and release to toss. Space picks up or drops, arrows move.`}
        aria-pressed={!!ball.held}
        data-loose-ball={ball.id}
        style={{ left: `${ball.x}%`, top: `${(ball.y / WORLD_HEIGHT) * 100}%` }}
        onPointerDown={(event) => {
          if (drag.current) drop(drag.current.id, { x: 0, y: 0 })
          drag.current = null
          if (!grab(ball.id)) return
          event.currentTarget.setPointerCapture(event.pointerId)
          const p = point(event)
          drag.current = {
            id: ball.id,
            pointerId: event.pointerId,
            offset: { x: ball.x - p.x, y: ball.y - p.y },
            last: p,
            time: event.timeStamp,
            velocity: { x: 0, y: 0 },
          }
        }}
        onPointerMove={(event) => {
          const held = drag.current
          if (
            !held ||
            held.id !== ball.id ||
            held.pointerId !== event.pointerId
          )
            return
          const p = point(event),
            now = event.timeStamp,
            dt = (now - held.time) / 1000
          if (dt > 0.001)
            held.velocity = {
              x: (p.x - held.last.x) / dt,
              y: (p.y - held.last.y) / dt,
            }
          held.last = p
          held.time = now
          move(ball.id, { x: p.x + held.offset.x, y: p.y + held.offset.y })
        }}
        onPointerUp={(event) => finish(event.pointerId, event.timeStamp)}
        onPointerCancel={(event) =>
          finish(event.pointerId, event.timeStamp, true)
        }
        onLostPointerCapture={(event) =>
          finish(event.pointerId, event.timeStamp, true)
        }
        onKeyDown={(event) => {
          const shifts: Record<string, Point> = {
            ArrowLeft: { x: -2, y: 0 },
            ArrowRight: { x: 2, y: 0 },
            ArrowUp: { x: 0, y: -2 },
            ArrowDown: { x: 0, y: 2 },
          }
          if (
            event.key === ' ' ||
            event.key === 'Enter' ||
            event.key === 'Escape'
          ) {
            event.preventDefault()
            event.stopPropagation()
            if (ball.held) drop(ball.id, { x: 0, y: 0 })
            else if (event.key !== 'Escape') grab(ball.id)
          } else if (shifts[event.key]) {
            event.preventDefault()
            if (!ball.held) grab(ball.id)
            move(ball.id, {
              x: ball.x + shifts[event.key].x,
              y: ball.y + shifts[event.key].y,
            })
          }
        }}
      />
    ))
}
