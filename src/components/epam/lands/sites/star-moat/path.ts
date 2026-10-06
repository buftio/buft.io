import * as THREE from 'three'

const EDGE: [number, number][] = [
  [-1560, -1950], [-1290, -1650], [-1050, -1400], [-800, -1180], [-560, -960], [-370, -740], [-220, -500],
  [-90, -250], [50, 0], [195, 250], [330, 500], [440, 750], [535, 1000], [650, 1250], [725, 1500], [800, 1720],
  [900, 1950],
]

const N = 360
const curve = new THREE.CatmullRomCurve3(EDGE.map(([x, y]) => new THREE.Vector3(x, y, 0)), false, 'centripetal')
const px = new Float32Array(N + 1)
const py = new Float32Array(N + 1)
const tx = new Float32Array(N + 1)
const ty = new Float32Array(N + 1)
const p = new THREE.Vector3()
for (let i = 0; i <= N; i++) {
  curve.getPointAt(i / N, p)
  px[i] = p.x
  py[i] = p.y
  curve.getTangentAt(i / N, p)
  tx[i] = p.x
  ty[i] = p.y
}

export const LEN = curve.getLength()
export const STEPS = N

export const pt = { x: 0, y: 0, tx: 0, ty: 0 }

export function bank(s: number, v: number) {
  const f = Math.min(N, Math.max(0, s * N))
  const i = Math.min(N - 1, Math.floor(f))
  const k = f - i
  const ax = tx[i] + (tx[i + 1] - tx[i]) * k
  const ay = ty[i] + (ty[i + 1] - ty[i]) * k
  const l = Math.hypot(ax, ay) || 1
  pt.tx = ax / l
  pt.ty = ay / l
  pt.x = px[i] + (px[i + 1] - px[i]) * k + pt.ty * v
  pt.y = py[i] + (py[i + 1] - py[i]) * k - pt.tx * v
  return pt
}

export const yawOf = (dx: number, dy: number) => Math.atan2(-dy / Math.sin((50 * Math.PI) / 180), dx)
