import * as THREE from 'three'
import { C, eyes, folk, merged, part, rand, stand } from './kit'
import { CAMP, INN, LANE, PADDOCK, PIER, POST, ROAD, THUMB, TOLL, WRECK } from './map'

type G = THREE.BufferGeometry

function prism(w: number, h: number, len: number, color: string, x: number, y: number, z: number) {
  const s = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(0, h)])
  const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false }).translate(0, 0, -len / 2)
  return part(g, color, x, y, z)
}

function box(w: number, h: number, d: number, color: string, x: number, y: number, z: number, turn = 0) {
  return part(new THREE.BoxGeometry(w, h, d), color, x, y, z, turn)
}

function cyl(r: number, h: number, color: string, x: number, y: number, z: number, seg = 8, r2 = r) {
  return part(new THREE.CylinderGeometry(r, r2, h, seg), color, x, y, z)
}

export function barrelParts(p: G[], x: number, y: number, z: number, r = 16, lay = false) {
  const b = new THREE.CylinderGeometry(r, r, r * 2.1, 10)
  const band = new THREE.CylinderGeometry(r * 1.06, r * 1.06, r * 0.35, 10)
  const out = [part(b, C.lard), part(band.clone().translate(0, r * 0.6, 0), C.band), part(band.translate(0, -r * 0.6, 0), C.band)]
  for (const g of out) {
    if (lay) g.rotateZ(Math.PI / 2)
    g.translate(x, y + (lay ? r : r * 1.05), z)
    p.push(g)
  }
}

function inn(): G {
  const p: G[] = []
  p.push(box(300, 130, 170, C.stone, 0, 65, 0))
  p.push(box(320, 100, 180, '#fff1d6', 0, 180, 0))
  for (const x of [-155, -60, 60, 155]) p.push(box(10, 100, 4, C.wood, x, 180, 92))
  p.push(box(320, 10, 4, C.wood, 0, 132, 92))
  p.push(box(320, 10, 4, C.wood, 0, 228, 92))
  p.push(prism(316, 148, 172, '#fff1d6', 0, 230, 0))
  for (const s of [-1, 1]) p.push(part(new THREE.BoxGeometry(262, 16, 214).rotateZ(-s * 0.745), C.teal, s * 95, 314, 0))
  p.push(box(16, 20, 214, C.mint, 0, 404, 0))
  p.push(box(38, 120, 38, C.roof, 105, 360, -46))
  p.push(box(46, 12, 46, C.ink, 105, 424, -46))
  for (const x of [-100, 100]) p.push(box(56, 50, 4, '#ffcc66', x, 70, 86))
  for (const x of [-100, 100]) p.push(box(68, 8, 10, C.wood, x, 42, 90))
  for (const x of [-108, 0, 108]) p.push(box(44, 42, 4, '#ffd27a', x, 180, 92))
  p.push(box(54, 86, 4, C.teal, 0, 43, 86))
  p.push(cyl(4, 4, '#ffd36b', 16, 45, 90, 6))
  for (let i = 0; i < 4; i++) p.push(part(new THREE.BoxGeometry(24, 4, 46).rotateX(0.5), i % 2 ? C.white : C.red, -36 + i * 24, 98, 104))
  p.push(box(90, 8, 26, C.plank, -120, 22, 110))
  for (const x of [-158, -82]) p.push(box(6, 18, 18, C.wood, x, 9, 110))
  eyes(p, 290, 92, 46, 26)
  for (let i = 0; i < 4; i++) barrelParts(p, 180 + (i % 2) * 34, i > 1 ? 36 : 0, 40 + (i % 2) * 10)
  p.push(cyl(4, 110, C.ink, -170, 150, 96, 5))
  p.push(box(120, 6, 6, C.ink, -225, 200, 96))
  return stand(merged(p), INN.x, INN.y)
}

function toll(): G {
  const p: G[] = []
  for (let i = 0; i < 6; i++) p.push(box(76, 18, 76, i % 2 ? C.white : C.red, 0, 9 + i * 18, 0))
  p.push(box(46, 34, 4, C.ink, 0, 72, 39))
  folk(p, 0, 52, 30, 13)
  p.push(part(new THREE.ConeGeometry(62, 56, 4), C.red, 0, 136, 0, Math.PI / 4))
  p.push(cyl(3, 30, C.ink, 0, 178, 0, 4))
  p.push(part(new THREE.SphereGeometry(8, 8, 6), '#ffd36b', 0, 196, 0))
  p.push(cyl(14, 24, C.ink, -48, 12, 30, 8))
  p.push(box(30, 60, 14, C.stone, -276, 30, 0))
  p.push(cyl(18, 34, '#fff7d6', 52, 17, 34, 10))
  return stand(merged(p), TOLL.x, TOLL.y)
}

function post(): G {
  const p: G[] = [cyl(6, 300, C.wood, 0, 150, 0, 6), part(new THREE.SphereGeometry(12, 8, 6), '#ffd36b', 0, 306, 0)]
  p.push(cyl(40, 10, C.stone, 0, 5, 0, 10, 46))
  return stand(merged(p), POST.x, POST.y)
}

function lamp(p: G[]) {
  p.push(cyl(3, 86, C.ink, 0, 43, 0, 5))
  p.push(box(14, 16, 14, '#ffcc66', 0, 92, 0))
  p.push(part(new THREE.ConeGeometry(12, 10, 4), C.ink, 0, 105, 0, Math.PI / 4))
}

export const LAMPS: [number, number][] = (() => {
  const out: [number, number][] = []
  const pt = { x: 0, y: 0, dx: 0, dy: 0 }
  for (let s = 180, k = 0; s < ROAD.length - 150; s += 230, k++) {
    ROAD.at(s, pt)
    const side = k % 2 ? 1 : -1
    out.push([pt.x - pt.dy * side * 112, pt.y + pt.dx * side * 112])
  }
  return out
})()

function milestone(p: G[], n: number) {
  p.push(part(new THREE.CylinderGeometry(15, 18, 30, 8), '#efc48c', 0, 15, 0))
  p.push(part(new THREE.SphereGeometry(15, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), C.teal, 0, 30, 0))
  for (let k = 0; k <= n % 3; k++) p.push(box(3, 13, 2, C.ink, (k - (n % 3) / 2) * 7, 17, 16))
}

function paddock(): G[] {
  const p: G[] = []
  const r = rand(4)
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2
    const x = Math.cos(a) * 150
    const z = Math.sin(a) * 90
    p.push(cyl(4, 34, C.wood, x, 17, z, 4))
    const b = ((k + 1) / 18) * Math.PI * 2
    const nx = Math.cos(b) * 150
    const nz = Math.sin(b) * 90
    const len = Math.hypot(nx - x, nz - z)
    const g = box(len, 4, 4, C.plank, 0, 0, 0)
    g.rotateY(-Math.atan2(nz - z, nx - x))
    g.translate((x + nx) / 2, 26, (z + nz) / 2)
    if (k !== 13 && k !== 14) p.push(g)
  }
  p.push(box(80, 16, 26, C.wood, 30, 8, -20))
  p.push(box(70, 8, 18, C.lard, 30, 18, -20))
  for (const [x, z, t] of [[-60, 10, 0.3], [-10, 40, -2.6]]) {
    const s: G[] = []
    snailParts(s, true)
    for (const g of s) p.push(g.rotateY(t).translate(x, 0, z))
  }
  for (let i = 0; i < 5; i++) p.push(part(new THREE.SphereGeometry(8, 5, 3), '#9fd8a0', -100 + r() * 200, 4, -60 + r() * 120))
  return [stand(merged(p), PADDOCK.x, PADDOCK.y)]
}

function wreck(): G {
  const p: G[] = []
  wagonParts(p, false)
  canvasParts(p, '#f7d9d9')
  const g = merged(p).rotateZ(-0.22).translate(0, 8, 0)
  const q: G[] = [g, cyl(17, 5, '#5a3424', 40, 3, 50, 12)]
  folk(q, -70, 0, 50, 14)
  q.push(box(20, 14, 16, C.ink, -96, 7, 50))
  return stand(merged(q), WRECK.x, WRECK.y, 1, 0.5)
}

function camp(): G {
  const p: G[] = []
  for (const [x, z, t, c] of [[-150, -40, 0.5, '#ffe0e6'], [150, -50, 2.7, '#dff7ef']] as const) {
    const w: G[] = []
    wagonParts(w, false)
    canvasParts(w, c)
    const s: G[] = []
    snailParts(s, true)
    for (const g of s) w.push(g.scale(1, 0.8, 1).translate(110, 0, 40))
    for (const g of w) p.push(g.rotateY(t).translate(x, 0, z))
  }
  for (let k = 0; k < 5; k++) p.push(part(new THREE.CylinderGeometry(4, 4, 46, 5).rotateZ(Math.PI / 2), C.wood, 0, 5, 0, (k * Math.PI) / 5))
  p.push(part(new THREE.ConeGeometry(16, 40, 6), '#ff8a2a', 0, 26, 0))
  p.push(part(new THREE.ConeGeometry(9, 26, 5), '#ffe066', 0, 22, 4))
  for (const [x, z] of [[-60, 30], [60, 30], [-20, -50], [45, -45]]) {
    folk(p, x, 0, z, 13)
    p.push(part(new THREE.CylinderGeometry(10, 12, 8, 6), C.wood, x, 0, z - 4))
  }
  p.push(part(new THREE.CylinderGeometry(1, 1, 60, 3).rotateZ(1.05), C.wood, -35, 30, 30))
  p.push(part(new THREE.SphereGeometry(5, 6, 4), C.white, -9, 46, 30))
  return stand(merged(p), CAMP.x, CAMP.y)
}

function hitch(): G {
  const p: G[] = []
  p.push(part(new THREE.CylinderGeometry(1.6, 1.6, 50, 4), C.wood, 26, 25, 4))
  p.push(part(new THREE.BoxGeometry(54, 26, 2), '#e8c89a', 26, 58, 5))
  p.push(part(new THREE.BoxGeometry(34, 3, 2.5), C.ink, 26, 62, 6.5))
  p.push(part(new THREE.BoxGeometry(24, 3, 2.5), C.ink, 22, 54, 6.5))
  barrelParts(p, -28, 0, -6, 11)
  return stand(merged(p), THUMB.x, THUMB.y, 1, -0.5)
}

function pier(): G {
  const p: G[] = []
  for (let i = 0; i < 8; i++) p.push(box(26, 6, 150, i % 2 ? C.plank : '#b47a4c', -90 + i * 27, 4, 0))
  for (const [x, z] of [[-100, -70], [100, -70], [-100, 70], [100, 70]]) p.push(cyl(6, 30, C.wood, x, 10, z, 5))
  for (let i = 0; i < 5; i++) barrelParts(p, -40 + (i % 3) * 36, i > 2 ? 34 : 6, -30 + (i > 2 ? 10 : 0), 15)
  folk(p, 60, 6, 30, 14)
  p.push(box(170, 8, 70, '#a8653a', 190, 2, 30))
  for (let i = 0; i < 3; i++) barrelParts(p, 150 + i * 34, 6, 30, 15)
  return stand(merged(p), PIER.x, PIER.y, 1, -0.4)
}

function lanePosts(): G[] {
  const out: G[] = []
  const pt = { x: 0, y: 0, dx: 0, dy: 0 }
  for (let s = 120; s < LANE.length - 60; s += 110) {
    LANE.at(s, pt)
    for (const side of [-1, 1]) out.push(stand(cyl(4, 30, C.wood, 0, 15, 0, 4), pt.x - pt.dy * side * 46, pt.y + pt.dx * side * 46))
  }
  return out
}

export function statics() {
  const p: G[] = [inn(), toll(), post(), stand(cyl(5, 132, C.wood, 0, 66, -6, 6), -870, -1500), wreck(), pier(), camp(), hitch(), ...paddock(), ...lanePosts()]
  for (const [x, y] of LAMPS) {
    const l: G[] = []
    lamp(l)
    p.push(stand(merged(l), x, y))
  }
  const pt = { x: 0, y: 0, dx: 0, dy: 0 }
  for (let s = 300, n = 0; s < ROAD.length - 200; s += 620, n++) {
    ROAD.at(s, pt)
    const m: G[] = []
    milestone(m, n)
    p.push(stand(merged(m), pt.x + pt.dy * 100, pt.y - pt.dx * 100))
  }
  return merged(p)
}

export function wagonParts(p: G[], driver = true) {
  p.push(box(104, 16, 50, C.wood, 0, 30, 0))
  for (const x of [-34, 34])
    for (const z of [-28, 28]) {
      p.push(part(new THREE.CylinderGeometry(17, 17, 5, 12).rotateX(Math.PI / 2), '#5a3424', x, 17, z))
      p.push(part(new THREE.CylinderGeometry(6, 6, 7, 6).rotateX(Math.PI / 2), C.band, x, 17, z))
    }
  for (const x of [-44, 0, 44]) p.push(part(new THREE.TorusGeometry(27, 2, 4, 10, Math.PI), C.wood, x, 38, 0, Math.PI / 2))
  barrelParts(p, -64, 24, 0, 12)
  p.push(box(14, 8, 46, C.wood, 52, 44, 0))
  p.push(box(60, 3, 3, C.wood, 82, 26, -12))
  p.push(box(60, 3, 3, C.wood, 82, 26, 12))
  if (driver) {
    folk(p, 56, 46, 0, 13)
    p.push(part(new THREE.ConeGeometry(15, 12, 8), C.teal, 56, 79, 0))
  }
}

export function canvasParts(p: G[], color: string = C.white) {
  p.push(part(new THREE.CylinderGeometry(28, 28, 96, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), color, 0, 38, 0))
  p.push(part(new THREE.CylinderGeometry(28.6, 28.6, 14, 12, 1, true, 0, Math.PI).rotateZ(Math.PI / 2), '#d8d0e0', 0, 38, 0))
}

export function snailParts(p: G[], shell: boolean) {
  const skin = '#f2c3a6'
  p.push(part(new THREE.SphereGeometry(1, 10, 6).scale(46, 11, 17), skin, 0, 10, 0))
  p.push(part(new THREE.SphereGeometry(12, 8, 6), skin, 40, 22, 0))
  for (const z of [-7, 7]) {
    p.push(part(new THREE.CylinderGeometry(1.8, 2.4, 26, 4).rotateZ(-0.3), skin, 46, 40, z))
    p.push(part(new THREE.SphereGeometry(6.5, 7, 5), C.white, 50, 54, z))
    p.push(part(new THREE.SphereGeometry(3.4, 5, 3), C.ink, 54, 53, z + 3))
  }
  p.push(part(new THREE.TorusGeometry(5, 1.4, 3, 6, Math.PI).rotateZ(Math.PI).rotateY(Math.PI / 2), C.ink, 51, 20, 0))
  if (shell) shellParts(p, '#c9b6f2')
}

export function shellParts(p: G[], color: string = C.white) {
  p.push(part(new THREE.SphereGeometry(27, 12, 9).scale(1, 1, 0.75), color, -8, 36, 0))
  p.push(part(new THREE.TorusGeometry(15, 3, 4, 14), '#b9a5c8', -8, 36, 20))
  p.push(part(new THREE.TorusGeometry(6, 2.4, 4, 10), '#b9a5c8', -8, 36, 22))
}
