'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Color, Object3D, type InstancedMesh } from 'three'
import { clay, geo } from '../../marketdata/models/clay'
import { isOpen } from '../factory'
import type { ModelProps } from './kit'

const colors = ['#f2bf63', '#ed8073', '#8bd4b1', '#9ebee7', '#fff1c9']
const count = 84

export function OpeningBurst({ game }: ModelProps) {
  const mesh = useRef<InstancedMesh>(null)
  const dummy = useRef(new Object3D())
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const color = new Color()
    for (let i = 0; i < count; i++)
      m.setColorAt(i, color.set(colors[i % colors.length]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [])
  useEffect(() => {
    const m = mesh.current
    return () => m?.dispose()
  }, [])
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const g = game.current
    const age = g.time - g.at.opened
    const first = g.openings === 1
    const duration = first ? 3 : 1.5
    m.visible = isOpen(g) && age >= 0 && age < duration && g.openings > 0
    if (!m.visible) return
    m.count = first ? count : 22
    for (let i = 0; i < m.count; i++) {
      const a = i * 2.399
      const t = Math.max(0, age - (i % 7) * 0.018)
      const speed = (first ? 1.15 : 0.58) * (0.5 + (i % 11) / 15)
      const y = 1.1 + (first ? 3.5 : 2) * t - 1.8 * t * t
      const fade = Math.max(0, Math.min(1, (duration - age) * 3, (y - 0.1) * 4))
      const d = dummy.current
      d.position.set(
        Math.sin(a) * speed * t,
        Math.max(0.12, y),
        Math.cos(a) * speed * t,
      )
      d.rotation.set(t * (3 + (i % 4)), a + t * 4, a - t * 3)
      d.scale.set(
        0.045 * fade,
        (i % 4 === 0 ? 0.28 : 0.09) * fade,
        0.015 * fade,
      )
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh
      name="gate-confetti"
      ref={mesh}
      args={[geo.slab, clay('#ffffff', 'gate-confetti'), count]}
      frustumCulled={false}
      dispose={null}
    />
  )
}
