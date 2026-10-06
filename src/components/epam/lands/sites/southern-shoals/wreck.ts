import * as THREE from 'three'
import { C, folk, merged, part, rng } from './kit'

export const L = 1100
export const B = 300
const D = 150
const SHEER = 80
const DECK = '#c39d6e'
const DECK_D = '#b08a5d'
export const MAIN_Z = -70
export const MIZ_Z = 400
export const MAIN_H = 640
export const CASTLE = { z0: 0.6, z1: 0.86, h: 105 }

export const sheer = (zn: number) => SHEER * zn * zn
export const deckY = (zn: number) => D + sheer(zn) - 4
export const half = (zn: number) =>
  (B / 2) *
  Math.sqrt(Math.max(0, 1 - zn * zn)) *
  (zn < 0 ? 1 - 0.3 * zn * zn : 1)
export const zOf = (zn: number) => (zn * L) / 2

const up = new THREE.Vector3(0, 1, 0)
export function rod(
  a: THREE.Vector3,
  b: THREE.Vector3,
  r: number,
  color: string,
  seg = 5,
) {
  const d = new THREE.Vector3().subVectors(b, a)
  const g = new THREE.CylinderGeometry(r, r, d.length(), seg, 1, true)
  g.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(up, d.clone().normalize()),
  )
  const mid = a.clone().add(b).multiplyScalar(0.5)
  return part(g, color, mid.x, mid.y, mid.z)
}
const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function hullShell() {
  const g = new THREE.SphereGeometry(
    1,
    24,
    9,
    0,
    Math.PI * 2,
    Math.PI / 2,
    Math.PI / 2,
  ).toNonIndexed()
  g.deleteAttribute('uv')
  g.deleteAttribute('normal')
  const p = g.getAttribute('position')
  const out: number[] = []
  const col: number[] = []
  const c = new THREE.Color()
  const roll = rng(11)
  for (let i = 0; i < p.count; i += 3) {
    const tri: number[] = []
    let cx = 0
    let cy = 0
    let cz = 0
    for (let k = 0; k < 3; k++) {
      const sx = p.getX(i + k)
      const sy = p.getY(i + k)
      const zn = Math.min(0.86, p.getZ(i + k))
      const lift = sy + 1
      const x = sx * (B / 2) * (zn < 0 ? 1 - 0.3 * zn * zn : 1)
      const y = lift * D + sheer(zn) * lift
      const z = zOf(zn)
      tri.push(x, y, z)
      cx += x / 3
      cy += y / 3
      cz += zn / 3
    }
    if (cx > 0 && cz > 0.17 && cz < 0.5 && cy > 26) continue
    const band = Math.floor(cy / 21)
    const fresh = cz > -0.22 && cz < 0.17 && cy > 20
    if (cy < 24) c.set(C.copper)
    else if (fresh) c.set(band % 2 ? C.fresh : C.freshD)
    else c.set(band % 2 ? C.drift : C.driftD)
    if (!fresh && cy > 24 && roll() < 0.08) c.set(C.driftL)
    out.push(...tri)
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b)
  }
  const s = new THREE.BufferGeometry()
  s.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  s.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return s
}

function deck() {
  const g = new THREE.PlaneGeometry(1, 1, 6, 22).toNonIndexed()
  g.deleteAttribute('uv')
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) * 2
    const zn = p.getY(i) * 2 * 0.86
    p.setXYZ(i, u * half(zn) * 0.97, deckY(zn), zOf(zn))
  }
  g.computeVertexNormals()
  const col: number[] = []
  const c = new THREE.Color()
  const roll = rng(9)
  for (let i = 0; i < p.count; i += 3) {
    const u = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3
    const zn = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3 / (L / 2)
    const lane = Math.floor((u / (2 * half(zn) + 1) + 0.5) * 6)
    const fresh = zn > -0.22 && zn < 0.17 && (lane + Math.floor(zn * 9)) % 3
    if (fresh) c.set(lane % 2 ? C.fresh : '#e8b46a')
    else c.set(lane % 2 ? DECK : DECK_D)
    if (!fresh && roll() < 0.06) c.set(C.drift)
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b)
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

function seams(parts: THREE.BufferGeometry[]) {
  for (const u of [-0.6, -0.2, 0.2, 0.6]) {
    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 10; k++) {
      const zn = -0.9 + (k / 10) * 1.48
      pts.push(v(u * half(zn) * 0.97, deckY(zn) + 1.5, zOf(zn)))
    }
    parts.push(
      part(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 1.6, 3),
        C.driftD,
      ),
    )
  }
}

function rails(parts: THREE.BufferGeometry[]) {
  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 20; k++) {
      const zn = -0.97 + (k / 20) * 1.83
      pts.push(v(side * half(zn) * 0.99, deckY(zn) + 18, zOf(zn)))
    }
    const tube = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts),
      24,
      3.5,
      4,
    )
    parts.push(part(tube, C.driftD))
    for (let k = 1; k < 20; k += 2)
      parts.push(
        rod(pts[k], pts[k].clone().setY(pts[k].y - 18), 2.5, C.driftD, 4),
      )
  }
}

function ribs(parts: THREE.BufferGeometry[]) {
  for (let k = 0; k < 6; k++) {
    const zn = 0.2 + k * 0.058
    const pts: THREE.Vector3[] = []
    for (let j = 0; j <= 8; j++) {
      const a = (j / 8) * (Math.PI / 2)
      const lift = 1 - Math.cos(a)
      pts.push(
        v(Math.sin(a) * half(zn), lift * D + sheer(zn) * lift + 6, zOf(zn)),
      )
    }
    parts.push(
      part(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 6, 4),
        C.driftD,
      ),
    )
  }
  for (let k = 0; k < 2; k++) {
    const y = 60 + k * 50
    const a = Math.acos(1 - y / (D + 20))
    const pts = [0.19, 0.5].map((zn) => v(Math.sin(a) * half(zn), y, zOf(zn)))
    parts.push(
      part(
        new THREE.TubeGeometry(new THREE.LineCurve3(pts[0], pts[1]), 1, 4, 4),
        C.fresh,
      ),
    )
  }
}

function scaffold(parts: THREE.BufferGeometry[]) {
  const x = half(0.35) + 34
  for (const zn of [0.16, 0.33, 0.52])
    parts.push(rod(v(x, 0, zOf(zn)), v(x, 215, zOf(zn)), 4, C.rope, 5))
  for (const y of [78, 158]) {
    parts.push(
      part(
        new THREE.BoxGeometry(34, 5, zOf(0.4)),
        C.fresh,
        x - 4,
        y,
        zOf(0.34),
      ),
    )
    parts.push(
      rod(
        v(x + 14, y + 26, zOf(0.16)),
        v(x + 14, y + 26, zOf(0.52)),
        2,
        C.rope,
        4,
      ),
    )
  }
  parts.push(rod(v(x, 0, zOf(0.16)), v(x, 158, zOf(0.52)), 2.4, C.rope, 4))
}

function castle(parts: THREE.BufferGeometry[]) {
  const z0 = zOf(CASTLE.z0)
  const z1 = zOf(CASTLE.z1) - 4
  const y0 = deckY(CASTLE.z0)
  const w = half(CASTLE.z1) * 1.9
  const h = CASTLE.h
  parts.push(
    part(
      new THREE.BoxGeometry(w, h, z1 - z0),
      C.drift,
      0,
      y0 + h / 2,
      (z0 + z1) / 2,
    ),
  )
  parts.push(
    part(
      new THREE.BoxGeometry(w + 16, 10, z1 - z0 + 16),
      C.copper,
      0,
      y0 + h + 5,
      (z0 + z1) / 2,
    ),
  )
  for (let k = -1; k <= 1; k++) {
    parts.push(
      part(
        new THREE.BoxGeometry(28, 34, 4),
        C.gold,
        k * 62,
        y0 + h * 0.55,
        z1 + 1,
      ),
    )
    parts.push(
      part(
        new THREE.BoxGeometry(34, 4, 5),
        C.driftD,
        k * 62,
        y0 + h * 0.55 + 19,
        z1 + 1.5,
      ),
    )
  }
  parts.push(part(new THREE.BoxGeometry(34, 56, 4), C.ink, 40, y0 + 28, z0 - 1))
  for (let k = 0; k < 7; k++) {
    const zn = CASTLE.z0 + 0.03 + k * 0.035
    parts.push(
      part(
        new THREE.BoxGeometry(5, 18, 5),
        C.driftD,
        w / 2 + 2,
        y0 + h + 18,
        zOf(zn),
      ),
    )
    parts.push(
      part(
        new THREE.BoxGeometry(5, 18, 5),
        C.driftD,
        -w / 2 - 2,
        y0 + h + 18,
        zOf(zn),
      ),
    )
  }
}

export const castleTop = () => deckY(CASTLE.z0) + CASTLE.h + 10

function masts(parts: THREE.BufferGeometry[]) {
  const y0 = deckY(MAIN_Z / (L / 2))
  const top = y0 + MAIN_H
  parts.push(rod(v(0, y0 - 10, MAIN_Z), v(0, top, MAIN_Z), 11, C.driftD, 7))
  parts.push(
    rod(
      v(-165, y0 + 560, MAIN_Z + 14),
      v(165, y0 + 560, MAIN_Z + 14),
      6,
      C.driftD,
      5,
    ),
  )
  parts.push(
    rod(
      v(-185, y0 + 262, MAIN_Z + 14),
      v(185, y0 + 262, MAIN_Z + 14),
      6,
      C.driftD,
      5,
    ),
  )
  parts.push(
    part(
      new THREE.CylinderGeometry(36, 30, 34, 10, 1, true),
      C.drift,
      0,
      y0 + 596,
      MAIN_Z,
    ),
  )
  parts.push(
    part(
      new THREE.CylinderGeometry(36, 36, 5, 10),
      C.driftD,
      0,
      y0 + 580,
      MAIN_Z,
    ),
  )
  const bow = v(0, deckY(-0.97) + 16, zOf(-0.97))
  const sprit = v(0, bow.y + 110, bow.z - 230)
  parts.push(rod(bow, sprit, 8, C.driftD, 6))
  parts.push(rod(v(0, top - 6, MAIN_Z), sprit, 2.2, C.rope, 4))
  const ct = castleTop()
  const miz = ct + 330
  parts.push(rod(v(0, ct - 6, MIZ_Z), v(0, miz, MIZ_Z), 8, C.driftD, 6))
  parts.push(
    rod(
      v(-110, ct + 250, MIZ_Z + 10),
      v(110, ct + 250, MIZ_Z + 10),
      4.5,
      C.driftD,
      5,
    ),
  )
  parts.push(rod(v(0, top - 6, MAIN_Z), v(0, miz - 6, MIZ_Z), 2.2, C.rope, 4))
  for (const s of [-1, 1]) {
    parts.push(
      rod(
        v(0, top - 60, MAIN_Z),
        v(s * half(-0.1), deckY(-0.1) + 18, MAIN_Z + 130),
        2,
        C.rope,
        4,
      ),
    )
    parts.push(
      rod(
        v(0, miz - 40, MIZ_Z),
        v(s * half(0.6) * 0.9, castleTop(), MIZ_Z + 60),
        2,
        C.rope,
        4,
      ),
    )
  }
  const fz = zOf(-0.6)
  const fy = deckY(-0.6)
  parts.push(rod(v(0, fy - 10, fz), v(0, fy + 170, fz), 10, C.driftD, 7))
  parts.push(
    rod(v(4, fy + 160, fz + 8), v(-190, fy - 40, fz + 300), 9, C.drift, 7),
  )
  parts.push(
    part(new THREE.ConeGeometry(14, 30, 6), C.driftL, 0, fy + 182, fz, 0, 0.5),
  )
  parts.push(
    rod(v(-120, fy + 40, fz + 180), v(-150, fy - 30, fz + 240), 4, C.drift, 4),
  )
  const sag = new THREE.CatmullRomCurve3([
    v(-60, fy + 90, fz + 100),
    v(-110, fy + 20, fz + 160),
    v(-150, fy - 10, fz + 260),
  ])
  parts.push(part(new THREE.TubeGeometry(sag, 8, 2, 4), C.rope))
}

function figurehead(parts: THREE.BufferGeometry[]) {
  const head: THREE.BufferGeometry[] = []
  folk(head, 0, 0, 0, C.teal, 30, C.folk2)
  const g = merged(head)
  g.rotateY(Math.PI / 2 + 0.25)
  g.rotateZ(-0.25)
  g.translate(0, deckY(-0.97) - 30, zOf(-0.99) - 30)
  parts.push(g)
}

function keel(parts: THREE.BufferGeometry[]) {
  const pts: THREE.Vector3[] = []
  for (let k = 0; k <= 12; k++) {
    const zn = -1 + (k / 12) * 1.86
    pts.push(
      v(
        0,
        Math.max(
          0,
          (1 - Math.sqrt(Math.max(0, 1 - zn * zn))) * (D + sheer(zn)),
        ) - 4,
        zOf(zn),
      ),
    )
  }
  parts.push(
    part(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 9, 4),
      C.driftD,
    ),
  )
  const roll = rng(4)
  for (let k = 0; k < 26; k++) {
    const zn = -0.9 + roll() * 1.7
    const a = 0.75 + roll() * 0.5
    const lift = 1 - Math.cos(a)
    parts.push(
      part(
        new THREE.SphereGeometry(5 + roll() * 4, 5, 3),
        roll() < 0.5 ? C.white : C.glass,
        Math.sin(a) * half(zn) + 2,
        lift * (D + sheer(zn)) + 6,
        zOf(zn),
      ),
    )
  }
}

export function wreckGeometry() {
  const parts: THREE.BufferGeometry[] = [hullShell(), deck()]
  rails(parts)
  seams(parts)
  ribs(parts)
  scaffold(parts)
  castle(parts)
  masts(parts)
  figurehead(parts)
  keel(parts)
  parts.push(
    part(
      new THREE.BoxGeometry(50, 30, 50),
      C.ink,
      -30,
      deckY(-0.3) + 1,
      zOf(-0.3),
    ),
  )
  for (const [x, zn] of [
    [60, -0.45],
    [-80, 0.1],
    [70, 0.25],
  ] as const) {
    parts.push(
      part(
        new THREE.CylinderGeometry(16, 16, 34, 8),
        C.gold,
        x,
        deckY(zn) + 17,
        zOf(zn),
      ),
    )
    parts.push(
      part(
        new THREE.CylinderGeometry(17, 17, 5, 8),
        C.rind,
        x,
        deckY(zn) + 26,
        zOf(zn),
      ),
    )
  }
  parts.push(
    part(
      new THREE.TorusGeometry(22, 7, 5, 12),
      C.coral,
      half(-0.3) + 4,
      deckY(-0.3) - 30,
      zOf(-0.3),
      Math.PI / 2 - 0.1,
    ),
  )
  for (const p of parts) if (!p.getAttribute('normal')) p.computeVertexNormals()
  return merged(parts)
}
