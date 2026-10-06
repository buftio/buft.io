'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { bank, LEN, STEPS } from './path'

export const WATER = 320
const IN = -520
const OUT = WATER + 300
export const LAMPS = 14

const vertexShader = `
attribute vec2 a;
varying vec2 vA;
void main() {
  vA = a;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragmentShader = `
uniform float uT;
uniform float uHope;
uniform float uLen;
uniform float uLamp[${LAMPS}];
uniform float uLit[${LAMPS}];
varying vec2 vA;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec4 star(vec2 q, float cell, float dens, float t, float pw, float big) {
  vec2 id = floor(q / cell);
  vec2 f = q - (id + 0.5) * cell;
  float h = h21(id);
  if (h > dens) return vec4(0.0);
  vec2 d = f - (vec2(h21(id + 7.1), h21(id + 3.3)) - 0.5) * cell * 0.5;
  float r = mix(1.6, 3.6, h21(id + 1.9)) * big;
  float rr = max(r, pw * 0.75);
  float e = (r * r) / (rr * rr);
  float tw = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(t * (0.8 + 2.6 * h21(id + 5.0)) + h * 60.0), 2.0);
  float core = exp(-dot(d, d) / (rr * rr)) * e;
  vec2 ad = abs(d);
  float ray = (exp(-ad.x / (rr * 0.3) - ad.y / (rr * 2.2)) + exp(-ad.y / (rr * 0.3) - ad.x / (rr * 2.2))) * e * step(0.55, h21(id + 9.0));
  float b = clamp((core * 1.4 + ray) * tw, 0.0, 1.0);
  vec3 c = mix(vec3(0.86, 0.93, 1.0), vec3(1.0, 0.92, 0.62), step(0.72, h21(id + 11.0)));
  return vec4(c, b);
}
void over(inout vec4 acc, vec3 c, float a) { acc.rgb = c * a + acc.rgb * (1.0 - a); acc.a = a + acc.a * (1.0 - a); }
void main() {
  float u = vA.x;
  float end = smoothstep(0.0, 260.0, u) * (1.0 - smoothstep(uLen - 260.0, uLen, u));
  float v = vA.y + 30.0 + (1.0 - end) * 150.0;
  float pw = max(fwidth(u), 0.001);
  vec4 acc = vec4(0.0);
  float halo = (1.0 - smoothstep(${WATER.toFixed(1)}, ${OUT.toFixed(1)}, v)) * step(${WATER.toFixed(1)} - 10.0, v);
  over(acc, vec3(0.45, 0.5, 0.95), halo * halo * 0.2 * (0.4 + 0.6 * uHope));
  float wet = smoothstep(-6.0, 10.0, v) * (1.0 - smoothstep(${WATER.toFixed(1)} - 10.0, ${WATER.toFixed(1)} + 6.0, v));
  float m = abs(v - ${(WATER / 2).toFixed(1)}) / ${(WATER / 2).toFixed(1)};
  vec3 water = mix(vec3(0.06, 0.08, 0.3), vec3(0.2, 0.21, 0.56), m * m);
  float far = smoothstep(2.5, 9.0, pw);
  float milk = 0.5 + 0.5 * sin(u * 0.006 - uT * 0.25 + sin(u * 0.0021 + 1.3) * 3.0);
  water += vec3(0.16, 0.2, 0.46) * far * (1.0 - m) * (0.35 + 0.65 * milk * milk) * uHope;
  float rip = sin(u * 0.022 - v * 0.012 + uT * 0.7 + sin(v * 0.04 + u * 0.004 + uT * 0.4) * 2.0);
  water += vec3(0.05, 0.08, 0.18) * smoothstep(0.82, 1.0, rip) * (1.0 - m);
  float glow = 0.0;
  for (int i = 0; i < ${LAMPS}; i++) {
    float du = (u - uLamp[i]) / (16.0 + v * 0.06);
    glow += uLit[i] * exp(-du * du) * (0.55 + 0.45 * sin(v * 0.18 - uT * 2.6 + float(i))) * (1.0 - smoothstep(20.0, 210.0, v));
  }
  water += vec3(1.0, 0.78, 0.4) * glow * 0.8;
  vec4 s1 = star(vec2(u - uT * 16.0, v), 42.0, 0.42, uT, pw, 1.0);
  vec4 s2 = star(vec2(u - uT * 7.0 + 300.0, v + 11.0), 96.0, 0.4, uT * 0.8, pw, 2.0);
  vec4 s3 = star(vec2(u - uT * 4.0 + 77.0, v + 40.0), 170.0, 0.5, uT * 0.6, pw, 3.4 * clamp(pw / 5.0, 1.0, 2.3));
  water = mix(water, s1.rgb, s1.a * uHope);
  water = mix(water, s2.rgb, s2.a * uHope);
  water = mix(water, s3.rgb, s3.a * uHope * smoothstep(1.0, 4.0, pw));
  water = mix(water * 0.6 + vec3(0.05), water, uHope);
  over(acc, water, wet * 0.93);
  float kw = max(6.0, pw * 1.2);
  float kerb = (exp(-v * v / (kw * kw)) + exp(-pow(v - ${WATER.toFixed(1)}, 2.0) / (kw * kw))) * (6.0 / kw);
  over(acc, vec3(0.9, 0.88, 0.98), clamp(kerb, 0.0, 1.0) * 0.95);
  float sn = smoothstep(${IN.toFixed(1)} + 30.0, -300.0, v) * (1.0 - smoothstep(-60.0, -10.0, v));
  vec4 g = star(vec2(u + uT * 3.0, v), 30.0, 0.4, uT * 1.3, pw, 1.1);
  over(acc, vec3(0.42, 0.4, 0.95), sn * 0.1 * uHope);
  over(acc, g.rgb, g.a * sn * uHope);
  gl_FragColor = vec4(acc.rgb / max(acc.a, 0.0001), acc.a * end);
}`

function ribbon() {
  const n = STEPS
  const pos = new Float32Array((n + 1) * 6)
  const att = new Float32Array((n + 1) * 4)
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const s = i / n
    for (const [j, v] of [IN, OUT].entries()) {
      const p = bank(s, v)
      pos.set([p.x, -p.y, 2], (i * 2 + j) * 3)
      att.set([s * LEN, v], (i * 2 + j) * 2)
    }
    if (i < n) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('a', new THREE.BufferAttribute(att, 2))
  g.setIndex(idx)
  return g
}

export const glow = { at: new Float32Array(LAMPS).fill(-9999), lit: new Float32Array(LAMPS) }

export function Moat({ hope, reduced }: { hope: RefObject<number>; reduced: boolean }) {
  const geo = useMemo(() => ribbon(), [])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uT: { value: 0 },
          uHope: { value: 1 },
          uLen: { value: LEN },
          uLamp: { value: new Array(LAMPS).fill(-9999) },
          uLit: { value: new Array(LAMPS).fill(0) },
        },
        transparent: true,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  )
  useEffect(() => () => {
    geo.dispose()
    mat.dispose()
  }, [geo, mat])
  const mesh = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const m = mesh.current?.material as THREE.ShaderMaterial | undefined
    if (!m) return
    const u = m.uniforms
    u.uT.value = reduced ? 0 : state.clock.elapsedTime
    u.uHope.value = hope.current
    const g = glow
    for (let i = 0; i < LAMPS; i++) {
      u.uLamp.value[i] = g.at[i]
      u.uLit.value[i] = g.lit[i]
    }
  })
  return <mesh ref={mesh} geometry={geo} material={mat} renderOrder={41} frustumCulled={false} />
}
