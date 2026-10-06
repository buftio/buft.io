import { tileExists, tileUrl, type SlideMeta } from '../slide-data'
import { DEPOSITS, type Deposit } from './fat'

const LEVEL = 3
const SPAN = 1600
const WHITE = 205
const SMALL_UM = 25
const LARGE_UM = 160
const CELLS = 6

async function patch(meta: SlideMeta, x: number, y: number) {
  const scale = 2 ** (meta.zmax - LEVEL)
  const size = Math.round(SPAN / scale)
  const x0 = Math.round(x / scale - size / 2)
  const y0 = Math.round(y / scale - size / 2)
  const canvas = new OffscreenCanvas(size, size)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('no 2d context')
  const jobs: Promise<void>[] = []
  for (
    let ty = Math.floor(y0 / meta.tile);
    ty <= Math.floor((y0 + size) / meta.tile);
    ty++
  )
    for (
      let tx = Math.floor(x0 / meta.tile);
      tx <= Math.floor((x0 + size) / meta.tile);
      tx++
    ) {
      if (!tileExists(meta, LEVEL, tx, ty)) continue
      jobs.push(
        fetch(tileUrl(meta, LEVEL, tx, ty))
          .then((response) => response.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            context.drawImage(bitmap, tx * meta.tile - x0, ty * meta.tile - y0)
            bitmap.close()
          }),
      )
    }
  await Promise.all(jobs)
  return {
    data: context.getImageData(0, 0, size, size).data,
    size,
    um: scale * meta.mpp,
  }
}

function cells(data: Uint8ClampedArray, size: number, um: number) {
  const white = new Uint8Array(size * size)
  const r = size / 2
  for (let i = 0; i < white.length; i++) {
    const [x, y, p] = [i % size, Math.floor(i / size), i * 4]
    if ((x + 0.5 - r) ** 2 + (y + 0.5 - r) ** 2 > r * r || !data[p + 3])
      continue
    if (Math.min(data[p], data[p + 1], data[p + 2]) > WHITE) white[i] = 1
  }
  let count = 0
  const stack: number[] = []
  for (let i = 0; i < white.length; i++) {
    if (white[i] !== 1) continue
    white[i] = 2
    stack.push(i)
    let area = 0
    while (stack.length) {
      const j = stack.pop()!
      const x = j % size
      area++
      for (const k of [
        x > 0 ? j - 1 : -1,
        x < size - 1 ? j + 1 : -1,
        j - size,
        j + size,
      ])
        if (k >= 0 && k < white.length && white[k] === 1) {
          white[k] = 2
          stack.push(k)
        }
    }
    const across = 2 * Math.sqrt(area / Math.PI) * um
    if (across > SMALL_UM && across < LARGE_UM) count++
  }
  return count
}

export async function fatty(meta: SlideMeta, found: Deposit[]) {
  const kept = await Promise.all(
    found.map(async (d) => {
      try {
        const { data, size, um } = await patch(meta, d.x, d.y)
        return cells(data, size, um) >= CELLS
      } catch {
        return true
      }
    }),
  )
  return found.filter((_, k) => kept[k]).slice(0, DEPOSITS)
}
