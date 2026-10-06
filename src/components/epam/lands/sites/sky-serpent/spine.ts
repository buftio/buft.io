import * as THREE from 'three'

const HAIR: [number, number][] = [
  [-735, 600], [-712, 420], [-700, 260], [-682, 140], [-645, 45], [-590, -20], [-500, -78], [-400, -135],
  [-300, -190], [-200, -238], [-100, -282], [0, -312], [100, -352], [200, -395], [300, -438], [400, -472],
  [500, -505], [600, -545], [700, -588], [760, -610],
]

export const N = 150
export const LIFT = 120
const curve = new THREE.CatmullRomCurve3(HAIR.map(([x, y]) => new THREE.Vector3(x, -y, 0)), false, 'centripetal')
const rest = curve.getSpacedPoints(N - 1)
const ruler = Array.from({ length: N }, (_, i) => curve.getTangentAt(i / (N - 1)))
const PROFILE: [number, number][] = [[0, 5], [0.05, 14], [0.18, 38], [0.36, 60], [0.6, 66], [0.8, 58], [0.93, 46], [1, 46]]

export function girth(t: number) {
  for (let k = 1; k < PROFILE.length; k++) {
    const [t1, r1] = PROFILE[k]
    const [t0, r0] = PROFILE[k - 1]
    if (t <= t1) return r0 + ((r1 - r0) * (t - t0)) / (t1 - t0)
  }
  return PROFILE[PROFILE.length - 1][1]
}

export type Spine = { x: Float32Array; y: Float32Array; z: Float32Array; tx: Float32Array; ty: Float32Array; r: Float32Array }

export const spine = (): Spine => ({
  x: new Float32Array(N),
  y: new Float32Array(N),
  z: new Float32Array(N),
  tx: new Float32Array(N),
  ty: new Float32Array(N),
  r: new Float32Array(N),
})

export function flex(sp: Spine, time: number, breath: number, swell: number, jolt = 0, age = 0) {
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1)
    const amp = 5 + 18 * (1 - t) * (1 - t)
    const off = amp * Math.sin(time * 0.33 + t * 6.5) + jolt * 34 * t * Math.sin(t * 14 - age * 18)
    const n = ruler[i]
    sp.x[i] = rest[i].x - n.y * off
    sp.y[i] = rest[i].y + n.x * off
    sp.z[i] = LIFT + 10 * Math.sin(time * 0.45 + t * 4)
    sp.r[i] = girth(t) * (1 + breath * (0.05 + 0.08 * Math.sin(Math.PI * t)) + swell)
  }
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1)
    const b = Math.min(N - 1, i + 1)
    const dx = sp.x[b] - sp.x[a]
    const dy = sp.y[b] - sp.y[a]
    const l = Math.hypot(dx, dy) || 1
    sp.tx[i] = dx / l
    sp.ty[i] = dy / l
  }
}

export const at = { x: 0, y: 0, z: 0, tx: 1, ty: 0, r: 0 }

export function sample(sp: Spine, t: number) {
  const f = Math.min(N - 1.001, Math.max(0, t * (N - 1)))
  const i = Math.floor(f)
  const k = f - i
  const j = i + 1
  at.x = sp.x[i] + (sp.x[j] - sp.x[i]) * k
  at.y = sp.y[i] + (sp.y[j] - sp.y[i]) * k
  at.z = sp.z[i] + (sp.z[j] - sp.z[i]) * k
  at.r = sp.r[i] + (sp.r[j] - sp.r[i]) * k
  const tx = sp.tx[i] + (sp.tx[j] - sp.tx[i]) * k
  const ty = sp.ty[i] + (sp.ty[j] - sp.ty[i]) * k
  const l = Math.hypot(tx, ty) || 1
  at.tx = tx / l
  at.ty = ty / l
  return at
}
