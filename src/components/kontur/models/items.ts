import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  Matrix4,
  Quaternion,
  Euler,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Kind } from '../map'

type V = [number, number, number]
const cache = new Map<Kind, BufferGeometry>()
export const itemHeight: Record<Kind, number> = {
  potato: 0.25,
  tomato: 0.29,
  bear: 0.46,
  van: 0.3,
  banana: 0.29,
  grapes: 0.34,
  monkey: 0.46,
  car: 0.23,
  paper: 0.04,
  gray: 0.055,
  gold: 0.065,
  diamond: 0.31,
}
const brown = '#a5764f',
  cream = '#f3e6cf',
  dark = '#2b2622',
  leaf = '#2f6b47'
function build(kind: Kind) {
  const parts: BufferGeometry[] = []
  function add(
    source: BufferGeometry,
    color: string,
    position: V,
    scale: V,
    rotation: V = [0, 0, 0],
  ) {
    const g = source.index ? source.toNonIndexed() : source.clone()
    source.dispose()
    g.deleteAttribute('uv')
    g.applyMatrix4(
      new Matrix4().compose(
        new Vector3(...position),
        new Quaternion().setFromEuler(new Euler(...rotation)),
        new Vector3(...scale),
      ),
    )
    const c = new Color(color),
      count = g.getAttribute('position').count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) c.toArray(colors, i * 3)
    g.setAttribute('color', new BufferAttribute(colors, 3))
    parts.push(g)
  }
  const ball = (c: string, p: V, s: V) =>
    add(new SphereGeometry(0.5, 8, 6), c, p, s)
  const box = (c: string, p: V, s: V, r?: V) =>
    add(new BoxGeometry(1, 1, 1), c, p, s, r)
  const round = (c: string, p: V, s: V) =>
    add(new RoundedBoxGeometry(1, 1, 1, 1, 0.08), c, p, s)
  const disc = (c: string, p: V, s: V, r?: V) =>
    add(new CylinderGeometry(0.5, 0.5, 1, 12), c, p, s, r)
  if (kind === 'potato') {
    ball(brown, [0, 0.13, 0], [0.4, 0.26, 0.3])
    ball('#b88957', [0.105, 0.12, 0.025], [0.2, 0.19, 0.23])
    for (const [x, z] of [
      [-0.1, 0.11],
      [0.05, 0.145],
      [0.12, 0.08],
    ])
      ball('#6e4a30', [x, 0.17, z], [0.035, 0.025, 0.018])
  } else if (kind === 'tomato') {
    ball('#d14b3c', [0, 0.135, 0], [0.35, 0.27, 0.34])
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5
      add(
        new ConeGeometry(0.5, 1, 3),
        leaf,
        [Math.sin(a) * 0.055, 0.275, Math.cos(a) * 0.055],
        [0.085, 0.025, 0.16],
        [0, a, 0],
      )
    }
    disc(leaf, [0, 0.29, 0], [0.035, 0.07, 0.035])
  } else if (kind === 'bear' || kind === 'monkey') {
    const monkey = kind === 'monkey',
      fur = monkey ? '#9d7353' : '#a5764f'
    ball(fur, [0, 0.17, 0], [0.27, 0.28, 0.23])
    ball(cream, [0, 0.17, 0.095], [0.17, 0.19, 0.08])
    ball(fur, [0, 0.355, 0], [0.31, 0.29, 0.27])
    if (monkey) ball('#e9bd9c', [0, 0.345, 0.115], [0.24, 0.19, 0.06])
    for (const s of [-1, 1]) {
      ball(fur, [s * 0.15, 0.4, 0], [0.13, 0.13, 0.08])
      ball('#e9bd9c', [s * 0.15, 0.4, 0.03], [0.075, 0.075, 0.025])
      ball(fur, [s * 0.12, 0.055, 0.07], [0.14, 0.11, 0.17])
      ball(fur, [s * 0.145, 0.17, 0.035], [0.09, 0.21, 0.1])
      ball(dark, [s * 0.055, 0.365, 0.133], [0.026, 0.031, 0.024])
    }
    ball(cream, [0, 0.302, 0.125], [0.14, 0.08, 0.08])
    ball(dark, [0, 0.32, 0.164], [0.044, 0.028, 0.025])
    if (monkey)
      add(
        new TorusGeometry(0.11, 0.022, 4, 10, Math.PI * 1.5),
        fur,
        [0.09, 0.095, -0.11],
        [1, 1, 1],
        [Math.PI / 2, 0, 0],
      )
  } else if (kind === 'van' || kind === 'car') {
    const van = kind === 'van',
      color = van ? '#91a282' : '#d14b3c'
    round(color, [0, 0.115, 0], [0.55, van ? 0.2 : 0.115, 0.27])
    if (!van) {
      const hood = new BoxGeometry(1, 1, 1)
      const positions = hood.getAttribute('position')
      for (let i = 0; i < positions.count; i++)
        if (positions.getY(i) > 0)
          positions.setY(i, 0.5 - (positions.getX(i) + 0.5) * 0.45)
      hood.computeVertexNormals()
      add(hood, color, [0.17, 0.135, 0], [0.21, 0.09, 0.265])
    }
    round(
      color,
      [van ? -0.025 : -0.055, van ? 0.22 : 0.17, 0],
      [van ? 0.48 : 0.27, van ? 0.14 : 0.085, 0.24],
    )
    box(
      '#bfe3ec',
      [van ? 0.215 : 0.07, van ? 0.227 : 0.177, 0],
      [0.016, van ? 0.086 : 0.06, 0.19],
      [0, 0, van ? 0 : -0.25],
    )
    for (const s of [-1, 1]) {
      box(
        '#bfe3ec',
        [-0.055, van ? 0.23 : 0.18, s * 0.124],
        [van ? 0.31 : 0.19, van ? 0.078 : 0.048, 0.008],
      )
      disc(
        '#3a3532',
        [-0.17, 0.064, s * 0.14],
        [0.115, 0.035, 0.115],
        [Math.PI / 2, 0, 0],
      )
      disc(
        '#3a3532',
        [0.17, 0.064, s * 0.14],
        [0.115, 0.035, 0.115],
        [Math.PI / 2, 0, 0],
      )
      ball('#fff0b9', [0.274, 0.12, s * 0.085], [0.018, 0.045, 0.045])
    }
    box('#9aa3a8', [0.279, 0.074, 0], [0.02, 0.025, 0.23])
  } else if (kind === 'banana') {
    for (let i = 0; i < 3; i++)
      add(
        new TorusGeometry(0.145, 0.037, 5, 10, Math.PI * 0.85),
        '#f2cc58',
        [(i - 1) * 0.061, 0.12, (i - 1) * 0.015],
        [0.72, 1, 1],
        [0, (i - 1) * 0.4, -0.65],
      )
    ball(leaf, [-0.09, 0.25, 0], [0.055, 0.055, 0.085])
  } else if (kind === 'grapes') {
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 3 - row; i++)
        ball(
          i % 2 ? '#9970b0' : '#7a4c8f',
          [(i - (2 - row) / 2) * 0.09, 0.235 - row * 0.085, (i % 2) * 0.045],
          [0.13, 0.13, 0.13],
        )
    ball('#9163a7', [0, 0.155, -0.065], [0.14, 0.14, 0.14])
    disc(leaf, [0, 0.325, 0], [0.025, 0.09, 0.025], [0, 0, -0.3])
    ball(leaf, [0.06, 0.33, 0], [0.13, 0.025, 0.055])
  } else if (kind === 'paper') {
    box('#fff9ef', [0, 0.015, 0], [0.3, 0.025, 0.37])
    round('#fff9ef', [0, 0.023, -0.17], [0.3, 0.035, 0.055])
    for (let i = 0; i < 3; i++)
      box('#9aa3a8', [0, 0.029, -0.07 + i * 0.06], [0.2, 0.003, 0.015])
  } else if (kind === 'gray' || kind === 'gold') {
    const c = kind === 'gold' ? '#e9b735' : '#9aa3a8'
    disc(c, [0, 0.027, 0], [0.32, 0.05, 0.32])
    add(
      new TorusGeometry(0.137, 0.014, 4, 12),
      kind === 'gold' ? '#ffe29a' : '#c3c7cb',
      [0, 0.054, 0],
      [1, 1, 1],
      [Math.PI / 2, 0, 0],
    )
    box(
      kind === 'gold' ? '#ffe29a' : '#c3c7cb',
      [0, 0.055, 0],
      [0.065, 0.015, 0.105],
      [0, 0.35, 0],
    )
  } else {
    add(
      new CylinderGeometry(0.12, 0.18, 0.12, 6),
      '#8bdeef',
      [0, 0.21, 0],
      [1, 1, 1],
    )
    add(
      new ConeGeometry(0.18, 0.2, 6),
      '#48bbd3',
      [0, 0.05, 0],
      [1, 1, 1],
      [0, 0, Math.PI],
    )
  }
  const merged = mergeGeometries(parts)!
  parts.forEach((p) => p.dispose())
  merged.computeBoundingBox()
  const b = merged.boundingBox!,
    size = new Vector3()
  b.getSize(size)
  const horizontal = kind === 'car' || kind === 'van' ? 0.56 : 0.45
  const factor = Math.min(1, horizontal / size.x, 0.45 / size.z)
  merged.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2)
  merged.scale(factor, itemHeight[kind] / size.y, factor)
  merged.computeBoundingBox()
  merged.computeBoundingSphere()
  return merged
}
export function itemGeometry(kind: Kind): BufferGeometry {
  let geometry = cache.get(kind)
  if (!geometry) {
    geometry = build(kind)
    cache.set(kind, geometry)
  }
  return geometry
}
