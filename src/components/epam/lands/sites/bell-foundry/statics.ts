import * as THREE from 'three'
import { Kit } from './kit'
import {
  BARRELS,
  COOL,
  COTTAGE,
  CRANE,
  FORGE,
  GANTRY,
  KILNS,
  ORE,
  RELAYS,
  SCRAP,
} from './layout'
import { bell, C, crane, folk, gantry, kiln, muffs, trumpet } from './models'
import { cottage, heap, relayPost } from './props'

export function statics() {
  const k = new Kit()
  k.place(GANTRY, gantry)
  KILNS.forEach((s) => k.place(s, (m) => kiln(m, s.h)))
  k.place(CRANE, (m) => {
    m.add(new THREE.CylinderGeometry(16, 22, 380, 8), C.wood, 0, 190, 0)
    m.add(new THREE.CylinderGeometry(50, 60, 24, 10), C.soot, 0, 12, 0)
    for (const y of [70, 160, 250])
      m.add(
        new THREE.TorusGeometry(23 - y * 0.016, 4, 4, 8),
        C.ink,
        0,
        y,
        0,
        Math.PI / 2,
      )
    for (let y = 40; y < 330; y += 36)
      m.add(new THREE.BoxGeometry(26, 5, 8), C.rope, 0, y, 22)
  })
  COOL.forEach(([x, y, h], i) =>
    k.place({ at: [x, y], size: 1, turn: i * 0.7 }, (m) =>
      bell(m, h, 0, i % 2 === 0),
    ),
  )
  SCRAP.forEach(([x, y, h, tip]) =>
    k.place({ at: [x, y], size: 1 }, (m) =>
      bell(m, h, h * 0.3, false, 0, 0, tip),
    ),
  )
  k.place(COTTAGE, cottage)
  RELAYS.forEach((at) => k.place({ at, size: 1 }, relayPost))
  k.place({ at: ORE, size: 1 }, (m) => heap(m, 16, 150, 7))
  k.place({ at: [FORGE[0] + 10, FORGE[1] + 70], size: 1 }, (m) => {
    m.add(new THREE.BoxGeometry(70, 30, 34), C.ink, 0, 45, 0)
    m.add(new THREE.BoxGeometry(34, 30, 24), C.dark, 0, 15, 0)
    m.add(
      new THREE.ConeGeometry(14, 30, 4),
      C.ink,
      48,
      52,
      0,
      0,
      0,
      -Math.PI / 2,
    )
  })
  BARRELS.forEach((at) =>
    k.place({ at, size: 1 }, (m) => {
      m.add(
        new THREE.CylinderGeometry(40, 35, 62, 12, 1, true),
        C.wood,
        0,
        31,
        0,
      )
      for (const y of [10, 52])
        m.add(
          new THREE.TorusGeometry(39, 3.5, 4, 12),
          C.ink,
          0,
          y,
          0,
          Math.PI / 2,
        )
      m.add(
        new THREE.TorusGeometry(40, 4, 4, 14),
        C.dark,
        0,
        62,
        0,
        Math.PI / 2,
      )
      m.add(new THREE.CylinderGeometry(38, 38, 2, 12), '#3fb7d6', 0, 56, 0)
    }),
  )
  return k.merge()
}

export const quencher = () =>
  folk((k) => {
    k.rod(
      new THREE.Vector3(-0.5, 0.6, 0.9),
      new THREE.Vector3(0, 0.7, 2.4),
      0.08,
      C.ink,
      4,
    )
    k.rod(
      new THREE.Vector3(0.5, 0.6, 0.9),
      new THREE.Vector3(0, 0.7, 2.4),
      0.08,
      C.ink,
      4,
    )
    k.add(new THREE.SphereGeometry(0.42, 8, 6), C.hot, 0, 0.6, 2.75)
  })

export const crowd = () => folk()
export const muffGuy = () => folk(muffs)
export const listener = () => folk(trumpet)

export function jib() {
  const k = new Kit()
  crane(k)
  k.add(new THREE.CylinderGeometry(4, 4, 10, 4), C.ink, 0, 375, 0)
  return k.merge()
}
