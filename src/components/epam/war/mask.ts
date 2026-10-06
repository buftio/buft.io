import { tileExists, tileUrl, type SlideMeta } from '../slide-data'
import { fatty } from './cells'
import { CELL } from './sim'
import { terrain } from './terrain'

const LEVEL = 2

export async function loadTerrain(meta: SlideMeta) {
  const cols = Math.ceil(meta.width / CELL)
  const rows = Math.ceil(meta.height / CELL)
  const scale = 2 ** (meta.zmax - LEVEL)
  const per = CELL / scale
  const span = Math.ceil(meta.width / scale / meta.tile)
  const down = Math.ceil(meta.height / scale / meta.tile)
  const canvas = new OffscreenCanvas(cols * per, rows * per)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('no 2d context')
  const jobs: Promise<void>[] = []
  for (let y = 0; y < down; y++)
    for (let x = 0; x < span; x++) {
      if (!tileExists(meta, LEVEL, x, y)) continue
      jobs.push(
        fetch(tileUrl(meta, LEVEL, x, y))
          .then((response) => response.blob())
          .then((blob) => createImageBitmap(blob))
          .then((bitmap) => {
            context.drawImage(bitmap, x * meta.tile, y * meta.tile)
            bitmap.close()
          }),
      )
    }
  await Promise.all(jobs)
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height)
  const land = terrain(
    data,
    canvas.width,
    cols,
    rows,
    per,
    CELL,
    meta.mpp,
    meta.tumors,
  )
  return { ...land, deposits: await fatty(meta, land.deposits) }
}
