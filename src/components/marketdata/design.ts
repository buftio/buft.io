export const COLS = 9
export const ROWS = 13
export const palettes = [
  {
    id: 'ruby',
    name: 'Ruby & indigo',
    colors: ['#8e293d', '#e7b969', '#233b59', '#f4e6c5'],
  },
  {
    id: 'forest',
    name: 'Pine & rose',
    colors: ['#244b42', '#d99597', '#9db2a0', '#f6e6bc'],
  },
  {
    id: 'night',
    name: 'Midnight & gold',
    colors: ['#28345b', '#d4a94f', '#9c5266', '#eee1c5'],
  },
  {
    id: 'apricot',
    name: 'Apricot & plum',
    colors: ['#d88458', '#693b57', '#e5bc70', '#fff0d0'],
  },
] as const
export type Palette = (typeof palettes)[number]['id']
export type Pattern = 'medallion' | 'diamonds' | 'garden'
export type RugDesign = { palette: Palette; pattern: Pattern; pixels: number[] }
export type Carpet = {
  id: string
  name: string
  design: RugDesign
  createdAt: number
  flying?: boolean
}
export const patterns: { id: Pattern; name: string }[] = [
  { id: 'medallion', name: 'Medallion' },
  { id: 'diamonds', name: 'Diamonds' },
  { id: 'garden', name: 'Garden' },
]

export function patternPixels(pattern: Pattern) {
  return Array.from({ length: COLS * ROWS }, (_, i) => {
    const x = (i % COLS) - 4
    const y = Math.floor(i / COLS) - 6
    if (pattern === 'diamonds') {
      const d = Math.abs(x) + Math.abs(((y + 6) % 6) - 3)
      return d === 3 ? 1 : d < 3 ? (d % 2 ? 2 : 3) : 0
    }
    if (pattern === 'garden') {
      const bloom = Math.abs(x) === 2 && Math.abs(y) % 4 === 1
      return bloom ? 3 : x === 0 ? 1 : Math.abs(x) === Math.abs(y % 4) ? 2 : 0
    }
    const d = Math.abs(x) + Math.abs(y) * 0.65
    return d < 1.5
      ? 3
      : d < 2.5
        ? 2
        : d < 3.6
          ? 1
          : Math.abs(x) === 4 && Math.abs(y) > 4
            ? 1
            : 0
  })
}

export const initialDesign: RugDesign = {
  palette: 'ruby',
  pattern: 'medallion',
  pixels: patternPixels('medallion'),
}

export const colorsFor = (design: RugDesign) =>
  palettes.find((palette) => palette.id === design.palette)!.colors

export function paintRug(
  ctx: CanvasRenderingContext2D,
  design: RugDesign,
  width: number,
  height: number,
) {
  const c = colorsFor(design)
  ctx.fillStyle = c[0]
  ctx.fillRect(0, 0, width, height)
  const border = width * 0.12
  for (const [inset, color, weight] of [
    [0.015, 3, 0.014],
    [0.045, 1, 0.05],
    [0.09, 2, 0.018],
    [0.115, 3, 0.008],
  ] as const) {
    ctx.strokeStyle = c[color]
    ctx.lineWidth = width * weight
    ctx.strokeRect(
      width * inset,
      width * inset,
      width * (1 - inset * 2),
      height - width * inset * 2,
    )
  }
  ctx.fillStyle = c[2]
  const step = width / 15
  for (let x = step; x < width - step / 2; x += step) {
    for (const y of [width * 0.06, height - width * 0.06]) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-step * 0.2, -step * 0.2, step * 0.4, step * 0.4)
      ctx.restore()
    }
  }
  for (let y = step * 1.8; y < height - step; y += step) {
    for (const x of [width * 0.06, width * 0.94]) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.PI / 4)
      ctx.fillRect(-step * 0.2, -step * 0.2, step * 0.4, step * 0.4)
      ctx.restore()
    }
  }
  const cellW = (width - border * 2) / COLS
  const cellH = (height - border * 2) / ROWS
  design.pixels.forEach((color, i) => {
    ctx.fillStyle = c[color]
    ctx.fillRect(
      border + (i % COLS) * cellW,
      border + Math.floor(i / COLS) * cellH,
      cellW + 0.5,
      cellH + 0.5,
    )
  })
  ctx.globalAlpha = 0.13
  for (let y = 0; y < height; y += 3) {
    ctx.fillStyle = y % 6 === 0 ? '#fff9db' : '#190e21'
    ctx.fillRect(0, y, width, 1)
  }
  ctx.globalAlpha = 0.07
  ctx.fillStyle = '#fff8dc'
  for (let x = 0; x < width; x += 3) ctx.fillRect(x, 0, 1, height)
  ctx.globalAlpha = 1
}

export function isCarpet(value: unknown): value is Carpet {
  if (!value || typeof value !== 'object') return false
  const rug = value as Carpet
  return (
    typeof rug.id === 'string' &&
    rug.id.length < 100 &&
    typeof rug.name === 'string' &&
    rug.name.length <= 40 &&
    Number.isFinite(rug.createdAt) &&
    (rug.flying === undefined || typeof rug.flying === 'boolean') &&
    !!rug.design &&
    palettes.some((p) => p.id === rug.design.palette) &&
    patterns.some((p) => p.id === rug.design.pattern) &&
    Array.isArray(rug.design.pixels) &&
    rug.design.pixels.length === COLS * ROWS &&
    rug.design.pixels.every((p) => Number.isInteger(p) && p >= 0 && p <= 3)
  )
}
