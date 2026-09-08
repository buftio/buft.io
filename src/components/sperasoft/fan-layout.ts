const rand = (i: number, k: number) => {
  const value = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
  return value - Math.floor(value)
}
type Fan = {
  x: number
  y: number
  size: number
  phase: number
  rate: number
  shirt: string
  skin: string
}

const shirts = [
  '#c8553d',
  '#2e8b88',
  '#d9a527',
  '#526f92',
  '#7a4c8f',
  '#e07a5f',
  '#81b29a',
  '#f3e6cf',
]
const skins = ['#f0d9b0', '#c78d63', '#8d5b3b', '#e6b98f']
const ROW = 4.9
const FIRST_ROW = 203
const ROWS = 9
const column = (x: number, count: number, offset = 0): [number, number][] =>
  Array.from({ length: count }, (_, i) => [x, FIRST_ROW + offset + i * ROW])
const seats = [
  ...column(11.8, ROWS),
  ...column(15.2, ROWS - 1, ROW / 2),
  ...column(95.5, ROWS),
]
export const fans: Fan[] = seats.map(([x, y], i) => ({
  x: x + (rand(i, 21) - 0.5) * 0.5,
  y,
  size: 0.9 + rand(i, 22) * 0.2,
  phase: rand(i, 23) * Math.PI * 2,
  rate: 0.8 + rand(i, 24) * 0.6,
  shirt: shirts[Math.floor(rand(i, 25) * shirts.length)],
  skin: skins[Math.floor(rand(i, 26) * skins.length)],
}))
