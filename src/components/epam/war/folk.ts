const NUCLEUS_UM = 6.5
const FLOOR = 95
const PERCENTILE = 0.55

export function box(src: Float32Array, w: number, h: number, size: number) {
  const lo = Math.floor(size / 2)
  const hi = size - 1 - lo
  const pass = (from: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(from.length)
    const [len, lines] = horizontal ? [w, h] : [h, w]
    for (let line = 0; line < lines; line++) {
      const at = (k: number) => {
        const q = Math.min(len - 1, Math.max(0, k))
        return horizontal ? from[line * w + q] : from[q * w + line]
      }
      let sum = 0
      for (let k = -lo; k <= hi; k++) sum += at(k)
      for (let k = 0; k < len; k++) {
        out[horizontal ? line * w + k : k * w + line] = sum / size
        sum += at(k + hi + 1) - at(k - lo)
      }
    }
    return out
  }
  return pass(pass(src, true), false)
}

function peaks(src: Float32Array, w: number, h: number, size: number) {
  const lo = Math.floor(size / 2)
  const hi = size - 1 - lo
  const pass = (from: Float32Array, horizontal: boolean) => {
    const out = new Float32Array(from.length)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        let top = -Infinity
        for (let k = -lo; k <= hi; k++) {
          const v = horizontal
            ? from[y * w + Math.min(w - 1, Math.max(0, x + k))]
            : from[Math.min(h - 1, Math.max(0, y + k)) * w + x]
          if (v > top) top = v
        }
        out[y * w + x] = top
      }
    return out
  }
  return pass(pass(src, true), false)
}

export function nuclei(
  data: Uint8Array | Uint8ClampedArray,
  w: number,
  h: number,
  mpp: number,
) {
  const diam = NUCLEUS_UM / mpp
  const blurSize = Math.max(1, Math.floor(diam * 0.5))
  const peakSize = Math.max(3, Math.floor(diam * 0.75))
  const n = w * h
  const dark = new Float32Array(n)
  const tint = new Float32Array(n)
  const tissue = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    const p = i * 4
    const [r, g, b] = [data[p], data[p + 1], data[p + 2]]
    dark[i] = 255 - r
    tint[i] = b - r
    tissue[i] =
      data[p + 3] && Math.max(r, g, b) - Math.min(r, g, b) > 28 ? 1 : 0
  }
  const blur = box(dark, w, h, blurSize)
  const blue = box(tint, w, h, blurSize)
  const histogram = new Uint32Array(257)
  let count = 0
  for (let i = 0; i < n; i++)
    if (tissue[i]) {
      histogram[Math.min(256, Math.max(0, Math.round(blur[i])))]++
      count++
    }
  let threshold = FLOOR
  for (let v = 0, seen = 0; v <= 256 && count; v++) {
    seen += histogram[v]
    if (seen >= count * PERCENTILE) {
      threshold = Math.max(FLOOR, v)
      break
    }
  }
  const top = peaks(blur, w, h, peakSize)
  const out: number[] = []
  for (let i = 0; i < n; i++)
    if (tissue[i] && blur[i] > threshold && blue[i] > -5 && blur[i] === top[i])
      out.push(i % w, Math.floor(i / w))
  return out
}
