import { Compass, RotateCcw } from 'lucide-react'
import { useState, type CSSProperties } from 'react'
import type { Status } from './war/war'

const COLORS = ['#7dffe6', '#ffd166', '#ff8fab', '#c3a6ff', '#ffffff']

const confetti = Array.from({ length: 36 }, (_, i) => {
  const angle = ((i * 137.5) % 360) * (Math.PI / 180)
  const reach = 140 + ((i * 53) % 120)
  return {
    '--x': `${Math.cos(angle) * reach}px`,
    '--y': `${Math.sin(angle) * reach * 0.7 - 40}px`,
    '--r': `${((i * 97) % 720) - 360}deg`,
    '--d': `${(i % 6) * 0.04}s`,
    background: COLORS[i % COLORS.length],
  } as CSSProperties
})

export function Victory({
  status,
  time,
  onReplay,
}: {
  status: Status
  time: string
  onReplay: () => void
}) {
  const [open, setOpen] = useState(true)
  if (!open) return null
  return (
    <output className="e-won">
      <span className="e-confetti" aria-hidden>
        {confetti.map((style, i) => (
          <i key={i} style={style} />
        ))}
      </span>
      <strong>Victory!</strong>
      <span>
        All {status.tumors} tumors contained in {time}.
      </span>
      <small>
        {(status.villagers - status.lost).toLocaleString('en')} villagers saved
        · {status.fallen} warriors fell
      </small>
      <span className="e-won-actions">
        <button type="button" onClick={onReplay}>
          <RotateCcw size={15} aria-hidden />
          Play again
        </button>
        <button
          type="button"
          className="e-explore"
          onClick={() => setOpen(false)}
        >
          <Compass size={15} aria-hidden />
          Continue exploring
        </button>
      </span>
    </output>
  )
}
