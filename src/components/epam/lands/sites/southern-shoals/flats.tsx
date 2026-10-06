'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { smoothstep } from './kit'
import { shore, type Shore } from './plan'

type Row = [number, number, number, string, number]
const SAND = '#f6e8c8'
const WET = '#e6d2a8'
const LINE = '#dcc499'
const FOAM = '#ffffff'
const SHALLOW = '#9fe3d3'

const COAST_ROWS: Row[] = [
  [-50, 0, -1, SAND, 0],
  [-8, 0, -1, SAND, 0.7],
  [0, 0.4, -1, SAND, 0.72],
  [2, 0.4, -1, LINE, 0.6],
  [4, 0.4, -1, SAND, 0.72],
  [0, 0.7, -1, SAND, 0.7],
  [2, 0.7, -1, LINE, 0.55],
  [4, 0.7, -1, WET, 0.7],
  [0, 1, -1, WET, 0.72],
  [2, 1, -1, FOAM, 0.95],
  [12, 1, -1, FOAM, 0],
  [12, 1, -1, SHALLOW, 0.3],
  [90, 1, -1, SHALLOW, 0.18],
  [300, 1, -1, SHALLOW, 0],
]
const WAVE_ROWS = (k: number): Row[] => [
  [0, 0, k, FOAM, 0],
  [7, 0, k, FOAM, 0.85],
  [18, 0, k, FOAM, 0],
]
const BAR_ROWS: Row[] = [
  [0, 0, -1, SAND, 0.85],
  [0, 0.7, -1, SAND, 0.85],
  [0, 1, -1, WET, 0.8],
  [4, 1, -1, FOAM, 0.95],
  [15, 1, -1, FOAM, 0],
  [15, 1, -1, SHALLOW, 0.3],
  [150, 1, -1, SHALLOW, 0],
]
export const BARS: [number, number, number, number][] = [
  [380, 980, 330, 0.3],
  [-380, 1180, 220, -0.4],
  [1180, 900, 260, 0.15],
]

const shader = {
  vertexShader: /* glsl */ `
    attribute vec2 aDir;
    attribute vec4 aRow;
    attribute vec4 aTint;
    attribute vec2 aWU;
    uniform float uTime;
    uniform float uTide;
    varying vec4 vTint;
    void main() {
      float k = 1.0 - aRow.w * (1.0 - uTide);
      float lobe = 0.55 + 0.25 * sin(aWU.y * 0.0047 + 1.3) + 0.2 * sin(aWU.y * 0.0131);
      float edge = aWU.x * k * (aRow.w > 0.5 ? 1.0 : lobe);
      float off = aRow.x + aRow.y * edge;
      float a = aTint.a;
      if (aRow.z >= 0.0) {
        float ph = fract(uTime * 0.055 + aRow.z / 3.0 + sin(aWU.y * 0.0021 + aRow.z) * 0.07);
        float room = clamp(aWU.x / 330.0, 0.3, 1.3);
        off = edge + 14.0 + (1.0 - ph) * 250.0 * room + aRow.x + sin(aWU.y * 0.013 + uTime * 0.7 + aRow.z) * 9.0;
        a *= smoothstep(0.0, 0.3, ph) * (1.0 - smoothstep(0.8, 1.0, ph));
      }
      vec3 p = position;
      p.xy += aDir * off;
      vTint = vec4(aTint.rgb, a);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec4 vTint;
    void main() { gl_FragColor = vTint; }`,
}

type Bufs = {
  pos: number[]
  dir: number[]
  row: number[]
  tint: number[]
  wu: number[]
  index: number[]
}

function strip(
  b: Bufs,
  pts: Shore[],
  rows: Row[],
  gain: number,
  z: number,
  closed = false,
) {
  const c = new THREE.Color()
  const base = b.pos.length / 3
  const R = rows.length
  const end = pts[pts.length - 1].u
  pts.forEach((p) => {
    const fade = closed
      ? 1
      : smoothstep(0, 500, p.u) * smoothstep(0, 500, end - p.u)
    for (const [fix, w, wave, hex, alpha] of rows) {
      c.set(hex)
      b.pos.push(p.x, -p.y, z)
      b.dir.push(p.nx, -p.ny)
      b.row.push(fix, w, wave, gain)
      b.tint.push(c.r, c.g, c.b, alpha * fade)
      b.wu.push(p.w, p.u)
    }
  })
  const n = pts.length
  const segs = closed ? n : n - 1
  for (let i = 0; i < segs; i++) {
    const j = (i + 1) % n
    for (let r = 0; r < R - 1; r++) {
      const a = base + i * R + r
      const d = base + j * R + r
      b.index.push(a, a + 1, d, d, a + 1, d + 1)
    }
  }
}

function bar([x, y, r, turn]: (typeof BARS)[number]): Shore[] {
  const out: Shore[] = []
  const M = 28
  for (let i = 0; i < M; i++) {
    const t = (i / M) * Math.PI * 2
    const ex = Math.cos(t) * 1.7 * (1 + 0.12 * Math.sin(t * 3 + x))
    const ey = Math.sin(t) * 0.6
    const nx = ex * Math.cos(turn) - ey * Math.sin(turn)
    const ny = ex * Math.sin(turn) + ey * Math.cos(turn)
    out.push({ x, y, nx, ny, w: r, u: i * 40 })
  }
  return out
}

function build() {
  const b: Bufs = { pos: [], dir: [], row: [], tint: [], wu: [], index: [] }
  const pts = shore()
  strip(b, pts, COAST_ROWS, 0.3, 1.5)
  for (let k = 0; k < 3; k++) strip(b, pts, WAVE_ROWS(k), 0.3, 1.8)
  BARS.forEach((spec) => strip(b, bar(spec), BAR_ROWS, 0.9, 1.6, true))
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
  g.setAttribute('aDir', new THREE.Float32BufferAttribute(b.dir, 2))
  g.setAttribute('aRow', new THREE.Float32BufferAttribute(b.row, 4))
  g.setAttribute('aTint', new THREE.Float32BufferAttribute(b.tint, 4))
  g.setAttribute('aWU', new THREE.Float32BufferAttribute(b.wu, 2))
  g.setIndex(b.index)
  return g
}

export function Flats({
  tide,
  clock,
}: {
  tide: RefObject<number>
  clock: RefObject<number>
}) {
  const geometry = useMemo(() => build(), [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: { uTime: { value: 0 }, uTide: { value: 0.5 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  const mesh = useRef<THREE.Mesh>(null)
  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const u = (m.material as THREE.ShaderMaterial).uniforms
    u.uTime.value = clock.current ?? 0
    u.uTide.value = tide.current ?? 0.5
  })
  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      material={material}
      renderOrder={41}
      frustumCulled={false}
    />
  )
}
