'use client'

import { type RefObject } from 'react'
import { type Carpet } from './design'
import { type PartyLayout } from './party-layout'

export default function Collection({
  carpets,
  pending,
  wide,
  narrow,
  controls,
  onFly,
}: {
  carpets: Carpet[]
  pending: string[]
  wide: PartyLayout
  narrow: PartyLayout
  controls: RefObject<Map<string, HTMLButtonElement>>
  onFly: (id: string) => void
}) {
  return (
    <div
      className="carpet-party-world"
      style={
        {
          '--party-ratio': `${wide.width} / ${wide.height}`,
          '--party-mobile-ratio': `${narrow.width} / ${narrow.height}`,
        } as React.CSSProperties
      }
    >
      {carpets.map((carpet, i) => (
        <button
          key={carpet.id}
          className="party-hit"
          ref={(element) => {
            if (element) controls.current.set(carpet.id, element)
            else controls.current.delete(carpet.id)
          }}
          disabled={pending.includes(carpet.id)}
          onClick={() => onFly(carpet.id)}
          aria-label={`Fly ${carpet.name}`}
          aria-pressed={carpet.flying ?? i % 3 === 2}
        />
      ))}
    </div>
  )
}
