'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type * as THREE from 'three'
import {
  EYE,
  MAX_SCALE,
  fitView,
  minScale,
  type SlideMeta,
  type View,
} from './slide-data'

const clampView = (meta: SlideMeta, view: View, min: number): View => ({
  scale: Math.min(MAX_SCALE, Math.max(min, view.scale)),
  x: Math.min(meta.width, Math.max(0, view.x)),
  y: Math.min(meta.height, Math.max(0, view.y)),
})

const TAP_PX = 6
const TAP_MS = 350
const HOLD_MS = 500

export function Controls({
  meta,
  onView,
  onTap,
  onHold,
}: {
  meta: SlideMeta
  onView: (view: View) => void
  onTap?: (x: number, y: number, scale: number) => void
  onHold?: (x: number, y: number) => void
}) {
  const size = useThree((state) => state.size)
  const element = useThree((state) => state.gl.domElement)
  const invalidate = useThree((state) => state.invalidate)
  const target = useRef<View | null>(null)
  const current = useRef<View | null>(null)
  const tapped = useRef(onTap)
  const held = useRef(onHold)

  useEffect(() => {
    tapped.current = onTap
    held.current = onHold
  }, [onTap, onHold])

  useEffect(() => {
    if (!size.width || current.current) return
    const start = fitView(meta, size.width, size.height)
    target.current = start
    current.current = { ...start }
    invalidate()
  }, [meta, size, invalidate])

  useEffect(() => {
    const pointers = new Map<number, { x: number; y: number }>()
    let pinch = 0
    let press: { x: number; y: number; at: number; far: number } | null = null
    let last = { x: 0, y: 0, at: -Infinity }
    let timer = 0
    let lastHold = -Infinity
    const hold = (p: { x: number; y: number }) => {
      const view = current.current
      if (!view || performance.now() - lastHold < HOLD_MS * 2) return
      lastHold = performance.now()
      press = null
      held.current?.(
        view.x + (p.x - size.width / 2) / view.scale,
        view.y + (p.y - size.height / 2) / view.scale,
      )
    }
    const min = () => minScale(meta, size.width, size.height)
    const local = (event: { clientX: number; clientY: number }) => {
      const rect = element.getBoundingClientRect()
      return { x: event.clientX - rect.left, y: event.clientY - rect.top }
    }
    const zoomAt = (px: number, py: number, factor: number) => {
      const view = target.current
      if (!view) return
      const scale = Math.min(MAX_SCALE, Math.max(min(), view.scale * factor))
      const wx = view.x + (px - size.width / 2) / view.scale
      const wy = view.y + (py - size.height / 2) / view.scale
      target.current = clampView(
        meta,
        {
          scale,
          x: wx - (px - size.width / 2) / scale,
          y: wy - (py - size.height / 2) / scale,
        },
        min(),
      )
      invalidate()
    }
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const p = local(event)
      const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
      zoomAt(p.x, p.y, Math.exp(-delta * (event.ctrlKey ? 0.01 : 0.0022)))
    }
    const onDown = (event: PointerEvent) => {
      element.setPointerCapture(event.pointerId)
      const p = local(event)
      pointers.set(event.pointerId, p)
      pinch = 0
      press =
        pointers.size === 1 && event.button === 0
          ? { ...p, at: event.timeStamp, far: 0 }
          : null
      window.clearTimeout(timer)
      if (press) timer = window.setTimeout(() => hold(p), HOLD_MS)
    }
    const onMove = (event: PointerEvent) => {
      const before = pointers.get(event.pointerId)
      const view = target.current
      if (!before || !view) return
      const now = local(event)
      pointers.set(event.pointerId, now)
      if (press)
        press.far = Math.max(press.far, Math.hypot(now.x - press.x, now.y - press.y))
      if (!press || press.far > TAP_PX) window.clearTimeout(timer)
      if (pointers.size === 1) {
        target.current = clampView(
          meta,
          {
            ...view,
            x: view.x - (now.x - before.x) / view.scale,
            y: view.y - (now.y - before.y) / view.scale,
          },
          min(),
        )
        if (current.current) {
          current.current.x = target.current.x
          current.current.y = target.current.y
        }
        invalidate()
        return
      }
      const [a, b] = [...pointers.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      if (pinch) zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, distance / pinch)
      pinch = distance
    }
    const onUp = (event: PointerEvent) => {
      pointers.delete(event.pointerId)
      pinch = 0
      window.clearTimeout(timer)
      const view = current.current
      const tap = press
      press = null
      if (!tap || !view || pointers.size || event.type !== 'pointerup') return
      if (tap.far > TAP_PX || event.timeStamp - tap.at > TAP_MS) return
      const again =
        event.timeStamp - last.at < TAP_MS &&
        Math.hypot(tap.x - last.x, tap.y - last.y) < TAP_PX * 2
      last = { x: tap.x, y: tap.y, at: event.timeStamp }
      if (again) return
      tapped.current?.(
        view.x + (tap.x - size.width / 2) / view.scale,
        view.y + (tap.y - size.height / 2) / view.scale,
        view.scale,
      )
    }
    const onMenu = (event: MouseEvent) => {
      event.preventDefault()
      hold(local(event))
    }
    const onDouble = (event: MouseEvent) => {
      const p = local(event)
      zoomAt(p.x, p.y, event.shiftKey ? 0.5 : 2)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    element.addEventListener('pointerdown', onDown)
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', onUp)
    element.addEventListener('dblclick', onDouble)
    element.addEventListener('contextmenu', onMenu)
    return () => {
      window.clearTimeout(timer)
      element.removeEventListener('contextmenu', onMenu)
      element.removeEventListener('wheel', onWheel)
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
      element.removeEventListener('dblclick', onDouble)
    }
  }, [element, meta, size, invalidate])

  useFrame((state, delta) => {
    const view = current.current
    const goal = target.current
    if (!view || !goal) return
    const k = 1 - Math.exp(-delta * 14)
    const logScale = Math.log(view.scale)
    view.scale = Math.exp(logScale + (Math.log(goal.scale) - logScale) * k)
    view.x += (goal.x - view.x) * k
    view.y += (goal.y - view.y) * k
    const camera = state.camera as THREE.OrthographicCamera
    camera.position.set(view.x, -view.y, EYE)
    camera.zoom = view.scale
    camera.updateProjectionMatrix()
    onView(view)
    const settled =
      Math.abs(view.scale / goal.scale - 1) < 1e-4 &&
      Math.abs(view.x - goal.x) * view.scale < 0.1 &&
      Math.abs(view.y - goal.y) * view.scale < 0.1
    if (!settled) state.invalidate()
  })

  return null
}
