'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { BUBBLES, STALLS, BLOWER, PEARLS, SHADY_B } from './data'
import { boost, hash, lift, type Mood } from './kit'

const vertex = `
attribute vec3 aFilm;
varying vec2 vUv;
varying vec3 vF;
void main() {
  vUv = uv;
  vF = aFilm;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}`

const fragment = `
uniform float uTime;
uniform float uDim;
uniform float uBody;
uniform float uBoost;
varying vec2 vUv;
varying vec3 vF;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  if (r > 1.0) discard;
  float a = atan(p.y, p.x);
  float h = vF.x + r * 0.8 + 0.14 * sin(a * 3.0 + uTime * 0.6 + vF.x * 9.0) + uTime * 0.03;
  vec3 c = 0.6 + 0.4 * cos(6.2832 * (h + vec3(0.0, 0.33, 0.67)));
  float rim = smoothstep(0.6, 0.96, r) * (1.0 - smoothstep(0.96, 1.0, r));
  float spec = smoothstep(0.3, 0.0, length(p - vec2(-0.4, 0.45)));
  vec3 col = mix(c, vec3(1.0), spec * 0.8);
  float ooze = 0.5 + 0.5 * sin(a * 2.0 - uTime * 0.8 + r * 7.0);
  vec3 sick = mix(vec3(0.16, 0.08, 0.22), vec3(0.55, 0.75, 0.12), ooze * smoothstep(0.35, 0.95, r) * 0.6);
  col = mix(col, mix(sick, vec3(1.0), spec * 0.35), vF.z * 0.85);
  col = mix(col, vec3(0.3, 0.36, 0.16), uDim * 0.7);
  float alpha = (uBody + uBoost * 0.2 + rim * 0.8 + spec * 0.55 + vF.z * 0.45) * min(1.0, vF.y * (1.0 + uBoost)) * (1.0 - uDim * 0.7);
  gl_FragColor = vec4(col, alpha);
}`

const FLOATS = 26
const m = new THREE.Matrix4()
const q = new THREE.Quaternion()
const v = new THREE.Vector3()
const s = new THREE.Vector3()

function shader(body: number) {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uDim: { value: 0 }, uBody: { value: body }, uBoost: { value: 0 } },
    transparent: true,
    depthWrite: false,
  })
}

function discs(n: number, seg: number, gain: (k: number) => number, dark = -1) {
  const g = new THREE.CircleGeometry(1, seg)
  const a = new Float32Array(n * 3)
  for (let k = 0; k < n; k++) {
    a[k * 3] = hash(k + 3)
    a[k * 3 + 1] = gain(k)
    a[k * 3 + 2] = k === dark ? 1 : 0
  }
  g.setAttribute('aFilm', new THREE.InstancedBufferAttribute(a, 3))
  return g
}

const pearly = (x: number, y: number) => PEARLS.some(([px, py]) => Math.hypot(px - x, py - y) < 150)
const stally = (x: number, y: number) => STALLS.some((st) => Math.hypot(st.x - x, st.y - y) < 90)
const gain = (k: number) => (stally(BUBBLES[k].x, BUBBLES[k].y) ? 1 : pearly(BUBBLES[k].x, BUBBLES[k].y) ? 0.8 : 0.4)

export function Film({ mood, reduced }: { mood: RefObject<Mood>; reduced: boolean }) {
  const flatDisc = useMemo(() => discs(BUBBLES.length, 40, gain, SHADY_B), [])
  const airDisc = useMemo(() => discs(FLOATS, 28, () => 1.3), [])
  const flat = useMemo(() => shader(0.12), [])
  const air = useMemo(() => shader(0.06), [])
  const decals = useRef<THREE.InstancedMesh>(null)
  const floats = useRef<THREE.InstancedMesh>(null)
  const life = useRef(Float32Array.from({ length: FLOATS }, (_, k) => -k * 0.55))
  useEffect(() => () => [flatDisc, airDisc, flat, air].forEach((o) => o.dispose()), [flatDisc, airDisc, flat, air])

  useEffect(() => {
    const mesh = decals.current
    if (!mesh) return
    BUBBLES.forEach((b, k) => mesh.setMatrixAt(k, m.compose(v.set(b.x, -b.y, 2), q.identity(), s.set(Math.min(b.r, 160) * 0.94, Math.min(b.r, 160) * 0.94, 1))))
    mesh.instanceMatrix.needsUpdate = true
  }, [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    const dim = Math.min(1, mood.current.t * 2.5)
    for (const mat of [flat, air]) {
      mat.uniforms.uTime.value = reduced ? 0 : t
      mat.uniforms.uDim.value = dim
      mat.uniforms.uBoost.value = boost(mood.current.zoom)
    }
    const mesh = floats.current
    if (!mesh) return
    const src = STALLS[BLOWER]
    const L = life.current
    for (let k = 0; k < FLOATS; k++) {
      if (!reduced) L[k] += dt / (6 + hash(k) * 5)
      if (L[k] > 1) L[k] -= 1
      const u = Math.max(0, L[k])
      const pop = u > 0.93 ? 1 + (u - 0.93) * 8 : 1
      const r = (14 + hash(k + 9) * 26) * Math.min(1, u * 8) * (u > 0.985 ? 0 : pop)
      const rise = u * (900 + hash(k + 2) * 700)
      const dx = src.x - 40 + rise * (0.55 + hash(k + 5) * 0.4) + Math.sin(t * 0.9 + k) * 40
      const dy = src.y - 20 - rise * (0.35 + hash(k + 7) * 0.5)
      lift(v, dx, dy, 0, 60 + rise * 0.4, 0)
      mesh.setMatrixAt(k, m.compose(v, q.identity(), s.set(r, r, 1)))
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <instancedMesh ref={decals} args={[flatDisc, flat, BUBBLES.length]} renderOrder={41} frustumCulled={false} />
      <instancedMesh ref={floats} args={[airDisc, air, FLOATS]} renderOrder={49} frustumCulled={false} />
    </>
  )
}
