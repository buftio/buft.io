import * as THREE from 'three'
import { eyes, INK, merged, part, PITCH, WHITE } from './space'

const BODY = '#4a36a3'
const BODY2 = '#5b3fb8'
const TEAL = '#16b3a0'
const ROSE = '#e0679b'
const STEEL = '#dfe7ef'
const GOLD = '#ffc94d'
const WICKER = '#c98f52'

type Parts = THREE.BufferGeometry[]

function feet(p: Parts) {
  for (const s of [-1, 1]) p.push(part(new THREE.SphereGeometry(4.5, 6, 4), INK, s * 7, 3, 2))
}

export function sentryGeometry() {
  const p: Parts = [
    part(new THREE.SphereGeometry(15, 10, 7), BODY, 0, 16, 0),
    part(new THREE.SphereGeometry(15.8, 8, 5, Math.PI, Math.PI, Math.PI * 0.3, Math.PI * 0.55), ROSE, 0, 16, 0),
    part(new THREE.SphereGeometry(13.5, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), TEAL, 0, 22, 0),
    part(new THREE.BoxGeometry(3, 11, 14), ROSE, 0, 38, 0),
    part(new THREE.CylinderGeometry(1.3, 1.3, 66, 5), INK, 17, 33, 3),
    part(new THREE.ConeGeometry(3.6, 11, 4), STEEL, 17, 71, 3),
  ]
  feet(p)
  eyes(p, 5.6, 0, 16, 12, 6.2, undefined, 7)
  return merged(p)
}

export function pickerGeometry() {
  const p: Parts = [
    part(new THREE.SphereGeometry(14, 10, 7), BODY2, 0, 15, 0),
    part(new THREE.SphereGeometry(14.6, 12, 5, 0, Math.PI * 2, 0, Math.PI * 0.42), '#ff8fb8', 0, 15, 0),
    part(new THREE.CylinderGeometry(13, 9, 12, 10), WICKER, 0, 34, 0),
    part(new THREE.TorusGeometry(12.5, 1.6, 4, 12).rotateX(Math.PI / 2), '#a26c38', 0, 40, 0),
  ]
  feet(p)
  eyes(p, 5.2, 0, 15, 11.5, 5.8, undefined, 7)
  return merged(p)
}

export function berryGeometry() {
  return merged([
    part(new THREE.SphereGeometry(6, 6, 4), '#d8264a', -5, 43, 0),
    part(new THREE.SphereGeometry(6, 6, 4), '#ff3d63', 5, 43, 1),
    part(new THREE.SphereGeometry(6, 6, 4), '#c21a40', 0, 49, -1),
  ])
}

export function bushGeometry() {
  return merged([
    part(new THREE.SphereGeometry(9, 10, 8), '#d8264a', 0, 9, 0),
    part(new THREE.SphereGeometry(3, 6, 4), '#ffb3c4', -3, 14, 6),
  ])
}

export function cookGeometry() {
  const p: Parts = [
    part(new THREE.SphereGeometry(22, 14, 10), BODY, 0, 23, 0),
    part(new THREE.SphereGeometry(22.6, 12, 8, 0, Math.PI, Math.PI * 0.42, Math.PI * 0.45), WHITE, 0, 23, 0),
    part(new THREE.CylinderGeometry(11, 10, 22, 12), WHITE, 0, 50, 0),
    part(new THREE.SphereGeometry(15, 12, 8), WHITE, 0, 66, 0),
    part(new THREE.CylinderGeometry(1.8, 1.8, 58, 5).rotateZ(-0.5), '#a0643c', 26, 30, 10),
    part(new THREE.SphereGeometry(6, 8, 6), '#a0643c', 39, 6, 10),
  ]
  eyes(p, 7.5, 0, 27, 18, 8.5, [0.2, -0.35])
  return merged(p)
}

export function cartGeometry() {
  const p: Parts = [
    part(new THREE.BoxGeometry(46, 14, 28), GOLD, 0, 17, 0),
    part(new THREE.SphereGeometry(13, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#3a2346', 4, 38, 0),
    part(new THREE.TorusGeometry(13, 2, 4, 12).rotateX(Math.PI / 2), '#e3995a', 4, 38, 0),
    part(new THREE.CylinderGeometry(1.5, 1.5, 34, 5).rotateZ(1.1), INK, -30, 26, 0),
  ]
  for (const sx of [-14, 14]) for (const sz of [-15, 15]) p.push(part(new THREE.CylinderGeometry(8, 8, 4, 10).rotateX(Math.PI / 2), INK, sx, 8, sz))
  for (const sz of [-9, 9]) p.push(part(new THREE.SphereGeometry(6, 8, 4, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), TEAL, -14, 30, sz))
  const pusher: Parts = [
    part(new THREE.SphereGeometry(13, 10, 8), BODY2, 0, 14, 0),
    part(new THREE.SphereGeometry(10, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), WHITE, 0, 21, 0),
  ]
  feet(pusher)
  eyes(pusher, 5, 0, 15, 10, 5.4, [0, 0])
  for (const g of pusher) {
    g.rotateY(Math.PI / 2)
    g.translate(-46, 0, 0)
    p.push(g)
  }
  return merged(p)
}

const DROP = [[0, -0.1], [0.5, 0.05], [0.72, 0.45], [0.6, 0.95], [0.32, 1.55], [0.1, 2.05], [0, 2.3]].map(([x, y]) => new THREE.Vector2(x, y))

export function flameGeometry() {
  const outer = new THREE.LatheGeometry(DROP, 12)
  const core = new THREE.LatheGeometry(DROP, 10).scale(0.5, 0.55, 0.5)
  return merged([part(outer, '#d0d0d0'), part(core, WHITE, 0, 0.02, 0.5)])
}

export function scopeGeometry() {
  const p: Parts = []
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const leg = new THREE.CylinderGeometry(1.6, 1.6, 64, 5).rotateZ(0.32).rotateY(a)
    p.push(part(leg, INK, Math.cos(a) * -10, 30, Math.sin(a) * 10))
  }
  const tube = new THREE.CylinderGeometry(7, 12, 130, 12).rotateZ(-Math.PI / 2 + 0.32)
  p.push(part(tube, '#d9a441', 18, 66, 0))
  for (const x of [-30, 10, 60]) p.push(part(new THREE.CylinderGeometry(9 + x * 0.06, 9 + x * 0.06, 6, 12).rotateZ(-Math.PI / 2 + 0.32), INK, x + 4, 66 + (x - 18) * 0.33, 0))
  p.push(part(new THREE.CylinderGeometry(12.5, 12.5, 3, 12).rotateZ(-Math.PI / 2 + 0.32), '#bfe9ff', 80, 87, 0))
  const old: Parts = [
    part(new THREE.SphereGeometry(16, 12, 9), BODY, 0, 17, 0),
    part(new THREE.SphereGeometry(12, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#2d6f8f', 0, 26, 0),
    part(new THREE.CylinderGeometry(15, 15, 2, 12), '#2d6f8f', 0, 26, 0),
    part(new THREE.SphereGeometry(10, 10, 6, 0, Math.PI, Math.PI * 0.5, Math.PI * 0.4), WHITE, 0, 12, 0),
  ]
  feet(old)
  eyes(old, 5.8, 0, 19, 13, 6.4, [0.2, 0.3])
  for (const g of old) {
    g.rotateY(Math.PI / 2)
    g.translate(-62, 0, 0)
    p.push(g)
  }
  return merged(p)
}

export function pennantGeometry() {
  const s = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-1, -0.16), new THREE.Vector2(0, -0.34)])
  return new THREE.ShapeGeometry(s)
}

export function kiteGeometry(rider: THREE.BufferGeometry) {
  const [top, right, bottom, left, mid] = [[0, 150], [92, 40], [0, -120], [-92, 40], [0, 40]]
  const tri = (a: number[], b: number[], c: number[], color: string) => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([...a, 0, ...b, 0, ...c, 0], 3))
    g.computeVertexNormals()
    return part(g, color)
  }
  const p: Parts = [
    tri(mid, top, left, '#16b3a0'),
    tri(mid, right, top, '#fbe9f2'),
    tri(mid, bottom, right, '#16b3a0'),
    tri(mid, left, bottom, '#e0679b'),
    part(new THREE.BoxGeometry(5, 272, 3), INK, 0, 15, 2),
    part(new THREE.BoxGeometry(186, 5, 3), INK, 0, 40, 2),
    part(new THREE.SphereGeometry(16, 10, 8), '#ffd36b', 0, 40, 4),
    part(new THREE.CylinderGeometry(24, 18, 20, 10), '#c98f52', 0, -200, 6),
  ]
  for (const s of [-1, 1]) p.push(part(new THREE.CylinderGeometry(1, 1, 80, 4).rotateZ(s * 0.25), INK, s * 10, -152, 0))
  p.push(rider.clone().scale(1.5, 1.5, 1.5).applyQuaternion(PITCH).translate(0, -214, 12))
  return merged(p)
}

export function puffGeometry() {
  return new THREE.SphereGeometry(1, 10, 8)
}

export function waveGeometry() {
  return new THREE.RingGeometry(0.88, 1, 18, 1, (200 * Math.PI) / 180, (92 * Math.PI) / 180)
}
