import * as THREE from 'three'
import { Kit, rng, stand } from './kit'
import { BACK, BEACON_AT, CLOD, DERRICK, GAP, HOIST, LIFT, QUARRY, STEPS, TOWERS, WALK } from './layout'
import { FAT, INK, MINT, PLANK, STONE, TEAL, WOOD } from './models'

const ROSE = ['#c8245e', '#e04a7d', '#b31b52', '#ee6a95']
const CUT = '#b8406c'
const CUT_TOP = '#e07898'
const SEAM = '#a23a64'
const TIMBER = '#7c4a26'
const QUARTZ = '#ffc8da'

type R = () => number

function wobble<T extends THREE.BufferGeometry>(g: T, ph: number, amp: number, flat = false) {
  const p = g.getAttribute('position')
  const a1 = ph
  const a2 = ph * 2.7 + 1
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const z = flat ? p.getY(i) : p.getZ(i)
    const a = Math.atan2(z, x)
    const k = 1 + amp * (Math.sin(2 * a + a1) * 0.5 + Math.sin(3 * a + a2) * 0.3 + Math.sin(7 * a + a1 * 3) * 0.35)
    p.setX(i, x * k)
    if (flat) p.setY(i, z * k)
    else p.setZ(i, z * k)
  }
  return g
}

function strata(k: Kit, r: R, x: number, z: number, w: number, h: number) {
  const n = 3 + Math.floor(r() * 3)
  let y = 0
  for (let i = 0; i < n; i++) {
    const th = (h / n) * (0.75 + r() * 0.5)
    const rad = w * (1 - (i / n) * 0.45) * (0.85 + r() * 0.2)
    const ox = x + (r() - 0.5) * w * 0.25
    const o = { ry: r() * 3, sz: 0.7 + r() * 0.3 }
    const ph = r() * 6
    k.add(wobble(new THREE.CylinderGeometry(rad * 0.7, rad * 0.74, th * 0.2, 9), ph, 0.2), '#7e1440', ox, y + th * 0.1, z, o)
    k.add(wobble(new THREE.CylinderGeometry(rad * 0.88, rad, th * 0.8, 9), ph, 0.2), ROSE[(i + Math.floor(r() * 2)) % 4], ox, y + th * 0.6, z, { ...o, top: '#f58db0' })
    y += th
  }
  return y
}

function crystals(k: Kit, r: R, x: number, y: number, z: number, s: number) {
  for (let i = 0; i < 4; i++)
    k.add(new THREE.ConeGeometry(s * 0.18, s * (0.6 + r() * 0.5), 5), QUARTZ, x + (r() - 0.5) * s * 0.6, y + s * 0.25, z + (r() - 0.5) * s * 0.5, {
      rx: (r() - 0.5) * 0.9,
      rz: (r() - 0.5) * 0.9,
      top: '#fff2f6',
    })
}

function flag(k: Kit, x: number, y: number, z: number, s = 1) {
  k.box(5 * s, 70 * s, 5 * s, INK, x, y + 35 * s, z)
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(48 * s, -12 * s), new THREE.Vector2(0, -24 * s)])
  k.add(new THREE.ShapeGeometry(tri), MINT, x + 2, y + 68 * s, z)
}

function steps(k: Kit, r: R) {
  STEPS.forEach((s, i) => {
    const d = s.front - BACK
    k.box(s.w * 2, s.h, d, CUT, s.c, s.h / 2, BACK + d / 2, { top: CUT_TOP })
    for (const y of [s.h - 38, s.h - 84]) k.box(s.w * 2 - 30, 5, 4, SEAM, s.c, y, s.front + 1)
    const z0 = i < 3 ? STEPS[i + 1].front : BACK
    const mid = (z0 + s.front) / 2
    k.box(s.w * 2 - 40, 3, 4, SEAM, s.c, s.h + 1, mid)
    for (let x = -s.w + 100; x < s.w - 40; x += 130) k.box(4, 3, s.front - z0 - 12, SEAM, s.c + x, s.h + 1, mid)
    const bx = s.c + (r() - 0.5) * s.w
    k.box(110, 44, (s.front - z0) * 0.55, '#d8688f', bx, s.h + 22, mid, { top: '#f4a3bf' })
  })
}

function scaffolds(k: Kit) {
  for (let i = 1; i < 4; i++) {
    const s = STEPS[i]
    const low = STEPS[i - 1].h
    const hh = s.h - low + 70
    for (let x = -s.w + 50; x <= s.w - 50; x += 170)
      for (const dz of [10, 60]) k.box(8, hh, 8, WOOD, s.c + x, low + hh / 2, s.front + dz)
    k.box(s.w * 2 - 70, 8, 62, PLANK, s.c, low + 56, s.front + 35, { top: '#efc187' })
    k.box(s.w * 2 - 70, 5, 5, WOOD, s.c, low + 96, s.front + 62)
    k.box(6, hh, 6, WOOD, s.c - s.w + 135, low + hh / 2, s.front + 62, { rz: 0.8 })
    flag(k, s.c + s.w - 50, low + hh, s.front + 60, 0.8)
  }
  for (let y = 18; y < 170; y += 26) k.box(46, 5, 5, WOOD, -STEPS[1].w + 110, y, STEPS[1].front + 70)
  for (const x of [-STEPS[1].w + 88, -STEPS[1].w + 132]) k.box(6, 180, 6, WOOD, x, 90, STEPS[1].front + 70)
}

function floor(k: Kit, r: R) {
  k.box(1150, 8, 220, '#c8678b', 0, 4, 340, { top: '#e08aa8' })
  const rows = [[360, 440, 520], [400, 480], [440]]
  rows.forEach((xs, j) => xs.forEach((x) => k.box(72, 44, 56, j % 2 ? '#d36a92' : '#e07ea3', x, 22 + j * 44, 320, { top: '#f6b0c8' })))
  k.box(170, 100, 110, '#d8688f', -230, 62, 340, { top: '#f4a3bf' })
  k.box(220, 12, 130, PLANK, -230, 13, 340, { top: '#efc187' })
  for (const x of [-310, -230, -150]) k.add(new THREE.CylinderGeometry(9, 9, 150, 8), WOOD, x, 9, 340, { rx: Math.PI / 2 })
  for (const z of [310, 370]) k.beam({ x: -120, y: 20, z }, { x: 60, y: 22, z: z + (z > 340 ? 20 : -20) }, 3, INK)
  for (let i = 0; i < 9; i++) k.add(new THREE.DodecahedronGeometry(10 + r() * 14, 0), CUT, -480 + r() * 800, 6, 270 + r() * 140, { ry: r() * 3 })
}

function hoist(k: Kit) {
  const top = STEPS[3].h
  k.box(14, 200, 14, WOOD, HOIST.x, top + 100, HOIST.z)
  k.beam({ x: HOIST.x, y: top + 40, z: HOIST.z }, { x: HOIST.tx, y: HOIST.ty, z: HOIST.tz }, 12, WOOD)
  k.beam({ x: HOIST.x, y: top + 200, z: HOIST.z }, { x: HOIST.tx, y: HOIST.ty, z: HOIST.tz }, 4, INK)
  k.beam({ x: HOIST.x, y: top + 200, z: HOIST.z }, { x: HOIST.x - 120, y: top, z: HOIST.z - 40 }, 4, INK)
  k.add(new THREE.CylinderGeometry(20, 20, 50, 10), TIMBER, HOIST.x - 40, top + 22, HOIST.z, { rz: Math.PI / 2 })
}

function backMass(k: Kit, r: R) {
  k.box(880, 440, 140, '#c8245e', 170, 220, BACK - 50, { top: '#ee6a95' })
  for (const y of [120, 250, 360]) k.box(884, 8, 4, '#a3164b', 170, y, BACK + 22)
  for (let i = 0; i < 7; i++) {
    const x = -260 + i * 140 + r() * 40
    const top = strata(k, r, x, BACK - 70 - r() * 50, 120 + r() * 40, 520 + r() * 160)
    if (i % 3 === 1) crystals(k, r, x, top - 30, BACK - 70, 110)
  }
  k.box(48, 260, 48, STONE, BEACON_AT.x, BEACON_AT.y - 140, BEACON_AT.z, { top: '#fff' })
  k.add(new THREE.CylinderGeometry(42, 22, 30, 10), INK, BEACON_AT.x, BEACON_AT.y - 4, BEACON_AT.z)
  k.box(6, 200, 6, INK, 160, 560, BACK - 60)
  const big = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(130, -26), new THREE.Vector2(0, -60)])
  k.add(new THREE.ShapeGeometry(big), TEAL, 163, 656, BACK - 60)
}

function quarry(k: Kit, r: R) {
  k.on(QUARRY)
  backMass(k, r)
  steps(k, r)
  scaffolds(k)
  floor(k, r)
  hoist(k)
}

function gantry(k: Kit, h: number) {
  for (const s of [-1, 1]) k.box(14, h - 30, 14, TIMBER, 0, 30 + (h - 30) / 2, s * (GAP + 6))
  k.box(16, 16, GAP * 2 + 40, TIMBER, 0, h, 0)
  k.add(new THREE.TorusGeometry(GAP, 5, 5, 18), INK, 0, h + 8, 0, { rx: Math.PI / 2 })
}

function station(k: Kit, m: THREE.Matrix4, h: number, side: number, r: R) {
  k.on(m)
  k.box(250, 30, 160, PLANK, 0, 15, 0, { top: '#efc187' })
  gantry(k, h)
  k.box(100, 80, 80, STONE, side * 80, 70, -30, { top: '#fff' })
  k.add(new THREE.ConeGeometry(80, 60, 4), TEAL, side * 80, 140, -30, { ry: Math.PI / 4 })
  k.box(22, 34, 4, INK, side * 80, 47, 11)
  const rows = side > 0 ? [[-150, -80, -10], [-115, -45], [-80]] : [[110, 180], [145]]
  rows.forEach((xs, j) => xs.forEach((x) => k.box(64, 40, 50, j % 2 ? '#d36a92' : '#e07ea3', x + (r() - 0.5) * 6, 50 + j * 40, 50, { top: '#f6b0c8' })))
}

function pylon(k: Kit, m: THREE.Matrix4, h: number, pier: boolean) {
  k.on(m)
  if (pier) k.add(new THREE.CylinderGeometry(70, 90, 70, 8), '#e894b0', 0, 35, 0, { top: '#ffd0de' })
  else k.box(100, 24, 100, STONE, 0, 12, 0, { top: '#fff' })
  const base = pier ? 70 : 24
  for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.beam({ x: a * 40, y: base, z: b * 34 }, { x: a * 10, y: h, z: b * 12 }, 10, TIMBER)
  for (const t of [0.3, 0.6]) {
    const y = base + (h - base) * t
    const s = 40 - 30 * t
    k.box(s * 2, 6, 6, TIMBER, 0, y, s * 0.85)
    k.box(6, 6, s * 1.7, TIMBER, s, y, 0)
  }
  k.box(16, 16, GAP * 2 + 30, TIMBER, 0, h - 6, 0)
  for (const s of [-1, 1]) k.add(new THREE.CylinderGeometry(9, 9, 6, 10), INK, 0, h + 4, s * GAP, { rz: Math.PI / 2 })
}

function ridge(k: Kit, r: R, from: [number, number], to: [number, number], n: number) {
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    const s = 120 + r() * 110
    k.on(stand(from[0] + (to[0] - from[0]) * t + (r() - 0.5) * 90, from[1] + (to[1] - from[1]) * t + (r() - 0.5) * 70, 1, r() * 6, LIFT))
    const top = strata(k, r, 0, 0, s, s * (0.7 + r() * 0.9 + Math.sin(t * Math.PI) * 0.5))
    if (r() < 0.4) crystals(k, r, 0, top - 20, 0, s * 0.7)
  }
}

function derrick(k: Kit) {
  k.on(DERRICK)
  k.box(130, 16, 110, PLANK, 0, 8, -10, { top: '#efc187' })
  k.beam({ x: -40, y: 16, z: -30 }, { x: 0, y: 320, z: 20 }, 12, WOOD)
  k.beam({ x: 40, y: 16, z: -30 }, { x: 0, y: 320, z: 20 }, 12, WOOD)
  k.beam({ x: 0, y: 30, z: 10 }, { x: 0, y: 300, z: 280 }, 10, WOOD)
  k.beam({ x: 0, y: 320, z: 20 }, { x: 0, y: 300, z: 280 }, 3, INK)
  k.add(new THREE.CylinderGeometry(22, 22, 70, 10), TIMBER, 0, 40, -40, { rz: Math.PI / 2 })
  for (let x = -260; x <= 260; x += 75) k.box(8, 40, 8, WOOD, x, 20, 80)
  k.box(540, 3, 3, '#e6d2b0', 0, 34, 80)
}

function clodCamp(k: Kit) {
  k.on(stand(CLOD.x - 210, CLOD.y + 250, 1, 0.3, LIFT))
  k.box(10, 130, 10, WOOD, 0, 65, 0)
  k.on(stand(CLOD.x + 20, CLOD.y + 235, 1, 0, LIFT))
  k.add(new THREE.CylinderGeometry(42, 42, 6, 16), STONE, 0, 3, 0)
  k.add(new THREE.CylinderGeometry(28, 31, 26, 14), FAT, 0, 19, 0, { top: '#fff0b8' })
  k.add(new THREE.SphereGeometry(8, 8, 6), '#e0245e', 0, 38, 0)
}

export function cliffGeometry() {
  const r = rng(91)
  const k = new Kit()
  quarry(k, r)
  station(k, TOWERS[0].m, TOWERS[0].h, -1, r)
  pylon(k, TOWERS[1].m, TOWERS[1].h, true)
  pylon(k, TOWERS[2].m, TOWERS[2].h, false)
  station(k, TOWERS[3].m, TOWERS[3].h, 1, r)
  ridge(k, r, [430, -800], [1000, -1640], 14)
  ridge(k, r, [-860, 500], [-1330, 1330], 13)
  derrick(k)
  clodCamp(k)
  pit(k)
  road(k)
  return k.build()
}

function road(k: Kit) {
  k.on(new THREE.Matrix4())
  const side = new THREE.Vector3()
  for (let i = 1; i < WALK.length; i++) {
    const a = WALK[i - 1]
    const b = WALK[i]
    side.set(-(b.y - a.y), b.x - a.x, 0).normalize()
    for (const s of [-1, 1])
      k.beam(a.clone().addScaledVector(side, s * 13).setZ(a.z - 3), b.clone().addScaledVector(side, s * 13).setZ(b.z - 3), 4, '#5b3a2a')
    const n = Math.floor(a.distanceTo(b) / 24)
    for (let j = 0; j <= n; j++) {
      const p = a.clone().lerp(b, j / n)
      p.z -= 5
      k.beam(p.clone().addScaledVector(side, -20), p.clone().addScaledVector(side, 20), 6, '#a46a36')
    }
  }
}

const PIT = ['#e77fa3', '#c94a7d', '#9c2a5c', '#6e1640', '#3e0a24']

function pit(k: Kit) {
  k.on(new THREE.Matrix4())
  PIT.forEach((c, i) => {
    const f = 1 - i * 0.17
    k.add(wobble(new THREE.CircleGeometry(1, 40), 1.3 + i * 0.4, 0.12, true), c, -760 + i * 10, 1150 - i * 22, 4 + i, { sx: 370 * f, sy: 165 * f, rz: 1.2 })
  })
}

export function shadowGeometry() {
  const k = new Kit()
  const spot = (x: number, y: number, a: number, b: number, turn = 0, c = '#7a1240') =>
    k.add(new THREE.CircleGeometry(1, 28), c, x, y, 2, { sx: a, sy: b, rz: turn })
  const q = new THREE.Vector3(0, 0, -40).applyMatrix4(QUARRY)
  spot(q.x, q.y, 640, 300, 0.47)
  for (const t of TOWERS) spot(t.x, -t.y, 130, 70)
  spot(CLOD.x, -CLOD.y - 40, 240, 130)
  return k.build()
}

export const SIGNS = ['PLEASE MOVE', 'TO THE WALLS →', 'OLD CUT', 'ROSE STONE CO.']

export function signGeometry() {
  const k = new Kit()
  const board = (m: THREE.Matrix4, row: number, w: number, y: number) => {
    const g = new THREE.PlaneGeometry(w, w / 8)
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (row + 1 - uv.getY(i)) / 4)
    k.on(m).add(g, '#ffffff', 0, y, 8, { uv: true, rx: -(50 * Math.PI) / 180 })
  }
  board(stand(CLOD.x - 210, CLOD.y + 250, 1, 0.3, LIFT), 0, 200, 135)
  const b = TOWERS[3]
  board(stand(b.x + 40, b.y + 150, 1, 0, LIFT), 1, 240, 40)
  board(stand(-990, -770, 1, 0, LIFT), 2, 150, 20)
  board(stand(TOWERS[0].x + 80, TOWERS[0].y + 170, 1, 0, LIFT), 3, 220, 16)
  return k.build()
}
