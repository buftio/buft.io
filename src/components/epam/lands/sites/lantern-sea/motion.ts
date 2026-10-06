import * as THREE from 'three'
import { BOATS, CELLS, HOOK, HUES, MOORED, RAFT, SEAM, SHACK, SLEEPER, WISH_TO } from './data'
import { BOW } from './geo'

export const SIZE = { lantern: 118, tow: 88, boat: 68, folk: 28, net: 125, mini: 34, raft: 95, shack: 100, post: 90, hook: 100 }

const TILT = (50 * Math.PI) / 180
const C = Math.cos(TILT)
const S = Math.sin(TILT)
const PQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))
const AXIS = new THREE.Vector3(0, 0, 1)
const NONE = new THREE.Quaternion()
const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const e = new THREE.Euler()
const p = new THREE.Vector3()
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const sc = new THREE.Vector3()
const col = new THREE.Color()
const DARK = new THREE.Color('#aaa2bd')
const AMBER = new THREE.Color('#ff7c22')
const ROSE = new THREE.Color('#ff5a9e')
const RIPPLE = new THREE.Color('#8fd4ff')
const TONES = HUES.map((h) => new THREE.Color(h))
const NOTES = ['#7dffe6', '#ff4fa3', '#ffd36b', '#ffffff'].map((h) => new THREE.Color(h))

const LIT = CELLS.map(([x, y]) => MOORED.some(([mx, my]) => mx === x && my === y))
const TOWED = BOATS.flatMap((boat, i) => (boat.tow ? [i] : []))
const SPANS = SEAM.length - 1
const GRANNY = new THREE.Vector3()
const STRING = 6

export const L = (() => {
  const tow = MOORED.length
  const bow = tow + TOWED.length
  const hook = bow + BOATS.length + 2
  const wish = hook + 1
  const seam = wish + 1
  const raft = seam + SPANS * 2
  return { tow, bow, hook, wish, seam, raft, swim: raft + 4, n: raft + 5 }
})()

export const G = (() => {
  const tow = CELLS.length
  const hook = tow + TOWED.length
  const wish = hook + 1
  const seam = wish + 1
  const raft = seam + SPANS
  return { tow, hook, wish, seam, raft, n: raft + 1 }
})()

export const SEG = (() => {
  const tow = MOORED.length
  const hook = tow + TOWED.length
  const seam = hook + 1
  const raft = seam + SPANS * STRING
  return { tow, hook, seam, raft, granny: raft + 16, n: raft + 19 }
})()

export const COUNT = { boats: BOATS.length + 2, folk: BOATS.length + 6, rings: (BOATS.length + 3) * 2, band: 5, notes: 10, zeds: 3, posts: SEAM.length }

export type Rig = {
  paper: THREE.InstancedMesh
  frame: THREE.InstancedMesh
  glow: THREE.InstancedMesh
  boats: THREE.InstancedMesh
  folk: THREE.InstancedMesh
  nets: THREE.InstancedMesh
  rings: THREE.InstancedMesh
  zeds: THREE.InstancedMesh
  posts: THREE.InstancedMesh
  band: THREE.InstancedMesh
  notes: THREE.InstancedMesh
  squeeze: THREE.Mesh
  lines: THREE.LineSegments
}

const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 31.7) * 43758.5453
  return x - Math.floor(x)
}
const smooth = (x: number) => x * x * (3 - 2 * x)

function up(out: THREE.Vector3, x: number, y: number, mx = 0, my = 0, mz = 0) {
  return out.set(x + mx, -y + my * C - mz * S, my * S + mz * C)
}

function stand(mesh: THREE.InstancedMesh, i: number, x: number, y: number, size: number, mx = 0, my = 0, mz = 0, turn = 0, roll = 0) {
  up(p, x, y, mx, my, mz)
  q.copy(PQ).multiply(q2.setFromEuler(e.set(0, turn, roll)))
  mesh.setMatrixAt(i, m.compose(p, q, sc.setScalar(size)))
}

function flat(mesh: THREE.InstancedMesh, i: number, x: number, y: number, z: number, size: number, angle = 0) {
  q.setFromAxisAngle(AXIS, angle)
  mesh.setMatrixAt(i, m.compose(p.set(x, -y, z), q, sc.set(size, size, 1)))
}

function seg(lines: THREE.LineSegments, k: number, from: THREE.Vector3, to: THREE.Vector3) {
  const at = lines.geometry.getAttribute('position') as THREE.BufferAttribute
  at.setXYZ(k * 2, from.x, from.y, from.z)
  at.setXYZ(k * 2 + 1, to.x, to.y, to.z)
}

function lantern(r: Rig, i: number, x: number, y: number, size: number, lift: number, roll: number, tone: THREE.Color, glow: number, dim: number) {
  stand(r.paper, i, x, y, size, 0, lift, 0, 0, roll)
  stand(r.frame, i, x, y, size, 0, lift, 0, 0, roll)
  col.copy(tone).multiplyScalar(glow).lerp(DARK, dim)
  r.paper.setColorAt(i, col)
  return up(b, x, y, 0.7 * size * Math.sin(roll), lift - 0.7 * size * Math.cos(roll), 0)
}

function hang(r: Rig, i: number, at: THREE.Vector3, size: number, roll: number, tone: THREE.Color, glow: number, dim: number) {
  r.paper.setMatrixAt(i, m.compose(at, q.copy(PQ).multiply(q2.setFromEuler(e.set(0, 0, roll))), sc.setScalar(size)))
  r.frame.setMatrixAt(i, m)
  r.paper.setColorAt(i, col.copy(tone).multiplyScalar(glow).lerp(DARK, dim))
}

function halo(r: Rig, i: number, x: number, y: number, size: number, tone: THREE.Color, power: number) {
  flat(r.glow, i, x, y, 1.5, size)
  r.glow.setColorAt(i, col.copy(tone).multiplyScalar(power))
}

function drift(k: number, t: number) {
  const boat = BOATS[k]
  const w = boat.speed
  const x = boat.home[0] + boat.roam[0] * Math.sin(w * t + boat.phase)
  const y = boat.home[1] + boat.roam[1] * Math.sin(w * 0.73 * t + boat.phase * 1.7)
  const vx = boat.roam[0] * w * Math.cos(w * t + boat.phase)
  const vy = boat.roam[1] * w * 0.73 * Math.cos(w * 0.73 * t + boat.phase * 1.7)
  return [x, y, Math.atan2(-vy, vx)] as const
}

function turned(out: THREE.Vector3, mx: number, my: number, mz: number, turn: number, size: number) {
  return out.set((mx * Math.cos(turn) + mz * Math.sin(turn)) * size, my * size, (-mx * Math.sin(turn) + mz * Math.cos(turn)) * size)
}

function ripple(r: Rig, k: number, x: number, y: number, t: number, dim: number) {
  for (let h = 0; h < 2; h++) {
    const u = (t * 0.3 + k * 0.37 + h * 0.5) % 1
    flat(r.rings, k * 2 + h, x, y, 1.2, 50 + 90 * u)
    r.rings.setColorAt(k * 2 + h, col.copy(RIPPLE).multiplyScalar((1 - u) * Math.min(1, u * 4) * 0.14 * (1 - dim * 0.6)))
  }
}

function boatAt(r: Rig, k: number, x: number, y: number, turn: number, t: number, dim: number) {
  const bob = Math.sin(t * 1.3 + k * 2.1)
  stand(r.boats, k, x, y, SIZE.boat, 0, bob * 2, 0, turn, bob * 0.06)
  turned(a, BOW[0], BOW[1], BOW[2], turn, SIZE.boat)
  hang(r, L.bow + k, up(p, x, y, a.x, a.y - 8 + bob * 2, a.z), SIZE.boat * 0.3, Math.sin(t * 2 + k) * 0.15, TONES[k % TONES.length], 1, dim)
  ripple(r, k, x, y, t, dim)
}

function fleet(r: Rig, t: number, k: number, dim: number) {
  BOATS.forEach((boat, i) => {
    const [x, y, turn] = drift(i, t)
    boatAt(r, i, x, y, turn, t, dim)
    const u = ((t + boat.phase * 3) / boat.period) % 1
    let reach = 0
    let lean = 0
    if (u < 0.12) reach = lean = 1 - (1 - u / 0.12) ** 3
    else if (u < 0.6) [reach, lean] = [1, 0.15]
    else if (u < 0.85) {
      const v = (u - 0.6) / 0.25
      reach = 1 - 0.7 * v
      lean = -0.5 - 0.4 * Math.sin(v * Math.PI * 5)
    }
    const dx = Math.cos(boat.cast)
    const dy = Math.sin(boat.cast)
    const out = 30 + 55 * reach
    flat(r.nets, i, x + dx * out, y + dy * out, 2, u < 0.85 ? SIZE.net * Math.max(0.05, reach) : 0, -boat.cast)
    turned(a, -0.05, 0.02, 0, turn, SIZE.boat)
    stand(r.folk, i, x, y, SIZE.folk, a.x, a.y + Math.sin(t * 1.3 + i * 2.1) * 2, a.z, 0, -0.4 * lean * Math.sign(dx || 1))
    if (!boat.tow) return
    const j = TOWED.indexOf(i)
    const [tx, ty] = drift(i, t - 6)
    const sway = Math.sin(t * 0.7 + i) * 0.08
    const lift = 175 + Math.sin(t * 0.9 + i) * 10
    const tone = TONES[(i + 2) % TONES.length]
    lantern(r, L.tow + j, tx, ty, SIZE.tow * k, lift, sway, tone, 1, dim)
    turned(a, -0.95, 0.25, 0, turn, SIZE.boat)
    seg(r.lines, SEG.tow + j, up(p, x, y, a.x, a.y, a.z), b)
    halo(r, G.tow + j, tx, ty, 300 * k, AMBER, 0.75 * (1 - dim))
  })
}

function moored(r: Rig, t: number, k: number, dim: number) {
  MOORED.forEach(([x, y], i) => {
    const ph = i * 1.7
    const lift = 220 + (i % 3) * 30 + Math.sin(t * 0.6 + ph) * 14
    const roll = Math.sin(t * 0.45 + ph * 1.3) * 0.07
    const glow = 0.86 + 0.14 * Math.sin(t * (2.1 + (i % 5) * 0.37) + ph) * Math.sin(t * 0.73 + i)
    const big = i === 0
    const size = SIZE.lantern * k * (big ? 2.3 : 0.85 + 0.3 * hash(i))
    lantern(r, i, x, y, size, big ? lift + 260 : lift, big ? roll * 0.4 : roll, TONES[i % TONES.length], glow, dim)
    seg(r.lines, i, up(a, x, y), b)
    if (big) GRANNY.copy(b)
  })
  CELLS.forEach(([x, y, rad], i) => {
    const f = 0.8 + 0.2 * Math.sin(t * (1.3 + hash(i + 9)) + i * 2.3)
    const lit = LIT[i]
    halo(r, i, x, y, rad * (i === 0 ? 7 : lit ? 4.6 : 2.8) * (0.6 + 0.4 * k), hash(i + 3) > 0.8 ? ROSE : AMBER, (lit ? 0.6 : 0.28) * f * (1 - dim * 0.9))
  })
}

function hook(r: Rig, t: number, dim: number) {
  const k = BOATS.length
  const [hx, hy] = HOOK
  const x = hx + Math.sin(t * 0.21) * 25
  boatAt(r, k, x, hy, 0.25, t, dim)
  const u = (t % 16) / 16
  const lift =
    u < 0.15 ? 175 : u < 0.55 ? 175 + 280 * smooth((u - 0.15) / 0.4) : u < 0.7 ? 455 : u < 0.95 ? 455 - 280 * smooth((u - 0.7) / 0.25) : 175
  const hang = u >= 0.15 && u < 0.95
  const lx = x + 10 + (hang ? Math.sin(t * 1.1) * 18 : 0)
  const bottom = lantern(r, L.hook, lx, hy, SIZE.hook, lift, Math.sin(t * 1.1) * 0.06, TONES[2], 1.05, dim)
  const swing = hang ? Math.sin(t * 2.6) * 0.28 : 0
  const feet = hang ? lift - 0.7 * SIZE.hook - 55 - 1.15 * SIZE.folk : 4
  const fx = hang ? lx : x + 12
  stand(r.folk, k + 1, fx, hy, SIZE.folk, 0, feet, hang ? 0 : 8, 0, swing)
  seg(r.lines, SEG.hook, bottom, up(a, fx, hy, -Math.sin(swing) * 32, feet + 1.1 * SIZE.folk, hang ? 0 : 8))
  const panic = hang ? Math.abs(Math.sin(t * 9)) * 7 : 0
  stand(r.folk, k, x - 28, hy, SIZE.folk, 0, 3 + panic, -4, 0, hang ? Math.sin(t * 9) * 0.15 : 0)
  halo(r, G.hook, lx, hy, 340, ROSE, 0.8 * (1 - dim))
}

function sleeper(r: Rig, t: number, dim: number) {
  const k = BOATS.length + 1
  const x = SLEEPER[0] + Math.sin(t * 0.04) * 60
  const y = SLEEPER[1] + Math.sin(t * 0.031) * 35
  boatAt(r, k, x, y, 2.9 + Math.sin(t * 0.05) * 0.3, t, dim)
  stand(r.folk, BOATS.length + 2, x + 14, y, SIZE.folk, 0, 10 + Math.sin(t * 0.8) * 1.5, 0, 0, 1.45)
  for (let j = 0; j < COUNT.zeds; j++) {
    const u = (t / 3.6 + j / COUNT.zeds) % 1
    const size = (10 + 16 * u) * (u > 0.8 ? (1 - u) / 0.2 : 1)
    stand(r.zeds, j, x, y, size, -10 + 40 * u + Math.sin(u * 7) * 8, 40 + 80 * u, 0, 0, 0.25)
  }
}

function shore(r: Rig, t: number, k: number, dim: number) {
  const [sx, sy] = SHACK
  const h = SIZE.shack
  const u = (t % 44) / 44
  stand(r.folk, BOATS.length + 3, sx - 3.3 * h, sy, SIZE.folk, 0, 0.32 * h, 0.2 * h, 0, u < 0.3 ? Math.sin(t * 6) * 0.3 : Math.sin(t) * 0.05)
  stand(r.folk, BOATS.length + 4, sx + 0.75 * h, sy, SIZE.folk, 0, 0.36 * h + Math.abs(Math.sin(t * 1.7)) * 4, 0.45 * h, 0, 0)
  const x0 = sx - 3.4 * h
  const x = x0 + (WISH_TO[0] - x0) * u
  const y = sy + (WISH_TO[1] - sy) * u
  const show = Math.min(1, u / 0.05) * (u > 0.85 ? (1 - u) / 0.15 : 1)
  const size = 90 * k * (1 - 0.35 * u) * show
  lantern(r, L.wish, x, y, size, 70 + 620 * u ** 0.8, Math.sin(t * 0.8) * 0.1, TONES[3], 1.1, dim)
  halo(r, G.wish, x, y, 380 * show * k, AMBER, 0.7 * show)
}

function seam(r: Rig, t: number, dim: number) {
  SEAM.forEach(([x, y], i) => stand(r.posts, i, x, y, SIZE.post))
  for (let j = 0; j < SPANS; j++) {
    const [x0, y0] = SEAM[j]
    const [x1, y1] = SEAM[j + 1]
    const top = SIZE.post * 1.02
    const droop = 0.1 * Math.hypot(x1 - x0, y1 - y0) + 10
    const point = (out: THREE.Vector3, s: number) => {
      up(out, x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, 0, top, 0)
      out.y -= droop * 4 * s * (1 - s)
      return out
    }
    for (let s = 0; s < STRING; s++) seg(r.lines, SEG.seam + j * STRING + s, point(a, s / STRING), point(b, (s + 1) / STRING))
    for (let h = 0; h < 2; h++) {
      const i = L.seam + j * 2 + h
      point(p, (h + 1) / 3).y -= 20
      hang(r, i, p, SIZE.mini, Math.sin(t * 1.4 + i) * 0.12, TONES[(i * 7) % TONES.length], 0.9 + 0.1 * Math.sin(t * 3 + i), dim)
    }
    halo(r, G.seam + j, (x0 + x1) / 2, (y0 + y1) / 2, 420, ROSE, 0.45 * (1 - dim))
  }
}

const CORNERS: [number, number][] = [[-1.25, -0.85], [1.25, -0.85], [1.25, 0.85], [-1.25, 0.85]]

function raft(r: Rig, t: number, dim: number) {
  const [rx, ry] = RAFT
  const rs = SIZE.raft
  CORNERS.forEach(([cx, cz], j) => {
    hang(r, L.raft + j, up(p, rx, ry, cx * rs, 1.18 * rs, cz * rs), SIZE.mini, Math.sin(t * 1.7 + j) * 0.1, TONES[j + 1], 1, dim)
    const [nx, nz] = CORNERS[(j + 1) % 4]
    for (let s = 0; s < 4; s++) {
      const s0 = s / 4
      const s1 = (s + 1) / 4
      const sag = (v: number) => 1.3 - 0.14 * 4 * v * (1 - v)
      up(a, rx, ry, (cx + (nx - cx) * s0) * rs, sag(s0) * rs, (cz + (nz - cz) * s0) * rs)
      up(b, rx, ry, (cx + (nx - cx) * s1) * rs, sag(s1) * rs, (cz + (nz - cz) * s1) * rs)
      seg(r.lines, SEG.raft + j * 4 + s, a, b)
    }
  })
  halo(r, G.raft, rx, ry, 620, ROSE, 0.55 * (1 - dim))
  CORNERS.slice(0, 2).forEach(([cx, cz], j) => seg(r.lines, SEG.granny + j, GRANNY, up(a, rx, ry, cx * rs, 1.3 * rs, cz * rs)))
  seg(r.lines, SEG.granny + 2, GRANNY, up(a, MOORED[20][0], MOORED[20][1], 0, 40, 0))
}

const SEATS: [number, number, number][] = [[0.55, 0.06, -0.3], [-0.35, 0.06, -0.5], [0, 0.06, 0.2], [-0.85, 0.06, 0.45], [0.9, 0.06, 0.5]]

function band(r: Rig, t: number, play: number) {
  const f = 0.34
  const moves = [
    [Math.abs(Math.sin(t * 2.2)) * 0.02, Math.sin(t * 2.2) * 0.12, 0],
    [Math.abs(Math.sin(t * 6.3)) * 0.06, 0, 0],
    [0, Math.sin(t * 1.6) * 0.1, 0],
    [Math.abs(Math.sin(t * 4.2)) * 0.16, Math.sin(t * 4.2) * 0.1, Math.sin(t * 1.3) * 1.1],
    [Math.abs(Math.cos(t * 4.2)) * 0.16, -Math.sin(t * 4.2) * 0.1, -Math.sin(t * 1.1) * 1.1],
  ]
  SEATS.forEach(([x, y, z], i) => {
    const [hop, roll, turn] = moves[i]
    q.setFromEuler(e.set(0, turn * play, roll * play))
    r.band.setMatrixAt(i, m.compose(p.set(x, y + hop * play, z), q, sc.setScalar(f)))
  })
  r.squeeze.scale.set(0.33 * (0.85 + 0.3 * Math.sin(t * 3.2) * play), 0.33, 0.33)
  for (let j = 0; j < COUNT.notes; j++) {
    const u = (t * 0.3 + j / COUNT.notes) % 1
    const [x, , z] = SEATS[j % 3]
    const size = 0.3 * Math.sin(u * Math.PI) ** 0.6 * play
    p.set(x + 0.5 * u + Math.sin(u * 9 + j) * 0.18, 0.6 + 1.9 * u, z + 0.1)
    r.notes.setMatrixAt(j, m.compose(p, NONE, sc.setScalar(size)))
    r.notes.setColorAt(j, NOTES[j % NOTES.length])
  }
}

function swimmer(r: Rig, t: number, dim: number) {
  const x = 120 + Math.sin(t * 0.09) * 130
  const y = 60 + Math.sin(t * 0.07 + 1) * 70
  const bob = Math.sin(t * 1.7) * 3
  stand(r.folk, BOATS.length + 5, x, y, SIZE.folk, 0, bob, 0, 0, 0.55 + Math.sin(t * 0.9) * 0.1)
  hang(r, L.swim, up(p, x, y, 24, 16 + bob * 1.4, 6), 40, Math.sin(t * 1.3) * 0.2, TONES[4], 1, dim)
  ripple(r, BOATS.length + 2, x, y, t, dim)
}

export function animate(r: Rig, t: number, zoom: number, dim: number) {
  const k = 1 + Math.min(1, Math.max(0, (0.16 - zoom) / 0.08)) * 0.8
  moored(r, t, k, dim)
  fleet(r, t, k, dim)
  hook(r, t, dim)
  sleeper(r, t, dim)
  shore(r, t, k, dim)
  seam(r, t, dim)
  raft(r, t, dim)
  swimmer(r, t, dim)
  band(r, t, 1 - Math.min(1, dim * 4))
  for (const mesh of [r.paper, r.frame, r.glow, r.boats, r.folk, r.nets, r.rings, r.zeds, r.posts, r.band, r.notes]) {
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }
  r.lines.geometry.getAttribute('position').needsUpdate = true
  const fine = zoom > 0.13
  r.lines.visible = fine
  r.notes.visible = fine
  r.zeds.visible = fine
}
