import * as THREE from 'three'
import type { War } from './sim'

const CAP = 10
const AGE = 45
const DIAG = 1.414

export type Goo = {
  age: Float32Array
  dist: Float32Array
  a: Float32Array
  b: Float32Array
  last: number
}

export const createGoo = (war: War): Goo => ({
  age: new Float32Array(war.cols * war.rows),
  dist: new Float32Array(war.cols * war.rows),
  a: new Float32Array(war.cols * war.rows),
  b: new Float32Array(war.cols * war.rows),
  last: -1,
})

export function softTexture(war: War) {
  const soft = new THREE.DataTexture(
    new Uint8Array(war.cols * war.rows),
    war.cols,
    war.rows,
    THREE.RedFormat,
  )
  soft.unpackAlignment = 1
  soft.magFilter = THREE.LinearFilter
  soft.minFilter = THREE.LinearFilter
  return soft
}

function box(cols: number, src: Float32Array, out: Float32Array, step: number) {
  const n = src.length
  if (step === 1) {
    for (let row = 0; row < n; row += cols) {
      const end = row + cols - 1
      out[row] = (2 * src[row] + src[row + 1]) / 3
      for (let i = row + 1; i < end; i++)
        out[i] = (src[i - 1] + src[i] + src[i + 1]) / 3
      out[end] = (src[end - 1] + 2 * src[end]) / 3
    }
    return
  }
  for (let i = 0; i < cols; i++) out[i] = (2 * src[i] + src[i + cols]) / 3
  for (let i = cols; i < n - cols; i++)
    out[i] = (src[i - cols] + src[i] + src[i + cols]) / 3
  for (let i = n - cols; i < n; i++) out[i] = (src[i - cols] + 2 * src[i]) / 3
}

function soften(war: War, goo: Goo, data: Uint8Array) {
  const { cols, corrupt, guard } = war
  const { a, b } = goo
  a.set(corrupt)
  for (let k = 0; k < 2; k++) {
    box(cols, a, b, 1)
    box(cols, b, a, cols)
  }
  for (let i = 0; i < corrupt.length; i++) b[i] = guard[i]
  box(cols, b, goo.dist, 1)
  box(cols, goo.dist, b, cols)
  for (let i = 0; i < corrupt.length; i++)
    data[i] = Math.round((corrupt[i] + (a[i] - corrupt[i]) * b[i]) * 255)
}

export function gridTexture(war: War) {
  const data = new Uint8Array(war.cols * war.rows * 4)
  const aux = new THREE.DataTexture(data, war.cols, war.rows, THREE.RGBAFormat)
  aux.magFilter = THREE.LinearFilter
  aux.minFilter = THREE.LinearFilter
  return aux
}

function chamfer(war: War, dist: Float32Array) {
  const { cols, rows, corrupt, tissue } = war
  for (let i = 0; i < dist.length; i++)
    dist[i] = tissue[i] && corrupt[i] >= 0.5 ? CAP : 0
  const relax = (i: number, j: number, w: number) => {
    if (dist[j] + w < dist[i]) dist[i] = dist[j] + w
  }
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c
      if (!dist[i]) continue
      if (c === 0 || r === 0 || c === cols - 1) {
        dist[i] = 1
        continue
      }
      relax(i, i - 1, 1)
      relax(i, i - cols, 1)
      relax(i, i - cols - 1, DIAG)
      relax(i, i - cols + 1, DIAG)
    }
  for (let r = rows - 1; r >= 0; r--)
    for (let c = cols - 1; c >= 0; c--) {
      const i = r * cols + c
      if (!dist[i]) continue
      if (c === cols - 1 || r === rows - 1 || c === 0) {
        dist[i] = 1
        continue
      }
      relax(i, i + 1, 1)
      relax(i, i + cols, 1)
      relax(i, i + cols + 1, DIAG)
      relax(i, i + cols - 1, DIAG)
    }
}

export function stir(war: War, goo: Goo, data: Uint8Array, soft: Uint8Array) {
  if (war.time === goo.last) return false
  const { cols, corrupt, guard, tissue } = war
  const first = goo.last < 0
  const dt = first ? 0 : Math.max(0, war.time - goo.last)
  goo.last = war.time
  soften(war, goo, soft)
  chamfer(war, goo.dist)
  for (let k = 0; k < 2; k++) {
    box(cols, goo.dist, goo.a, 1)
    box(cols, goo.a, goo.dist, cols)
  }
  const n = corrupt.length
  for (let i = 0; i < n; i++) {
    const v = corrupt[i]
    const held = tissue[i] && v >= 0.5
    goo.age[i] = held
      ? first
        ? AGE
        : Math.min(AGE, goo.age[i] + dt)
      : Math.max(0, goo.age[i] - dt * 6)
    const c = i % cols
    const l = c > 0 ? i - 1 : i
    const r = c < cols - 1 ? i + 1 : i
    const u = i >= cols ? i - cols : i
    const d = i + cols < n ? i + cols : i
    const near = Math.max(v, corrupt[l], corrupt[r], corrupt[u], corrupt[d])
    const open =
      held && (gap(war, l) || gap(war, r) || gap(war, u) || gap(war, d))
    const p = i * 4
    data[p] = Math.round((goo.dist[i] / CAP) * 255)
    data[p + 1] = Math.round((goo.age[i] / AGE) * 255)
    goo.a[i] = guard[i] && near > 0.05 ? 1 : 0
    data[p + 3] =
      !guard[i] && tissue[i] && ((v > 0.01 && v < 0.5) || open) ? 255 : 0
  }
  for (let k = 0; k < 2; k++) {
    box(cols, goo.a, goo.b, 1)
    box(cols, goo.b, goo.a, cols)
  }
  for (let i = 0; i < n; i++)
    data[i * 4 + 2] = Math.round(Math.min(1, goo.a[i] * 1.5) * 255)
  return true
}

const gap = (war: War, j: number) => war.tissue[j] === 1 && war.corrupt[j] < 0.5

const SIZE = 256
const LATTICE = 32

function lattice(seed: number) {
  let a = seed
  const rand = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return Float32Array.from({ length: LATTICE * LATTICE }, rand)
}

function smooth(grid: Float32Array, size: number, x: number, y: number) {
  const fx = Math.floor(x)
  const fy = Math.floor(y)
  const tx = x - fx
  const ty = y - fy
  const sx = tx * tx * (3 - 2 * tx)
  const sy = ty * ty * (3 - 2 * ty)
  const at = (u: number, v: number) =>
    grid[((v % size) * LATTICE + (u % size)) % grid.length]
  const top = at(fx, fy) + (at(fx + 1, fy) - at(fx, fy)) * sx
  const bottom = at(fx, fy + 1) + (at(fx + 1, fy + 1) - at(fx, fy + 1)) * sx
  return top + (bottom - top) * sy
}

export function noiseTexture() {
  const data = new Uint8Array(SIZE * SIZE * 4)
  for (let ch = 0; ch < 4; ch++) {
    const coarse = lattice(11 + ch * 7)
    const fine = lattice(97 + ch * 13)
    for (let y = 0; y < SIZE; y++)
      for (let x = 0; x < SIZE; x++) {
        const u = (x / SIZE) * LATTICE
        const v = (y / SIZE) * LATTICE
        const value =
          smooth(coarse, LATTICE, u, v) * 0.7 +
          smooth(fine, LATTICE, u * 2, v * 2) * 0.3
        data[(y * SIZE + x) * 4 + ch] = Math.round(value * 255)
      }
  }
  const noise = new THREE.DataTexture(data, SIZE, SIZE, THREE.RGBAFormat)
  noise.wrapS = THREE.RepeatWrapping
  noise.wrapT = THREE.RepeatWrapping
  noise.magFilter = THREE.LinearFilter
  noise.minFilter = THREE.LinearMipmapLinearFilter
  noise.generateMipmaps = true
  noise.needsUpdate = true
  return noise
}
