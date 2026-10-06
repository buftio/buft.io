'use client'

import { Maximize2, Minimize2 } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'

export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [full, setFull] = useState(false)
  const top = useRef<number | null>(null)
  useEffect(() => {
    const sync = () => setFull(document.fullscreenElement === target.current)
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [target])
  useEffect(() => {
    if (full || top.current === null) return
    target.current?.closest('dialog')?.scrollTo({ top: top.current })
    top.current = null
  }, [full, target])
  const toggle = () => {
    if (!full)
      top.current = target.current?.closest('dialog')?.scrollTop ?? null
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
