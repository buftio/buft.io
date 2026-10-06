import * as THREE from 'three'
import { CELL, type War } from './sim'
import { STRIDE } from './villager-scan'

export const NEAR_CAP = 5000
const RING = 1.6
const SPOKES = 8

export type Folk = {
  traits: Float32Array
  mood: Float32Array
  fresh: Uint8Array
}
export type Picks = {
  folk: Folk[]
  at: Int32Array
  count: number
  radius: number
}

export function withInstances(shape: THREE.InstancedBufferGeometry) {
  for (const name of ['iA', 'iB', 'iM']) {
    const attr = new THREE.InstancedBufferAttribute(
      new Float32Array(NEAR_CAP * 4),
      4,
    )
    if (name === 'iM') attr.setUsage(THREE.DynamicDrawUsage)
    shape.setAttribute(name, attr)
  }
  shape.setAttribute(
    'iC',
    new THREE.InstancedBufferAttribute(new Float32Array(NEAR_CAP * 3), 3),
  )
  shape.instanceCount = 0
  return shape
}

export function folkOf(traits: Float32Array): Folk {
  const n = traits.length / STRIDE
  return {
    traits,
    mood: new Float32Array(n * 4),
    fresh: new Uint8Array(n).fill(1),
  }
}

const dist = new Float32Array(1 << 16)

export function pick(
  list: Folk[],
  cx: number,
  cy: number,
  halfW: number,
  halfH: number,
  out: Picks,
) {
  let n = 0
  const order: number[] = []
  for (let f = 0; f < list.length; f++) {
    const t = list[f].traits
    for (let k = 0; k < t.length; k += STRIDE) {
      const dx = t[k] - cx
      const dy = t[k + 1] - cy
      if (Math.abs(dx) > halfW || Math.abs(dy) > halfH) continue
      if (n >= dist.length) break
      dist[n] = Math.hypot(dx, dy)
      order.push(f, k / STRIDE)
      n++
    }
  }
  let radius = Infinity
  if (n > NEAR_CAP) {
    const sorted = dist.slice(0, n).sort()
    radius = sorted[NEAR_CAP - 1]
  }
  let m = 0
  for (let i = 0; i < n && m < NEAR_CAP; i++) {
    if (dist[i] > radius) continue
    out.at[m * 2] = order[i * 2]
    out.at[m * 2 + 1] = order[i * 2 + 1]
    m++
  }
  out.folk = list
  out.count = m
  out.radius = radius
}

export function upload(shape: THREE.InstancedBufferGeometry, picks: Picks) {
  const a = shape.getAttribute('iA') as THREE.InstancedBufferAttribute
  const b = shape.getAttribute('iB') as THREE.InstancedBufferAttribute
  const c = shape.getAttribute('iC') as THREE.InstancedBufferAttribute
  for (let i = 0; i < picks.count; i++) {
    const t = picks.folk[picks.at[i * 2]].traits
    const o = picks.at[i * 2 + 1] * STRIDE
    const x = t[o]
    const y = t[o + 1]
    a.setXYZW(
      i,
      x,
      -y,
      t[o + 2],
      Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1,
    )
    b.setXYZW(i, t[o + 3], t[o + 4], t[o + 5], t[o + 6])
    c.setXYZ(i, t[o + 7], t[o + 8], t[o + 9])
  }
  for (const attr of [a, b, c]) attr.needsUpdate = true
  shape.instanceCount = picks.count
}

function field(values: ArrayLike<number>, war: War, x: number, y: number) {
  const gx = Math.min(war.cols - 1.001, Math.max(0, x / CELL - 0.5))
  const gy = Math.min(war.rows - 1.001, Math.max(0, y / CELL - 0.5))
  const c = Math.floor(gx)
  const r = Math.floor(gy)
  const fx = gx - c
  const fy = gy - r
  const i = r * war.cols + c
  const top = values[i] * (1 - fx) + values[i + 1] * fx
  const low = values[i + war.cols] * (1 - fx) + values[i + war.cols + 1] * fx
  return top * (1 - fy) + low * fy
}

const goal = new Float32Array(4)

function sense(war: War, x: number, y: number) {
  const sick = field(war.corrupt, war, x, y)
  let near = 0
  let px = 0
  let py = 0
  for (let k = 0; k < SPOKES; k++) {
    const a = (k / SPOKES) * Math.PI * 2
    const v = field(
      war.corrupt,
      war,
      x + Math.cos(a) * RING * CELL,
      y + Math.sin(a) * RING * CELL,
    )
    near = Math.max(near, v)
    px += Math.cos(a) * v
    py += Math.sin(a) * v
  }
  const scar = field(war.scar, war, x, y)
  goal[1] = sick >= 0.5 ? 1 : 0
  goal[2] = sick < 0.5 && scar > 0.35 ? 1 : 0
  goal[0] =
    goal[1] || goal[2] ? 0 : Math.min(1, Math.max(0, (near - 0.38) / 0.12))
  goal[3] = Math.hypot(px, py) > 0.01 ? Math.atan2(-py, px) : 0
}

export function feel(
  war: War,
  shape: THREE.InstancedBufferGeometry,
  picks: Picks,
  dt: number,
) {
  const m = shape.getAttribute('iM') as THREE.InstancedBufferAttribute
  const data = m.array as Float32Array
  const ease = Math.min(1, dt * 2.5)
  for (let i = 0; i < picks.count; i++) {
    const folk = picks.folk[picks.at[i * 2]]
    const k = picks.at[i * 2 + 1]
    const t = folk.traits
    sense(war, t[k * STRIDE], t[k * STRIDE + 1])
    const mood = folk.mood
    const o = k * 4
    if (folk.fresh[k]) {
      mood.set(goal, o)
      folk.fresh[k] = 0
    } else {
      for (let j = 0; j < 3; j++)
        mood[o + j] +=
          (goal[j] - mood[o + j]) *
          (goal[j] > mood[o + j] && j === 0 ? Math.min(1, dt * 8) : ease)
      if (goal[0] > 0.05) mood[o + 3] = goal[3]
    }
    data.set(mood.subarray(o, o + 4), i * 4)
  }
  m.needsUpdate = true
}
