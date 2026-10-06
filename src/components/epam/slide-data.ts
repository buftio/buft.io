export type SlideMeta = {
  width: number
  height: number
  tile: number
  zmax: number
  fmt: string
  mpp: number
  capZ: number
  deep: [number, number, number, number][]
  blank: string[]
  files: number
  bytes: number
  tumors: [number, number][][]
  source: string
}

export const SLIDE_URL = 'https://slides.buft.io/tumor_091/v3'
export const GLASS = '#dedae0'
export const EYE = 100_000

export async function loadSlide(): Promise<SlideMeta> {
  const response = await fetch(`${SLIDE_URL}/slide.json`)
  if (!response.ok) throw new Error(`slide.json ${response.status}`)
  return response.json()
}

export const tileUrl = (meta: SlideMeta, z: number, x: number, y: number) =>
  `${SLIDE_URL}/${z}/${x}_${y}.${meta.fmt}`

const blanks = new WeakMap<SlideMeta, Set<string>>()

export function tileExists(meta: SlideMeta, z: number, x: number, y: number) {
  let blank = blanks.get(meta)
  if (!blank) blanks.set(meta, (blank = new Set(meta.blank)))
  if (blank.has(`${z}/${x}_${y}`)) return false
  if (z <= meta.capZ) return true
  const size = 2 ** (meta.zmax - z) * meta.tile
  const [x0, y0] = [x * size, y * size]
  return meta.deep.some(
    ([left, top, right, bottom]) =>
      x0 + size >= left && x0 <= right && y0 + size >= top && y0 <= bottom,
  )
}

export type View = { x: number; y: number; scale: number }

export function fitView(meta: SlideMeta, width: number, height: number): View {
  const scale = Math.min(width / meta.width, height / meta.height) * 0.92
  return { x: meta.width / 2, y: meta.height / 2, scale }
}

export const minScale = (meta: SlideMeta, width: number, height: number) =>
  fitView(meta, width, height).scale * 0.6

export const MAX_SCALE = 2

export const mb = (bytes: number) => `${(bytes / 1e6).toFixed(1)} MB`

const NICE = [1, 2, 5]

export function scaleBar(mpp: number, scale: number, targetPx = 110) {
  const micronsPerPx = mpp / scale
  const raw = micronsPerPx * targetPx
  const power = 10 ** Math.floor(Math.log10(raw))
  const step = NICE.map((n) => n * power).findLast((n) => n <= raw) ?? power
  const px = step / micronsPerPx
  const label = step >= 1000 ? `${step / 1000} mm` : `${step} µm`
  return { px, label }
}
