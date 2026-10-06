import type { SlideMeta } from '../slide-data'
import { loadTerrain } from './mask'

self.onmessage = (event: MessageEvent<SlideMeta>) =>
  loadTerrain(event.data).then(
    (land) =>
      self.postMessage(land, {
        transfer: [land.tissue.buffer, land.folk.buffer],
      }),
    (error) => self.postMessage({ error: String(error) }),
  )
