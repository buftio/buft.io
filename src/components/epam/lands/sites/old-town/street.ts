import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { paint, rng, TEAL } from './kit'
import { BATH, HALF, PLAZA, PX, PY, SPRING } from './plan'

const TILE = 70

function ribbon(half: number, z: number, color: string) {
  const n = PX.length
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    const j = Math.min(n - 1, i + 1)
    const k = Math.max(0, i - 1)
    const tx = PX[j] - PX[k]
    const ty = PY[j] - PY[k]
    const l = Math.hypot(tx, ty) || 1
    const nx = -ty / l
    const ny = tx / l
    pos.push(PX[i] + nx * half, -(PY[i] + ny * half), z, PX[i] - nx * half, -(PY[i] - ny * half), z)
    if (i < n - 1) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setIndex(idx)
  return finish(g, color)
}

function disc(x: number, y: number, r: number, z: number, color: string, inner = 0) {
  const g = inner ? new THREE.RingGeometry(inner, r, 64) : new THREE.CircleGeometry(r, 64)
  g.translate(x, -y, z)
  return finish(g, color)
}

function finish(g: THREE.BufferGeometry, color: string) {
  const p = g.getAttribute('position')
  const uv = new Float32Array(p.count * 2)
  const nrm = new Float32Array(p.count * 3)
  for (let i = 0; i < p.count; i++) {
    uv[i * 2] = p.getX(i) / TILE
    uv[i * 2 + 1] = p.getY(i) / TILE
    nrm[i * 3 + 2] = 1
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3))
  return paint(g, color)
}

export function streetShape() {
  const parts = [
    ribbon(HALF + 12, 1.5, '#9c7fb0'),
    ribbon(HALF, 2, '#ffffff'),
    disc(PLAZA.x, PLAZA.y, PLAZA.r + 12, 2.2, '#9c7fb0'),
    disc(PLAZA.x, PLAZA.y, PLAZA.r, 2.6, '#ffffff'),
    disc(PLAZA.x, PLAZA.y, 150, 2.9, TEAL, 128),
    disc(PLAZA.x, PLAZA.y, 60, 2.9, '#ffd36b'),
  ]
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function cobbles() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const x = c.getContext('2d')!
  const r = rng(5)
  x.fillStyle = '#b9a2c6'
  x.fillRect(0, 0, 128, 128)
  for (let row = 0; row < 8; row++)
    for (let col = -1; col < 8; col++) {
      const l = 236 + Math.floor(r() * 18)
      x.fillStyle = `rgb(${l},${l - 14 - Math.floor(r() * 8)},${l - 4})`
      x.beginPath()
      x.roundRect(col * 16 + (row % 2) * 8 + 1, row * 16 + 1, 14, 14, 4)
      x.fill()
    }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function waterShape() {
  const [ax, ay, bx, by] = BATH
  const pool = new THREE.CircleGeometry(1, 32)
  pool.scale(Math.hypot(bx - ax, by - ay) / 2 + 30, 78, 1)
  pool.rotateZ(-Math.atan2(by - ay, bx - ax))
  pool.translate((ax + bx) / 2, -(ay + by) / 2, 6)
  const tub = new THREE.CircleGeometry(1, 24)
  tub.scale(95, 60, 1)
  tub.rotateZ(0.5)
  tub.translate(SPRING[0], -SPRING[1], 6)
  const g = mergeGeometries([pool, tub])
  pool.dispose()
  tub.dispose()
  return g
}
