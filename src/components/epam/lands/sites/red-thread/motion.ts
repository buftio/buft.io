import * as THREE from 'three'
import { BEACH, C, EYE_AT, hash, KIDS, LEAN, NEEDLE, PIN_H, PIN_TONES, PINS, riverX, S, SPOOL, TILT, UMBRELLAS, type Path } from './data'
import { SPOOL_TOP } from './geo'

export const CARTS = 12
const KID0 = CARTS * 2
const SWING = KID0 + KIDS.length
const SUN = SWING + 1
const WALK = SUN + UMBRELLAS.length
export const COUNT = {
  riders: WALK + 3,
  workers: 6,
  pots: CARTS * 2 + 1 + 4 + 9,
  beads: 27,
  rings: 14,
  shadows: CARTS + KIDS.length,
}
const LOADER = CARTS * 2
const DROP0 = LOADER + 1
const BEADPOT = DROP0 + 4
const BASE = 125
const HOLD = [2.6, 2.2, 2.4]

export type Rig = {
  carts: THREE.InstancedMesh
  riders: THREE.InstancedMesh
  workers: THREE.InstancedMesh
  pots: THREE.InstancedMesh
  heads: THREE.InstancedMesh
  beads: THREE.InstancedMesh
  rings: THREE.InstancedMesh
  shadows: THREE.InstancedMesh
  rope: THREE.Mesh
  barrel: THREE.Object3D
}

export type State = {
  s: Float32Array
  hold: Float32Array
  last: Int8Array
  lost: Uint8Array
  swing: Float32Array
  drop: Float32Array
  ring: Float32Array
  ringAt: number
  kid: Int32Array
  spin: number
  nextDrop: number
  sags: number[]
  time: number
}

const PQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))
const AXIS = new THREE.Vector3(0, 0, 1)
const m = new THREE.Matrix4()
const m2 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const e = new THREE.Euler()
const p = new THREE.Vector3()
const sc = new THREE.Vector3()
const col = new THREE.Color()
const FAT = new THREE.Color('#f3e8f1')
const BLOOD = new THREE.Color('#c8235a')
const TEAL = new THREE.Color('#16b3a0')
const GOLD = new THREE.Color('#ffc23a')
const ALARM = new THREE.Color('#ff2a3a')
const TONES = PIN_TONES.map((h) => new THREE.Color(h))
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)
const ZERO_T = new THREE.Matrix4()

function place(gx: number, gy: number, mx: number, my: number, mz: number) {
  return p.set(gx + mx, -gy + my * C - mz * S, my * S + mz * C)
}

function stand(mesh: THREE.InstancedMesh, i: number, gx: number, gy: number, mx: number, my: number, mz: number, size = 1, turn = 0, roll = 0, sy = 1, tip = 0) {
  place(gx, gy, mx, my, mz)
  q.copy(PQ).multiply(q2.setFromEuler(e.set(tip, turn, roll)))
  mesh.setMatrixAt(i, m.compose(p, q, sc.set(size, size * sy, size)))
}

function flat(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, sx: number, sy: number, angle = 0) {
  q.setFromAxisAngle(AXIS, angle)
  mesh.setMatrixAt(i, m.compose(p.set(x, y, z), q, sc.set(sx, sy, 1)))
}

function hide(mesh: THREE.InstancedMesh, i: number) {
  mesh.setMatrixAt(i, ZERO)
}

function ripple(st: State, x: number, y: number, size: number, river: boolean) {
  const k = st.ringAt
  st.ringAt = (k + 1) % COUNT.rings
  st.ring.set([x, y, st.time, size, river ? 1 : 0], k * 5)
}

function drop(st: State, gx: number, fy: number, h: number) {
  for (let k = 0; k < 4; k++) {
    if (st.drop[k * 5 + 4] > 0 && st.time - st.drop[k * 5 + 3] < 5) continue
    st.drop.set([gx, fy, h, st.time, 1], k * 5)
    return
  }
}

const at = (path: Path, s: number) => {
  const f = s / path.step
  const i = Math.floor(f) % path.n
  return { i, u: f - Math.floor(f), j: (i + 1) % path.n }
}

function step(path: Path, st: State, k: number, dt: number, rush: number, live: boolean) {
  if (st.hold[k] > 0) {
    st.hold[k] -= dt
    return
  }
  const { i } = at(path, st.s[k])
  const v = BASE * path.speed[i] * rush
  const before = i
  st.s[k] = (st.s[k] + v * dt) % path.len
  const after = at(path, st.s[k]).i
  for (let n = 0; n < 3; n++) {
    const stop = path.stops[n]
    const crossed = before <= after ? stop > before && stop <= after : stop > before || stop <= after
    if (!crossed || st.last[k] === n) continue
    st.last[k] = n
    st.hold[k] = HOLD[n]
    st.s[k] = stop * path.step
    if (n === 0) st.lost[k] = 0
    if (n === 1 && live) drop(st, path.gx[stop], path.fy[stop], path.h[stop] - 80)
  }
  if (!live) return
  for (const sag of st.sags) {
    const crossed = before <= after ? sag > before && sag <= after : false
    if (crossed) ripple(st, path.gx[sag], path.fy[sag], 110, false)
  }
}

export function makeState(path: Path): State {
  const st: State = {
    s: new Float32Array(CARTS),
    hold: new Float32Array(CARTS),
    last: new Int8Array(CARTS).fill(-1),
    lost: new Uint8Array(CARTS),
    swing: new Float32Array(CARTS),
    drop: new Float32Array(20),
    ring: new Float32Array(COUNT.rings * 5).fill(-99),
    ringAt: 0,
    kid: new Int32Array(KIDS.length),
    spin: 0,
    nextDrop: 6,
    sags: [],
    time: 0,
  }
  for (let i = 2; i < path.n - 2; i++) if (path.h[i] < 200 && path.h[i] < path.h[i - 1] && path.h[i] <= path.h[i + 1]) st.sags.push(i)
  let lead = 0
  for (let k = CARTS - 1; k >= 0; k--) {
    lead += 3.3 + hash(k + 3) * 2.3
    for (let t = 0; t < lead; t += 0.05) step(path, st, k, 0.05, 1, false)
  }
  return st
}

function cart(r: Rig, path: Path, st: State, k: number, now: number, dim: number) {
  const { i, u, j } = at(path, st.s[k])
  const x = path.x[i] + (path.x[j] - path.x[i]) * u
  const y = path.y[i] + (path.y[j] - path.y[i]) * u
  const z = path.z[i] + (path.z[j] - path.z[i]) * u
  const moving = st.hold[k] <= 0
  const lean = moving ? (path.speed[i] - 1) * 0.12 : 0
  st.swing[k] += (lean + Math.sin(now * (1.6 + hash(k) * 0.6) + k * 2.1) * (moving ? 0.07 : 0.03) - st.swing[k]) * 0.08
  q.copy(PQ).multiply(q2.setFromEuler(e.set(0, 0, st.swing[k])))
  m.compose(p.set(x, y, z), q, sc.set(1, 1, 1))
  r.carts.setMatrixAt(k, m)
  const east = i >= path.east[0] && i < path.east[1]
  const west = i >= path.east[1] && i <= path.stops[2]
  const many = k % 3 === 0 || dim > 0.3
  for (let n = 0; n < 2; n++) {
    const slot = k * 2 + n
    const side = n ? 12 : -12
    if (east && !(n === 1 && st.lost[k])) r.pots.setMatrixAt(slot, m2.copy(m).multiply(ZERO_T.makeTranslation(side * 1.1, -68 - n * 4, n ? -5 : 7)))
    else hide(r.pots, slot)
    if (west && (n === 0 || many)) {
      const bob = Math.abs(Math.sin(now * 7 + k + n)) * (path.h[i] < 220 ? 14 : 3)
      const off = many ? side * 1.1 : 0
      r.riders.setMatrixAt(slot, m2.copy(m).multiply(ZERO_T.makeTranslation(off, -64 + bob, n ? -6 : 6)))
    } else hide(r.riders, slot)
  }
  const fx = path.gx[i] + path.h[i] * 0.12
  const fy = path.fy[i] - path.h[i] * 0.05
  const size = 30 * (1 - Math.min(0.6, path.h[i] / 900))
  flat(r.shadows, k, fx, fy, 1.5, size * 1.3, size * 0.6)
}

function kids(r: Rig, st: State, now: number, dim: number) {
  KIDS.forEach(([x, y, amp, ph], k) => {
    const w = 3 + k * 0.35
    const u = now * w + ph
    const n = Math.floor(u / Math.PI)
    const s = Math.abs(Math.sin(u))
    const a = amp * (1 - dim)
    if (dim > 0.6) {
      hide(r.riders, KID0 + k)
      hide(r.shadows, CARTS + k)
      return
    }
    if (n !== st.kid[k]) {
      st.kid[k] = n
      ripple(st, x, -y, 80, false)
    }
    const squash = s < 0.14 ? 0.78 : 1
    const roll = k === 1 ? (u % Math.PI) * 2 : Math.sin(u) * 0.2
    stand(r.riders, KID0 + k, x, y, 0, 18 + a * s, 0, 1.15, 0, roll, squash)
    flat(r.shadows, CARTS + k, x + 6, -y - 4, 1.5, 26 - s * 8, 12 - s * 4)
  })
}

function swinger(r: Rig, now: number) {
  const [x, y] = PINS[0]
  const th = Math.sin(now * 1.9) * 0.6
  place(x, y, 0, 235, 10)
  q.copy(PQ).multiply(q2.setFromEuler(e.set(0, 0, th)))
  r.rope.position.copy(p)
  r.rope.quaternion.copy(q)
  r.rope.scale.set(1, 150, 1)
  m.compose(p, q, sc.set(1, 1, 1))
  r.riders.setMatrixAt(SWING, m2.copy(m).multiply(ZERO_T.makeTranslation(0, -172, 0)))
}

function beach(r: Rig, now: number, dim: number) {
  UMBRELLAS.forEach(([x, z], k) => {
    if (dim > 0.5) return hide(r.riders, SUN + k)
    stand(r.riders, SUN + k, BEACH[0], BEACH[1], x + 30, 16, z + 20, 1.1, 0, Math.sin(now * 0.8 + k * 2) * 0.25, 1, -1.35)
  })
  for (let k = 0; k < 3; k++) {
    const f = (now / 14 + k / 3) % 1
    const u = Math.min(1, f / 0.8)
    const [ux, uz] = UMBRELLAS[k]
    const sx = SPOOL[0] + 500
    const sy = SPOOL[1] + 45
    const tx = BEACH[0] + ux + 70
    const ty = BEACH[1] + uz * S + 30
    const gx = sx + (tx - sx) * u
    const gy = sy + (ty - sy) * u + Math.sin(u * Math.PI) * (120 + k * 30)
    const fade = Math.min(1, f * 12, (1 - f) * 8)
    if (fade <= 0.02) hide(r.riders, WALK + k)
    else stand(r.riders, WALK + k, gx, gy, 0, 18 + Math.abs(Math.sin(now * 9 + k)) * 6, 0, fade, -0.7, 0)
  }
}

function workers(r: Rig, st: State, now: number, dim: number, busy: number) {
  const a = st.spin - 0.35
  stand(r.workers, 0, SPOOL[0], SPOOL[1], 150 * Math.cos(a), SPOOL_TOP + 18 + Math.abs(Math.sin(now * 8)) * 3, -150 * Math.sin(a), 1.15, a - Math.PI / 2)
  stand(r.workers, 1, SPOOL[0], SPOOL[1], 300, 188 + busy * Math.abs(Math.sin(now * 10)) * 16, 40, 1.15, -0.3)
  const f = (now / 7) % 1
  const go = f < 0.5
  const u = go ? f * 2 : 2 - f * 2
  const lx = -150 + u * 260
  const walk = Math.abs(Math.sin(now * 9)) * 5
  stand(r.workers, 2, SPOOL[0], SPOOL[1], lx, 18 + walk, 150, 1.15, go ? 0.8 : -0.8)
  if (go) stand(r.pots, LOADER, SPOOL[0], SPOOL[1], lx, 38 + walk, 150, 1.1)
  else hide(r.pots, LOADER)
  const top = EYE_AT + 70
  const lookUp = Math.abs(Math.sin(now * (dim > 0.2 ? 9 : 1.3))) * (dim > 0.2 ? 20 : 5)
  stand(r.workers, 3, NEEDLE[0], NEEDLE[1], top * Math.sin(LEAN), top * Math.cos(LEAN) + lookUp, 0, 1.15, Math.sin(now * 0.5) * 0.9)
  const c = (now / 16) % 1
  const climb = c < 0.75 ? 110 + (c / 0.75) * 400 * (0.5 - Math.cos((c / 0.75) * Math.PI) * 0.5) : 510 - ((c - 0.75) / 0.25) * 400
  const pause = c < 0.75 ? Math.abs(Math.sin(now * 6)) * 4 : 0
  stand(r.workers, 4, NEEDLE[0], NEEDLE[1], climb * Math.sin(LEAN) + 4, climb * Math.cos(LEAN) + pause, 50, 1.1, Math.PI)
  stand(r.workers, 5, NEEDLE[0], NEEDLE[1], -95, 32 + Math.abs(Math.sin(now * 4)) * 6, 70, 1.15, 0.4)
}

function beads(r: Rig, now: number) {
  for (let k = 0; k < COUNT.beads; k++) {
    const dy = -1300 + ((hash(k * 3) + (now * (40 + hash(k * 7) * 30)) / 2600) % 1) * 2600
    const x = riverX(dy) + (hash(k * 11) - 0.5) * 210
    flat(r.beads, k, x, -dy, 3, 1, 1, now * 0.3 + k)
    if (k % 3 === 0) stand(r.pots, BEADPOT + k / 3, x, dy, 0, 2, 0, 1)
  }
}

function drops(r: Rig, st: State) {
  for (let k = 0; k < 4; k++) {
    const [gx, fy, h0, t0, on] = st.drop.subarray(k * 5, k * 5 + 5)
    const age = st.time - t0
    if (!on || age > 4.5) {
      hide(r.pots, DROP0 + k)
      continue
    }
    const fall = Math.sqrt((2 * h0) / 900)
    const h = Math.max(0, h0 - 450 * age * age)
    if (age >= fall && st.drop[k * 5 + 4] === 1) {
      st.drop[k * 5 + 4] = 2
      ripple(st, gx, fy, 120, gx > 1400)
    }
    const shrink = age > 3.5 ? Math.max(0, 1 - (age - 3.5)) : 1
    q.copy(PQ).multiply(q2.setFromEuler(e.set(0, 0, age < fall ? age * 5 : 1.4)))
    r.pots.setMatrixAt(DROP0 + k, m.compose(p.set(gx, fy + h * C + (age >= fall ? 6 : 0), h * S + 12), q, sc.setScalar(shrink)))
  }
}

function rings(r: Rig, st: State) {
  for (let k = 0; k < COUNT.rings; k++) {
    const [x, y, t0, size, river] = st.ring.subarray(k * 5, k * 5 + 5)
    const age = st.time - t0
    if (age > 1.6 || age < 0) {
      hide(r.rings, k)
      continue
    }
    const s = size * (0.25 + age * 0.75)
    flat(r.rings, k, x, y, 2.5, s, s * 0.55)
    col.copy(river ? GOLD : TEAL).lerp(river ? BLOOD : FAT, age / 1.6)
    r.rings.setColorAt(k, col)
  }
}

function heads(r: Rig, now: number, dim: number, big: number) {
  PINS.forEach(([x, y], k) => {
    stand(r.heads, k, x, y, 0, PIN_H + 30 + Math.abs(Math.sin(now * 2 + k)) * 2, 0, big)
    const blink = dim > 0.05 && Math.sin(now * 6 + k) > 0 ? Math.min(1, dim * 2) : 0
    r.heads.setColorAt(k, col.copy(TONES[k]).lerp(ALARM, blink))
  })
}

export function placePins(mesh: THREE.InstancedMesh) {
  PINS.forEach(([x, y], k) => stand(mesh, k, x, y, 0, 0, 0, 1, (hash(k) - 0.5) * 0.3))
  mesh.instanceMatrix.needsUpdate = true
}

export function animate(r: Rig, path: Path, st: State, now: number, dt: number, dim: number, zoom: number) {
  st.time = now
  const rush = 1 + dim * 0.5
  st.spin += dt * 0.55 * rush
  r.barrel.rotation.y = st.spin
  let busy = 0
  for (let k = 0; k < CARTS; k++) {
    step(path, st, k, dt, rush, true)
    if (st.hold[k] > 0 && st.last[k] !== 1) busy = 1
    cart(r, path, st, k, now, dim)
  }
  if (now > st.nextDrop) {
    st.nextDrop = now + 9 + hash(Math.floor(now)) * 6
    for (let k = 0; k < CARTS; k++) {
      const { i } = at(path, st.s[k])
      if (st.hold[k] > 0 || st.lost[k] || i < path.east[0] || i >= path.east[1] || path.h[i] < 200) continue
      st.lost[k] = 1
      drop(st, path.gx[i], path.fy[i], path.h[i] - 82)
      break
    }
  }
  kids(r, st, now, dim)
  swinger(r, now)
  beach(r, now, dim)
  workers(r, st, now, dim, busy)
  beads(r, now)
  drops(r, st)
  rings(r, st)
  heads(r, now, dim, zoom < 0.13 ? 2.2 : 1)
  for (const mesh of [r.carts, r.riders, r.workers, r.pots, r.heads, r.beads, r.rings, r.shadows]) mesh.instanceMatrix.needsUpdate = true
  if (r.rings.instanceColor) r.rings.instanceColor.needsUpdate = true
  if (r.heads.instanceColor) r.heads.instanceColor.needsUpdate = true
}

