import { box } from './folk'

const SMALL_UM = 80
const WIDE_UM = 290
const CLEAR_UM = 650
const APART_UM = 2000
const CASTLES = 6

export type Castle = { x: number; y: number; score: number }

const blur = (src: Float32Array, w: number, h: number, sigma: number) => {
  const size = Math.max(1, Math.round(Math.sqrt(4 * sigma * sigma + 1)))
  return box(box(box(src, w, h, size), w, h, size), w, h, size)
}

export function castles(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  scale: number,
  mpp: number,
  tumors: [number, number][][],
): Castle[] {
  const um = mpp * scale
  const dark = new Float32Array(width * height)
  for (let i = 0; i < dark.length; i++) {
    const p = i * 4
    const [R, G, B] = [data[p], data[p + 1], data[p + 2]]
    if (data[p + 3] && Math.max(R, G, B) - Math.min(R, G, B) > 28)
      dark[i] = 255 - R
  }
  const near = blur(dark, width, height, SMALL_UM / um)
  const wide = blur(dark, width, height, WIDE_UM / um)
  const found: Castle[] = []
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const v = near[i] - wide[i]
      if (v <= 0) continue
      let top = true
      for (const j of [
        i - 1,
        i + 1,
        i - width,
        i + width,
        i - width - 1,
        i - width + 1,
        i + width - 1,
        i + width + 1,
      ])
        if (near[j] - wide[j] > v) top = false
      if (top)
        found.push({ x: (x + 0.5) * scale, y: (y + 0.5) * scale, score: v })
    }
  found.sort((a, b) => b.score - a.score)
  const clear = CLEAR_UM / mpp
  const apart = APART_UM / mpp
  const picked: Castle[] = []
  for (const c of found) {
    if (picked.length >= CASTLES) break
    if (picked.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < apart)) continue
    if (
      tumors.some((t) =>
        t.some(([x, y]) => Math.hypot(x - c.x, y - c.y) < clear),
      )
    )
      continue
    picked.push(c)
  }
  return picked
}
