import * as THREE from 'three'

export const GLYPHS = ['9!', '2', '5?', '3', 'coin', 'heart', '?!', 'NO'] as const
export const glyph = (name: (typeof GLYPHS)[number]) => GLYPHS.indexOf(name)

function banner(g: CanvasRenderingContext2D, y: number, text: string, bg: string, fg: string, size: number) {
  g.fillStyle = bg
  g.beginPath()
  g.roundRect(4, y + 6, 248, 52, 10)
  g.fill()
  g.fillStyle = fg
  g.font = `900 ${size}px ui-rounded, system-ui, sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(text, 128, y + 33, 236)
}

function bubble(g: CanvasRenderingContext2D, k: number, name: string) {
  const x = (k % 4) * 64
  const y = 128 + Math.floor(k / 4) * 64
  g.fillStyle = '#ffffff'
  g.strokeStyle = '#2a1630'
  g.lineWidth = 3
  g.beginPath()
  g.roundRect(x + 5, y + 5, 54, 40, 14)
  g.moveTo(x + 22, y + 44)
  g.lineTo(x + 18, y + 59)
  g.lineTo(x + 34, y + 44)
  g.fill()
  g.stroke()
  g.fillStyle = '#ffffff'
  g.fillRect(x + 21, y + 41, 12, 5)
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  if (name === 'coin') {
    g.fillStyle = '#ffb800'
    g.beginPath()
    g.arc(x + 32, y + 25, 13, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#a86a00'
    g.stroke()
    return
  }
  if (name === 'heart') {
    g.fillStyle = '#ff6f61'
    g.font = '900 30px system-ui, sans-serif'
    g.fillText('♥', x + 32, y + 26)
    return
  }
  g.fillStyle = name === 'NO' ? '#e8457a' : '#2a1630'
  g.font = '900 26px ui-rounded, system-ui, sans-serif'
  g.fillText(name, x + 32, y + 26)
}

export function atlas() {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const g = canvas.getContext('2d')
  if (g) {
    banner(g, 0, 'BUBBLE BAZAAR', '#fff4e6', '#e8457a', 34)
    banner(g, 64, 'TAME BLIGHT · 3 FAT', '#1c2410', '#c8ff3a', 28)
    GLYPHS.forEach((name, k) => bubble(g, k, name))
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}

export function strip(row: number, w: number, h: number) {
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv') as THREE.BufferAttribute
  for (let k = 0; k < uv.count; k++) uv.setY(k, 1 - (row + 1 - uv.getY(k)) * 0.25)
  return g
}
