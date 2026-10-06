'use client'

import { Html } from '@react-three/drei'
import {
  Ban,
  Biohazard,
  Droplet,
  LightbulbOff,
  Pickaxe,
  Sprout,
  type LucideIcon,
} from 'lucide-react'

export type Why = 'taken' | 'empty' | 'corrupt' | 'dark' | 'full' | 'poor'
export type Ask = {
  x: number
  y: number
  mine: boolean
  why: Why
  cost: number
  at: number
}

const TOP = { tower: 950, mine: 450 }

const ICONS: Record<Why, { icon: LucideIcon; text: string }> = {
  poor: { icon: Droplet, text: 'Not enough fat' },
  empty: { icon: Sprout, text: 'Build on tissue' },
  corrupt: { icon: Biohazard, text: 'Too close to corruption' },
  dark: { icon: LightbulbOff, text: 'Build only in your light' },
  taken: { icon: Pickaxe, text: 'Already mined' },
  full: { icon: Ban, text: 'No more posts' },
}

export const isWhy = (made: string): made is Why => made in ICONS

export function Question({ ask }: { ask: Ask }) {
  const { icon: Icon, text } = ICONS[ask.why]
  const label = ask.why === 'poor' ? `Needs ${ask.cost} fat` : text
  return (
    <Html
      position={[ask.x, -ask.y + (ask.mine ? TOP.mine : TOP.tower), 0]}
      center
      zIndexRange={[4, 4]}
      style={{ pointerEvents: 'none' }}
    >
      <output
        className="e-ask"
        data-why={ask.why}
        aria-label={label}
        title={label}
      >
        <Icon size={15} strokeWidth={2.4} aria-hidden />
        {ask.why === 'poor' && <small>{ask.cost}</small>}
        <b>?</b>
      </output>
    </Html>
  )
}
