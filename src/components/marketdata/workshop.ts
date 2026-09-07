'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isCarpet, type Carpet, type RugDesign } from './design'

export const stops = [
  { at: 0, name: 'On the loom', section: 'market-mill' },
  { at: 0.23, name: 'Truck to the warehouse', section: 'market-freight' },
  {
    at: 0.43,
    name: 'Invoice checked. Stock updated.',
    section: 'market-storage',
  },
  { at: 0.51, name: 'Express carpet flight', section: 'market-flight' },
  { at: 0.69, name: 'A customer found their favorite', section: 'market-shop' },
  { at: 0.85, name: 'On the way home', section: 'market-owner' },
] as const
export const stopAt = (progress: number) =>
  stops.findLastIndex((stop) => progress >= stop.at)
const STORAGE = 'buft.marketdata.workshop.v1'
const DURATION = 30
type Pending = Carpet & { progress: number }
type SavedWorkshop = { version: 1; carpets: Carpet[]; queue: Pending[] }

export function useWorkshop(reduced: boolean) {
  const [carpets, setCarpets] = useState<Carpet[]>([])
  const [queue, setQueue] = useState<Pending[]>([])
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastFinished, setLastFinished] = useState('')
  const clock = useRef({ progress: 0, time: 0 })
  const current = useRef<SavedWorkshop>({ version: 1, carpets: [], queue: [] })
  const active = queue[0]
  const persist = useCallback(() => {
    try {
      const snapshot = current.current
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          ...snapshot,
          queue: snapshot.queue.map((rug, i) =>
            i === 0 ? { ...rug, progress: clock.current.progress } : rug,
          ),
        }),
      )
    } catch {
      setStorageError(true)
    }
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE)
        if (raw) {
          const saved = JSON.parse(raw) as SavedWorkshop
          if (
            saved.version !== 1 ||
            !Array.isArray(saved.carpets) ||
            !Array.isArray(saved.queue)
          )
            throw new Error('Invalid workshop')
          const validCarpets = saved.carpets.filter(isCarpet)
          const validQueue = saved.queue.filter(
            (rug) =>
              isCarpet(rug) &&
              Number.isFinite(rug.progress) &&
              rug.progress >= 0 &&
              rug.progress < 1 &&
              !validCarpets.some((c) => c.id === rug.id),
          )
          current.current = {
            version: 1,
            carpets: validCarpets,
            queue: validQueue,
          }
          clock.current.progress = validQueue[0]?.progress ?? 0
          setProgress(clock.current.progress)
          setCarpets(validCarpets)
          setQueue(validQueue)
        }
      } catch {
        setStorageError(true)
      }
      setReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  const complete = useCallback(() => {
    const first = current.current.queue[0]
    if (!first) return
    const { progress: _progress, ...carpet } = first
    const next = {
      ...current.current,
      carpets: [...current.current.carpets, carpet],
      queue: current.current.queue.slice(1),
    }
    current.current = next
    clock.current.progress = next.queue[0]?.progress ?? 0
    setCarpets(next.carpets)
    setQueue(next.queue)
    setProgress(clock.current.progress)
    setLastFinished(carpet.name)
    persist()
  }, [persist])
  useEffect(() => {
    if (!ready) return
    let previous = performance.now()
    let announced = 0
    let savedAt = 0
    let frame: number
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (!paused && !reduced && !document.hidden) {
        clock.current.time += delta
        clock.current.progress += delta / DURATION
        if (clock.current.progress >= 1) {
          if (current.current.queue.length) complete()
          else clock.current.progress = 0
        }
        if (now - announced > 180) {
          setProgress(clock.current.progress)
          announced = now
        }
        if (current.current.queue.length && now - savedAt > 1000) {
          persist()
          savedAt = now
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    const saveOnHide = () => {
      if (document.hidden) persist()
    }
    document.addEventListener('visibilitychange', saveOnHide)
    window.addEventListener('pagehide', persist)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('visibilitychange', saveOnHide)
      window.removeEventListener('pagehide', persist)
      persist()
    }
  }, [ready, paused, reduced, persist, complete])
  const make = (design: RugDesign, name: string) => {
    const total = current.current.carpets.length + current.current.queue.length
    const rug: Pending = {
      id: crypto.randomUUID(),
      name: name || `Carpet No. ${total + 1}`,
      design: { ...design, pixels: [...design.pixels] },
      createdAt: Date.now(),
      progress: 0,
    }
    const next = [...current.current.queue, rug]
    current.current = { ...current.current, queue: next }
    if (next.length === 1) {
      clock.current.progress = 0
      setProgress(0)
    }
    setQueue(next)
    persist()
  }
  const fly = (id: string) => {
    const next = current.current.carpets.map((carpet, index) =>
      carpet.id === id
        ? { ...carpet, flying: !(carpet.flying ?? index % 3 === 2) }
        : carpet,
    )
    current.current = { ...current.current, carpets: next }
    setCarpets(next)
    persist()
  }
  const advance = () => {
    const next = stops[stopAt(clock.current.progress) + 1]
    if (next) clock.current.progress = next.at + 0.005
    else if (current.current.queue.length) complete()
    else clock.current.progress = 0
    setProgress(clock.current.progress)
    persist()
  }
  return {
    carpets,
    queue,
    ready,
    paused,
    setPaused,
    storageError,
    progress,
    clock,
    active,
    make,
    fly,
    advance,
    lastFinished,
  }
}
