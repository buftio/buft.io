'use client'

import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { isOpen } from '../factory'
import type { ModelProps } from './kit'

/** The customs officer's speech bubble: pops up asking for money whenever something bumps the closed border. */
export function Toll({ game }: ModelProps) {
  const bubble = useRef<HTMLDivElement>(null)
  useFrame(() => {
    const g = game.current
    const age = g.time - g.denied
    bubble.current?.classList.toggle(
      'is-on',
      !isOpen(g) && age >= 0 && age < 1.6,
    )
  })
  return (
    <Html
      position={[0.55, 1.75, -0.58]}
      zIndexRange={[4, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <div ref={bubble} className="k-toll" aria-hidden>
        💰 Pay up!
      </div>
    </Html>
  )
}
