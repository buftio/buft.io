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
  TubeGeometry,
  CatmullRomCurve3,
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
  const curve = (c: string, points: V[], radius: number, taper = false) => {
    const path = new CatmullRomCurve3(points.map((p) => new Vector3(...p)))
    const geometry = new TubeGeometry(path, 16, radius, 6, false)
    if (taper) {
      const positions = geometry.getAttribute('position')
      for (let i = 0; i < positions.count; i++) {
        const t = Math.floor(i / 7) / 16
        const center = path.getPointAt(t)
        const vertex = new Vector3().fromBufferAttribute(positions, i)
        vertex.sub(center).multiplyScalar(0.35 + Math.sin(t * Math.PI) * 0.65)
        vertex.add(center)
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
      }
      geometry.computeVertexNormals()
    }
    add(geometry, c, [0, 0, 0], [1, 1, 1])
  }
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
  } else if (kind === 'bear') {
    const fur = '#a5764f'
    ball(fur, [0, 0.17, 0], [0.27, 0.28, 0.23])
    ball(cream, [0, 0.17, 0.095], [0.17, 0.19, 0.08])
    ball(fur, [0, 0.355, 0], [0.31, 0.29, 0.27])
    for (const s of [-1, 1]) {
      ball(fur, [s * 0.15, 0.4, 0], [0.13, 0.13, 0.08])
      ball('#e9bd9c', [s * 0.15, 0.4, 0.03], [0.075, 0.075, 0.025])
      ball(fur, [s * 0.12, 0.055, 0.07], [0.14, 0.11, 0.17])
      ball(fur, [s * 0.145, 0.17, 0.035], [0.09, 0.21, 0.1])
      ball(dark, [s * 0.055, 0.365, 0.133], [0.026, 0.031, 0.024])
    }
    ball(cream, [0, 0.302, 0.125], [0.14, 0.08, 0.08])
    ball(dark, [0, 0.32, 0.164], [0.044, 0.028, 0.025])
  } else if (kind === 'van') {
    const color = '#91a282'
    round(color, [0, 0.115, 0], [0.55, 0.2, 0.27])
    round(color, [-0.025, 0.22, 0], [0.48, 0.14, 0.24])
    box('#bfe3ec', [0.215, 0.227, 0], [0.016, 0.086, 0.19])
    for (const s of [-1, 1]) {
      box('#bfe3ec', [-0.055, 0.23, s * 0.124], [0.31, 0.078, 0.008])
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
    for (let i = 0; i < 4; i++) {
      const z = (i - 1.5) * 0.064,
        x = Math.abs(i - 1.5) * 0.026
      curve(
        ['#f3c83e', '#ffe06a', '#f7d34f', '#edba32'][i],
        [
          [-0.15 + x, 0.11, z],
          [-0.11, 0.045, z],
          [0.01, 0.035, z * 0.9],
          [0.13, 0.13, z * 0.65],
          [0.12, 0.255, z * 0.2],
        ],
        0.035,
        true,
      )
      ball('#725638', [-0.15 + x, 0.11, z], [0.025, 0.027, 0.025])
    }
    disc('#667442', [0.12, 0.275, 0], [0.045, 0.07, 0.055], [0, 0, 0.2])
    add(
      new SphereGeometry(0.5, 8, 4),
      '#427c4a',
      [0.06, 0.265, -0.02],
      [0.14, 0.018, 0.075],
      [0, 0.35, -0.25],
    )
    ball('#3989d1', [0.035, 0.078, 0.083], [0.06, 0.015, 0.043])
    box('#eaf4eb', [0.035, 0.087, 0.083], [0.028, 0.003, 0.009], [0, -0.4, 0])
  } else if (kind === 'grapes') {
    box('#95633f', [0, 0.018, 0], [0.28, 0.036, 0.23])
    for (const s of [-1, 1]) {
      box('#c7955d', [0, 0.05, s * 0.112], [0.3, 0.065, 0.024])
      box('#b18251', [s * 0.138, 0.05, 0], [0.024, 0.065, 0.23])
    }
    for (let row = 0; row < 3; row++) {
      const count = 5 - row
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count + row * 0.6
        ball(
          ['#764494', '#ad73c5', '#8b4cab', '#965bbb'][i % 4],
          [
            Math.cos(a) * (0.085 - row * 0.016),
            0.105 + row * 0.075,
            Math.sin(a) * (0.074 - row * 0.01),
          ],
          [0.115, 0.115, 0.115],
        )
      }
    }
    ball('#b880d2', [0, 0.27, 0], [0.11, 0.105, 0.11])
    curve(
      '#6b7643',
      [
        [0, 0.27, 0],
        [-0.035, 0.335, 0],
        [0.015, 0.355, 0],
        [0.05, 0.33, 0],
        [0.025, 0.32, 0],
      ],
      0.012,
    )
    for (let i = 0; i < 3; i++)
      add(
        new SphereGeometry(0.5, 8, 4),
        i === 1 ? '#4b9054' : leaf,
        [0.07 + i * 0.025, 0.309, -0.035 + i * 0.035],
        [0.13, 0.02, 0.073],
        [0, -0.5 + i * 0.5, 0.1],
      )
    box('#a0be66', [0.095, 0.322, 0], [0.105, 0.008, 0.009], [0, 0, 0.1])
    box('#e6bd60', [0, 0.037, 0.126], [0.065, 0.047, 0.012])
  } else if (kind === 'monkey') {
    const fur = '#875332',
      skin = '#edc291'
    curve(
      fur,
      [
        [0, 0.11, -0.07],
        [-0.12, 0.08, -0.12],
        [-0.22, 0.16, -0.09],
        [-0.22, 0.3, -0.06],
        [-0.14, 0.32, -0.035],
        [-0.115, 0.25, -0.01],
        [-0.16, 0.22, 0],
      ],
      0.023,
    )
    ball(fur, [0.035, 0.175, 0], [0.18, 0.245, 0.18])
    ball(skin, [0.035, 0.17, 0.077], [0.12, 0.155, 0.03])
    ball(fur, [0.035, 0.335, 0], [0.235, 0.21, 0.195])
    for (const s of [-1, 1]) {
      ball(fur, [0.035 + s * 0.137, 0.34, 0], [0.12, 0.14, 0.075])
      ball(skin, [0.035 + s * 0.139, 0.343, 0.029], [0.083, 0.102, 0.033])
      ball(skin, [0.035 + s * 0.047, 0.347, 0.086], [0.105, 0.118, 0.042])
      ball(dark, [0.035 + s * 0.042, 0.363, 0.109], [0.021, 0.025, 0.017])
      ball(fur, [0.035 + s * 0.072, 0.037, 0.04], [0.095, 0.075, 0.13])
      curve(
        fur,
        [
          [0.035 + s * 0.08, 0.255, 0],
          [0.035 + s * 0.13, 0.19, 0.025],
          [0.035 + s * 0.12, 0.13, 0.09],
        ],
        0.03,
      )
      ball(skin, [0.035 + s * 0.12, 0.13, 0.09], [0.062, 0.063, 0.06])
    }
    ball(skin, [0.035, 0.302, 0.102], [0.115, 0.078, 0.06])
    ball('#b67d55', [0.035, 0.324, 0.135], [0.037, 0.019, 0.014])
    add(
      new TorusGeometry(0.025, 0.005, 4, 8, Math.PI),
      dark,
      [0.035, 0.302, 0.132],
      [1, 0.55, 1],
      [0, 0, Math.PI],
    )
    add(
      new CylinderGeometry(0.058, 0.074, 0.073, 10),
      '#c72f3e',
      [0.035, 0.452, 0],
      [1, 1, 1],
    )
    disc('#e8b945', [0.035, 0.421, 0], [0.153, 0.015, 0.153])
    curve(
      '#edc44d',
      [
        [0.035, 0.49, 0],
        [0.075, 0.488, 0],
        [0.11, 0.45, 0],
      ],
      0.008,
    )
    ball('#edc44d', [0.11, 0.442, 0], [0.018, 0.038, 0.018])
    curve(
      '#ffdb50',
      [
        [0.11, 0.12, 0.13],
        [0.17, 0.11, 0.155],
        [0.21, 0.16, 0.14],
        [0.195, 0.22, 0.12],
      ],
      0.022,
      true,
    )
    ball('#765637', [0.195, 0.223, 0.12], [0.018, 0.021, 0.018])
  } else if (kind === 'car') {
    const red = '#cf2937',
      chrome = '#dde3df'
    round(red, [0, 0.093, 0], [0.54, 0.093, 0.25])
    round('#ed3e45', [0.145, 0.128, 0], [0.24, 0.055, 0.25])
    round(red, [-0.205, 0.128, 0], [0.12, 0.055, 0.25])
    box('#382a30', [-0.065, 0.144, 0], [0.195, 0.016, 0.2])
    for (const s of [-1, 1]) {
      round('#e7c795', [-0.103, 0.17, s * 0.052], [0.054, 0.061, 0.073])
      box(
        chrome,
        [0.018, 0.184, s * 0.102],
        [0.018, 0.095, 0.013],
        [0, 0, -0.24],
      )
      box('#f36a68', [0, 0.14, s * 0.125], [0.46, 0.013, 0.009])
      box(red, [-0.205, 0.166, s * 0.118], [0.102, 0.058, 0.017], [0, 0, -0.18])
      for (const x of [-0.17, 0.173]) {
        disc(
          '#302c31',
          [x, 0.056, s * 0.132],
          [0.108, 0.038, 0.108],
          [Math.PI / 2, 0, 0],
        )
        disc(
          '#fff1d5',
          [x, 0.056, s * 0.153],
          [0.081, 0.006, 0.081],
          [Math.PI / 2, 0, 0],
        )
        disc(
          chrome,
          [x, 0.056, s * 0.157],
          [0.048, 0.009, 0.048],
          [Math.PI / 2, 0, 0],
        )
      }
      ball('#fff1bd', [0.27, 0.124, s * 0.087], [0.022, 0.044, 0.044])
      box('#f78757', [-0.267, 0.125, s * 0.094], [0.009, 0.027, 0.033])
      box('#fff0cd', [0.151, 0.157, s * 0.037], [0.22, 0.005, 0.023])
    }
    box('#8dc9dc', [0.018, 0.181, 0], [0.013, 0.082, 0.192], [0, 0, -0.24])
    box(chrome, [0.028, 0.226, 0], [0.018, 0.014, 0.217])
    box('#f9ad95', [0.16, 0.158, -0.109], [0.185, 0.005, 0.013])
    box(dark, [0.277, 0.094, 0], [0.014, 0.039, 0.113])
    for (let i = -2; i <= 2; i++)
      box(chrome, [0.286, 0.094, i * 0.021], [0.006, 0.033, 0.007])
    for (const s of [-1, 1])
      box(chrome, [s * 0.277, 0.068, 0], [0.019, 0.022, 0.24])
    add(
      new TorusGeometry(0.027, 0.006, 4, 10),
      dark,
      [-0.018, 0.172, 0.052],
      [1, 1, 1],
      [0, Math.PI / 2, 0],
    )
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
