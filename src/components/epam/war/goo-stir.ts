import type { War } from './sim'

export type Grid = Pick<
  War,
  'cols' | 'rows' | 'corrupt' | 'guard' | 'tissue' | 'time'
>

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

export const createGoo = (war: Grid): Goo => ({
  age: new Float32Array(war.cols * war.rows),
  dist: new Float32Array(war.cols * war.rows),
  a: new Float32Array(war.cols * war.rows),
  b: new Float32Array(war.cols * war.rows),
  last: -1,
})

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

function soften(war: Grid, goo: Goo, data: Uint8Array) {
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

function chamfer(war: Grid, dist: Float32Array) {
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

export function stir(war: Grid, goo: Goo, data: Uint8Array, soft: Uint8Array) {
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

const gap = (war: Grid, j: number) =>
  war.tissue[j] === 1 && war.corrupt[j] < 0.5
