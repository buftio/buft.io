import * as THREE from 'three'
import { C, eyes, merged, part, path, rand, rod, stand, top } from './kit'
import { CAMP, CART, FIRE, GATE, HEAP, PASTEL, POST, QUEUE, RING, STALL, TENTS, TOWER } from './place'

const ROWS = 5
const RED = ['#d81b4a', '#e83a5e', '#b5123d', '#ff5470', '#c2184a']

export function heap() {
  const r = rand(7)
  const parts: THREE.BufferGeometry[] = []
  for (let i = 0; i < 150; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r())
    const x = HEAP.x + Math.cos(a) * d * HEAP.rx
    const y = HEAP.y + Math.sin(a) * d * HEAP.ry
    const z = 8 + 46 * (1 - d * d) + r() * 10
    const ball = part(new THREE.SphereGeometry(13 + r() * 6, 7, 5), RED[i % RED.length])
    parts.push(ball.translate(x, -y, z))
  }
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r()) * 0.9
    const coin = new THREE.CylinderGeometry(10, 10, 3, 10).rotateX(Math.PI / 2 + (r() - 0.5) * 0.8)
    const x = HEAP.x + Math.cos(a) * d * HEAP.rx
    const y = HEAP.y + Math.sin(a) * d * HEAP.ry
    parts.push(part(coin, i % 3 ? C.gold : C.deep).translate(x, -y, 30 + 50 * (1 - d * d)))
  }
  return merged(parts)
}

export function flat() {
  const ring = part(new THREE.RingGeometry(0.93, 1.07, 120), '#fff4dc')
  const col = ring.getAttribute('color') as THREE.BufferAttribute
  const teal = new THREE.Color(C.flag)
  for (let t = 0; t < col.count; t += 6) if ((t / 6) % 4 < 1) for (let j = 0; j < 6; j++) col.setXYZ(t + j, teal.r, teal.g, teal.b)
  ring.scale(RING.rx, RING.ry, 1).translate(RING.x, -RING.y, 3)
  const parts = [ring]
  for (let i = 1; i < QUEUE.length; i++) {
    const [ax, ay] = QUEUE[i - 1]
    const [bx, by] = QUEUE[i]
    const len = Math.hypot(bx - ax, by - ay)
    const g = part(new THREE.PlaneGeometry(len + 44, 44), '#ffd98a')
    g.rotateZ(Math.atan2(-(by - ay), bx - ax)).translate((ax + bx) / 2, -(ay + by) / 2, 2)
    parts.push(g)
  }
  return merged(parts)
}

export function poles() {
  const out: [number, number][] = []
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2
    out.push([RING.x + Math.cos(a) * RING.rx * 1.13, RING.y + Math.sin(a) * RING.ry * 1.13])
  }
  return out
}

function stanchions(parts: THREE.BufferGeometry[]) {
  for (let i = 1; i < QUEUE.length - 1; i++) {
    const [ax, ay] = QUEUE[i - 1]
    const [bx, by] = QUEUE[i]
    const len = Math.hypot(bx - ax, by - ay)
    const n = Math.max(1, Math.round(len / 90))
    const nx = -(by - ay) / len
    const ny = (bx - ax) / len
    for (const side of [-1, 1]) {
      let prev: THREE.Vector3 | null = null
      for (let k = 0; k <= n; k++) {
        const x = ax + ((bx - ax) * k) / n + nx * 30 * side
        const y = ay + ((by - ay) * k) / n + ny * 30 * side
        parts.push(stand(part(new THREE.CylinderGeometry(2.5, 3.5, 30, 5), C.deep, 0, 15), x, y))
        parts.push(stand(part(new THREE.SphereGeometry(5, 6, 4), C.gold, 0, 31), x, y))
        const t = top(x, y, 26)
        if (prev) parts.push(rod(prev, t, 2, C.roof))
        prev = t
      }
    }
  }
}

function tent(x: number, y: number, color: string, turn: number) {
  const g = part(new THREE.ConeGeometry(70, 120, 12, 1), color, 0, 60)
  const pos = g.getAttribute('position')
  const col = g.getAttribute('color') as THREE.BufferAttribute
  const w = new THREE.Color(C.stone)
  for (let t = 0; t < pos.count; t += 3) {
    const cx = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3
    const cz = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3
    if (Math.floor(((Math.atan2(cz, cx) + Math.PI) / (Math.PI * 2)) * 12) % 2)
      for (let j = 0; j < 3; j++) col.setXYZ(t + j, w.r, w.g, w.b)
  }
  const door = part(new THREE.ConeGeometry(22, 60, 3, 1), C.ink, 0, 30, 52)
  const pole = part(new THREE.CylinderGeometry(2, 2, 50, 4), C.ink, 0, 140)
  const flag = part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(34, -8), new THREE.Vector2(0, -16)])), C.roof, 2, 164)
  return [g, door, pole, flag].map((p) => stand(p, x, y, 1, turn))
}

function stall() {
  const p: THREE.BufferGeometry[] = [
    part(new THREE.BoxGeometry(160, 56, 60), C.wall, 0, 28),
    part(new THREE.BoxGeometry(170, 8, 66), C.wood, 0, 58),
  ]
  for (const sx of [-78, 78]) p.push(part(new THREE.CylinderGeometry(4, 4, 130, 5), C.wood, sx, 65, 26))
  for (let k = 0; k < 6; k++)
    p.push(part(new THREE.BoxGeometry(30, 6, 90).rotateX(-0.45), k % 2 ? C.stone : C.roof, -75 + k * 30, 132, 4))
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(11, 11, 4, 10), C.gold, -30 + (k % 2) * 4, 64 + k * 5, 10))
  for (let k = 0; k < 3; k++) p.push(part(new THREE.CylinderGeometry(11, 11, 4, 10), C.deep, 30, 64 + k * 5, 14))
  p.push(part(new THREE.SphereGeometry(22, 10, 8), C.folk, 0, 76, -14))
  p.push(part(new THREE.CylinderGeometry(16, 16, 22, 10), C.ink, 0, 104, -14))
  p.push(part(new THREE.CylinderGeometry(24, 24, 3, 12), C.ink, 0, 94, -14))
  eyes(p, 80, 2, 8, 7)
  return p.map((g) => stand(g, STALL.x, STALL.y))
}

function gate() {
  const p: THREE.BufferGeometry[] = []
  for (const sx of [-58, 58]) p.push(part(new THREE.CylinderGeometry(14, 17, 120, 8), C.stone, sx, 60))
  p.push(part(new THREE.BoxGeometry(150, 20, 26), C.roof, 0, 128))
  p.push(part(new THREE.CylinderGeometry(20, 20, 6, 14).rotateX(Math.PI / 2), C.gold, 0, 154, 0))
  p.push(part(new THREE.BoxGeometry(8, 8, 8), C.ink, 0, 154, 4))
  return p.map((g) => stand(g, GATE.x, GATE.y))
}

function tower() {
  const { h, board } = TOWER
  const p: THREE.BufferGeometry[] = []
  for (const sx of [-26, 26]) p.push(part(new THREE.CylinderGeometry(5, 6, h, 5), C.stone, sx, h / 2))
  for (let y = 24; y < h; y += 30) p.push(part(new THREE.BoxGeometry(52, 4, 4), C.wood, 0, y, 6))
  p.push(part(new THREE.BoxGeometry(64, 8, 40), C.roof, 0, h, -6))
  p.push(part(new THREE.BoxGeometry(30, 7, board), '#ff5470', 0, h + 2, -board / 2 - 12))
  p.push(part(new THREE.BoxGeometry(30, 6, 6), C.roof, 0, h + 2, -board - 12))
  for (const sx of [-30, 30]) p.push(part(new THREE.CylinderGeometry(2, 2, 40, 4), C.ink, sx, h + 22, 8))
  return p.map((g) => stand(g, TOWER.x, TOWER.y))
}

function cart() {
  const p: THREE.BufferGeometry[] = [
    part(new THREE.BoxGeometry(120, 50, 60), '#ffb3c7', 0, 40),
    part(new THREE.BoxGeometry(128, 8, 66), C.gold, 0, 68),
    part(new THREE.BoxGeometry(128, 6, 66), C.gold, 0, 16),
  ]
  for (const sx of [-42, 42]) p.push(part(new THREE.TorusGeometry(16, 4, 4, 12), C.wood, sx, 16, 33))
  p.push(part(new THREE.CylinderGeometry(3, 3, 120, 5), C.ink, 20, 128))
  const top = part(new THREE.ConeGeometry(78, 34, 12, 1, true), '#ff5c8a', 20, 200)
  const col = top.getAttribute('color') as THREE.BufferAttribute
  const w = new THREE.Color(C.stone)
  for (let t = 0; t < col.count; t += 6) if ((t / 6) % 2) for (let j = 0; j < 6; j++) col.setXYZ(t + j, w.r, w.g, w.b)
  p.push(top)
  for (let k = 0; k < 4; k++) {
    p.push(part(new THREE.CylinderGeometry(1.5, 1.5, 34, 4), C.stone, -36 + k * 15, 88, -6 + (k % 2) * 10))
    p.push(part(new THREE.SphereGeometry(13, 8, 6), k % 2 ? '#ff9ec4' : '#c8a8ff', -36 + k * 15, 108, -6 + (k % 2) * 10))
  }
  p.push(part(new THREE.SphereGeometry(20, 10, 8).scale(1, 1.1, 1), C.folk, 92, 22, 4))
  p.push(part(new THREE.CylinderGeometry(14, 15, 10, 10), C.roof, 92, 48, 4))
  p.push(part(new THREE.CylinderGeometry(21, 21, 3, 12), C.flag, 92, 44, 8))
  eyes(p, 27, 18, 7, 6.5)
  return p.map((g, i) => stand(i >= p.length - 4 ? g.translate(92, 0, 4) : g, CART.x, CART.y, 1, 0.25))
}

export function props(tops: [number, number][]) {
  const parts: THREE.BufferGeometry[] = []
  for (const [x, y] of tops) {
    parts.push(stand(part(new THREE.CylinderGeometry(3, 4, 110, 5), C.wood, 0, 55), x, y))
    parts.push(stand(part(new THREE.SphereGeometry(7, 6, 4), C.gold, 0, 112), x, y))
  }
  stanchions(parts)
  TENTS.forEach(([x, y, c], k) => parts.push(...tent(x, y, c, (k % 3) * 0.3 - 0.3)))
  for (const t of [0.6, -0.6]) parts.push(stand(part(new THREE.CylinderGeometry(6, 6, 70, 5).rotateZ(Math.PI / 2), C.wood, 0, 6, 0, t), FIRE.x, FIRE.y))
  parts.push(stand(part(new THREE.CylinderGeometry(4, 5, 100, 5), C.wood, 0, 50), POST.x, POST.y))
  parts.push(...stall(), ...gate(), ...tower(), ...cart())
  return merged(parts)
}

export { CAMP }

export function folk(hat: 'hood' | 'cap' | 'top' | 'none') {
  const p: THREE.BufferGeometry[] = [part(new THREE.SphereGeometry(1, 8, 6).scale(1, 1.1, 1), C.folk, 0, 1.1)]
  eyes(p, 1.35, 0.72, 0.36, 0.33)
  if (hat === 'hood') {
    p.push(part(new THREE.CylinderGeometry(0.07, 0.07, 3.1, 4), C.wood, 1.15, 1.5, 0.1))
    p.push(part(new THREE.SphereGeometry(0.2, 6, 4), C.gold, 1.15, 3.1, 0.1))
  }
  if (hat === 'cap') {
    p.push(part(new THREE.SphereGeometry(0.95, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), '#ff5470', 0, 1.75))
    p.push(part(new THREE.TorusGeometry(0.62, 0.1, 4, 10), C.flag, 0, 1.35, 0.5))
  }
  if (hat === 'top') {
    p.push(part(new THREE.CylinderGeometry(0.62, 0.62, 0.9, 10), C.ink, 0, 2.55))
    p.push(part(new THREE.CylinderGeometry(1, 1, 0.08, 12), C.ink, 0, 2.12))
    p.push(part(new THREE.CylinderGeometry(0.64, 0.64, 0.18, 10), C.deep, 0, 2.3))
  }
  return merged(p)
}

export function hood() {
  const g = new THREE.ConeGeometry(0.78, 1.5, 8).translate(0, 2.55, -0.05)
  const brim = new THREE.CylinderGeometry(1.05, 1.05, 0.1, 10).translate(0, 1.85, 0)
  const parts = [part(g, C.white), part(brim, C.white)]
  return merged(parts)
}

export function signTexture() {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 256
  const x = cv.getContext('2d')!
  const rows = ['THE RING WELL', 'QUEUE: 3 MOONS', 'LUCKY COINS · 1 FAT', 'NO DIVING', 'FROM HERE: 2 MOONS']
  const hh = 256 / ROWS
  rows.forEach((t, k) => {
    x.fillStyle = C.ink
    x.fillRect(0, k * hh, 256, hh)
    x.fillStyle = k === 3 ? '#ffd9df' : k === 4 ? '#fff1c2' : C.stone
    x.fillRect(4, k * hh + 4, 248, hh - 8)
    x.fillStyle = k === 3 ? '#d81b4a' : C.ink
    let px = 30
    do x.font = `bold ${px--}px Georgia, serif`
    while (x.measureText(t).width > 232)
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText(t, 128, k * hh + hh / 2 + 2)
  })
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function signPlane(row: number, w: number) {
  const g = new THREE.PlaneGeometry(w, (w / 256) * (256 / ROWS))
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (row + (1 - uv.getY(i))) / ROWS)
  return g
}

export const queuePath = path(QUEUE)
export { PASTEL }
