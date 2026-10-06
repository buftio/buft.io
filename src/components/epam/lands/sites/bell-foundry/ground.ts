import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { fan, lift, ribbon } from './kit'
import {
  COOL,
  COTTAGE,
  FORGE,
  GANTRY,
  KILNS,
  MOULDS,
  PIT,
  ROAD,
  RUNNEL,
  SCRAP,
} from './layout'

const v = new THREE.Vector3()

function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  return g
}

export function decals() {
  return merge([
    fan(GANTRY.at[0] + 250, GANTRY.at[1] + 30, 900, 230, '#2a1630', 0.35),
    ...KILNS.map((k) =>
      fan(k.at[0], k.at[1] + 30, k.h * 0.75, k.h * 0.6, '#24121c', 0.55),
    ),
    fan(COOL[2][0] + 20, COOL[2][1] - 30, 330, 250, '#f3d29b', 0.38),
    ribbon(ROAD, 46, '#f0d6a6', 0.5),
    fan(PIT[0], PIT[1], 210, 140, '#4a2418', 0.85, '#7a4a2a', 0),
    ...MOULDS.map(([x, y]) =>
      fan(x, y, 30, 20, '#2a120c', 0.95, '#2a120c', 0.6, 12),
    ),
    ribbon(RUNNEL, 20, '#3a1c14', 0.85, 16),
    fan(FORGE[0], FORGE[1], 120, 80, '#24121c', 0.6),
    fan(COTTAGE.at[0], COTTAGE.at[1] + 40, 300, 220, '#24121c', 0.45),
    ...SCRAP.map(([x, y, h]) =>
      fan(x, y + h * 0.2, h * 1.1, h * 0.7, '#24121c', 0.5),
    ),
  ])
}

export function embers() {
  const doors = KILNS.map((k) => {
    lift({ ...k, size: 1 }, 0, 0.1 * k.h, 0.5 * k.h, v)
    const g = fan(0, 0, 0.22 * k.h, 0.16 * k.h, '#ffb347', 0.95)
    return g.translate(v.x, v.y, v.z + 2)
  })
  lift(COTTAGE, -84, 152, 126, v)
  const lamp = fan(0, 0, 70, 56, '#ffb347', 0.7).translate(v.x, v.y, v.z + 4)
  return merge([
    ...KILNS.map((k) =>
      fan(k.at[0], k.at[1] - k.h * 0.2, k.h * 1.3, k.h * 1.1, '#ff7a2a', 0.22),
    ),
    ...doors,
    lamp,
    fan(FORGE[0], FORGE[1], 110, 80, '#ff8a2a', 1),
    ...COOL.map(([x, y, h]) =>
      fan(x, y + h * 0.05, h * 0.85, h * 0.55, '#ff9a3a', 0.75),
    ),
  ])
}

export function molten() {
  return merge([
    ribbon(RUNNEL, 40, '#ffbe55', 1, 16),
    fan(PIT[0], PIT[1], 240, 165, '#ff8a2a', 0.95),
    ...MOULDS.map(([x, y]) =>
      fan(x, y, 44, 32, '#fff1b0', 1, '#ff9a2a', 0.2, 12),
    ),
  ])
}
