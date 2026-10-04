import { useEffect, useRef } from 'react'
import { projects } from '@/lib/projects'

const PIXELS_PER_PROJECT = 340
const clamp = (n: number) => Math.max(-1, Math.min(projects.length - 1, n))
type Drag = {
  id: number
  x: number
  from: number
  position: number
  time: number
  speed: number
  spinning: boolean
}

export function useSpin(navigate: (index: number) => void, enabled: boolean) {
  const drag = useRef<Drag | null>(null)
  useEffect(
    () => () => document.documentElement.classList.remove('is-spinning'),
    [],
  )
  const release = (event: React.PointerEvent<HTMLElement>) => {
    const current = drag.current
    if (!current || current.id !== event.pointerId) return
    drag.current = null
    if (!current.spinning) return
    if (event.timeStamp - current.time > 90) current.speed = 0
    navigate(Math.round(clamp(current.position + current.speed * 0.18)))
    document.documentElement.classList.remove('is-spinning')
  }
  return {
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      if (!enabled || event.button !== 0 || drag.current?.spinning) return
      const from = clamp(window.scrollY / window.innerHeight - 1)
      drag.current = {
        id: event.pointerId,
        x: event.clientX,
        from,
        position: from,
        time: event.timeStamp,
        speed: 0,
        spinning: false,
      }
    },
    onPointerMove(event: React.PointerEvent<HTMLElement>) {
      const current = drag.current
      if (!current || current.id !== event.pointerId) return
      if (!current.spinning && !(event.buttons & 1)) {
        drag.current = null
        return
      }
      const dx = event.clientX - current.x
      if (!current.spinning) {
        if (Math.abs(dx) < 8) return
        current.spinning = true
        event.currentTarget.setPointerCapture(event.pointerId)
        document.documentElement.classList.add('is-spinning')
      }
      const position = clamp(current.from - dx / PIXELS_PER_PROJECT)
      const dt = Math.max(1, event.timeStamp - current.time) / 1000
      current.speed =
        current.speed * 0.6 + ((position - current.position) / dt) * 0.4
      current.position = position
      current.time = event.timeStamp
      window.scrollTo({
        top: (position + 1) * window.innerHeight,
        behavior: 'instant',
      })
    },
    onPointerUp: release,
    onPointerCancel: release,
    onLostPointerCapture: release,
  }
}
