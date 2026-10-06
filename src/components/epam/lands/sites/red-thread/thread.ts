import * as THREE from 'three'
import { BEACH, C, NEEDLE, PINS, S, SAG_POST, SPOOL, type Path } from './data'
import { merge, part } from './geo'

const tint = new THREE.Color()

export function threadGeometry(p: Path, r = 15, radial = 6) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i < p.n; i += 2) pts.push(new THREE.Vector3(p.x[i], p.y[i], p.z[i]))
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal')
  const segs = Math.floor(p.n / 1.5)
  const tube = new THREE.TubeGeometry(curve, segs, r, radial, true)
  const n = tube.getAttribute('position').count
  const uv = tube.getAttribute('uv')
  const rgb = new Float32Array(n * 3)
  const a = new THREE.Color('#e3203f')
  const b = new THREE.Color('#9e0f2a')
  const hi = new THREE.Color('#ff6b7d')
  for (let i = 0; i < n; i++) {
    const t = uv.getX(i) * segs * 0.5 + uv.getY(i)
    const f = t - Math.floor(t)
    tint.copy(f < 0.45 ? a : f < 0.55 ? hi : b)
    rgb.set([tint.r, tint.g, tint.b], i * 3)
  }
  tube.setAttribute('color', new THREE.BufferAttribute(rgb, 3))
  tube.deleteAttribute('uv')
  return tube
}

export function decalGeometry(p: Path) {
  const v: number[] = []
  const w = 9
  for (let i = 0; i < p.n; i++) {
    const j = (i + 1) % p.n
    const x0 = p.gx[i] + p.h[i] * 0.12
    const x1 = p.gx[j] + p.h[j] * 0.12
    const y0 = p.fy[i] - p.h[i] * 0.05
    const y1 = p.fy[j] - p.h[j] * 0.05
    if (Math.hypot(x1 - x0, y1 - y0) > 40) continue
    v.push(x0, y0 - w, 0, x1, y1 - w, 0, x1, y1 + w, 0, x0, y0 - w, 0, x1, y1 + w, 0, x0, y0 + w, 0)
  }
  const ribbon = new THREE.BufferGeometry()
  ribbon.setAttribute('position', new THREE.Float32BufferAttribute(v, 3))
  ribbon.computeVertexNormals()
  const parts = [part(ribbon, '#3a1840')]
  const blob = (x: number, y: number, rx: number, ry: number) =>
    parts.push(part(new THREE.CircleGeometry(1, 20), '#3a1840', { at: [x, -y, 0], size: [rx, ry, 1] }))
  for (const [x, y] of PINS) blob(x + 30, y + 6, 48, 22)
  blob(SPOOL[0] + 30, SPOOL[1] + 10, 190, 80)
  blob(SPOOL[0] + 260, SPOOL[1] + 20, 150, 60)
  blob(NEEDLE[0] + 40, NEEDLE[1] + 10, 60, 18)
  blob(SAG_POST[0] + 10, SAG_POST[1] + 4, 30, 10)
  blob(SPOOL[0] - 160, SPOOL[1] - 88, 62, 20)
  blob(BEACH[0] + 80, BEACH[1] - 92, 34, 12)
  return merge(parts)
}

export const SIGNS: { at: [number, number, number]; w: number; row: number }[] = [
  { at: [SPOOL[0] - 240, SPOOL[1], 265], w: 250, row: 0 },
  { at: [NEEDLE[0] - 300, NEEDLE[1] - 25, 150], w: 220, row: 1 },
  { at: [SAG_POST[0], SAG_POST[1], 165], w: 210, row: 2 },
]

const LABELS = ['SPOOL STATION', 'THREAD END', 'MIND THE SAG!']

export function signTexture() {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 128
  const g = c.getContext('2d')
  if (g) {
    LABELS.forEach((text, k) => {
      const y = k * 42 + 2
      g.fillStyle = '#a8102c'
      g.beginPath()
      g.roundRect(2, y, 252, 38, 9)
      g.fill()
      g.fillStyle = k === 2 ? '#ffd36b' : '#fff4d6'
      g.beginPath()
      g.roundRect(6, y + 4, 244, 30, 6)
      g.fill()
      g.fillStyle = '#2a1630'
      g.font = 'bold 22px ui-rounded, system-ui, sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(text, 128, y + 20)
    })
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function signGeometry() {
  const parts = SIGNS.map(({ at: [x, y, h], w, row }) => {
    const g = new THREE.PlaneGeometry(w, (w * 38) / 252)
    const uv = g.getAttribute('uv')
    for (let i = 0; i < uv.count; i++) {
      const v = uv.getY(i)
      uv.setY(i, 1 - (row * 42 + 2 + (1 - v) * 38) / 128)
    }
    g.translate(x, -y + h * C, h * S + 40)
    return g
  })
  return merge(parts)
}
