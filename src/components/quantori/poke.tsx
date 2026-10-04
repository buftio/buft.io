'use client'

import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import type { Group } from 'three'
import type { V3 } from './layout'

const STREAK = 1.5

/** Makes whatever is inside hop when tapped, a little higher with every tap in a row. */
export function Poke({
  enabled,
  position,
  onPoke,
  children,
}: {
  enabled: boolean
  position: V3
  onPoke: (streak: number) => void
  children: ReactNode
}) {
  const ref = useRef<Group>(null)
  const now = useRef(0)
  const taps = useRef({ count: 0, at: -10 })
  useEffect(() => () => void (document.body.style.cursor = ''), [])
  useFrame(({ clock }) => {
    now.current = clock.elapsedTime
    const group = ref.current
    if (!group) return
    const t = now.current - taps.current.at
    const p = Math.min(1, t / 0.4)
    const height = 0.12 + Math.min(taps.current.count, 10) * 0.035
    group.position.y = Math.sin(p * Math.PI) * height
    const squash = t < 0.08 ? (t / 0.08) * 0.18 : -Math.sin(p * Math.PI) * 0.08
    group.scale.set(1 + squash * 0.6, 1 - squash, 1 + squash * 0.6)
  })
  const poke = (event: ThreeEvent<PointerEvent>) => {
    if (!enabled) return
    event.stopPropagation()
    const run = taps.current
    run.count = now.current - run.at < STREAK ? run.count + 1 : 1
    run.at = now.current
    onPoke(run.count)
  }
  return (
    <group position={position}>
      <group
        ref={ref}
        onPointerDown={poke}
        onPointerOver={() => {
          if (enabled) document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        {children}
      </group>
    </group>
  )
}
