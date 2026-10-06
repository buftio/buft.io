import * as THREE from 'three'
import { C, Kit, merge } from './kit'
import { CAPSTAN, FIELD, GRANNY, HANDLOOM, LINES, MID, SPOOLS, STALLS, VATS, WIDTH, type P } from './layout'

const H = Math.PI / 2

function beam(k: Kit, at: number, high: number) {
  const g = new THREE.CylinderGeometry(high * 0.45, high * 0.45, WIDTH + 90, 12)
  g.rotateZ(H)
  k.add(g, C.oak, 0, high, 0)
  for (const x of [-(WIDTH / 2 + 30), WIDTH / 2 + 30]) {
    k.add(new THREE.BoxGeometry(26, high + 20, 26), C.wood, x, (high + 20) / 2, 0)
    k.add(new THREE.SphereGeometry(18, 8, 6), C.teal, x, high + 26, 0)
  }
  return k.stand([MID, at], 1)
}

function pole(k: Kit, h: number, cap = C.teal) {
  k.add(new THREE.CylinderGeometry(7, 10, h, 6), C.wood, 0, h / 2, 0)
  k.add(new THREE.BoxGeometry(60, 8, 8), C.oak, 0, h - 14, 0)
  k.add(new THREE.TorusGeometry(12, 4, 4, 10), C.ink, 0, h, 0)
  k.add(new THREE.ConeGeometry(10, 22, 6), cap, 0, h + 20, 0)
}

function poles() {
  const k = new Kit()
  const out: THREE.BufferGeometry[] = []
  for (const { pts } of LINES)
    pts.forEach(([x, y, h], i) => {
      if (i === 0) return
      pole(k, h)
      out.push(k.stand([x, y], 1))
    })
  return out
}

function vat(at: P, r: number, h: number, dye: string, rim: string, i: number) {
  const k = new Kit()
  const tub = new THREE.CylinderGeometry(r, r * 0.92, h, 22, 1, true)
  k.add(tub, rim, 0, h / 2, 0)
  const inner = new THREE.CircleGeometry(r * 0.96, 22)
  inner.rotateX(-H)
  k.add(inner, dye, 0, h - 10, 0)
  for (const y of [h * 0.25, h * 0.8]) k.add(new THREE.TorusGeometry(r * 0.97, 4, 4, 22), C.ink, 0, y, 0, 0, H)
  const top = LINES[i].pts[0][2]
  for (const s of [-1, 1]) {
    const len = Math.hypot(r + 20, top)
    const leg = new THREE.BoxGeometry(14, len, 14)
    leg.rotateZ(s * Math.atan2(r + 20, top))
    k.add(leg, C.wood, (s * (r + 20)) / 2, top / 2, -r * 0.4)
  }
  k.add(new THREE.TorusGeometry(14, 5, 4, 10), C.ink, 0, top, -r * 0.4)
  if (i === 2) {
    for (const a of [0, 2.1, 4.2]) k.add(new THREE.BoxGeometry(70, 14, 14), C.oak, 0, 6, 0, a)
    k.add(new THREE.ConeGeometry(40, 50, 6), '#ff7a2e', 0, 20, r * 0.7)
  }
  return k.stand(at, 1)
}

function rack(at: P, color: string, turn: number) {
  const k = new Kit()
  for (const x of [-70, 70]) k.add(new THREE.BoxGeometry(10, 150, 10), C.wood, x, 75, 0)
  k.add(new THREE.BoxGeometry(170, 10, 10), C.oak, 0, 148, 0)
  for (let i = 0; i < 6; i++) k.add(new THREE.BoxGeometry(14, 80, 6), i % 2 ? color : C.stone, -55 + i * 22, 102, 0)
  return k.stand(at, 1, turn)
}

function spool(at: P, r: number, h: number, bands: string[], granny: boolean) {
  const k = new Kit()
  k.add(new THREE.CylinderGeometry(r + 32, r + 34, 22, 20), C.oak, 0, 11, 0)
  k.add(new THREE.CylinderGeometry(r + 32, r + 32, 22, 20), C.oak, 0, h - 11, 0)
  const span = (h - 44) / bands.length
  bands.forEach((c, i) => {
    k.add(new THREE.CylinderGeometry(r + 8, r + 8, span - 6, 18), c, 0, 22 + span * i + span / 2, 0)
    k.add(new THREE.TorusGeometry(r + 8, 2.5, 3, 18), C.white, 0, 22 + span * i + span * 0.3, 0, 0, H)
  })
  k.add(new THREE.CylinderGeometry(r, r, h - 20, 14), C.wood, 0, h / 2, 0)
  k.add(new THREE.BoxGeometry(r * 0.5, r * 0.7, 6), C.ink, 0, 22 + r * 0.35, r + 10)
  k.add(new THREE.SphereGeometry(r * 0.27, 8, 6), C.teal, 0, 22 + r * 0.72, r + 8)
  const k2 = k.eyes(h * 0.62, r + 12, r * 0.34, r * 0.2)
  if (!granny) {
    k2.add(new THREE.ConeGeometry(r + 20, r * 0.9, 10), C.teal, 0, h + r * 0.45, 0)
    k2.add(new THREE.CylinderGeometry(2.5, 2.5, 60, 4), C.ink, 0, h + r * 0.9 + 20, 0)
    k2.add(new THREE.ConeGeometry(10, 34, 3), C.mint, 14, h + r * 0.9 + 38, 0, 0, H)
  }
  return k.stand(at, 1)
}

function granny(at: P, h: number) {
  const k = new Kit()
  const y = h
  k.add(new THREE.CylinderGeometry(44, 48, 16, 12), C.madder, 0, y + 8, -6)
  const body = new THREE.SphereGeometry(42, 14, 10)
  body.scale(1, 1, 0.9)
  k.add(body, '#5d4cb4', 0, y + 50, 0)
  k.add(new THREE.SphereGeometry(20, 10, 8), C.white, 0, y + 96, -12)
  k.add(new THREE.TorusGeometry(40, 9, 5, 14), C.magenta, 0, y + 30, 2, 0, H)
  k.eyes(y + 62, 38, 15, 12)
  for (const s of [-1, 1]) k.add(new THREE.TorusGeometry(13, 2, 4, 12), C.ink, s * 15, y + 62, 41)
  k.add(new THREE.SphereGeometry(22, 10, 8), C.saffron, 58, y + 22, 18)
  for (const a of [0.4, 1.2, 2]) k.add(new THREE.TorusGeometry(22, 1.6, 3, 12), C.gold, 58, y + 22, 18, a, 0.8)
  return k.stand(at, 1)
}

function stall(at: P, awning: string, cloth: string[]) {
  const k = new Kit()
  for (const x of [-60, 60]) for (const z of [-30, 30]) k.add(new THREE.BoxGeometry(7, 110, 7), C.wood, x, 55, z)
  k.add(new THREE.BoxGeometry(130, 40, 56), C.oak, 0, 20, 18)
  for (let i = 0; i < 6; i++) {
    const s = new THREE.BoxGeometry(24, 5, 86)
    s.rotateX(-0.42)
    k.add(s, i % 2 ? C.white : awning, -60 + i * 24, 116, 4)
  }
  cloth.forEach((c, i) => {
    const b = new THREE.CylinderGeometry(11, 11, 46, 10)
    b.rotateZ(H)
    k.add(b, c, -36 + i * 36, 52, 26)
  })
  return k.stand(at, 1)
}

function handloom(at: P) {
  const k = new Kit()
  for (const x of [-60, 60]) k.add(new THREE.BoxGeometry(9, 120, 9), C.wood, x, 60, 0)
  k.add(new THREE.BoxGeometry(130, 9, 9), C.oak, 0, 118, 0)
  k.add(new THREE.BoxGeometry(130, 9, 12), C.oak, 0, 40, 6)
  const stripes = [C.indigo, C.saffron, C.madder, C.saffron, C.indigo, C.rose]
  stripes.forEach((c, i) => k.add(new THREE.BoxGeometry(110, 10, 2), c, 0, 50 + i * 10, 2))
  for (let i = 0; i < 12; i++) k.add(new THREE.BoxGeometry(1.5, 50, 1.5), C.stone, -50 + i * 9, 135 - 25 - 25, 2)
  return k.stand(at, 1)
}

function cart(at: P) {
  const k = new Kit()
  k.add(new THREE.BoxGeometry(110, 36, 60), C.wood, 0, 40, 0)
  for (const x of [-40, 40]) {
    const w = new THREE.CylinderGeometry(22, 22, 8, 12)
    w.rotateX(H)
    k.add(w, C.oak, x, 22, 34)
  }
  const blob = new THREE.SphereGeometry(40, 12, 8)
  blob.scale(1.2, 0.8, 0.9)
  k.add(blob, C.gold, 0, 70, 0)
  k.add(new THREE.BoxGeometry(80, 6, 6), C.oak, -90, 40, 0)
  return k.stand(at, 1, 0.3)
}

function capstanBase(at: P) {
  const k = new Kit()
  k.add(new THREE.CylinderGeometry(60, 64, 10, 18), C.oak, 0, 5, 0)
  return k.stand(at, 1)
}

export function statics() {
  const k = new Kit()
  const parts = [beam(k, FIELD.north, 70), beam(k, FIELD.south, 60), ...poles()]
  VATS.forEach((v, i) => parts.push(vat(v.at, v.r, v.h, v.dye, v.rim, i)))
  parts.push(rack([-640, -800], C.indigo, -0.3), rack([1230, 1120], C.madder, 0.4))
  SPOOLS.forEach((s, i) => parts.push(spool(s.at, s.r, s.h, s.bands, i === GRANNY)))
  parts.push(granny(SPOOLS[GRANNY].at, SPOOLS[GRANNY].h))
  STALLS.forEach((s) => parts.push(stall(s.at, s.awning, s.cloth)))
  parts.push(handloom(HANDLOOM), cart([330, 1320]), capstanBase(CAPSTAN))
  return merge(parts)
}
