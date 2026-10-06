'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ISLES, rim, size, type Isle } from './isles'

type Edge = [number, string, number, number]
const STRIPS: [Edge, Edge][] = [
  [[-22, '#f8e0a6', 0.6, 0], [3, '#e9bd6c', 0.95, 0]],
  [[3, '#35d9c4', 0.55, 0], [52, '#35d9c4', 0, 0]],
  [[4, '#ffffff', 0, 1], [12, '#ffffff', 0.95, 1]],
  [[12, '#ffffff', 0.95, 1], [24, '#ffffff', 0, 1]],
]
const M = 24

const shader = {
  vertexShader: /* glsl */ `
    attribute vec4 aTint;
    attribute vec2 aDir;
    attribute vec4 aBand;
    attribute float aFill;
    uniform float uTime;
    uniform float uThin;
    uniform float uFill;
    varying vec4 vTint;
    void main() {
      float swell = sin(uTime * 1.25 + aBand.z) * 0.5 + 0.5;
      vec3 p = position;
      p.xy += aDir * (aBand.x * uThin + swell * 11.0 * uThin * aBand.y);
      vTint = aTint;
      vTint.a *= aBand.w * mix(1.0, 0.55 + 0.45 * swell, aBand.y) * mix(1.0, uFill, aFill);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec4 vTint;
    void main() { gl_FragColor = vTint; }`,
}

type Bufs = { pos: number[]; tint: number[]; dir: number[]; band: number[]; fill: number[]; index: number[] }

const DUNE = new THREE.Color('#f7e2a8')
const HEART = new THREE.Color('#fff4d2')

function fill(isle: Isle, b: Bufs, fade: number, small: number) {
  const base = b.pos.length / 3
  b.pos.push(isle[0], -isle[1], 2)
  b.dir.push(0, 0)
  b.band.push(0, 0, 0, fade)
  b.tint.push(HEART.r, HEART.g, HEART.b, 0.75)
  b.fill.push(1)
  for (let i = 0; i < M; i++) {
    const t = (i / M) * Math.PI * 2
    const r = rim(isle, t)
    b.pos.push(isle[0] + Math.cos(t) * r, -(isle[1] + Math.sin(t) * r), 2)
    b.dir.push(Math.cos(t), -Math.sin(t))
    b.band.push(Math.max(-22, small * 0.25 - r), 0, 0, fade)
    b.tint.push(DUNE.r, DUNE.g, DUNE.b, 1)
    b.fill.push(1)
    b.index.push(base, base + 1 + i, base + 1 + ((i + 1) % M))
  }
}

function ring(isle: Isle, k: number, b: Bufs) {
  const small = size(isle)
  const fade = 1 - THREE.MathUtils.smoothstep(Math.hypot(isle[0], isle[1]), 1250, 1700)
  fill(isle, b, fade, small)
  const c = new THREE.Color()
  for (const [inner, outer] of STRIPS) {
    const base = b.pos.length / 3
    for (let i = 0; i < M; i++) {
      const t = (i / M) * Math.PI * 2
      const r = rim(isle, t)
      for (const [off, hex, alpha, move] of [inner, outer]) {
        c.set(hex)
        b.pos.push(isle[0] + Math.cos(t) * r, -(isle[1] + Math.sin(t) * r), 2)
        b.dir.push(Math.cos(t), -Math.sin(t))
        b.band.push(Math.max(off, small * 0.25 - r), move, k * 1.7 + t * 2, fade)
        b.tint.push(c.r, c.g, c.b, alpha)
        b.fill.push(0)
      }
      const j = base + i * 2
      const n = base + ((i + 1) % M) * 2
      b.index.push(j, j + 1, n, n, j + 1, n + 1)
    }
  }
}

export function Shore({ reduced }: { reduced: boolean }) {
  const geometry = useMemo(() => {
    const b: Bufs = { pos: [], tint: [], dir: [], band: [], fill: [], index: [] }
    ISLES.forEach((isle, k) => ring(isle, k, b))
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3))
    g.setAttribute('aTint', new THREE.Float32BufferAttribute(b.tint, 4))
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(b.dir, 2))
    g.setAttribute('aBand', new THREE.Float32BufferAttribute(b.band, 4))
    g.setAttribute('aFill', new THREE.Float32BufferAttribute(b.fill, 1))
    g.setIndex(b.index)
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: { uTime: { value: 0 }, uThin: { value: 1 }, uFill: { value: 0.5 } },
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      }),
    [],
  )
  useEffect(() => () => [geometry, material].forEach((o) => o.dispose()), [geometry, material])
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const u = (m.material as THREE.ShaderMaterial).uniforms
    if (!reduced) u.uTime.value = state.clock.elapsedTime
    u.uThin.value = THREE.MathUtils.clamp(0.2 / state.camera.zoom, 0.45, 1.6)
    u.uFill.value = THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(Math.log(state.camera.zoom), Math.log(0.08), Math.log(0.9)), Math.log(0.08), Math.log(0.9), 0.85, 0.22)
  })
  return <mesh ref={mesh} geometry={geometry} material={material} renderOrder={41} frustumCulled={false} />
}
