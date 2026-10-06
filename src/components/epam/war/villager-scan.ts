const NUCLEUS_UM = 6.5
export const STRIDE = 10
const NONE = 9

export function traits(
  data: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  found: number[],
  mpp: number,
  scale: number,
  ox: number,
  oy: number,
) {
  const diam = NUCLEUS_UM / mpp
  const win = Math.max(2, Math.round(diam * 0.75))
  const n = found.length / 2
  const out = new Float32Array(n * STRIDE)
  for (let k = 0; k < n; k++) {
    const cx = found[k * 2]
    const cy = found[k * 2 + 1]
    let sum = 0
    let cnt = 0
    for (let y = -win; y <= win; y++)
      for (let x = -win; x <= win; x++) {
        const px = cx + x
        const py = cy + y
        if (px < 0 || py < 0 || px >= w || py >= h || x * x + y * y > win * win)
          continue
        sum += 255 - data[(py * w + px) * 4]
        cnt++
      }
    const thr = sum / Math.max(1, cnt)
    let m = 0
    let mx = 0
    let my = 0
    let sxx = 0
    let syy = 0
    let sxy = 0
    let area = 0
    let r = 0
    let g = 0
    let b = 0
    for (let y = -win; y <= win; y++)
      for (let x = -win; x <= win; x++) {
        const px = cx + x
        const py = cy + y
        if (px < 0 || py < 0 || px >= w || py >= h || x * x + y * y > win * win)
          continue
        const p = (py * w + px) * 4
        const v = 255 - data[p] - thr
        if (v <= 0) continue
        area++
        m += v
        mx += v * x
        my += v * y
        sxx += v * x * x
        syy += v * y * y
        sxy += v * x * y
        r += v * data[p]
        g += v * data[p + 1]
        b += v * data[p + 2]
      }
    const o = k * STRIDE
    const mm = Math.max(m, 1e-3)
    const ax = mx / mm
    const ay = my / mm
    const vxx = sxx / mm - ax * ax
    const vyy = syy / mm - ay * ay
    const vxy = sxy / mm - ax * ay
    const half = (vxx + vyy) / 2
    const root = Math.sqrt(Math.max(0, half * half - (vxx * vyy - vxy * vxy)))
    const ratio = Math.sqrt((half + root) / Math.max(half - root, 0.05))
    out[o] = (ox + cx + 0.5 + Math.max(-1, Math.min(1, ax))) * scale
    out[o + 1] = (oy + cy + 0.5 + Math.max(-1, Math.min(1, ay))) * scale
    out[o + 2] =
      Math.min(1.3, Math.max(0.8, Math.sqrt(area / Math.PI) / (diam / 2))) *
      (diam / 2) *
      scale
    out[o + 3] = Math.min(1.45, Math.max(1, ratio || 1))
    out[o + 4] = -0.5 * Math.atan2(2 * vxy, vxx - vyy)
    out[o + 5] = NONE
    out[o + 6] = -1
    out[o + 7] = m ? r / mm / 255 : 0.35
    out[o + 8] = m ? g / mm / 255 : 0.25
    out[o + 9] = m ? b / mm / 255 : 0.55
  }
  pairs(out, n, diam * scale * 2.1, (diam / 2) * scale * 0.6)
  return out
}

function pairs(out: Float32Array, n: number, reach: number, least: number) {
  const grid = new Map<number, number[]>()
  const key = (x: number, y: number) =>
    Math.floor(x / reach) * 65536 + Math.floor(y / reach)
  for (let k = 0; k < n; k++) {
    const id = key(out[k * STRIDE], out[k * STRIDE + 1])
    const list = grid.get(id)
    if (list) list.push(k)
    else grid.set(id, [k])
  }
  const near = new Int32Array(n).fill(-1)
  for (let k = 0; k < n; k++) {
    const x = out[k * STRIDE]
    const y = out[k * STRIDE + 1]
    const gx = Math.floor(x / reach)
    const gy = Math.floor(y / reach)
    let best = reach
    for (let i = -1; i <= 1; i++)
      for (let j = -1; j <= 1; j++)
        for (const q of grid.get((gx + i) * 65536 + gy + j) ?? []) {
          if (q === k) continue
          const d = Math.hypot(out[q * STRIDE] - x, out[q * STRIDE + 1] - y)
          if (d < best) {
            best = d
            near[k] = q
          }
        }
    out[k * STRIDE + 2] = Math.min(
      out[k * STRIDE + 2],
      Math.max(least, best * 0.62),
    )
  }
  for (let k = 0; k < n; k++) {
    const q = near[k]
    if (q < 0 || near[q] !== k || q < k) continue
    const dx = out[q * STRIDE] - out[k * STRIDE]
    const dy = out[q * STRIDE + 1] - out[k * STRIDE + 1]
    const id =
      (Math.sin(out[k * STRIDE] * 12.9898 + out[k * STRIDE + 1] * 78.233) *
        43758.5453) %
      1
    out[k * STRIDE + 5] = Math.atan2(-dy, dx)
    out[q * STRIDE + 5] = Math.atan2(dy, -dx)
    out[k * STRIDE + 6] = Math.abs(id)
    out[q * STRIDE + 6] = Math.abs(id)
  }
}
