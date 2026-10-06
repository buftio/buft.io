import * as THREE from 'three'
import { C, eye, eyes, fade, folk, merged, paint, part } from './kit'

const BLOBS: [number, number, number, number][] = [
  [0, 0.42, 0, 0.66],
  [-0.6, 0.3, 0.1, 0.48],
  [0.62, 0.32, -0.04, 0.52],
  [-0.22, 0.58, -0.3, 0.5],
  [0.28, 0.74, 0.12, 0.42],
  [-0.98, 0.16, 0, 0.32],
  [1.02, 0.18, 0.1, 0.34],
  [0.02, 0.26, 0.48, 0.44],
]

export function cloud() {
  const tone = (y: number, out: THREE.Color) => (y < 0.3 ? fade(C.lilac, C.blush, (y - 0.02) / 0.28, out) : fade(C.blush, C.cloud, (y - 0.3) / 0.35, out))
  const parts = BLOBS.map(([x, y, z, r]) => {
    const cut = Math.acos(Math.max(-1, (0.04 - y) / r))
    const g = new THREE.SphereGeometry(r, 16, Math.max(5, Math.round((cut / Math.PI) * 9)), 0, Math.PI * 2, 0, cut)
    g.translate(x, y, z)
    return paint(g, (_x, y, _z, out) => tone(y, out))
  })
  return merged(parts)
}

export function fluff() {
  const parts: THREE.BufferGeometry[] = []
  for (const [x, y, z, r] of [[0, 0, 0, 0.62], [-0.45, -0.1, 0.2, 0.42], [0.45, -0.08, 0.15, 0.45], [0.1, 0.35, -0.1, 0.42], [-0.2, 0.15, 0.45, 0.36]])
    parts.push(paint(new THREE.SphereGeometry(r, 9, 6).translate(x, y, z), (_x, yy, _z, out) => fade(C.lilac, C.cloud, (yy + 0.5) / 0.9, out)))
  return merged(parts)
}

export function whale(rider: boolean) {
  const p: THREE.BufferGeometry[] = []
  const body = new THREE.SphereGeometry(1, 26, 16)
  body.scale(1.65, 0.8, 0.85)
  const pos = body.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    if (x < 0) {
      const k = 1 + (x / 1.65) * 0.42
      pos.setY(i, pos.getY(i) * k)
      pos.setZ(i, pos.getZ(i) * k)
    }
  }
  p.push(paint(body, (x, y, z, out) => {
    fade(C.belly, C.whale, (y + 0.1) / 0.45, out)
    if (Math.abs(z) > 0.45 && y > -0.2 && y < 0.15 && Math.abs(x - 0.95) < 0.22) out.set(C.cheek)
  }))
  for (const s of [-1, 1]) {
    const fin = new THREE.SphereGeometry(0.5, 14, 8).scale(0.55, 0.1, 0.5)
    fin.translate(0, 0, 0.25)
    fin.rotateY(s > 0 ? -0.6 : Math.PI + 0.6)
    fin.rotateX(s * 0.35)
    p.push(part(fin, C.whale, 0.45, -0.4, s * 0.62))
  }
  for (const [x, z] of [[-0.1, 0], [0.25, 0], [-0.45, 0]]) p.push(part(new THREE.SphereGeometry(0.13, 8, 5).scale(1, 0.6, 1), C.belly, x, 0.72 - Math.abs(x) * 0.1, z))
  eye(p, 1.08, 0.16, 0.56, 0.2, 0.55)
  eye(p, 1.08, 0.16, -0.56, 0.2, Math.PI - 0.55)
  for (const s of [-1, 1]) p.push(part(new THREE.TorusGeometry(0.24, 0.03, 4, 12, Math.PI * 0.6).rotateZ(Math.PI * 1.2), C.ink, 1.22, 0.02, s * 0.5))
  if (rider) {
    p.push(part(new THREE.CylinderGeometry(0.42, 0.46, 0.12, 14), C.teal, 0.05, 0.8, 0))
    p.push(part(new THREE.TorusGeometry(0.44, 0.05, 5, 16).rotateX(Math.PI / 2), C.gold, 0.05, 0.86, 0))
    folk(p, 0.05, 0.85, 0, 0.42, C.coral, Math.PI / 2)
    p.push(part(new THREE.CylinderGeometry(0.015, 0.015, 0.5, 4).rotateZ(-0.3), C.ink, 0.25, 1.1, 0.1))
    p.push(part(new THREE.SphereGeometry(0.07, 6, 4), C.coral, 0.33, 1.36, 0.1))
  }
  return merged(p)
}

export function tail() {
  const p: THREE.BufferGeometry[] = []
  const stem = new THREE.ConeGeometry(0.42, 1.1, 12).rotateZ(Math.PI / 2)
  p.push(paint(stem.translate(-0.45, 0, 0), (_x, y, _z, out) => fade(C.belly, C.whale, (y + 0.05) / 0.3, out)))
  for (const s of [-1, 1]) {
    const lobe = new THREE.SphereGeometry(0.5, 12, 6).scale(0.6, 0.08, 1.05)
    lobe.rotateY(s * 0.5)
    p.push(part(lobe, C.whale, -0.98, 0.02, s * 0.36))
  }
  return merged(p)
}

function envelope(p: THREE.BufferGeometry[], len: number, r: number, main: string, top: string, band: string, bands: number[]) {
  const n = 28
  const radius = (x: number) => r * Math.sqrt(Math.max(0, 1 - (x < 0 ? x / (len * 1.15) : x / len) ** 2))
  const pts = Array.from({ length: n + 1 }, (_, k) => {
    const x = -len * 1.15 + (k / n) * len * 2.15
    return new THREE.Vector2(Math.max(0.001, radius(x)), x)
  })
  const g = new THREE.LatheGeometry(pts, 18).rotateZ(-Math.PI / 2)
  p.push(paint(g, (_x, y, _z, out) => fade(main, top, (y / r) * 0.9 + 0.1, out)))
  for (const b of bands) p.push(part(new THREE.TorusGeometry(radius(b) * 1.015, 0.045, 4, 18).rotateY(Math.PI / 2), band, b, 0, 0))
}

function fins(p: THREE.BufferGeometry[], x: number, r: number, color: string) {
  const fin = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.7, 0), new THREE.Vector2(-0.75, 0.55), new THREE.Vector2(-0.3, 0.55)])
  for (let k = 0; k < 4; k++) {
    const g = new THREE.ExtrudeGeometry(fin, { depth: 0.04, bevelEnabled: false }).translate(0, r * 0.3, -0.02)
    g.rotateX((k * Math.PI) / 2)
    p.push(part(g, color, x, 0, 0))
  }
}

function ropes(p: THREE.BufferGeometry[], top: number, bottom: number, xs: number[], spread: number) {
  for (const x of xs)
    for (const s of [-1, 1]) {
      const h = top - bottom
      const g = new THREE.CylinderGeometry(0.015, 0.015, h, 3)
      g.rotateX(s * Math.atan2(spread, h))
      p.push(part(g, C.ink, x, bottom + h / 2, s * spread * 0.5))
    }
}

export function trawler() {
  const p: THREE.BufferGeometry[] = []
  envelope(p, 1.8, 0.6, C.apricot, C.peach, C.teal, [-1.0, -0.15, 0.7])
  fins(p, -1.32, 0.6, C.teal)
  p.push(part(new THREE.SphereGeometry(0.12, 8, 6), C.brass, 2.0, 0, 0))
  p.push(part(new THREE.BoxGeometry(1.15, 0.28, 0.42), C.wood, 0.1, -0.95, 0))
  p.push(part(new THREE.BoxGeometry(1.2, 0.05, 0.46), C.plank, 0.1, -0.8, 0))
  p.push(part(new THREE.ConeGeometry(0.21, 0.4, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4), C.wood, 0.85, -0.95, 0))
  ropes(p, -0.5, -0.8, [-0.35, 0.55], 0.3)
  folk(p, -0.25, -0.86, 0, 0.3, C.teal, Math.PI / 2)
  folk(p, 0.35, -0.86, 0.05, 0.3, C.coral, 0.4)
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4), C.ink, -0.4, -0.56, -0.1))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.38, -0.08), new THREE.Vector2(0, -0.17)])), C.mint, -0.42, -0.32, -0.1))
  for (const s of [-1, 1]) eyes(p, 1.15, 0.1, s * 0.43, 0.19, 0.13, s > 0 ? 0 : Math.PI)
  return merged(p)
}

export function lookout() {
  const p: THREE.BufferGeometry[] = []
  envelope(p, 1.5, 0.48, C.sky, C.cream, C.coral, [-0.8, 0.5])
  fins(p, -1.05, 0.48, C.coral)
  p.push(part(new THREE.CylinderGeometry(0.2, 0.15, 0.25, 10), C.brass, 0.05, -0.7, 0))
  p.push(part(new THREE.TorusGeometry(0.2, 0.025, 4, 12).rotateX(Math.PI / 2), C.teal, 0.05, -0.58, 0))
  ropes(p, -0.4, -0.6, [0.05], 0.22)
  folk(p, 0.05, -0.68, 0, 0.3, C.teal, Math.PI / 2)
  p.push(part(new THREE.CylinderGeometry(0.045, 0.07, 0.45, 8).rotateZ(Math.PI / 2 - 0.3), C.brass, 0.35, -0.38, 0.05))
  p.push(part(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 4), C.ink, 0, 0.72, 0))
  p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-0.4, -0.09), new THREE.Vector2(0, -0.18)])), C.teal, -0.02, 1.02, 0))
  for (const s of [-1, 1]) eyes(p, 0.95, 0.08, s * 0.35, 0.15, 0.1, s > 0 ? 0 : Math.PI)
  return merged(p)
}

export function propeller() {
  const p: THREE.BufferGeometry[] = []
  p.push(part(new THREE.BoxGeometry(0.03, 0.62, 0.1), C.ink, 0, 0, 0))
  p.push(part(new THREE.BoxGeometry(0.03, 0.1, 0.62), C.ink, 0, 0, 0))
  p.push(part(new THREE.SphereGeometry(0.06, 6, 4), C.brass, 0, 0, 0))
  return merged(p)
}

export function balloon() {
  const p: THREE.BufferGeometry[] = []
  const env = new THREE.SphereGeometry(1, 20, 14)
  const pos = env.getAttribute('position')
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y < 0) {
      const k = 1 + y * 0.62
      pos.setX(i, pos.getX(i) * k)
      pos.setZ(i, pos.getZ(i) * k)
      pos.setY(i, y * 1.15)
    }
  }
  env.translate(0, 2.2, 0)
  p.push(paint(env, (x, y, z, out) => {
    const g = Math.floor(((Math.atan2(z, x) + Math.PI) / (Math.PI * 2)) * 12)
    out.set(y > 2.95 ? C.teal : g % 2 ? C.coral : C.cream)
  }))
  ropes(p, 1.15, 0.45, [-0.18, 0.18], 0.36)
  p.push(part(new THREE.CylinderGeometry(0.34, 0.28, 0.42, 10), C.wood, 0, 0.21, 0))
  p.push(part(new THREE.TorusGeometry(0.34, 0.04, 4, 12).rotateX(Math.PI / 2), C.plank, 0, 0.42, 0))
  p.push(part(new THREE.CylinderGeometry(0.1, 0.13, 0.14, 8), C.brass, 0, 0.95, 0))
  folk(p, 0.08, 0.28, 0.06, 0.32, C.teal, 0)
  for (const [x, z] of [[-0.3, 0.1], [0.32, -0.05], [0.28, 0.2]]) p.push(part(new THREE.CylinderGeometry(0.06, 0.06, 0.14, 6), C.gold, x, 0.08, z))
  return merged(p)
}

export function flame() {
  const g = new THREE.ConeGeometry(0.13, 0.42, 8)
  g.translate(0, 0.21, 0)
  return paint(g, (_x, y, _z, out) => fade(C.gold, C.white, y / 0.42, out))
}

export function puff() {
  return paint(new THREE.IcosahedronGeometry(1, 1), (_x, y, _z, out) => fade(C.lilac, C.cloud, (y + 0.6) / 1.2, out))
}

export function shadowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const x = c.getContext('2d')
  if (x) {
    const g = x.createRadialGradient(32, 32, 2, 32, 32, 31)
    g.addColorStop(0, 'rgba(70,60,110,0.55)')
    g.addColorStop(0.55, 'rgba(70,60,110,0.3)')
    g.addColorStop(1, 'rgba(70,60,110,0)')
    x.fillStyle = g
    x.fillRect(0, 0, 64, 64)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
