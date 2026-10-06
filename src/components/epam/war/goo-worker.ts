import { createGoo, stir, type Goo, type Grid } from './goo-stir'

let goo: Goo | null = null

self.onmessage = (
  event: MessageEvent<Grid & { data: Uint8Array; soft: Uint8Array }>,
) => {
  const { data, soft, ...grid } = event.data
  goo ??= createGoo(grid)
  const ok = stir(grid, goo, data, soft)
  self.postMessage({ data, soft, ok }, { transfer: [data.buffer, soft.buffer] })
}
