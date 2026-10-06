import * as THREE from 'three'
import { C, merged, part } from './kit'
import { PATHS, RANGE, TRACK } from './layout'

function oval(rx: number, ry: number, w: number, color: string, lift: number, seg = 96) {
  const pos: number[] = []
  const at = (a: number, r: number): [number, number] => [TRACK.x + Math.cos(a) * (rx + r), -(TRACK.y + Math.sin(a) * (ry + r))]
  for (let k = 0; k < seg; k++) {
    const a0 = (k / seg) * Math.PI * 2
    const a1 = ((k + 1) / seg) * Math.PI * 2
    const [p, q, r, s] = [at(a0, -w / 2), at(a0, w / 2), at(a1, w / 2), at(a1, -w / 2)]
    pos.push(...p, lift, ...q, lift, ...r, lift, ...p, lift, ...r, lift, ...s, lift)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  return part(g, color)
}

function strip(a: [number, number], b: [number, number], w: number, color: string, lift: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1])
  const g = part(new THREE.PlaneGeometry(len, w), color)
  g.rotateZ(Math.atan2(-(b[1] - a[1]), b[0] - a[0]))
  g.translate((a[0] + b[0]) / 2, -(a[1] + b[1]) / 2, lift)
  return g
}

function dashes(line: [number, number][], out: THREE.BufferGeometry[]) {
  for (let k = 0; k + 1 < line.length; k++) {
    const [a, b] = [line[k], line[k + 1]]
    const len = Math.hypot(b[0] - a[0], b[1] - a[1])
    for (let d = 0; d + 46 < len; d += 84) {
      const t0 = d / len
      const t1 = (d + 46) / len
      out.push(strip([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1], 15, C.chalk, 2))
    }
  }
}

export function marksGeometry() {
  const { rx, ry, w } = TRACK
  const out = [
    oval(rx, ry, w, C.chalk, 1),
    oval(rx, ry, 7, C.slate, 2),
    oval(rx - w / 2 + 6, ry - w / 2 + 6, 9, C.white, 2),
    oval(rx + w / 2 - 6, ry + w / 2 - 6, 9, C.white, 2),
    oval(150, 90, 12, C.chalk, 1, 48),
    strip([TRACK.x, TRACK.y - ry + w / 2], [TRACK.x, TRACK.y + ry - w / 2], 12, C.chalk, 1),
    strip([TRACK.x + rx - w / 2, TRACK.y], [TRACK.x + rx + w / 2, TRACK.y], 20, C.red, 3),
    strip([RANGE.x - 230, RANGE.y + RANGE.line + 50], [RANGE.x + 230, RANGE.y + RANGE.line + 50], 14, C.chalk, 1),
  ]
  for (const p of PATHS) dashes(p, out)
  return merged(out)
}
