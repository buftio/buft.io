import { deposits, type Deposit } from './fat'
import { castles, type Castle } from './follicles'

export type Terrain = {
  tissue: Uint8Array
  folk: Uint8Array
  castles: Castle[]
  deposits: Deposit[]
}

export function terrain(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  cols: number,
  rows: number,
  per: number,
  cell: number,
  mpp: number,
  tumors: [number, number][][],
): Terrain {
  const tissue = new Uint8Array(cols * rows)
  const folk = new Uint8Array(cols * rows)
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      let stained = 0
      let nuclei = 0
      for (let dy = 0; dy < per; dy++)
        for (let dx = 0; dx < per; dx++) {
          const p = ((r * per + dy) * width + c * per + dx) * 4
          if (!data[p + 3]) continue
          const [R, G, B] = [data[p], data[p + 1], data[p + 2]]
          if (Math.max(R, G, B) - Math.min(R, G, B) > 28) stained++
          if (R < 160 && B > R - 5) nuclei++
        }
      const i = r * cols + c
      tissue[i] = stained >= per * per * 0.25 ? 1 : 0
      folk[i] = tissue[i] ? nuclei : 0
    }
  const height = rows * per
  return {
    tissue,
    folk,
    castles: castles(data, width, height, cell / per, mpp, tumors),
    deposits: deposits(data, width, height, cell / per, mpp, tumors),
  }
}
