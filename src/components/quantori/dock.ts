type Cells = [number, number][]

export const slots: { name: string; socket: [number, number] }[] = [
  { name: 'left', socket: [-0.5, 0.28] },
  { name: 'right', socket: [0.52, 0.3] },
  { name: 'bottom', socket: [0, -0.42] },
]

export const candidates: {
  name: string
  color: string
  cells: Cells
  start: number
}[] = [
  {
    name: 'pink',
    color: '#e88fb4',
    cells: [
      [0, 0],
      [-1, 0],
      [0, 1],
      [-1, 1],
      [0, 2],
    ],
    start: 1,
  },
  {
    name: 'teal',
    color: '#3fb8af',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
    ],
    start: 1,
  },
  {
    name: 'sky',
    color: '#6fa8dc',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [1, 1],
    ],
    start: 2,
  },
  {
    name: 'coral',
    color: '#f2766b',
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
      [1, 1],
    ],
    start: 2,
  },
  {
    name: 'lilac',
    color: '#b48ad8',
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [-1, 0],
    ],
    start: 3,
  },
  {
    name: 'amber',
    color: '#f2b84b',
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
    start: 3,
  },
]

export type Try = { guess: number[]; right: number; near: number }

export type Dock = {
  secret: number[]
  selected: number | null
  placed: (number | null)[]
  given: number[]
  tries: Try[]
}

export function newDock(): Dock {
  const pool = candidates.map((_, i) => i)
  const secret = slots.map(
    () => pool.splice(Math.floor(Math.random() * pool.length), 1)[0],
  )
  return {
    secret,
    selected: null,
    placed: candidates.map(() => null),
    given: [],
    tries: [],
  }
}

export const occupant = (dock: Dock, slot: number) =>
  dock.placed.findIndex((at) => at === slot)

export const guessOf = (dock: Dock) =>
  slots.map((_, slot) => occupant(dock, slot))
const isFull = (dock: Dock) => guessOf(dock).every((index) => index !== -1)
const last = (dock: Dock) => dock.tries[dock.tries.length - 1]

export const isPending = (dock: Dock) =>
  isFull(dock) && last(dock)?.guess.join() !== guessOf(dock).join()

export const isSolved = (dock: Dock) =>
  !isPending(dock) && isFull(dock) && last(dock)?.right === slots.length

export const isLocked = (dock: Dock, index: number) =>
  dock.given.includes(index) || (isSolved(dock) && dock.placed[index] !== null)

const place = (dock: Dock, index: number, slot: number): Dock => {
  const taken = occupant(dock, slot)
  return {
    ...dock,
    selected: null,
    placed: dock.placed.map((at, i) =>
      i === index ? slot : i === taken ? dock.placed[index] : at,
    ),
  }
}

export function pick(dock: Dock, index: number): Dock {
  if (isPending(dock) || isLocked(dock, index)) return dock
  const slot = dock.placed[index]
  if (slot === null)
    return { ...dock, selected: dock.selected === index ? null : index }
  if (dock.selected !== null) return place(dock, dock.selected, slot)
  return {
    ...dock,
    placed: dock.placed.map((at, i) => (i === index ? null : at)),
  }
}

export function drop(dock: Dock, slot: number): Dock {
  const index = dock.selected
  if (index === null || isPending(dock)) return dock
  if (dock.given.includes(occupant(dock, slot))) return dock
  return place(dock, index, slot)
}

export function score(dock: Dock): Dock {
  if (!isPending(dock)) return dock
  const guess = guessOf(dock)
  const right = guess.filter((index, slot) => dock.secret[slot] === index)
  const near = guess.filter(
    (index, slot) => dock.secret[slot] !== index && dock.secret.includes(index),
  )
  return {
    ...dock,
    tries: [...dock.tries, { guess, right: right.length, near: near.length }],
  }
}

export function ask(dock: Dock): { dock: Dock; slot: number } | null {
  if (isPending(dock)) return null
  const slot = slots.findIndex((_, s) => !dock.given.includes(dock.secret[s]))
  if (slot === -1) return null
  const index = dock.secret[slot]
  const freed = { ...dock, selected: null, placed: [...dock.placed] }
  const taken = occupant(freed, slot)
  if (taken !== -1) freed.placed[taken] = null
  freed.placed[index] = slot
  return { dock: { ...freed, given: [...dock.given, index] }, slot }
}
