export type Cell = [number, number]
export type Dir = 0 | 1 | 2 | 3

export const W = 20
export const H = 9
export const BORDER = 13
export const GATE: Cell = [13, 4]
export const DIRS: Cell[] = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
]

export type Kind =
  | 'potato'
  | 'tomato'
  | 'bear'
  | 'van'
  | 'monkey'
  | 'banana'
  | 'grapes'
  | 'car'
  | 'paper'
  | 'gray'
  | 'gold'
  | 'diamond'

export const native: Kind[] = ['potato', 'tomato', 'bear', 'van']
export const foreign: Kind[] = ['banana', 'grapes', 'monkey', 'car']
export const worth: Partial<Record<Kind, number>> = {
  banana: 1,
  grapes: 2,
  monkey: 4,
  car: 8,
}

export type Site = 'shop' | 'business' | 'tax' | 'bank' | 'booth' | 'rocket'
export type Port = { kind: Kind; x: number; y: number }

export const sites: Record<
  Site,
  { x: number; y: number; w: number; h: number; ports: Port[] }
> = {
  shop: {
    x: 5,
    y: 1,
    w: 2,
    h: 2,
    ports: [
      { kind: 'gray', x: 5, y: 3 },
      { kind: 'diamond', x: 6, y: 0 },
    ],
  },
  business: { x: 1, y: 5, w: 2, h: 2, ports: [{ kind: 'paper', x: 3, y: 6 }] },
  tax: {
    x: 5,
    y: 5,
    w: 2,
    h: 2,
    ports: [
      { kind: 'gold', x: 7, y: 5 },
      { kind: 'gold', x: 7, y: 6 },
    ],
  },
  bank: { x: 8, y: 6, w: 2, h: 2, ports: [] },
  booth: { x: 12, y: 5, w: 1, h: 1, ports: [] },
  rocket: { x: 8, y: 0, w: 3, h: 3, ports: [] },
}

export const given: {
  cells: Cell[]
  dir: Dir
  source?: 'native' | 'foreign'
}[] = [
  {
    cells: [
      [0, 2],
      [1, 2],
      [2, 2],
    ],
    dir: 0,
    source: 'native',
  },
  {
    cells: [
      [17, 0],
      [17, 1],
      [17, 2],
      [17, 3],
    ],
    dir: 1,
    source: 'foreign',
  },
  { cells: [GATE], dir: 2 },
]

export const key = (x: number, y: number) => y * W + x
export const cellOf = (k: number): Cell => [k % W, Math.floor(k / W)]
export const inside = (x: number, y: number) =>
  x >= 0 && y >= 0 && x < W && y < H

export function siteAt(x: number, y: number): Site | null {
  for (const [name, s] of Object.entries(sites) as [
    Site,
    (typeof sites)[Site],
  ][])
    if (x >= s.x && y >= s.y && x < s.x + s.w && y < s.y + s.h) return name
  return null
}

export const isWall = (x: number, y: number) =>
  x === BORDER && !(x === GATE[0] && y === GATE[1])

export const toWorld = (x: number, y: number): [number, number] => [
  x - W / 2 + 0.5,
  y - H / 2 + 0.5,
]
