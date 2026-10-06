import * as THREE from 'three'
import { breathOut, birds, tethers } from './air'
import { shape } from './body'
import { FISH, HOUSES, LEGS, NESTS, ROPE, TUFTS } from './cast'
import { clamp, COS, lay, SIN, smooth, span, stand } from './kit'
import { EYE, HAND } from './models'
import { beat, FOLK, heading, hop, inHead, P, pong, top, type Beat, type Mood, type Rig } from './place'
import { flex, sample, type Spine } from './spine'

export type { Rig } from './place'

const HOUSE = 120
const v = new THREE.Vector3()
export function animate(r: Rig, sp: Spine, m: Mood) {
  const { time, wake } = m
  const b = beat(time, wake)
  const ph = m.breath
  const breath = Math.max(b.pre, ph < 0.55 ? smooth(ph / 0.55) : 1 - smooth((ph - 0.55) / 0.45))
  flex(sp, time, breath, b.pre * 0.05 + wake * 0.04, b.age >= 0 ? Math.exp(-b.age * 1.2) : 0, b.age)
  shape(r.body, r.shadow, sp)
  head(r, sp, b, wake, time)
  crest(r, sp, b, wake, m)
  town(r, sp, b, wake, time)
  tickler(r, sp, b, wake, time)
  fisher(r, sp, time, b)
  birds(r, sp, b, time)
  breathOut(r, b, wake, time, ph, m.zoom)
  tethers(r, sp, m.pegs, time)
}

function head(r: Rig, sp: Spine, b: Beat, wake: number, time: number) {
  const a = sample(sp, 1)
  const push = -34 * b.pre + 60 * b.blast
  const h = r.head
  h.position.set(a.x + a.tx * push, a.y + a.ty * push, a.z + 30 * wake)
  h.rotation.set(0, -0.35 * b.pre + 0.25 * b.blast - 0.18 * wake, Math.atan2(a.ty, a.tx) - 0.35 * wake + 0.05 * Math.sin(time * 0.3))
  const s = 1.3 + 0.04 * Math.sin(time * 1.1)
  h.scale.set(s, s, s)
  h.updateMatrix()
  const peek = smooth(1 - Math.abs(((time + 11) % 41) - 1.2) / 1.2) * 0.55
  for (const k of [0, 1]) {
    const open = clamp(wake * 1.3 + (k ? 0 : peek)) * (1 - b.blast)
    const squeeze = b.pre * 0.12
    v.set(EYE.x - 9 * open, (k ? -1 : 1) * EYE.y, EYE.z)
    lay(r.lids, k, v.x, v.y, v.z, 1 - 0.72 * open, 1 + squeeze, 1 - 0.3 * open)
  }
  r.lids.instanceMatrix.needsUpdate = true
  for (let side = 0; side < 2; side++) {
    const sg = side ? -1 : 1
    let x = 204
    let y = sg * 30
    let ang = sg * (0.9 - 0.4 * wake)
    for (let j = 0; j < 10; j++) {
      ang += sg * (0.07 + 0.12 * Math.sin(time * 0.8 + j * 0.45 + side * 2)) - sg * 0.05 * b.blast
      const nx = x + Math.cos(ang) * 22
      const ny = y + Math.sin(ang) * 22
      const p0 = inHead(h, x, y, 4)
      const x0 = p0.x
      const y0 = p0.y
      const z0 = p0.z
      const p1 = inHead(h, nx, ny, 4)
      span(r.ropes, ROPE.whisker + side * 10 + j, x0, y0, z0, p1.x, p1.y, p1.z, 7 - j * 0.45)
      x = nx
      y = ny
    }
  }
}

function crest(r: Rig, sp: Spine, b: Beat, wake: number, m: Mood) {
  const bristle = 1 + 0.35 * wake + 0.2 * b.blast
  TUFTS.forEach((f, i) => {
    const p = top(sp, f.t, 0.8)
    const s = f.s * bristle
    lay(r.tufts, i, p.x, p.y, p.z, s, s * 0.8, s, heading(sp, f.t) + f.yaw)
  })
  ;[...HOUSES, FISH].forEach((t, i) => {
    const a = sample(sp, t)
    const s = a.r * 1.05
    lay(r.girths, i, a.x, a.y, a.z, s, s, s, Math.atan2(a.ty, a.tx))
  })
  LEGS.forEach((t, i) => {
    const a = sample(sp, t)
    const rz = Math.atan2(a.ty, a.tx)
    for (const side of [0, 1]) {
      const sg = side ? -1 : 1
      const s = a.r / 50
      const off = a.r * 0.8
      const paddle = 0.15 * Math.sin(m.time * 0.5 + i * 2 + side * 3) * (1 - wake)
      lay(r.legs, i * 2 + side, a.x - a.ty * off * sg, a.y + a.tx * off * sg, a.z - a.r * 0.2, s, s * sg, s, rz + sg * (paddle - 0.6 * wake), 0)
    }
  })
  NESTS.forEach((t, i) => {
    const p = top(sp, t, 0.85)
    lay(r.nests, i, p.x, p.y, p.z, 30, 30, 30, heading(sp, t))
  })
}

const ROOF = 1.13 * HOUSE
const roofs: { x: number; y: number; z: number }[] = HOUSES.map(() => ({ x: 0, y: 0, z: 0 }))

function town(r: Rig, sp: Spine, b: Beat, wake: number, time: number) {
  HOUSES.forEach((t, i) => {
    const p = top(sp, t, 0.7)
    const j = 26 * hop(b, i)
    stand(r.houses, i, p.x, p.y + j * COS, p.z + j * SIN, HOUSE, -0.25 + i * 0.2, 0.04 * Math.sin(time * 0.9 + i))
    roofs[i].x = p.x
    roofs[i].y = p.y + j * COS + ROOF * COS
    roofs[i].z = p.z + j * SIN + ROOF * SIN
  })
  for (let s = 0; s < 2; s++) {
    const a = roofs[s]
    const c = roofs[s + 1]
    const at = (u: number) => {
      P.x = a.x + (c.x - a.x) * u
      P.y = a.y + (c.y - a.y) * u - 70 * 4 * u * (1 - u)
      P.z = a.z + (c.z - a.z) * u
      return P
    }
    for (let k = 0; k < 8; k++) {
      const p0 = at(k / 8)
      const [x0, y0, z0] = [p0.x, p0.y, p0.z]
      const p1 = at((k + 1) / 8)
      span(r.ropes, ROPE.string + s * 8 + k, x0, y0, z0, p1.x, p1.y, p1.z, 2.5)
    }
    for (let k = 0; k < 5; k++) {
      const p = at((k + 1) / 6)
      const g = 9 + 2 * Math.sin(time * 3 + k + s * 2) + 4 * wake
      lay(r.beads, s * 5 + k, p.x, p.y - 10, p.z - 4, g, g * 1.25, g)
    }
  }
  const walkers: [number, number, number][] = [[0.36, 0.7, 26], [0.4, 0.66, 34], [0.34, 0.6, 20]]
  walkers.forEach(([lo, hi, speed], k) => {
    const rate = speed / 2700 / (hi - lo)
    const u = pong(time * rate + k * 0.7)
    const dir = Math.floor((time * rate + k * 0.7) % 2) ? -1 : 1
    const go = wake > 0.5 ? 0 : 1
    const t = lo + (hi - lo) * u
    const p = top(sp, t, 0.92)
    const step = Math.abs(Math.sin(time * 7 + k)) * 6 * go
    const cheer = wake > 0.5 ? Math.abs(Math.sin(time * 5 + k * 1.3)) * 22 : 0
    const j = 30 * hop(b, k + 2) + step + cheer
    stand(r.folk, 2 + k, p.x, p.y + j * COS, p.z + j * SIN, FOLK, dir * 0.6 * go, 0.1 * Math.sin(time * 7 + k) * go)
  })
  const door = top(sp, HOUSES[1], 0.9)
  const dj = 26 * hop(b, 6)
  stand(r.folk, 6, door.x + 40, door.y - 22 + dj * COS, door.z + 40 + dj * SIN, FOLK * 0.9, -0.3, 0)
  const porch = top(sp, HOUSES[2], 0.9)
  const pj = 26 * hop(b, 7) + (wake > 0.5 ? Math.abs(Math.sin(time * 6)) * 24 : 0)
  stand(r.folk, 7, porch.x - 46, porch.y - 18 + pj * COS, porch.z + 40 + pj * SIN, FOLK, 0.4, 0.35 * Math.sin(time * 4))
}

function tickler(r: Rig, sp: Spine, b: Beat, wake: number, time: number) {
  const h = r.head
  const home = inHead(h, HAND.x, HAND.y, HAND.z)
  let [x, y, z] = [home.x, home.y, home.z]
  let roll = 0.08 * Math.sin(time * 2.2)
  let yaw = 0.5
  let lift = 0
  const s = b.age
  if (s >= 0 && s < 6.7) {
    const l = top(sp, 0.86, 0.92)
    const [lx, ly, lz] = [l.x, l.y, l.z]
    if (s < 1.6) {
      const u = s / 1.6
      const from = inHead(h, HAND.x, HAND.y, HAND.z)
      x = from.x + (lx - from.x) * u
      y = from.y + (ly - from.y) * u
      z = from.z + (lz - from.z) * u
      lift = 240 * Math.sin(Math.PI * u)
      roll = u * Math.PI * 4
    } else if (s < 3.1) {
      ;[x, y, z] = [lx, ly, lz]
      roll = 1.35 + 0.12 * Math.sin(time * 6)
    } else if (s < 6.1) {
      const t = 0.86 + 0.125 * smooth((s - 3.1) / 3)
      const p = top(sp, t, 0.92)
      ;[x, y, z] = [p.x, p.y, p.z]
      lift = Math.abs(Math.sin(time * 8)) * 6
      yaw = 0.7
      roll = 0.1 * Math.sin(time * 8)
    } else {
      const u = (s - 6.1) / 0.6
      const from = top(sp, 0.985, 0.92)
      const fx = from.x
      const fy = from.y
      const fz = from.z
      const to = inHead(h, HAND.x, HAND.y, HAND.z)
      x = fx + (to.x - fx) * u
      y = fy + (to.y - fy) * u
      z = fz + (to.z - fz) * u
      lift = 50 * Math.sin(Math.PI * u)
    }
  }
  if (wake > 0.5) lift = Math.abs(Math.sin(time * 5)) * 26
  stand(r.folk, 0, x, y + lift * COS, z + lift * SIN, FOLK, yaw, roll)
  const f = r.feather
  const holding = s < 0 || s >= 6.7
  f.visible = holding && wake <= 0.5
  f.position.set(HAND.x + 10, HAND.y + 4, HAND.z + 22)
  f.rotation.set(0, 0, 0.55 + 0.28 * Math.sin(time * 9) * (1 - b.pre) + 0.15 * Math.sin(time * 1.3))
  const d = inHead(h, -6, 0, 52)
  const nod = 0.25 * Math.sin(time * 0.7)
  const dj = 30 * hop(b, 1) + (wake > 0.5 ? Math.abs(Math.sin(time * 4)) * 30 : 0)
  stand(r.folk, 1, d.x, d.y + dj * COS, d.z + dj * SIN, FOLK * 0.95, 0, wake > 0.5 ? 0 : nod)
}

function fisher(r: Rig, sp: Spine, time: number, b: Beat) {
  const p = top(sp, FISH, 0.9)
  const j = 24 * hop(b, 5)
  const f = (time + 3) % 19
  const glee = f > 11.5 && f < 14 ? Math.abs(Math.sin(time * 9)) * 14 : 0
  const [x, y, z] = [p.x - 10, p.y + (j + glee) * COS, p.z + (j + glee) * SIN]
  stand(r.folk, 5, x, y, z, FOLK, -0.7, f > 14 && f < 16 ? 0.3 : 0)
  const hx = x - 12
  const hy = y + 0.5 * FOLK * COS
  const hz = z + 0.5 * FOLK * SIN
  const tip = { x: hx - 150, y: hy + 60 + 8 * Math.sin(time * 1.4), z: hz + 50 }
  span(r.ropes, ROPE.rod, hx, hy, hz, tip.x, tip.y, tip.z, 6)
  const glass = { x: tip.x - 40, y: tip.y - 230, z: 3 }
  const reel = f < 9 ? 0 : f < 11.5 ? smooth((f - 9) / 2.5) : f < 14 ? 1 : f < 15 ? 1 - smooth(f - 14) : 0
  const end = {
    x: glass.x + (tip.x - glass.x) * reel * 0.7 + 6 * Math.sin(time * 1.7),
    y: glass.y + (tip.y - glass.y) * reel * 0.7,
    z: glass.z + (tip.z - glass.z) * reel * 0.7,
  }
  for (let k = 0; k < 5; k++) {
    const u0 = k / 5
    const u1 = (k + 1) / 5
    const sag = (u: number) => 18 * Math.sin(Math.PI * u) * Math.sin(time * 0.9)
    span(
      r.ropes, ROPE.line + k,
      tip.x + (end.x - tip.x) * u0 + sag(u0), tip.y + (end.y - tip.y) * u0, tip.z + (end.z - tip.z) * u0,
      tip.x + (end.x - tip.x) * u1 + sag(u1), tip.y + (end.y - tip.y) * u1, tip.z + (end.z - tip.z) * u1,
      2.5,
    )
  }
  const pf = r.puffs
  if (f < 9) {
    const bob = 1 + 0.15 * Math.sin(time * 3)
    lay(pf, 10, end.x, end.y, 4, 14 * bob, 14 * bob, 10)
  } else if (f < 14) {
    const w = 0.25 * Math.sin(time * 11)
    lay(pf, 10, end.x, end.y - 16, end.z, 30, 26, 24, w)
  } else {
    const u = clamp((f - 14) / 5)
    const s = 30 * (1 - smooth((u - 0.6) / 0.4))
    lay(pf, 10, end.x + 120 * u + 20 * Math.sin(u * 9), end.y + 260 * u, end.z + 60 * u, s, s * 0.86, s * 0.8, 0.4 * Math.sin(u * 12))
  }
}
