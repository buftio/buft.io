import * as THREE from 'three'
import { hash } from './kit'
import { along, BRUSH, CHAIN, cellAt, DIGGERS, GAWK, HEAP, NAP, PROUD, QUEUE, RIB, ROD, SELLER, SHRINE, TENT, TIP, track, TUG, WINCH } from './plan'

const TILT = (50 * Math.PI) / 180
const CO = Math.cos(TILT)
const SI = Math.sin(TILT)
const PQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(TILT, 0, 0))
const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const q2 = new THREE.Quaternion()
const e = new THREE.Euler()
const p = new THREE.Vector3()
const sc = new THREE.Vector3()
const col = new THREE.Color()
const at = { x: 0, y: 0, a: 0 }
const SAND = new THREE.Color('#d9a75b')
const WOODY = new THREE.Color('#8a5a33')
const BONE = new THREE.Color('#fff8e6')
const FLAME = new THREE.Color('#ffb21f')
const FLASH = new THREE.Color('#fffbe0')
const LUCK = new THREE.Color('#ffd36b')
const TEAL = new THREE.Color('#2a8f86')
const ALARM = new THREE.Color('#3fe0c5')
const MINT = new THREE.Color('#7dffe6')

const F = 30
const PILGRIMS = 14
const KNEEL = 2
const LINE = 11
const SPACING = 78

function offset(path: [number, number][], side: number): [number, number][] {
  return path.map(([x, y], i) => {
    const [ax, ay] = path[Math.max(0, i - 1)]
    const [bx, by] = path[Math.min(path.length - 1, i + 1)]
    const a = Math.atan2(by - ay, bx - ax)
    return [x - Math.sin(a) * side, y + Math.cos(a) * side]
  })
}

const LOOP = track([...offset(RIB, 34), ...offset(RIB, -34).reverse(), offset(RIB, 34)[0]])
const LINEUP = track([...QUEUE].reverse())
const BUCKET = track([cellAt(0, 0), ...CHAIN, HEAP])

export const COUNT = {
  digger: DIGGERS.length + 1,
  worker: BRUSH.length + CHAIN.length + TUG.length + WINCH.length + 2,
  pilgrim: PILGRIMS + KNEEL,
  tourist: LINE + GAWK.length,
  puff: DIGGERS.length * 2 + 3,
  glow: PILGRIMS + KNEEL + 7 + 4 + GAWK.length + 1,
}

export type Rig = {
  digger: THREE.InstancedMesh
  worker: THREE.InstancedMesh
  pilgrim: THREE.InstancedMesh
  tourist: THREE.InstancedMesh
  puff: THREE.InstancedMesh
  glow: THREE.InstancedMesh
  boom: THREE.Group
  rope: THREE.Mesh
  load: THREE.Mesh
  tug: THREE.Mesh
  whale: THREE.Mesh
  ribbon: THREE.Mesh
}

function up(x: number, y: number, my = 0, mz = 0) {
  return p.set(x, -y + my * CO - mz * SI, my * SI + mz * CO)
}

function stand(mesh: THREE.InstancedMesh, i: number, x: number, y: number, size: number, lift = 0, turn = 0, roll = 0, pitch = 0, sy = 1, mz = 0) {
  up(x, y, lift, mz)
  q.copy(PQ).multiply(q2.setFromEuler(e.set(pitch, turn, roll)))
  mesh.setMatrixAt(i, m.compose(p, q, sc.set(size, size * sy, size)))
}

function blob(mesh: THREE.InstancedMesh, i: number, x: number, y: number, lift: number, size: number, c: THREE.Color, mz = 0) {
  up(x, y, lift, mz)
  mesh.setMatrixAt(i, m.compose(p, PQ, sc.setScalar(size)))
  mesh.setColorAt(i, c)
}

function glow(mesh: THREE.InstancedMesh, i: number, x: number, y: number, lift: number, size: number, c: THREE.Color, power: number, mz = 0) {
  up(x, y, lift, mz)
  p.z += 4
  mesh.setMatrixAt(i, m.compose(p, q.identity(), sc.set(size, size, 1)))
  mesh.setColorAt(i, col.copy(c).multiplyScalar(power))
}

const frac = (x: number) => x - Math.floor(x)
const ease = (x: number) => x * x * (3 - 2 * x)

function diggers(r: Rig, t: number, rush: number) {
  DIGGERS.forEach(({ at: [x, y], turn }, i) => {
    const ph = frac(t * (0.5 + hash(i) * 0.2) * (1 + rush * 1.5) + hash(i + 9))
    const down = ph < 0.5 ? Math.sin(ph * Math.PI * 2) : 0
    const toss = ph >= 0.5 ? Math.sin((ph - 0.5) * Math.PI * 2) : 0
    stand(r.digger, i, x, y, F, toss * 6, turn, -toss * 0.45, down * 0.35, 1 - down * 0.1 + toss * 0.06)
    for (let k = 0; k < 2; k++) {
      const s = frac(ph - 0.5 - k * 0.12) * 2
      const live = s < 1
      const dir = turn > 0 ? 1 : -1
      blob(r.puff, i * 2 + k, x + dir * (20 + s * 70), y - 10 + k * 8, 30 + Math.sin(s * Math.PI) * 55, live ? 11 * (1 - s * 0.6) : 0, SAND)
    }
  })
  stand(r.digger, DIGGERS.length, NAP[0], NAP[1], F, 0, 0.3, Math.PI / 2 - 0.15, 0, 1 + Math.sin(t * 1.3) * 0.05)
}

function workers(r: Rig, t: number) {
  let i = 0
  BRUSH.forEach(([x, y], k) => stand(r.worker, i++, x, y, F, 0, (k % 2 ? 1 : -1) * 0.4, Math.sin(t * (7 + k) + k) * 0.18, 0.4))
  const n = BUCKET.len
  for (let b = 0; b < 2; b++) {
    const s = frac(t / 7 + b * 0.5)
    along(BUCKET, s * n, at)
    blob(r.puff, DIGGERS.length * 2 + b, at.x, at.y, 34 + Math.abs(Math.sin(s * Math.PI * 8)) * 12, 14, WOODY)
  }
  CHAIN.forEach(([x, y], k) => {
    const near = Math.max(0, 1 - Math.hypot(at.x - x, at.y - y) / 90)
    stand(r.worker, i++, x, y, F, near * 8, 0.6, Math.sin(t * 2 + k) * 0.08 - near * 0.2)
  })
  const cyc = frac(t / 16)
  TUG.forEach(([x, y], k) => {
    const heave = Math.max(0, Math.sin(t * 2.6 - k * 0.25))
    const f = cyc * 16 - 12 - k * 0.12
    const fall = f > 0 ? (f < 0.5 ? ease(f / 0.5) : Math.max(0, 1 - (f - 0.5) / 2.5)) : 0
    stand(r.worker, i++, x - heave * 10 - fall * 22, y, F, fall * -4, -0.5, 0.32 + heave * 0.18 + fall * 1.05, 0, 1 - heave * 0.06)
  })
  WINCH.forEach(([x, y], k) => stand(r.worker, i++, x, y, F, Math.abs(Math.sin(t * 3 + k * Math.PI)) * 6, k ? -0.5 : 0.5, Math.sin(t * 3 + k) * 0.2))
  const hop = Math.abs(Math.sin(t * 4.2))
  stand(r.worker, i++, PROUD[0], PROUD[1], F, hop * 16, 0, Math.sin(t * 2.1) * 0.15)
  blob(r.puff, DIGGERS.length * 2 + 2, PROUD[0], PROUD[1], 50 + hop * 16, 9, BONE)
  stand(r.worker, i++, SELLER[0], SELLER[1], F * 0.9, 44 + Math.abs(Math.sin(t * 1.7)) * 4, 0, Math.sin(t * 0.9) * 0.12, 0, 1, 50)
  const [x0, y0] = ROD
  const [x1, y1] = TUG[TUG.length - 1]
  const len = Math.hypot(x1 - x0, y1 - y0)
  r.tug.position.set((x0 + x1) / 2, -(y0 + y1) / 2 + 12, 6)
  r.tug.rotation.set(0, 0, -Math.atan2(y1 - y0, x1 - x0))
  r.tug.scale.set(len, 5, 1)
}

function pilgrims(r: Rig, t: number, power: number) {
  for (let i = 0; i < PILGRIMS; i++) {
    const group = Math.floor(i / 3.5)
    const d = frac((t * 16 + group * 2100 + (i % 4) * 52 + hash(i) * 20) / LOOP.len) * LOOP.len
    along(LOOP, d, at)
    const sway = Math.sin(t * 2.4 + i * 1.7)
    stand(r.pilgrim, i, at.x, at.y, 26, Math.abs(sway) * 3, Math.cos(at.a) > 0 ? 0.5 : -0.5, sway * 0.08)
    glow(r.glow, i, at.x, at.y, 17, 34, FLAME, power * (0.8 + 0.2 * Math.sin(t * 11 + i)), 12)
  }
  for (let k = 0; k < KNEEL; k++) {
    const bow = Math.max(0, Math.sin(t * 0.8 + k * 2))
    const x = TIP[0] - 70 - k * 50
    const y = TIP[1] + 20 + k * 20
    stand(r.pilgrim, PILGRIMS + k, x, y, 26, 0, 0.9, 0, bow * 0.6, 0.9)
    glow(r.glow, PILGRIMS + k, x, y, 15, 34, FLAME, power, 12)
  }
}

function tourists(r: Rig, t: number) {
  const step = Math.floor(t / 4) + ease(Math.min(1, frac(t / 4) * 2.5))
  for (let i = 0; i < LINE; i++) {
    const d = frac((i + step) / LINE) * LINE * SPACING
    along(LINEUP, d, at)
    const edge = Math.min(1, d / 40, (LINE * SPACING - d) / 40)
    stand(r.tourist, i, at.x, at.y, F * Math.max(0, edge), Math.abs(Math.sin(t * 1.3 + i)) * 2, -0.3 + hash(i) * 0.6, Math.sin(t * 0.7 + i) * 0.1)
  }
  GAWK.forEach(([x, y], k) => {
    stand(r.tourist, LINE + k, x, y, F, 0, (k - 1) * 0.6, Math.sin(t * 0.6 + k * 2) * 0.25)
    const flash = Math.max(0, 1 - frac(t / (3.5 + k * 1.3) + k * 0.3) * 6)
    glow(r.glow, PILGRIMS + KNEEL + 11 + k, x, y, 10, 90, FLASH, flash, 18)
  })
}

function lamps(r: Rig, t: number, power: number) {
  const base = PILGRIMS + KNEEL
  for (let k = 0; k < 7; k++) glow(r.glow, base + k, SHRINE[0] - 85 + k * 28, SHRINE[1], 58, 40, FLAME, power * (0.75 + 0.25 * Math.sin(t * 9 + k * 3)), 25)
  for (const [k, sx] of [[0, -1], [1, 1]] as const) glow(r.glow, base + 7 + k, TENT[0] + sx * 294, TENT[1], 294, 80, FLAME, 0.9, 140)
  for (const [k, sx] of [[2, -1], [3, 1]] as const) glow(r.glow, base + 7 + k, -1230 + sx * 36, 610, 52, 34, FLAME, 0.8, 75)
  glow(r.glow, base + 7 + 4 + GAWK.length, TIP[0], TIP[1], 4, 170 + Math.sin(t * 1.4) * 30, LUCK, 0.55 + power * 0.25)
}

function crane(r: Rig, t: number) {
  const c = frac(t / 18) * 18
  const A = -0.25
  const B = 2.55
  let yaw = A
  let len = 1.5
  let full = true
  if (c < 3) len = 1.5 - ease(c / 3) * 0.85
  else if (c < 7) [yaw, len] = [A + (B - A) * ease((c - 3) / 4), 0.65]
  else if (c < 9) [yaw, len] = [B, 0.65 + ease((c - 7) / 2) * 0.55]
  else if (c < 10) [yaw, len, full] = [B, 1.2, c < 9.4]
  else if (c < 14) [yaw, len, full] = [B + (A - B) * ease((c - 10) / 4), 1.2 - ease((c - 10) / 4) * 0.4, false]
  else if (c < 17) [yaw, len, full] = [A, 0.8 + ease((c - 14) / 3) * 0.7, false]
  r.boom.rotation.y = yaw + Math.sin(t * 0.7) * 0.02
  r.rope.scale.set(0.03, len, 0.03)
  r.load.position.set(1.6, 0.25 - len, 0)
  r.load.rotation.y = Math.sin(t * 1.1) * 0.3
  r.load.scale.setScalar(full ? 0.4 : 0.0001)
}

function ghost(r: Rig, t: number, threat: number, zoom: number) {
  const w = (t / 70) * Math.PI * 2
  const rx = 2000 - threat * 800
  const ry = 1850 - threat * 500
  const x = -500 + threat * 400 + Math.cos(w) * rx
  const y = 150 + Math.sin(w) * ry
  const head = Math.atan2(Math.cos(w) * ry, -Math.sin(w) * rx)
  const alarm = Math.min(1, threat * 4)
  const fade = Math.min(1, Math.max(0, (0.42 - zoom) / 0.17))
  r.whale.visible = fade > 0
  r.whale.position.set(x, -y, 0.8)
  r.whale.rotation.z = -head + Math.sin(t * 1.6) * 0.06
  r.whale.scale.set(620, 620 * (1 + Math.sin(t * 0.8) * 0.03), 1)
  const mat = r.whale.material as THREE.MeshBasicMaterial
  mat.opacity = (0.36 + threat * 0.34) * fade
  mat.color.copy(TEAL).lerp(ALARM, alarm)
  const rib = r.ribbon.material as THREE.MeshBasicMaterial
  const sheen = 0.2 * Math.min(1, Math.max(0, (0.3 - zoom) / 0.15))
  rib.color.copy(BONE).lerp(MINT, alarm)
  rib.opacity = Math.max(sheen * (1 - alarm), threat * (0.55 + 0.35 * Math.sin(t * 2.2)))
  r.ribbon.visible = rib.opacity > 0.01
}

export function animate(r: Rig, t: number, zoom: number, threat: number) {
  const power = 0.85 + threat * 0.6
  diggers(r, t, threat)
  workers(r, t)
  pilgrims(r, t, power)
  tourists(r, t)
  lamps(r, t, power)
  crane(r, t)
  ghost(r, t, threat, zoom)
  const near = zoom > 0.1
  for (const mesh of [r.digger, r.worker, r.pilgrim, r.tourist, r.puff, r.glow]) {
    mesh.visible = near
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }
}
