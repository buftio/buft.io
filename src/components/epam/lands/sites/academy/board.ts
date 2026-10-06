import * as THREE from 'three'
import { C } from './kit'

export const SHEET = 256
export const BOARD_UV = [0, 124] as const
export const BANNER_UV = [132, 182] as const

function blob(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  for (let k = 0; k <= 30; k++) {
    const a = (k / 30) * Math.PI * 2
    const q = r * (1 + 0.22 * Math.sin(a * 5) + 0.08 * Math.sin(a * 3 + 1))
    g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q)
  }
  g.stroke()
  for (const s of [-1, 1]) {
    const ex = x + s * r * 0.35
    const ey = y - r * 0.1
    g.beginPath()
    g.moveTo(ex - 4, ey - 4)
    g.lineTo(ex + 4, ey + 4)
    g.moveTo(ex + 4, ey - 4)
    g.lineTo(ex - 4, ey + 4)
    g.stroke()
  }
}

function friend(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  g.arc(x, y, r, 0, Math.PI * 2)
  g.stroke()
  for (const s of [-1, 1]) {
    g.beginPath()
    g.arc(x + s * r * 0.35, y - r * 0.15, 4.5, 0, Math.PI * 2)
    g.stroke()
    g.fillRect(x + s * r * 0.35 - 1, y - r * 0.15, 3, 3)
  }
  g.beginPath()
  g.arc(x, y + r * 0.1, r * 0.4, 0.2, Math.PI - 0.2)
  g.stroke()
}

function chalkboard(g: CanvasRenderingContext2D, alarm: boolean) {
  const [y0, y1] = BOARD_UV
  g.fillStyle = C.slate
  g.fillRect(0, y0, SHEET, y1 - y0)
  g.globalAlpha = 0.08
  g.fillStyle = C.chalk
  for (let k = 0; k < 7; k++) g.fillRect(10 + k * 37, y0 + 8 + (k % 3) * 30, 40, 14)
  g.globalAlpha = 1
  g.lineWidth = 2.5
  g.lineCap = 'round'
  g.textAlign = 'center'
  if (alarm) {
    g.strokeStyle = C.pink
    g.fillStyle = C.pink
    g.font = 'bold 30px "Comic Sans MS", "Marker Felt", cursive'
    g.fillText('NOT A', 128, y0 + 46)
    g.fillText('DRILL!', 128, y0 + 82)
    g.strokeStyle = C.chalk
    blob(g, 40, y0 + 62, 22)
    blob(g, 216, y0 + 62, 22)
    g.font = 'bold 13px "Comic Sans MS", cursive'
    g.fillStyle = C.chalk
    g.fillText('everyone to the posts', 128, y0 + 110)
    return
  }
  g.fillStyle = C.chalk
  g.strokeStyle = C.chalk
  g.font = 'bold 19px "Comic Sans MS", "Marker Felt", cursive'
  g.fillText('KNOW YOUR ENEMY', 128, y0 + 24)
  g.beginPath()
  g.moveTo(30, y0 + 31)
  g.lineTo(226, y0 + 31)
  g.stroke()
  g.strokeStyle = C.sky
  friend(g, 64, y0 + 66, 22)
  g.strokeStyle = C.pink
  blob(g, 192, y0 + 66, 22)
  g.font = 'bold 14px "Comic Sans MS", cursive'
  g.fillStyle = C.sky
  g.fillText('friend', 64, y0 + 112)
  g.fillStyle = C.pink
  g.fillText('BLIGHT', 192, y0 + 112)
  g.strokeStyle = C.sun
  g.font = 'bold 22px "Comic Sans MS", cursive'
  g.fillStyle = C.sun
  g.fillText('vs', 128, y0 + 74)
}

function banner(g: CanvasRenderingContext2D) {
  const [y0, y1] = BANNER_UV
  g.fillStyle = C.teal
  g.fillRect(0, y0, SHEET, y1 - y0)
  g.fillStyle = C.mint
  g.fillRect(0, y0, SHEET, 4)
  g.fillRect(0, y1 - 4, SHEET, 4)
  g.fillStyle = C.white
  g.textAlign = 'center'
  g.font = 'bold 30px Georgia, serif'
  g.fillText('CLASS OF 091', 128, y0 + 36)
}

export function drawSheet(canvas: HTMLCanvasElement, alarm: boolean) {
  const g = canvas.getContext('2d')
  if (!g) return
  chalkboard(g, alarm)
  banner(g)
}

export function sheetTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = SHEET
  canvas.height = SHEET
  drawSheet(canvas, false)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function sheetPlane(w: number, h: number, [y0, y1]: readonly [number, number]) {
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 1 - y0 / SHEET : 1 - y1 / SHEET)
  return g
}
