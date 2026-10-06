'use client'

import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { ISLES, size } from './isles'
import { C, bake, barrel, eyes, folk, hut, lighthouse, merged, palm, part, umbrella } from './kit'
import { BEACH, BRIDGES, CASTLE, HAMMOCK, LIGHT, QUAY, SPECIAL, STOP, WAIT, WORKS, rng, span } from './plan'

type G = THREE.BufferGeometry[]

function stood(out: G, dx: number, dy: number, build: (p: G) => void, s = 1, turn = 0) {
  const parts: G = []
  build(parts)
  out.push(bake(merged(parts), dx, dy, s, turn))
}

function bridge(out: G, a: number, b: number) {
  const [[x0, y0], [x1, y1]] = span(a, b, 14)
  const len = Math.hypot(x1 - x0, y1 - y0)
  const ang = Math.atan2(-(y1 - y0), x1 - x0)
  const sag = 12 * Math.abs(Math.cos(ang))
  const n = Math.max(3, Math.round(len / 11))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const drop = Math.sin(t * Math.PI) * sag
    out.push(part(new THREE.PlaneGeometry(6, 26), i % 2 ? C.wood : C.trunk, x0 + (x1 - x0) * t, -(y0 + (y1 - y0) * t) - drop, 6, 0, ang))
  }
  for (const side of [-1, 1]) {
    const nx = -Math.sin(ang) * 15 * side
    const ny = Math.cos(ang) * 15 * side
    for (let i = 0; i < 8; i++) {
      const t0 = i / 8
      const t1 = (i + 1) / 8
      const p0 = [x0 + (x1 - x0) * t0 + nx, -(y0 + (y1 - y0) * t0) - Math.sin(t0 * Math.PI) * sag + ny]
      const p1 = [x0 + (x1 - x0) * t1 + nx, -(y0 + (y1 - y0) * t1) - Math.sin(t1 * Math.PI) * sag + ny]
      const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      out.push(part(new THREE.PlaneGeometry(l + 1, 2.4), C.ink, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 8, 0, Math.atan2(p1[1] - p0[1], p1[0] - p0[0])))
    }
    for (const [px, py] of [[x0, y0], [x1, y1]])
      stood(out, px - nx, py + ny, (p) => p.push(part(new THREE.CylinderGeometry(2.6, 3, 26, 5), C.trunk, 0, 13, 0)))
  }
}

function village(out: G, k: number, roll: () => number) {
  const [x, y] = ISLES[k]
  const r = size(ISLES[k])
  const pick = roll()
  const spot = (f: number): [number, number] => {
    const a = roll() * Math.PI * 2
    return [x + Math.cos(a) * r * f, y + Math.sin(a) * r * f * 0.8 + r * 0.12]
  }
  const tree = (f: number, h = 70) => stood(out, ...spot(f), (p) => palm(p, 0, 0, h + roll() * 40, (roll() - 0.5) * 0.9))
  if (r < 70) {
    if (pick < 0.45) tree(0.1, 55)
    return
  }
  if (pick < 0.28) return
  if (pick < 0.5) {
    tree(0.3)
    tree(0.45)
    return
  }
  const roof = roll() < 0.3 ? C.teal : C.thatch
  stood(out, ...spot(0.15), (p) => hut(p, 0, 0, 0.9 + roll() * 0.4, roof))
  tree(0.6)
  if (r > 150 && pick > 0.75) {
    stood(out, ...spot(0.5), (p) => hut(p, 0, 0, 0.8, roll() < 0.5 ? C.coral : C.thatch))
    tree(0.55)
  }
}

function hammock(out: G, k: number) {
  const [x, y] = ISLES[k]
  stood(out, x, y + 10, (p) => {
    palm(p, -46, 0, 95, -0.35)
    palm(p, 46, 0, 90, 0.35)
    const sling = new THREE.TorusGeometry(42, 3, 4, 12, Math.PI)
    p.push(part(sling, C.coral, 0, 58, 0, 0, Math.PI))
    folk(p, 0, 12, 4, '', 12)
    p.push(part(new THREE.BoxGeometry(10, 2, 2), C.ink, -5, 30.5, 14.8))
    p.push(part(new THREE.BoxGeometry(10, 2, 2), C.ink, 5, 30.5, 14.8))
  })
}

function sandcastle(out: G, k: number) {
  const [x, y] = ISLES[k]
  stood(out, x + 10, y + 20, (p) => {
    p.push(part(new THREE.BoxGeometry(46, 16, 30), C.sand, 0, 8, 0))
    for (const s of [-1, 1]) {
      p.push(part(new THREE.CylinderGeometry(8, 9, 30, 6), C.sand, s * 24, 15, 10))
      p.push(part(new THREE.ConeGeometry(9, 12, 6), C.thatch, s * 24, 36, 10))
    }
    p.push(part(new THREE.CylinderGeometry(0.8, 0.8, 24, 3), C.ink, 24, 52, 10))
    p.push(part(new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(12, -4), new THREE.Vector2(0, -8)])), C.coral, 24, 64, 10))
    folk(p, -42, 0, 18, C.coral, 10)
    p.push(part(new THREE.CylinderGeometry(5, 4, 8, 6), C.coral, -26, 4, 22))
  })
}

function stop(out: G) {
  const [x, y] = ISLES[STOP]
  stood(out, x + 30, y + 52, (p) => {
    p.push(part(new THREE.BoxGeometry(34, 4, 120), C.wood, 0, 4, 40))
    for (const [px, pz] of [[-15, 0], [15, 0], [-15, 95], [15, 95]]) p.push(part(new THREE.CylinderGeometry(3, 3, 16, 5), C.trunk, px, 2, pz))
    p.push(part(new THREE.CylinderGeometry(2, 2, 40, 5), C.trunk, 14, 20, 98))
    p.push(part(new THREE.TorusGeometry(7, 2.6, 4, 10), C.coral, 14, 34, 101))
  })
  stood(
    out,
    x - 26,
    y - 6,
    (p) => {
      for (const s of [-1, 1]) p.push(part(new THREE.CylinderGeometry(2.6, 2.6, 92, 5), C.trunk, s * 46, 46, -1))
      p.push(part(new THREE.BoxGeometry(104, 56, 3), C.ink, 0, 66, -3))
      p.push(part(new THREE.CylinderGeometry(19, 19, 3, 16), C.ink, 0, 112, -2, 0, 0, Math.PI / 2))
      p.push(part(new THREE.CylinderGeometry(16, 16, 3, 16), C.stone, 0, 112, -1.4, 0, 0, Math.PI / 2))
      p.push(part(new THREE.ConeGeometry(10, 10, 4), C.teal, 0, 136, -2, Math.PI / 4))
      eyes(p, 132, 2, 6, 3.5)
    },
    1.5,
  )
  stood(out, x - 62, y + 26, (p) => {
    p.push(part(new THREE.BoxGeometry(40, 4, 12), C.wood, 0, 12, 0))
    for (const s of [-1, 1]) p.push(part(new THREE.BoxGeometry(3, 12, 10), C.trunk, s * 16, 6, 0))
  })
}

function waiter(out: G) {
  const [x, y] = ISLES[WAIT]
  stood(out, x - 4, y + 8, (p) => {
    folk(p, 0, 0, 0, C.navy, 13)
    p.push(part(new THREE.ConeGeometry(8, 20, 6), C.white, 0, 9, 13, 0, 0, Math.PI))
    const puddle = new THREE.CircleGeometry(1, 9)
    puddle.scale(9, 22, 1)
    p.push(part(puddle, C.white, 0, 0.6, 30, 0, 0, -Math.PI / 2))
    p.push(part(new THREE.BoxGeometry(18, 13, 7), C.case, 20, 6.5, 4))
    p.push(part(new THREE.TorusGeometry(3.5, 1, 3, 6, Math.PI), C.ink, 20, 13, 4))
    p.push(part(new THREE.CylinderGeometry(1.6, 1.6, 50, 4), C.trunk, -22, 25, -6))
  })
}

function works(out: G, roll: () => number) {
  const [x, y] = ISLES[WORKS]
  for (let i = 0; i < 9; i++) {
    const row = Math.floor(i / 3)
    stood(out, x - 70 + (i % 3) * 18 + row * 9, y + 40 - row * 2, (p) => barrel(p, 0, row * 15, 0, 1.1), 1)
  }
  stood(out, x + 40, y - 30, (p) => {
    p.push(part(new THREE.BoxGeometry(14, 120, 14), C.wood, 0, 60, 0))
    p.push(part(new THREE.BoxGeometry(130, 8, 8), C.wood, 40, 120, 0))
    p.push(part(new THREE.BoxGeometry(30, 18, 18), C.stone, -18, 114, 0))
    p.push(part(new THREE.CylinderGeometry(0.8, 0.8, 50, 3), C.ink, 98, 95, 0))
    barrel(p, 98, 52, 0, 1.2)
    eyes(p, 114, 10, 6, 3.6, -18)
  })
  stood(out, x + 70, y + 70, (p) => hut(p, 0, 0, 1.2, C.coral))
  stood(out, x - 110, y - 40, (p) => palm(p, 0, 0, 90 + roll() * 20, 0.3))
}

function quay(out: G) {
  const [x, y] = ISLES[QUAY]
  stood(out, x - 60, y + 20, (p) => {
    p.push(part(new THREE.CylinderGeometry(2.6, 2.6, 70, 5), C.trunk, 0, 35, -2))
    for (let i = 0; i < 4; i++) barrel(p, 24 + (i % 2) * 18, Math.floor(i / 2) * 16, 10 - (i % 2) * 6)
  })
  stood(out, x + 40, y - 30, (p) => hut(p, 0, 0, 1.3, C.teal))
  stood(out, x + 90, y + 50, (p) => palm(p, 0, 0, 110, -0.4))
}

function beach(out: G, roll: () => number) {
  const [x, y] = ISLES[BEACH]
  const tones = [C.coral, C.teal, C.gold, C.white]
  for (let i = 0; i < 4; i++) stood(out, x - 70 + i * 48, y + 20 + (i % 2) * 40, (p) => umbrella(p, 0, 0, tones[i]))
  for (let i = 0; i < 3; i++)
    stood(out, x - 50 + i * 50, y + 62, (p) => {
      p.push(part(new THREE.BoxGeometry(30, 3, 14), C.stone, 0, 6, 0, 0, 0.25))
      folk(p, 2, 6, 0, roll() < 0.5 ? C.gold : '', 12)
    })
  stood(out, x + 80, y - 40, (p) => palm(p, 0, 0, 100, -0.3))
}

export function propsGeometry() {
  const out: G = []
  const roll = rng(91)
  ISLES.forEach((_, k) => {
    if (!SPECIAL.has(k)) village(out, k, roll)
  })
  hammock(out, HAMMOCK)
  sandcastle(out, CASTLE)
  BRIDGES.forEach(([a, b]) => bridge(out, a, b))
  out.push(bake(lighthouse(), ISLES[LIGHT][0], ISLES[LIGHT][1] + 30))
  stood(out, ISLES[LIGHT][0] + 70, ISLES[LIGHT][1] + 40, (p) => palm(p, 0, 0, 80, 0.5))
  stop(out)
  waiter(out)
  works(out, roll)
  quay(out)
  beach(out, roll)
  return merged(out)
}

function atlas() {
  const cv = document.createElement('canvas')
  cv.width = cv.height = 256
  const g = cv.getContext('2d')
  if (!g) return new THREE.CanvasTexture(cv)
  g.fillStyle = '#1d4a6b'
  g.fillRect(0, 0, 256, 128)
  g.fillStyle = '#fffaf0'
  g.font = 'bold 26px sans-serif'
  g.textAlign = 'center'
  g.fillText('FERRIES', 128, 30)
  g.font = 'bold 19px monospace'
  const rows = ['08:00  09:15', '10:30  11:45', '13:00  14:20']
  rows.forEach((r, i) => g.fillText(r, 128, 58 + i * 22))
  g.strokeStyle = '#ff6b5e'
  g.lineWidth = 3
  rows.forEach((_, i) => {
    g.beginPath()
    g.moveTo(52, 52 + i * 22)
    g.lineTo(204, 52 + i * 22 + (i % 2 ? -3 : 3))
    g.stroke()
  })
  g.fillStyle = '#7dffe6'
  g.font = 'italic bold 15px sans-serif'
  g.fillText('…or whenever', 186, 122)
  g.fillStyle = '#fffaf0'
  g.fillRect(4, 132, 120, 120)
  g.fillStyle = '#2a1630'
  g.font = 'bold 26px sans-serif'
  g.fillText('FERRY', 64, 170)
  g.fillText('SOON', 64, 200)
  g.strokeStyle = '#2a1630'
  g.lineWidth = 2
  for (let i = 0; i < 4; i++) {
    const bx = 18 + i * 26
    for (let j = 0; j < 4; j++) {
      g.beginPath()
      g.moveTo(bx + j * 4, 214)
      g.lineTo(bx + j * 4, 240)
      g.stroke()
    }
    g.beginPath()
    g.moveTo(bx - 3, 236)
    g.lineTo(bx + 16, 218)
    g.stroke()
  }
  g.fillStyle = '#16b3a0'
  g.fillRect(132, 160, 120, 64)
  g.fillStyle = '#fffaf0'
  g.font = 'bold 22px sans-serif'
  g.fillText('TO THE', 192, 186)
  g.fillText('LOCK ➜', 192, 214)
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

function sign(w: number, h: number, u0: number, v0: number, u1: number, v1: number, dx: number, dy: number, y: number, z: number, s = 1) {
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) ? u1 : u0, uv.getY(i) ? v1 : v0)
  g.translate(0, y, z)
  return bake(g, dx, dy, s)
}

export function Signs() {
  const shape = useMemo(() => {
    const [sx, sy] = ISLES[STOP]
    const [wx, wy] = ISLES[WAIT]
    const [qx, qy] = ISLES[QUAY]
    return merged([
      sign(100, 50, 0, 0.5, 1, 1, sx - 26, sy - 6, 66, -1.2, 1.5),
      sign(30, 30, 0, 0, 0.5, 0.5, wx - 26, wy + 2, 56, -4),
      sign(48, 26, 0.5, 0.11, 1, 0.38, qx - 60, qy + 20, 62, 0),
    ])
  }, [])
  const tex = useMemo(() => atlas(), [])
  useEffect(() => () => [shape, tex].forEach((o) => o.dispose()), [shape, tex])
  return (
    <mesh geometry={shape} renderOrder={46} frustumCulled={false}>
      <meshBasicMaterial map={tex} side={THREE.DoubleSide} transparent />
    </mesh>
  )
}

export function Props() {
  const props = useMemo(() => propsGeometry(), [])
  useEffect(() => () => props.dispose(), [props])
  return (
    <mesh geometry={props} renderOrder={45} frustumCulled={false}>
      <meshStandardMaterial vertexColors flatShading roughness={0.75} side={THREE.DoubleSide} transparent />
    </mesh>
  )
}
