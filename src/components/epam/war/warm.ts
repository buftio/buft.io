import type { SlideMeta } from '../slide-data'
import { capitalGeometry } from './capital'
import { noiseBytes } from './goo-field'
import { keepGeometry } from './keeps'
import { seepGeometry } from './seeps'
import { createWar, type War } from './sim'
import { CASTLES, DEPOSITS, siteAt } from './sites'
import type { Terrain } from './terrain'

export const CROWN = 'dawnhold'

const shelf = new Map<string, unknown[]>()
const wars = new WeakMap<Terrain, War>()
const warmed = new WeakSet<Terrain>()

function take<T>(key: string, make: () => T): T {
  const ready = shelf.get(key)?.pop()
  return ready === undefined ? make() : (ready as T)
}

const castleOf = (id: string) =>
  id === CROWN ? capitalGeometry() : keepGeometry(id)

export const castleShape = (id: string) =>
  take(`castle:${id}`, () => castleOf(id))

export const seepShape = (id: string) =>
  take(`seep:${id}`, () => seepGeometry(id))

export function warOf(meta: SlideMeta, land: Terrain) {
  const war = wars.get(land)
  wars.delete(land)
  return war ?? createWar(meta, meta.tumors, land)
}

const idle = (run: () => void) =>
  typeof requestIdleCallback === 'function'
    ? requestIdleCallback(run, { timeout: 2000 })
    : setTimeout(run, 50)

export function warmUp(meta: SlideMeta, land: Terrain) {
  if (warmed.has(land)) return
  warmed.add(land)
  const need = new Map<string, number>()
  const put = (key: string, make: () => unknown) => {
    need.set(key, (need.get(key) ?? 0) + 1)
    return () => {
      const list = shelf.get(key) ?? []
      if (list.length < (need.get(key) ?? 0)) shelf.set(key, [...list, make()])
    }
  }
  const jobs = [
    () => void wars.set(land, createWar(meta, meta.tumors, land)),
    () => void noiseBytes(),
    ...land.castles.map((c) => {
      const id = siteAt(CASTLES, c)?.id ?? ''
      return put(`castle:${id}`, () => castleOf(id))
    }),
    ...land.deposits.map((d) => {
      const id = siteAt(DEPOSITS, d)?.id ?? ''
      return put(`seep:${id}`, () => seepGeometry(id))
    }),
  ]
  const next = () => {
    jobs.shift()?.()
    if (jobs.length) idle(next)
  }
  idle(next)
}
