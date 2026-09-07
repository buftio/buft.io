'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isCarpet, type Carpet, type RugDesign } from './design'
import {
  DURATION,
  ARRIVAL_END,
  moveRuns,
  nextDeparture,
  spaceRuns,
  type Run,
  type WorkshopClock,
} from './workshop-state'

export const stops = [
  { at: 0, name: 'On the loom' },
  { at: 0.23, name: 'Truck to the warehouse' },
  { at: 0.43, name: 'Invoice checked. Stock updated.' },
  { at: 0.51, name: 'Express carpet flight' },
  { at: 0.69, name: 'A customer found their favorite' },
  { at: 0.85, name: 'On the way home' },
  { at: 0.95, name: 'Home' },
  { at: 1, name: 'Flying to the party' },
] as const
export const stopAt = (progress: number) =>
  stops.findLastIndex((stop) => Math.max(0, progress) >= stop.at)
const STORAGE = 'buft.marketdata.workshop.v1'

export function useWorkshop(reduced: boolean) {
  const [guests, setGuests] = useState<Carpet[]>([])
  const [queue, setQueue] = useState<Run[]>([])
  const [ready, setReady] = useState(false)
  const [storageError, setStorageError] = useState(false)
  const [progress, setProgress] = useState(0)
  const [lastFinished, setLastFinished] = useState('')
  const clock = useRef<WorkshopClock>({ progress: 0, time: 0, runs: [] })
  const savedCarpets = useRef<Carpet[]>([])
  const storageLoaded = useRef(false)
  const persist = useCallback(() => {
    if (!storageLoaded.current) return
    try {
      localStorage.setItem(
        STORAGE,
        JSON.stringify({
          version: 2,
          carpets: savedCarpets.current,
          queue: clock.current.runs,
        }),
      )
    } catch {
      setStorageError(true)
    }
  }, [])
  const publish = useCallback(() => {
    setQueue(clock.current.runs)
    setProgress(clock.current.progress)
  }, [])
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem(STORAGE)
        if (raw) {
          const saved = JSON.parse(raw)
          if (
            ![1, 2].includes(saved.version) ||
            !Array.isArray(saved.carpets) ||
            !Array.isArray(saved.queue)
          )
            throw new Error('Invalid workshop')
          const completed = saved.carpets.filter(isCarpet) as Carpet[]
          const seen = new Set(completed.map((rug) => rug.id))
          savedCarpets.current = completed
          clock.current.runs = spaceRuns(
            saved.queue.filter((rug: Run) => {
              if (
                !isCarpet(rug) ||
                !Number.isFinite(rug.progress) ||
                rug.progress >= ARRIVAL_END ||
                seen.has(rug.id)
              )
                return false
              if (saved.version === 1 && rug.progress < 0) return false
              seen.add(rug.id)
              return true
            }),
          )
          clock.current.progress = clock.current.runs[0]?.progress ?? 0
          setGuests([...completed, ...clock.current.runs])
          publish()
        }
        storageLoaded.current = true
      } catch {
        setStorageError(true)
      }
      setReady(true)
    })
    return () => cancelAnimationFrame(frame)
  }, [publish])
  const move = useCallback(
    (seconds: number) => {
      const state = clock.current
      state.time += seconds
      if (state.runs.length) {
        const { pending, finished } = moveRuns(state.runs, seconds)
        state.runs = pending
        state.progress = pending[0]?.progress ?? 0
        if (finished.length) {
          savedCarpets.current = [...savedCarpets.current, ...finished]
          setLastFinished(finished.map((rug) => rug.name).join(', '))
          publish()
          persist()
        }
      } else state.progress = (state.progress + seconds / DURATION) % 1
    },
    [persist, publish],
  )
  useEffect(() => {
    if (!ready) return
    let previous = performance.now()
    let announced = 0
    let savedAt = 0
    let frame: number
    const tick = (now: number) => {
      const delta = Math.min((now - previous) / 1000, 0.05)
      previous = now
      if (!reduced && !document.hidden) {
        move(delta)
        if (now - announced > 180) {
          publish()
          announced = now
        }
        if (clock.current.runs.length && now - savedAt > 1000) {
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
  }, [ready, reduced, persist, publish, move])
  const make = (design: RugDesign, name: string) => {
    const total = savedCarpets.current.length + clock.current.runs.length
    const rug: Run = {
      id: crypto.randomUUID(),
      name: name || `Carpet No. ${total + 1}`,
      design: { ...design, pixels: [...design.pixels] },
      createdAt: Date.now(),
      progress: nextDeparture(clock.current.runs),
    }
    clock.current.runs = [...clock.current.runs, rug]
    setGuests((current) => [...current, rug])
    clock.current.progress = clock.current.runs[0].progress
    publish()
    persist()
  }
  const fly = (id: string) => {
    savedCarpets.current = savedCarpets.current.map((carpet, index) =>
      carpet.id === id
        ? { ...carpet, flying: !(carpet.flying ?? index % 3 === 2) }
        : carpet,
    )
    setGuests([...savedCarpets.current, ...clock.current.runs])
    persist()
  }
  const advance = () => {
    const stop = stops[stopAt(clock.current.progress) + 1]?.at ?? ARRIVAL_END
    const next = reduced && stop >= 1 ? ARRIVAL_END : stop
    move((next + 0.005 - clock.current.progress) * DURATION)
    publish()
    persist()
  }
  return {
    guests,
    queue,
    ready,
    storageError,
    progress,
    clock,
    active: queue[0],
    make,
    fly,
    advance,
    lastFinished,
  }
}
