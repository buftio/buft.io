import type { SlideMeta } from '../slide-data'
import { loadTerrain } from './mask'
import type { Terrain } from './terrain'

export function landOf(meta: SlideMeta, signal: AbortSignal) {
  if (typeof Worker === 'undefined') return loadTerrain(meta)
  return new Promise<Terrain>((resolve, reject) => {
    const worker = new Worker(new URL('./terrain-worker.ts', import.meta.url), {
      type: 'module',
    })
    const done = () => worker.terminate()
    signal.addEventListener('abort', done)
    worker.onmessage = (event: MessageEvent<Terrain | { error: string }>) => {
      done()
      if ('error' in event.data) reject(new Error(event.data.error))
      else resolve(event.data)
    }
    worker.onerror = () => {
      done()
      loadTerrain(meta).then(resolve, reject)
    }
    worker.postMessage(meta)
  })
}
