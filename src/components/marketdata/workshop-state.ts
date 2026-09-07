import type { Carpet } from './design'

export const DURATION = 30
export const STAGGER = 0.08
export const ARRIVAL_END = 1.14
export type Run = Carpet & { progress: number }
export type WorkshopClock = { progress: number; time: number; runs: Run[] }

export function spaceRuns(runs: Run[]) {
  let previous = Infinity
  return runs.map((rug) => {
    const progress = Math.min(rug.progress, previous - STAGGER)
    previous = progress
    return { ...rug, progress }
  })
}

export function nextDeparture(runs: Run[]) {
  return Math.min(0, (runs.at(-1)?.progress ?? STAGGER) - STAGGER)
}

export function moveRuns(runs: Run[], seconds: number) {
  const advanced = runs.map((rug) => ({
    ...rug,
    progress: rug.progress + seconds / DURATION,
  }))
  return {
    pending: advanced.filter((rug) => rug.progress < ARRIVAL_END),
    finished: advanced
      .filter((rug) => rug.progress >= ARRIVAL_END)
      .map(({ progress: _progress, ...rug }) => rug),
  }
}
