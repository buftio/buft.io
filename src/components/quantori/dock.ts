type Cells = [number, number][]

const L: Cells = [
  [0, 0],
  [0, 1],
  [0, 2],
  [1, 0],
]
const T: Cells = [
  [0, 0],
  [1, 0],
  [2, 0],
  [1, 1],
]
const P: Cells = [
  [0, 0],
  [1, 0],
  [0, 1],
  [1, 1],
  [0, 2],
]
const mirror = (cells: Cells): Cells => cells.map(([x, y]) => [-x, y])

export const slots: { name: string; cells: Cells; socket: [number, number] }[] =
  [
    { name: 'left', cells: L, socket: [-0.5, 0.28] },
    { name: 'right', cells: T, socket: [0.52, 0.3] },
    { name: 'bottom', cells: P, socket: [0, -0.42] },
  ]

export const candidates: {
  name: string
  color: string
  cells: Cells
  slot: number | null
  start: number
  note?: string
}[] = [
  {
    name: 'pink',
    color: '#e88fb4',
    cells: mirror(P),
    slot: null,
    start: 1,
    note: 'mirror image of amber',
  },
  { name: 'teal', color: '#3fb8af', cells: L, slot: 0, start: 1 },
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
    slot: null,
    start: 2,
    note: 'longer cousin of coral',
  },
  { name: 'coral', color: '#f2766b', cells: T, slot: 1, start: 2 },
  {
    name: 'lilac',
    color: '#b48ad8',
    cells: mirror(L),
    slot: null,
    start: 3,
    note: 'mirror image of teal',
  },
  { name: 'amber', color: '#f2b84b', cells: P, slot: 2, start: 3 },
]

export type Dock = {
  selected: number | null
  placed: (number | null)[]
  turns: number[]
  miss: { index: number; slot: number; at: number } | null
}

export const newDock = (): Dock => ({
  selected: null,
  placed: candidates.map(() => null),
  turns: candidates.map(({ start }) => start),
  miss: null,
})

export const isLocked = (dock: Dock, index: number) =>
  dock.placed[index] !== null && dock.turns[index] % 4 === 0

export const isSolved = (dock: Dock) =>
  slots.every((_, slot) =>
    dock.placed.some((at, index) => at === slot && isLocked(dock, index)),
  )

export const occupant = (dock: Dock, slot: number) =>
  dock.placed.findIndex((at) => at === slot)

export function pick(dock: Dock, index: number): Dock {
  if (isLocked(dock, index)) return dock
  if (dock.placed[index] !== null)
    return {
      ...dock,
      selected: null,
      turns: dock.turns.map((turn, i) => (i === index ? turn + 1 : turn)),
    }
  return { ...dock, selected: dock.selected === index ? null : index }
}

export function drop(dock: Dock, slot: number, now: number): Dock {
  const index = dock.selected
  if (index === null || occupant(dock, slot) !== -1) return dock
  if (candidates[index].slot !== slot)
    return { ...dock, selected: null, miss: { index, slot, at: now } }
  return {
    ...dock,
    selected: null,
    placed: dock.placed.map((at, i) => (i === index ? slot : at)),
  }
}

export function hint(dock: Dock) {
  const slot = slots.findIndex(
    (_, s) => !dock.placed.some((at, i) => at === s && isLocked(dock, i)),
  )
  if (slot === -1) return 'All three bind. Nice.'
  const index = candidates.findIndex((candidate) => candidate.slot === slot)
  const { name } = candidates[index]
  if (dock.placed[index] === slot) {
    const left = (4 - (dock.turns[index] % 4)) % 4
    return `Turn ${name} ${left === 1 ? 'once more' : `${left} more times`}.`
  }
  const twin = candidates.find((candidate) => candidate.note?.endsWith(name))
  const warning = twin
    ? ` Careful: ${twin.name} is its ${twin.note?.replace(/ of .*/, '')}, it won't bind.`
    : ''
  return `The ${slots[slot].name} pocket takes ${name}.${warning}`
}
