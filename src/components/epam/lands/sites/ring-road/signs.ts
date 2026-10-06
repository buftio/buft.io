import * as THREE from 'three'
import { C, TILT } from './kit'

const ROWS: [string, 'board' | 'left' | 'right', string, string][] = [
  ['THE HALFWAY INN', 'board', '#2a1630', '#ffe7b8'],
  ['', 'board', '', ''],
  ['TOLL · ONE DROP OF LARD', 'board', '#f3ebf4', '#c8283a'],
  ['LAKE', 'right', '#2a1630', '#f6d9a8'],
  ['ALSO LAKE', 'left', '#2a1630', '#f6d9a8'],
  ['YOU ARE HERE (AGAIN)', 'board', '#2a1630', '#bff3e8'],
  ['ONE WAY (ROUND)', 'right', '#2a1630', '#ffd36b'],
  ['FREE PASSAGE · GO GO GO', 'board', '#ffffff', '#16a34a'],
]

function shape(x: CanvasRenderingContext2D, kind: string, y: number, h: number) {
  const tip = 22
  x.beginPath()
  if (kind === 'right') {
    x.moveTo(3, y + 3)
    x.lineTo(253 - tip, y + 3)
    x.lineTo(253, y + h / 2)
    x.lineTo(253 - tip, y + h - 3)
    x.lineTo(3, y + h - 3)
  } else if (kind === 'left') {
    x.moveTo(253, y + 3)
    x.lineTo(3 + tip, y + 3)
    x.lineTo(3, y + h / 2)
    x.lineTo(3 + tip, y + h - 3)
    x.lineTo(253, y + h - 3)
  } else x.roundRect(3, y + 3, 250, h - 6, 6)
  x.closePath()
}

export function signTexture() {
  const cv = document.createElement('canvas')
  cv.width = 256
  cv.height = 256
  const x = cv.getContext('2d')!
  x.textAlign = 'center'
  x.textBaseline = 'middle'
  ROWS.forEach(([text, kind, ink, fill], k) => {
    if (!text) return
    const h = k === 0 ? 64 : 32
    const y = k * 32
    shape(x, kind, y, h)
    x.fillStyle = fill
    x.fill()
    x.lineWidth = 4
    x.strokeStyle = C.ink
    x.stroke()
    x.fillStyle = ink
    let px = k === 0 ? 34 : 21
    do x.font = `bold ${px--}px Georgia, serif`
    while (x.measureText(text).width > 200)
    x.fillText(text, kind === 'left' ? 140 : kind === 'right' ? 116 : 128, y + h / 2 + 1)
  })
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function signQuad(row: number, w: number, rows = 1) {
  const h = (w / 8) * rows
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (row + (1 - uv.getY(i)) * rows) / 8)
  return g
}

const m4 = new THREE.Matrix4()
const q = new THREE.Quaternion()
const e = new THREE.Euler()
const v = new THREE.Vector3()
const one = new THREE.Vector3(1, 1, 1)

export function board(row: number, w: number, dx: number, dy: number, h: number, turn = 0, tilt = 0) {
  const g = signQuad(row, w)
  q.setFromEuler(e.set(0, turn, tilt)).premultiply(TILT)
  v.set(0, h, 0).applyQuaternion(TILT)
  return g.applyMatrix4(m4.compose(v.add(new THREE.Vector3(dx, -dy, 0)), q, one))
}
