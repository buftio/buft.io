import * as THREE from 'three'
import { hash } from './kit'
import { BOARD, CADET, DEAN, DESKS, DUMMIES, ELDER, EXIT, GRADS, PATHS, ROMP, STAGE, TARGETS, THROWERS, TRACK } from './layout'

const TILT = (25 * Math.PI) / 180
const PQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), TILT)
const UP = new THREE.Vector3(0, 1, 0).applyQuaternion(PQ)
const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler(0, 0, 0, 'XZY')
const p = new THREE.Vector3()
const s = new THREE.Vector3()

export type Pose = { x: number; y: number; size: number; turn?: number; hop?: number; lx?: number; lz?: number }

export function put(mesh: THREE.InstancedMesh, i: number, o: Pose) {
  e.set(o.lx ?? 0, o.turn ?? 0, o.lz ?? 0)
  q.setFromEuler(e)
  q.premultiply(PQ)
  p.set(o.x, -o.y, 0).addScaledVector(UP, o.hop ?? 0)
  m.compose(p, q, s.setScalar(o.size))
  mesh.setMatrixAt(i, m)
}

const face = (ux: number, uy: number) => Math.atan2(ux, uy)
const cheat = (a: number) => (Math.abs(a) < 2 ? a * 0.6 : a)
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const bump = (u: number, w: number) => (u >= 0 && u < w ? Math.sin((u / w) * Math.PI) : 0)

export const JOGGERS = 12
export type Mood = { alarm: boolean; flee: number }

export function joggers(mesh: THREE.InstancedMesh, t: number, mood: Mood, lap: number) {
  for (let i = 0; i < JOGGERS; i++) {
    const slow = i === JOGGERS - 1
    const w = (slow ? 0.62 : 0.8 + hash(i) * 0.08) * lap
    const a = -i * 0.24 + w + (slow ? -0.4 : 0)
    const lane = (i % 2) * 34 - 17
    let x = TRACK.x + Math.cos(a) * (TRACK.rx + lane)
    let y = TRACK.y + Math.sin(a) * (TRACK.ry + lane)
    let turn = face(-Math.sin(a) * TRACK.rx, Math.cos(a) * TRACK.ry)
    let size = CADET
    const go = mood.flee ? clamp((t - mood.flee - i * 0.7) / 7) : 0
    if (go > 0) {
      turn = face(EXIT.x - x, EXIT.y - y)
      x = mix(x, EXIT.x, go)
      y = mix(y, EXIT.y, go)
      size = CADET * clamp((1 - go) * 6)
    }
    const hop = Math.abs(Math.sin(t * (slow ? 7 : 9) + i * 1.7)) * (slow ? 8 : 15)
    put(mesh, i, { x, y, size, turn: cheat(turn), hop, lx: slow ? 0.25 : 0.12 })
  }
}

const centre = { x: TRACK.x, y: TRACK.y - 60 }

export function sparring(cadets: THREE.InstancedMesh, base: number, dummies: THREE.InstancedMesh, puffs: THREE.InstancedMesh, t: number, pace: number) {
  DUMMIES.forEach((d, k) => {
    const P = (3.1 + hash(k + 20) * 1.5) / pace
    const u = (t + hash(k + 40) * 9) % P
    const vx = centre.x - d.x
    const vy = centre.y - d.y
    const n = Math.hypot(vx, vy)
    const sx = d.x + (vx / n) * 230
    const sy = d.y + (vy / n) * 230
    const cx = d.x + (vx / n) * 70
    const cy = d.y + (vy / n) * 70
    const c = clamp(u / 0.35)
    const back = clamp((u - 0.6) / 1.0)
    const f = u < 0.6 ? c * c : 1 - back
    const turn = face(-vx, -vy)
    const hop = u < 0.35 ? Math.abs(Math.sin(u * 30)) * 18 : bump(u - 0.6, 1) * 6 + Math.abs(Math.sin(t * 3 + k)) * 4
    put(cadets, base + k, { x: mix(sx, cx, f), y: mix(sy, cy, f), size: CADET, turn, hop, lx: u < 0.35 ? 0.3 : 0 })
    const dt = u >= 0.35 ? u - 0.35 : u + P - 0.35
    const swing = 0.5 * Math.exp(-2.4 * dt) * Math.sin(dt * 12)
    const ux = -vx / n
    const uy = -vy / n
    put(dummies, k, { x: d.x, y: d.y, size: 95, lx: swing * uy, lz: -swing * ux, turn: Math.sin(k) * 0.4 })
    const puff = bump(dt, 0.4) * 40
    put(puffs, k, { x: d.x + ux * 10, y: d.y + uy * 10, size: puff, hop: 105 })
  })
}

export function sergeant(mesh: THREE.InstancedMesh, shout: THREE.InstancedMesh, t: number, pace: number) {
  const x = centre.x + Math.sin(t * 0.45 * pace) * 230
  const dir = Math.cos(t * 0.45 * pace)
  const bark = (t * pace) % 4.2
  const turn = bark < 0.9 ? 0 : Math.sign(dir) * 1.1
  const y = centre.y - 70
  put(mesh, 0, { x, y, size: ELDER, turn, hop: bump(bark, 0.35) * 30 + bump(bark - 0.35, 0.3) * 18 })
  put(shout, 0, { x: x + 95, y, size: bark < 0.9 ? 80 * Math.min(1, bark * 8) : 0, hop: 205 })
}

export const CHASERS = 2

export function romp(costume: THREE.InstancedMesh, cadets: THREE.InstancedMesh, base: number, t: number, a: number, scared: boolean) {
  const at = (v: number) => [ROMP.x + Math.sin(v) * ROMP.ax, ROMP.y + Math.sin(v) * Math.cos(v) * ROMP.ay * 2] as const
  const dir = scared ? -1 : 1
  const heading = (v: number) => {
    const [x0, y0] = at(v)
    const [x1, y1] = at(v + 0.05 * dir)
    return face(x1 - x0, y1 - y0)
  }
  const [x, y] = at(a)
  put(costume, 0, { x, y, size: 105, turn: scared ? 0 : cheat(heading(a)) * 0.6, hop: Math.abs(Math.sin(t * 6)) * 8, lz: Math.sin(t * 6) * 0.14 })
  for (let k = 0; k < CHASERS; k++) {
    const v = a - 0.42 - k * 0.36
    const [cx, cy] = at(v)
    const hop = Math.abs(Math.sin(t * (scared ? 15 : 10) + k * 2)) * (scared ? 32 : 18)
    put(cadets, base + k, { x: cx, y: cy, size: CADET * 0.85, turn: cheat(heading(v)), hop, lx: scared ? -0.2 : 0.25 })
  }
}

const walk = PATHS[0]
const legs = walk.slice(1).map((b, k) => Math.hypot(b[0] - walk[k][0], b[1] - walk[k][1]))
const total = legs.reduce((a, b) => a + b, 0)
export const COMMUTERS = 4

function along(d: number) {
  let r = Math.max(0, Math.min(total - 1, d))
  for (let k = 0; k < legs.length; k++) {
    if (r <= legs[k]) {
      const f = r / legs[k]
      const [a, b] = [walk[k], walk[k + 1]]
      return [mix(a[0], b[0], f), mix(a[1], b[1], f), b[0] - a[0], b[1] - a[1]] as const
    }
    r -= legs[k]
  }
  return [walk[walk.length - 1][0], walk[walk.length - 1][1], 0, 1] as const
}

export function commute(cadets: THREE.InstancedMesh, base: number, t: number) {
  for (let k = 0; k < COMMUTERS; k++) {
    const speed = 70 + hash(k + 200) * 40
    const loop = (t * speed + hash(k + 210) * total * 2) % (total * 2)
    const out = loop < total
    const [x, y, ux, uy] = along(out ? loop : total * 2 - loop)
    const side = (k % 2 ? 1 : -1) * 34
    const n = Math.hypot(ux, uy) || 1
    put(cadets, base + k, {
      x: x + (-uy / n) * side,
      y: y + (ux / n) * side,
      size: CADET * 0.9,
      turn: cheat(out ? face(ux, uy) : face(-ux, -uy)),
      hop: Math.abs(Math.sin(t * 7 + k * 1.3)) * 10,
    })
  }
}

export const STUDENTS = DESKS.length
const DREAMER = 12

export function lecture(cadets: THREE.InstancedMesh, base: number, prof: THREE.InstancedMesh, t: number) {
  DESKS.forEach((d, k) => {
    const P = 5 + hash(k + 60) * 7
    const u = (t + hash(k + 80) * 11) % P
    const dream = k === DREAMER && t % 9 < 6
    const turn = dream ? Math.sin(t * 0.7) * 0.4 : Math.PI + Math.sin(t * 0.6 + k) * 0.12
    put(cadets, base + k, { x: d.x, y: d.y + 22, size: CADET * 0.92, turn, hop: bump(u, 0.55) * 46 + (dream ? 6 : 0) })
  })
  const tap = t % 5
  const turn = tap < 2.5 ? -0.55 : 0.35
  put(prof, 0, { x: BOARD.x - 470, y: BOARD.y + 110, size: ELDER, turn, hop: bump(tap % 2.5, 0.25) * 16 })
}

export const GRAD_LIFT = (0.25 * STAGE.s * Math.cos((50 * Math.PI) / 180)) / Math.cos(TILT)

export function graduation(cadets: THREE.InstancedMesh, base: number, hats: THREE.InstancedMesh, dean: THREE.InstancedMesh, t: number) {
  const P = 11
  GRADS.forEach((g, k) => {
    const u = (t + k * 0.09) % P
    const cheer = bump(u - 6.7, 0.5) * 60 + bump(u - 9.4, 0.4) * 20
    const sway = Math.abs(Math.sin(t * 2.2 + k)) * 5
    const turn = Math.sin(t * 0.8 + k * 1.3) * 0.25
    put(cadets, base + k, { x: g.x, y: g.y, size: CADET, turn, hop: GRAD_LIFT + cheer + sway })
    const fly = clamp((u - 7) / 2.4)
    const up = fly > 0 && fly < 1 ? 1 - (fly * 2 - 1) ** 2 : 0
    const head = GRAD_LIFT + CADET * 0.74 + cheer + sway
    put(hats, k, {
      x: g.x + up * (k - 2.5) * 30,
      y: g.y,
      size: CADET,
      hop: head + up * 560,
      turn: turn + fly * (6 + k) * (k % 2 ? 1 : -1),
      lx: up * Math.sin(k * 3 + fly * 9) * 0.9,
      lz: 0.12,
    })
  })
  const u = t % P
  const bow = bump(u - 1, 2) * 0.5 + bump(u - 6.6, 0.5) * -0.2
  put(dean, 0, { x: DEAN.x, y: DEAN.y, size: ELDER, turn: 0.5, hop: GRAD_LIFT + bump(u - 6.6, 0.5) * 30, lx: bow })
}

export function range(cadets: THREE.InstancedMesh, base: number, boards: THREE.InstancedMesh, balls: THREE.InstancedMesh, t: number, pace: number) {
  const throws = [0, 0, 0]
  TARGETS.forEach((g, k) => {
    const P = (3.7 + hash(k + 100) * 1.6) / pace
    const u = (t + hash(k + 120) * 7) % P
    const turn = u < 0.3 ? (u / 0.3) * Math.PI : u < 1.5 ? Math.PI : u < 1.8 ? Math.PI + ((u - 1.5) / 0.3) * Math.PI : 0
    const hit = u - 1.2
    const knock = hit > 0 && hit < 0.6 ? -Math.exp(-5 * hit) * Math.sin(hit * 20) * 0.5 : 0
    put(boards, k, { x: g.x, y: g.y, size: 95, turn, lx: knock })
    const j = k % THROWERS.length
    const th = THROWERS[j]
    const f = clamp((u - 0.6) / 0.6)
    const live = u > 0.6 && u < 1.2
    throws[j] = Math.max(throws[j], bump(u - 0.45, 0.35))
    put(balls, DUMMIES.length + k, {
      x: mix(th.x, g.x, f),
      y: mix(th.y, g.y, f),
      size: live ? 16 : 0,
      hop: mix(55, 119, f) + Math.sin(f * Math.PI) * 140,
    })
  })
  THROWERS.forEach((th, j) => {
    const aim = TARGETS[j]
    put(cadets, base + j, { x: th.x, y: th.y, size: CADET, turn: face(aim.x - th.x, aim.y - th.y) + 0.5, hop: throws[j] * 34, lx: -throws[j] * 0.3 })
  })
}
