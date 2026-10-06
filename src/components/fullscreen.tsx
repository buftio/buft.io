'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useState, type RefObject } from 'react'

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [full, setFull] = useState(false)
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === target.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [target])
  const toggle = () => {
    if (!document.fullscreenEnabled) return setFull((f) => !f)
    if (document.fullscreenElement) document.exitFullscreen()
    else target.current?.requestFullscreen()
  }
  return [full, toggle] as const
}

export function FullscreenButton({
  full,
  onClick,
  className,
}: {
  full: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={className ? `full-toggle ${className}` : 'full-toggle'}
      onClick={onClick}
      aria-label={full ? 'Exit full screen' : 'Full screen'}
    >
      {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
    </button>
  )
}
