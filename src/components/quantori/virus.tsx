'use client'

import { useMemo } from 'react'
import { Clay, palette } from '../marketdata/models/clay'
import type { V3 } from './layout'

export const virusColors = ['#9bd16b', '#b48ad8', '#f08a6c', '#6cc4c0']

/** A silly, cross little virus facing +z. Radius is about 0.4. */
export function Virus({ kind }: { kind: number }) {
  const color = virusColors[kind % virusColors.length]
  const knobs = useMemo(() => {
    const count = 11
    return Array.from({ length: count }, (_, i): { at: V3; tip: V3 } => {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const a = i * 2.39996
      const dir: V3 = [Math.cos(a) * r, y, Math.sin(a) * r]
      return {
        at: [dir[0] * 0.33, dir[1] * 0.33, dir[2] * 0.33],
        tip: [dir[0] * 0.42, dir[1] * 0.42, dir[2] * 0.42],
      }
    }).filter(({ tip }) => tip[2] < 0.3 || Math.abs(tip[0]) > 0.25)
  }, [])
  const oneEye = kind === 3
  return (
    <group>
      <Clay shape="sphere" color={color} size={0.66} />
      {knobs.map(({ at, tip }, i) => (
        <group key={i}>
          <Clay shape="sphere" color={color} size={0.08} position={at} />
          <Clay
            shape="sphere"
            color={kind === 1 ? '#f2b84b' : '#f6e7c8'}
            size={0.11}
            position={tip}
          />
        </group>
      ))}
      {(oneEye ? [0] : [-0.11, 0.11]).map((x) => (
        <group key={x} position={[x, 0.06, 0.27]}>
          <Clay shape="sphere" color="#ffffff" size={oneEye ? 0.24 : 0.16} />
          <Clay
            shape="sphere"
            color={palette.ink}
            size={oneEye ? 0.11 : 0.08}
            position={[0, -0.01, oneEye ? 0.1 : 0.07]}
          />
          {!oneEye && (
            <Clay
              shape="slab"
              color={palette.ink}
              size={[0.15, 0.035, 0.04]}
              position={[0, 0.12, 0.04]}
              rotation={[0, 0, x < 0 ? -0.5 : 0.5]}
            />
          )}
        </group>
      ))}
      <Clay
        shape="smile"
        color={palette.ink}
        size={0.12}
        position={[0, -0.14, 0.3]}
        rotation={[0, 0, kind === 2 ? Math.PI : 0]}
      />
    </group>
  )
}
