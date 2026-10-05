import {
  BORDER,
  DIRS,
  GATE,
  cellOf,
  foreign,
  given,
  inside,
  isWall,
  key,
  native,
  siteAt,
  sites,
  worth,
  type Cell,
  type Dir,
  type Kind,
  type Site,
} from './map'

export const SPEED = 1.8
export const GAP = 0.32
export const BELT = 1
export const BANKS = 6
export const FACTORY = 5
export const ROCKET = 1000
const NATIVE_EVERY = 1.3
const FOREIGN_EVERY = 0.16
const PAPER_EVERY = 2
const TAX_TIME = 1.5
const GATE_TIME = 6
const GATE_MAX = 24
const PILE: Partial<Record<Kind, number>> = {
  paper: 5,
  gray: 8,
  diamond: 12,
  gold: 4,
}

export type Item = { id: number; kind: Kind; p: number; n: number }
export type Belt = { dir: Dir; items: Item[]; fixed: boolean }
export type Held = { item: Item; from: Cell }

export type Game = {
  time: number
  ids: number
  wallet: number
  belts: Map<number, Belt>
  piles: Map<number, Item[]>
  registered: boolean
  sold: boolean
  minted: boolean
  built: number
  banks: boolean
  tax: { paper: number; gray: number; until: number }
  gate: number
  opened: boolean
  rocket: number
  launched: boolean
  denied: number
  next: { native: number; foreign: number; paper: number }
  held: Held | null
  version: number
}

export function newGame(): Game {
  const belts = new Map<number, Belt>()
  for (const { cells, dir } of given)
    for (const [x, y] of cells)
      belts.set(key(x, y), { dir, items: [], fixed: true })
  const piles = new Map<number, Item[]>()
  for (const site of Object.values(sites))
    for (const port of site.ports) piles.set(key(port.x, port.y), [])
  return {
    time: 0,
    ids: 1,
    wallet: 0,
    belts,
    piles,
    registered: false,
    sold: false,
    minted: false,
    built: 0,
    banks: false,
    tax: { paper: 0, gray: 0, until: -1 },
    gate: 0,
    opened: false,
    rocket: 0,
    launched: false,
    denied: -10,
    next: { native: 0, foreign: 0, paper: 0 },
    held: null,
    version: 0,
  }
}

const bump = (game: Game) => game.version++
const random = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)]
export const isOpen = (game: Game) => game.time < game.gate
const make = (game: Game, kind: Kind, n = 1): Item => ({
  id: game.ids++,
  kind,
  p: 0,
  n,
})

const roomAt = (belt: Belt, p: number) =>
  belt.items.every((item) => Math.abs(item.p - p) >= GAP)

function portOf(site: Site, kind: Kind) {
  const port = sites[site].ports.find((item) => item.kind === kind)
  return port ? key(port.x, port.y) : -1
}

function emit(game: Game, site: Site, item: Item) {
  const pile = game.piles.get(portOf(site, item.kind))
  if (!pile || pile.length >= (PILE[item.kind] ?? 6)) return false
  pile.push(item)
  return true
}

/** Hands an item to a building; false when it doesn't take that item right now. */
export function offer(game: Game, site: Site, item: Item): boolean {
  if (site === 'shop') {
    if (native.includes(item.kind)) {
      if (!emit(game, 'shop', make(game, 'gray'))) return false
      if (!game.sold) bump(game)
      game.sold = true
      return true
    }
    if (foreign.includes(item.kind))
      return emit(game, 'shop', make(game, 'diamond', worth[item.kind]))
    return false
  }
  if (site === 'tax') {
    const tax = game.tax
    if (item.kind === 'paper' && tax.paper < 4) return !!++tax.paper
    if (item.kind === 'gray' && tax.gray < 8) return !!++tax.gray
    return false
  }
  if (site === 'booth') {
    if (item.kind !== 'gold' || game.gate - game.time > GATE_MAX) return false
    game.gate = Math.max(game.time, game.gate) + GATE_TIME
    if (!game.opened) bump(game)
    game.opened = true
    return true
  }
  if (site === 'rocket') {
    if (item.kind !== 'diamond' || game.launched) return false
    const before = game.rocket
    game.rocket = Math.min(ROCKET, game.rocket + item.n)
    if (before !== game.rocket) bump(game)
    if (game.rocket >= ROCKET) {
      game.launched = true
      bump(game)
    }
    return true
  }
  return false
}

function handOff(game: Game, from: Cell, dir: Dir, item: Item, over: number) {
  const [x, y] = [from[0] + DIRS[dir][0], from[1] + DIRS[dir][1]]
  if (!inside(x, y)) return false
  if (x === GATE[0] && y === GATE[1] && !isOpen(game)) return false
  const next = game.belts.get(key(x, y))
  if (next) {
    if ((next.dir + 2) % 4 === dir || !roomAt(next, over)) return false
    next.items.push({ ...item, p: over })
    return true
  }
  const site = siteAt(x, y)
  return !!site && offer(game, site, item)
}

function move(game: Game, at: number, belt: Belt, dt: number) {
  const cell = cellOf(at)
  let limit = Infinity
  for (let i = 0; i < belt.items.length; i++) {
    const item = belt.items[i]
    const target = Math.min(item.p + SPEED * dt, limit)
    if (target >= 1 && handOff(game, cell, belt.dir, item, target - 1)) {
      belt.items.shift()
      i--
      continue
    }
    item.p = Math.max(item.p, Math.min(target, 1))
    limit = item.p - GAP
  }
}

function spawn(game: Game, source: 'native' | 'foreign', every: number) {
  if (game.time < game.next[source]) return
  const line = given.find((item) => item.source === source)!
  const belt = game.belts.get(key(...line.cells[0]))!
  if (!roomAt(belt, 0)) return
  belt.items.push(make(game, random(source === 'native' ? native : foreign)))
  game.next[source] = game.time + every
}

/** Advances the factory by `dt` seconds. */
export function step(game: Game, dt: number) {
  game.time += dt
  spawn(game, 'native', NATIVE_EVERY)
  spawn(game, 'foreign', FOREIGN_EVERY)
  if (game.registered && game.time >= game.next.paper) {
    if (emit(game, 'business', make(game, 'paper')))
      game.next.paper = game.time + PAPER_EVERY
  }
  const tax = game.tax
  if (tax.until < 0 && tax.paper >= 1 && tax.gray >= 2) {
    tax.paper--
    tax.gray -= 2
    tax.until = game.time + (game.banks ? TAX_TIME / 3 : TAX_TIME)
  }
  if (tax.until >= 0 && game.time >= tax.until) {
    if (!emit(game, 'tax', make(game, 'gold'))) game.wallet++
    tax.until = -1
    if (!game.minted) bump(game)
    game.minted = true
    bump(game)
  }
  for (const [at, pile] of game.piles) {
    const belt = game.belts.get(at)
    if (belt && pile.length && roomAt(belt, 0)) belt.items.push(pile.shift()!)
  }
  for (const [at, belt] of game.belts) move(game, at, belt, dt)
}

export const canBuild = (game: Game, x: number, y: number) =>
  inside(x, y) &&
  !isWall(x, y) &&
  !siteAt(x, y) &&
  !game.belts.get(key(x, y))?.fixed &&
  (x < BORDER || isOpen(game))

/** Lays or turns a belt. Turning is free; a new tile costs gold. */
export function build(game: Game, x: number, y: number, dir: Dir) {
  if (!canBuild(game, x, y)) return false
  const belt = game.belts.get(key(x, y))
  if (belt) {
    if (belt.dir !== dir) bump(game)
    belt.dir = dir
    return true
  }
  if (game.wallet < BELT) return false
  game.wallet -= BELT
  game.built++
  game.belts.set(key(x, y), { dir, items: [], fixed: false })
  bump(game)
  return true
}

export function remove(game: Game, x: number, y: number) {
  const belt = game.belts.get(key(x, y))
  if (!belt || belt.fixed) return false
  game.belts.delete(key(x, y))
  game.wallet += BELT
  bump(game)
  return true
}

export function register(game: Game) {
  if (game.registered) return
  game.registered = true
  game.next.paper = game.time + 0.6
  bump(game)
}

export function connectBanks(game: Game) {
  if (game.banks || game.wallet < BANKS) return
  game.wallet -= BANKS
  game.banks = true
  bump(game)
}

export function collect(game: Game) {
  const pile = game.piles.get(portOf('tax', 'gold'))!
  if (!pile.length) return false
  game.wallet += pile.length
  pile.length = 0
  bump(game)
  return true
}

/** Puts the carried gold coin, and the whole gold pile, into the wallet. */
export function pocket(game: Game) {
  if (game.held?.item.kind !== 'gold') return false
  game.held = null
  game.wallet++
  collect(game)
  bump(game)
  return true
}

/** Lifts an item off a belt or a pile so the player can carry it. */
export function grab(game: Game, id: number) {
  if (game.held) return null
  for (const [at, list] of [...game.belts]
    .map(([at, belt]) => [at, belt.items] as const)
    .concat([...game.piles])) {
    const index = list.findIndex((item) => item.id === id)
    if (index === -1) continue
    const [item] = list.splice(index, 1)
    game.held = { item, from: cellOf(at) }
    return item
  }
  return null
}

function putBack(game: Game, held: Held) {
  const at = key(...held.from)
  const belt = game.belts.get(at)
  const list = belt ? belt.items : game.piles.get(at)
  if (!list) return
  list.push(held.item)
  list.sort((a, b) => b.p - a.p)
}

export type Drop = 'taken' | 'denied' | 'back'

/** Drops the carried item on a cell: a building takes it, a belt carries it, otherwise it goes back. */
export function release(game: Game, x: number, y: number): Drop {
  const held = game.held
  if (!held) return 'back'
  game.held = null
  if (held.from[0] > BORDER && x <= BORDER && !isOpen(game)) {
    game.denied = game.time
    putBack(game, held)
    return 'denied'
  }
  const site = inside(x, y) ? siteAt(x, y) : null
  if (site && offer(game, site, held.item)) return 'taken'
  const belt = game.belts.get(key(x, y))
  if (inside(x, y) && belt && roomAt(belt, 0.5)) {
    belt.items.push({ ...held.item, p: 0.5 })
    belt.items.sort((a, b) => b.p - a.p)
    return 'taken'
  }
  putBack(game, held)
  return 'back'
}
