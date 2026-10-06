import type * as THREE from 'three'
import { createGoo, stir, type Goo, type Grid } from './goo-stir'

type Out = { data: Uint8Array; soft: Uint8Array }

const bytes = (texture: THREE.DataTexture) => texture.image.data as Uint8Array

export function gooThread(aux: THREE.DataTexture, soft: THREE.DataTexture) {
  let goo: Goo | null = null
  let spare: Out | null = null
  let busy = false
  let worker: Worker | null = null
  const local = (grid: Grid) => {
    goo ??= createGoo(grid)
    if (!stir(grid, goo, bytes(aux), bytes(soft))) return
    aux.needsUpdate = true
    soft.needsUpdate = true
  }
  try {
    worker = new Worker(new URL('./goo-worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.onmessage = (event: MessageEvent<Out & { ok: boolean }>) => {
      busy = false
      const out = event.data
      if (!out.ok) {
        spare = out
        return
      }
      spare = { data: bytes(aux), soft: bytes(soft) }
      aux.image.data = out.data
      soft.image.data = out.soft
      aux.needsUpdate = true
      soft.needsUpdate = true
    }
    worker.onerror = () => {
      worker?.terminate()
      worker = null
      busy = false
    }
  } catch {
    worker = null
  }
  return {
    stir(grid: Grid) {
      if (!worker) {
        local(grid)
        return true
      }
      if (busy) return false
      const out = spare ?? {
        data: new Uint8Array(bytes(aux).length),
        soft: new Uint8Array(bytes(soft).length),
      }
      spare = null
      busy = true
      const { cols, rows, time, corrupt, guard, tissue } = grid
      worker.postMessage(
        { cols, rows, time, corrupt, guard, tissue, ...out },
        { transfer: [out.data.buffer, out.soft.buffer] },
      )
      return true
    },
    stop: () => worker?.terminate(),
  }
}
