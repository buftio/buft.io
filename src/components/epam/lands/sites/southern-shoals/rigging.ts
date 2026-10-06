import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { C, folk, merged, part } from './kit'
import { CASTLE, deckY, half, rod, zOf } from './wreck'

const roof = deckY(CASTLE.z0) + CASTLE.h + 10
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

export const FISH = {
  x: 40,
  z: zOf(0.8),
  tip: v(96, roof + 150, zOf(0.8) + 190),
}

export function fishGeometry() {
  const parts = [
    rod(v(FISH.x + 12, roof + 24, FISH.z + 8), FISH.tip, 2.6, C.driftD, 4),
  ]
  parts.push(
    part(
      new THREE.CylinderGeometry(14, 12, 22, 8),
      C.gold,
      FISH.x - 34,
      roof + 11,
      FISH.z + 6,
    ),
  )
  parts.push(
    part(
      new THREE.CylinderGeometry(15, 15, 4, 8),
      C.rind,
      FISH.x - 34,
      roof + 22,
      FISH.z + 6,
    ),
  )
  for (let k = 0; k < 3; k++) {
    const b = new THREE.SphereGeometry(7, 6, 4)
    b.scale(1.7, 0.6, 1)
    parts.push(
      part(
        b,
        k === 1 ? C.glass : C.driftL,
        FISH.x - 34 + (k - 1) * 4,
        roof + 26 + k * 7,
        FISH.z + 6,
      ),
    )
  }
  const sleeper: THREE.BufferGeometry[] = []
  folk(sleeper, 0, 0, 0, C.hat, 15)
  const g = merged(sleeper)
  g.rotateZ(1.3)
  g.translate(-half(-0.75) * 0.3, deckY(-0.75) + 14, zOf(-0.75))
  parts.push(g)
  return merged(parts)
}

function canvas() {
  const el = document.createElement('canvas')
  el.width = 256
  el.height = 128
  const x = el.getContext('2d')
  if (x) {
    x.fillStyle = '#f4e6c8'
    x.beginPath()
    x.roundRect(4, 8, 248, 48, 10)
    x.fill()
    x.strokeStyle = C.driftD
    x.lineWidth = 4
    x.stroke()
    x.fillStyle = C.ink
    x.font = 'bold 25px Georgia, serif'
    x.textAlign = 'center'
    x.textBaseline = 'middle'
    x.fillText('SECOND CHANCE', 128, 33)
    x.save()
    x.translate(128, 96)
    x.rotate(-0.05)
    x.fillStyle = C.coral
    x.font = 'bold italic 34px "Comic Sans MS", Chalkboard, sans-serif'
    x.fillText('seaworthy-ish', 0, 0)
    x.restore()
  }
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function board(w: number, h: number, v0: number) {
  const g = new THREE.PlaneGeometry(w, h)
  const uv = g.getAttribute('uv')
  for (let i = 0; i < uv.count; i++) uv.setY(i, v0 + uv.getY(i) * 0.5)
  return g
}

export function boards() {
  const stern = board(124, 25, 0.5)
  stern.translate(0, deckY(CASTLE.z0) + 30, zOf(CASTLE.z1) + 3)
  const side = board(230, 46, 0)
  side.rotateY(Math.PI / 2)
  side.rotateZ(-0.35)
  const zn = -0.42
  side.translate(half(zn) * 0.9 + 14, 92, zOf(zn))
  const geometry = mergeGeometries([stern, side])
  stern.dispose()
  side.dispose()
  return { geometry, texture: canvas() }
}
