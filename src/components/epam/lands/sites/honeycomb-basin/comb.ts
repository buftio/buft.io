import * as THREE from 'three'
import type { Cell } from './cells'

export const FILL_S = 2.6
export const LID_S = 1.3
const RIM = 10
const V = RIM + 1

const vertex = /* glsl */ `
attribute vec2 aUv;
attribute vec3 aInfo;
attribute vec3 aLevel;
attribute vec3 aLid;
uniform float uTime;
varying vec2 vUv;
varying vec3 vInfo;
varying float vLevel;
varying float vLid;
varying vec2 vPos;
void main() {
  vUv = aUv;
  vPos = position.xy;
  vInfo = aInfo;
  float k = clamp((uTime - aLevel.z) / ${FILL_S.toFixed(2)}, 0.0, 1.0);
  vLevel = mix(aLevel.x, aLevel.y, k * k * (3.0 - 2.0 * k));
  vLid = mix(aLid.x, aLid.y, clamp((uTime - aLid.z) / ${LID_S.toFixed(2)}, 0.0, 1.0));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const fragment = /* glsl */ `
uniform float uTime;
uniform float uAlarm;
varying vec2 vUv;
varying vec3 vInfo;
varying float vLevel;
varying float vLid;
varying vec2 vPos;
float hex(vec2 p) {
  const vec2 s = vec2(1.0, 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(0.5, 1.0)) / s.xyxy) + 0.5;
  vec4 h = vec4(p - c.xy * s, p - (c.zw + 0.5) * s);
  vec2 q = dot(h.xy, h.xy) < dot(h.zw, h.zw) ? h.xy : h.zw;
  q = abs(q);
  return max(dot(q, s * 0.5), q.x);
}
void main() {
  vec2 p = vUv;
  vec2 hp = vPos / 34.0;
  float hw = fwidth(hp.x);
  float comb = smoothstep(0.5 - 0.07 - hw, 0.5 - 0.02, hex(hp)) * smoothstep(0.35, 0.08, hw);
  float r = length(p);
  float a = atan(p.y, p.x);
  float seed = vInfo.x;
  float aa = fwidth(r) * 1.2 + 0.004;
  float wob = 0.05 * sin(a * 5.0 + uTime * 1.7 + seed * 40.0) + 0.03 * sin(a * 3.0 - uTime * 1.1 + seed * 17.0);
  float edge = vLevel * 1.14 - r - wob * (1.0 - 0.75 * vLevel);
  float gold = smoothstep(-aa, aa, edge) * step(0.001, vLevel);
  vec3 g = mix(vec3(0.86, 0.47, 0.04), vec3(1.0, 0.84, 0.32), smoothstep(1.0, 0.05, r));
  g += 0.08 * sin(r * 16.0 - uTime * 2.6 + seed * 9.0) * (1.0 - r);
  g += vec3(0.5, 0.45, 0.3) * smoothstep(0.3, 0.0, length(p - vec2(-0.3, 0.32)));
  g += vec3(0.6, 0.4, 0.0) * smoothstep(0.08, 0.0, abs(edge)) * step(vLevel, 0.98);
  g = mix(g, g * 0.72, comb * 0.6);
  float sweep = vLid * 2.3 - 1.15 - p.x;
  float cov = smoothstep(-aa, aa, sweep);
  float hx = max(abs(p.x) * 0.866 + abs(p.y) * 0.5, abs(p.y));
  vec3 wax = vec3(0.98, 0.8, 0.42) * (0.88 + 0.12 * smoothstep(0.8, 0.1, r));
  wax = mix(wax, vec3(0.86, 0.56, 0.16), comb * 0.75);
  wax = mix(wax, vec3(0.8, 0.45, 0.1), smoothstep(0.05, 0.0, abs(hx - 0.3)) * 0.35 * (1.0 - comb));
  wax = mix(wax, vec3(0.95, 0.7, 0.3), smoothstep(0.12, 0.0, sweep) * step(vLid, 0.99));
  float rim = smoothstep(0.78, 0.97, r);
  vec3 frame = mix(vec3(0.85, 0.55, 0.12), vec3(1.0, 0.25, 0.12), uAlarm * (0.55 + 0.45 * sin(uTime * 6.0)));
  vec3 col = vec3(0.92, 0.66, 0.25);
  float far = smoothstep(0.14, 0.38, hw);
  col = mix(col, vec3(0.97, 0.78, 0.4), far);
  float alpha = 0.05 + comb * 0.32 + far * 0.42;
  col = mix(col, g, gold);
  alpha = mix(alpha, 0.94, gold);
  col = mix(col, wax, cov);
  alpha = mix(alpha, 0.96, cov);
  col = mix(col, frame, rim * 0.85);
  alpha = max(alpha, rim * 0.7);
  if (vInfo.y > 0.5) {
    float pulse = 0.5 + 0.5 * sin(uTime * 1.4 - length(vPos) * 0.012 + seed * 2.0);
    vec2 gp = hp * 0.5;
    vec2 gid = floor(gp);
    float gh = fract(sin(dot(gid, vec2(12.9898, 78.233))) * 43758.5453);
    float glint = step(0.72, gh) * pow(max(0.0, sin(uTime * (0.9 + gh) + gh * 60.0)), 24.0) * smoothstep(0.22, 0.0, length(fract(gp) - 0.5));
    col = mix(vec3(1.0, 0.9, 0.62), vec3(1.0, 0.98, 0.9), pulse);
    col = mix(col, vec3(0.95, 0.68, 0.25), comb * 0.55 + rim * 0.6);
    col += glint * 0.6;
    alpha = 0.35 + 0.25 * pulse + comb * 0.3 + rim * 0.4 + glint * 0.4;
  }
  gl_FragColor = vec4(col, alpha * vInfo.z);
}`

export function combMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    uniforms: { uTime: { value: 0 }, uAlarm: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

export function combGeometry(list: Cell[], mother: (c: Cell) => boolean, fade: (c: Cell) => number) {
  const n = list.length
  const pos = new Float32Array(n * V * 3)
  const uv = new Float32Array(n * V * 2)
  const info = new Float32Array(n * V * 3)
  const index: number[] = []
  list.forEach((c, i) => {
    const o = i * V
    const set = (k: number, x: number, y: number, u: number, v: number) => {
      pos.set([x, y, 3], (o + k) * 3)
      uv.set([u, v], (o + k) * 2)
      info.set([((i * 0.618) % 1) + 0.01, mother(c) ? 1 : 0, fade(c)], (o + k) * 3)
    }
    set(0, c.x, -c.y, 0, 0)
    for (let k = 0; k < RIM; k++) {
      const a = (k / RIM) * Math.PI * 2
      const r = c.r[k] * 0.97
      set(k + 1, c.x + Math.cos(a) * r, -(c.y + Math.sin(a) * r), Math.cos(a), -Math.sin(a))
      index.push(o, o + 1 + k, o + 1 + ((k + 1) % RIM))
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setAttribute('aUv', new THREE.BufferAttribute(uv, 2))
  g.setAttribute('aInfo', new THREE.BufferAttribute(info, 3))
  g.setAttribute('aLevel', new THREE.BufferAttribute(new Float32Array(n * V * 3), 3))
  g.setAttribute('aLid', new THREE.BufferAttribute(new Float32Array(n * V * 3), 3))
  g.setIndex(index)
  g.computeBoundingSphere()
  return g
}

export function writeCell(g: THREE.BufferGeometry, i: number, level: [number, number, number], lid: [number, number, number]) {
  const l = g.getAttribute('aLevel') as THREE.BufferAttribute
  const c = g.getAttribute('aLid') as THREE.BufferAttribute
  for (let k = 0; k < V; k++) {
    l.setXYZ(i * V + k, level[0], level[1], level[2])
    c.setXYZ(i * V + k, lid[0], lid[1], lid[2])
  }
  l.needsUpdate = true
  c.needsUpdate = true
}
