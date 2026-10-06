import { box } from './folk'

const SPREAD_UM = 160
const WHITE = 205
const SEAL_UM = 120
const RICH = 0.3
const CLEAR_UM = 900
const APART_UM = 1200
export const DEPOSITS = 10
const CANDIDATES = 24

export type Deposit = { x: number; y: number; rich: number }

const blur = (src: Float32Array, w: number, h: number, sigma: number) => {
  const size = Math.max(1, Math.round(Math.sqrt(4 * sigma * sigma + 1)))
  return box(box(box(src, w, h, size), w, h, size), w, h, size)
}

function enclosed(stain: Float32Array, w: number, h: number, size: number) {
  const sealed = box(stain, w, h, size)
  const outside = new Uint8Array(w * h)
  const queue: number[] = []
  const push = (i: number) => {
    if (outside[i] || sealed[i] > 0) return
    outside[i] = 1
    queue.push(i)
  }
  for (let x = 0; x < w; x++) {
    push(x)
    push((h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    push(y * w)
    push(y * w + w - 1)
  }
  while (queue.length) {
    const i = queue.pop()!
    const x = i % w
    if (x > 0) push(i - 1)
    if (x < w - 1) push(i + 1)
    if (i >= w) push(i - w)
    if (i < w * (h - 1)) push(i + w)
  }
  return outside
}

export function deposits(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  scale: number,
  mpp: number,
  tumors: [number, number][][],
): Deposit[] {
  const white = new Float32Array(width * height)
  const stain = new Float32Array(width * height)
  for (let i = 0; i < white.length; i++) {
    const p = i * 4
    if (!data[p + 3]) continue
    const [R, G, B] = [data[p], data[p + 1], data[p + 2]]
    if (Math.min(R, G, B) > WHITE) white[i] = 1
    if (Math.max(R, G, B) - Math.min(R, G, B) > 28) stain[i] = 1
  }
  const px = mpp * scale
  const outside = enclosed(
    stain,
    width,
    height,
    Math.max(1, Math.round(SEAL_UM / px)),
  )
  for (let i = 0; i < white.length; i++) if (outside[i]) white[i] = 0
  const fat = blur(white, width, height, SPREAD_UM / px)
  const found: Deposit[] = []
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      const v = fat[i]
      if (v < RICH) continue
      if ([i - 1, i + 1, i - width, i + width].some((j) => fat[j] > v)) continue
      found.push({ x: (x + 0.5) * scale, y: (y + 0.5) * scale, rich: v })
    }
  found.sort((a, b) => b.rich - a.rich)
  const clear = CLEAR_UM / mpp
  const apart = APART_UM / mpp
  const picked: Deposit[] = []
  for (const d of found) {
    if (picked.length >= CANDIDATES) break
    if (picked.some((p) => Math.hypot(p.x - d.x, p.y - d.y) < apart)) continue
    if (
      tumors.some((t) =>
        t.some(([x, y]) => Math.hypot(x - d.x, y - d.y) < clear),
      )
    )
      continue
    picked.push(d)
  }
  return picked
}
