import type * as THREE from 'three'
import type { Cell } from './cells'
import { FILL_S, LID_S, writeCell } from './comb'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const clamp01 = (k: number) => Math.min(1, Math.max(0, k))

export class Comb {
  readonly n: number
  readonly lf: Float32Array
  readonly lt: Float32Array
  readonly l0: Float32Array
  readonly cf: Float32Array
  readonly ct: Float32Array
  readonly c0: Float32Array
  readonly busy: Uint8Array
  readonly mother: Uint8Array
  readonly fade: Float32Array

  constructor(
    readonly list: Cell[],
    readonly geo: THREE.BufferGeometry,
    isMother: (c: Cell) => boolean,
    fade: (c: Cell) => number,
    rnd: () => number,
  ) {
    const n = (this.n = list.length)
    this.lf = new Float32Array(n)
    this.lt = new Float32Array(n)
    this.l0 = new Float32Array(n).fill(-100)
    this.cf = new Float32Array(n)
    this.ct = new Float32Array(n)
    this.c0 = new Float32Array(n).fill(-100)
    this.busy = new Uint8Array(n)
    this.mother = Uint8Array.from(list, (c) => (isMother(c) ? 1 : 0))
    this.fade = Float32Array.from(list, fade)
    for (let i = 0; i < n; i++) {
      if (this.mother[i]) continue
      const u = rnd() / Math.max(0.2, this.fade[i])
      const full = u < 0.78 ? 1 : 0
      const lid = u < 0.58 ? 1 : 0
      this.lf[i] = this.lt[i] = full
      this.cf[i] = this.ct[i] = lid
    }
    for (let i = 0; i < n; i++) this.write(i)
  }

  level(i: number, t: number) {
    const k = clamp01((t - this.l0[i]) / FILL_S)
    return this.lf[i] + (this.lt[i] - this.lf[i]) * k * k * (3 - 2 * k)
  }

  lid(i: number, t: number) {
    return this.cf[i] + (this.ct[i] - this.cf[i]) * clamp01((t - this.c0[i]) / LID_S)
  }

  setLevel(i: number, to: number, t: number) {
    this.lf[i] = this.level(i, t)
    this.lt[i] = to
    this.l0[i] = t
    this.write(i)
  }

  setLid(i: number, to: number, t: number) {
    this.cf[i] = this.lid(i, Math.max(t, this.c0[i]))
    this.ct[i] = to
    this.c0[i] = t
    this.write(i)
  }

  write(i: number) {
    writeCell(this.geo, i, [this.lf[i], this.lt[i], this.l0[i]], [this.cf[i], this.ct[i], this.c0[i]])
  }

  free(i: number) {
    return !this.mother[i] && !this.busy[i] && this.fade[i] > 0.6
  }

  empty(i: number) {
    return this.free(i) && this.lt[i] === 0 && this.ct[i] === 0
  }

  open(i: number) {
    return this.free(i) && this.ct[i] === 0 && this.lt[i] > 0.05
  }

  sealed(i: number) {
    return this.free(i) && this.ct[i] === 1 && this.lt[i] === 1
  }

  near(x: number, y: number, reach: number, ok: (i: number) => boolean, rnd: () => number) {
    let best = [-1, -1, -1]
    let dist = [Infinity, Infinity, Infinity]
    for (let i = 0; i < this.n; i++) {
      if (!ok(i)) continue
      const c = this.list[i]
      const d = Math.hypot(c.x - x, c.y - y)
      if (d > reach) continue
      if (d < dist[2]) {
        const k = d < dist[0] ? 0 : d < dist[1] ? 1 : 2
        best = [...best.slice(0, k), i, ...best.slice(k, 2)]
        dist = [...dist.slice(0, k), d, ...dist.slice(k, 2)]
      }
    }
    const found = best.filter((i) => i >= 0)
    return found.length ? found[Math.floor(rnd() * found.length)] : -1
  }

  any(ok: (i: number) => boolean, rnd: () => number) {
    const start = Math.floor(rnd() * this.n)
    for (let k = 0; k < this.n; k++) {
      const i = (start + k) % this.n
      if (ok(i)) return i
    }
    return -1
  }
}
