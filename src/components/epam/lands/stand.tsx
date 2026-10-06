'use client'

import type { ReactNode } from 'react'
import * as THREE from 'three'

export const PITCH = new THREE.Euler((50 * Math.PI) / 180, 0, 0)

export function Stand({ at, size, turn = 0, children }: { at: [number, number]; size: number; turn?: number; children: ReactNode }) {
  return (
    <group position={[at[0], -at[1], 0]} rotation={PITCH} scale={size}>
      <group rotation={[0, turn, 0]}>{children}</group>
    </group>
  )
}

export const ground = (dx: number, dy: number, lift = 0): [number, number, number] => [dx, -dy, lift]
