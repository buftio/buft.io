import * as THREE from 'three'
import { fog, FOG_FRAGMENT, FOG_HEAD } from './fog'

export const K = {
  still: 0,
  flag: 1,
  glow: 2,
  walk: 3,
  smoke: 4,
  rock: 5,
  drip: 6,
  banner: 7,
  look: 8,
  bob: 9,
  fire: 10,
  spin: 11,
}

const HEAD = /* glsl */ `
attribute vec4 aAnim;
attribute vec3 aPivot;
attribute vec3 aState;
uniform float uTime;
uniform vec3 uWarn;
varying vec3 vHeat;
varying float vFade;
mat2 spin(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
`

const MOVE = /* glsl */ `
vec3 transformed = vec3(position);
int kind = int(aAnim.x + 0.5);
float seed = fract(sin(dot(instanceMatrix[3].xy, vec2(0.0129898, 0.078233))) * 43758.5453);
float t = uTime + seed * 37.0;
float ph = aAnim.y;
vec3 rel = position - aPivot;
float crew = max(aState.x, 0.06);
float run = aState.y;
float alarm = aState.z;
vHeat = vec3(0.0);
vFade = 1.0;
if (kind == 1) {
  float d = max(rel.x, 0.0);
  float w = t * aAnim.z * (1.0 + alarm) + ph * 6.0 - d * 16.0;
  transformed.z += sin(w) * d * 0.45;
  transformed.y += cos(w * 0.7) * d * 0.06;
} else if (kind == 2) {
  float on = aAnim.z > 0.5 ? 1.0 : max(alarm, step(0.3, fract(sin(floor(t * 0.07 + ph * 3.1) * 91.7 + ph * 13.0) * 4375.5)));
  float flick = 0.82 + 0.18 * sin(t * 9.0 + ph * 5.0) * sin(t * 5.3 + ph);
  vHeat = vec3(1.0, 0.42, 0.06) * 0.95 * aAnim.w * on * flick * run;
} else if (kind == 3) {
  vec3 dir = aAnim.z > 0.5 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
  float x = t * (0.5 + 0.9 * alarm) + ph;
  transformed += dir * sin(x + 0.25 * sin(2.0 * x)) * aAnim.w;
  transformed.y += abs(sin(t * 6.5 + ph)) * 0.012;
} else if (kind == 4) {
  float u = fract(t * aAnim.z + ph);
  transformed = aPivot + rel * (0.5 + u * 1.9) + vec3(u * 0.2 + 0.03 * sin(t + ph * 6.0), u * 0.62, 0.0);
  vFade = smoothstep(0.0, 0.15, u) * (1.0 - u) * 0.85;
  vHeat = vec3(0.42, 0.38, 0.46) * (1.0 - 0.5 * u);
} else if (kind == 5) {
  float a = sin(t * aAnim.z * run + ph) * aAnim.w;
  transformed.xy = aPivot.xy + spin(a) * rel.xy;
} else if (kind == 6) {
  float u = fract(t * aAnim.z + ph);
  transformed.y -= u * u * aAnim.w;
  vFade = run * smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.8, 1.0, u));
} else if (kind == 7) {
  transformed.y = aPivot.y + rel.y * crew;
  vec3 out_ = normalize(vec3(aPivot.x, 0.0, aPivot.z) + vec3(0.0, 0.0, 1e-3));
  transformed += out_ * (0.6 + 0.4 * sin(t * (1.4 + 4.0 * alarm) + ph)) * rel.y * crew * -0.12;
} else if (kind == 8) {
  float a = sin(t * (0.45 + 2.6 * alarm) + ph + 0.4 * sin(t * 0.23)) * 1.0;
  transformed.xz = aPivot.xz + spin(a) * rel.xz;
  transformed.y += alarm * abs(sin(t * 8.0)) * 0.06;
} else if (kind == 9) {
  transformed.y += (0.5 + 0.5 * sin(t * aAnim.z + ph)) * aAnim.w * run;
} else if (kind == 10) {
  float s = (0.8 + 0.5 * alarm) * run * (0.85 + 0.25 * sin(t * 13.0 + ph) * sin(t * 7.0));
  transformed = aPivot + rel * vec3(s, s * (1.0 + (0.2 + 0.15 * alarm) * sin(t * 11.0 + ph)), s);
  transformed.x += rel.y * (0.1 + 0.25 * alarm) * sin(t * 6.0 + ph);
  vHeat = color.rgb * (0.45 + 0.35 * alarm);
} else if (kind == 11) {
  transformed.xy = aPivot.xy + spin(uTime * aAnim.z * run + ph) * rel.xy;
}
`

const TINT = /* glsl */ `
if (int(aAnim.x + 0.5) == 7) {
  vec3 tint = vec3(1.0);
  #ifdef USE_INSTANCING_COLOR
  tint = instanceColor.rgb;
  #endif
  vColor.rgb = mix(uWarn, color.rgb, smoothstep(0.25, 0.85, aState.x)) * tint;
}
`

export function animated(roughness: number) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness,
    transparent: true,
    side: THREE.DoubleSide,
  })
  material.userData.time = { value: 0 }
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = material.userData.time
    shader.uniforms.uWarn = { value: new THREE.Color('#ff5a3d') }
    shader.vertexShader =
      HEAD +
      shader.vertexShader
        .replace('#include <begin_vertex>', MOVE)
        .replace('#include <color_vertex>', `#include <color_vertex>\n${TINT}`)
    shader.fragmentShader =
      'varying vec3 vHeat;\nvarying float vFade;\n' +
      shader.fragmentShader
        .replace(
          '#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.a *= vFade;',
        )
        .replace(
          '#include <emissivemap_fragment>',
          '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vHeat;',
        )
  }
  return material
}

export function state(n: number, fill: [number, number, number]) {
  return new THREE.InstancedBufferAttribute(
    Float32Array.from({ length: n * 3 }, (_, i) => fill[i % 3]),
    3,
  )
}

export const tick = (mesh: THREE.Mesh | null, t: number) => {
  const time = (mesh?.material as THREE.Material | undefined)?.userData.time
  if (time) time.value = t
}

const seep = {
  vertexShader: /* glsl */ `
    attribute float aRich;
    varying vec2 vFogAt;
    varying vec2 vUv;
    varying float vSeed;
    varying float vRich;
    void main() {
      vUv = position.xy;
      vSeed = fract(sin(dot(instanceMatrix[3].xy, vec2(0.0129898, 0.078233))) * 43758.5453);
      vRich = aRich;
      vFogAt = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xy;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    ${FOG_HEAD}
    uniform float uTime;
    varying vec2 vUv;
    varying float vSeed;
    varying float vRich;
    float hash(float n) { return fract(sin(n) * 43758.5453); }
    float wob(float a, float s, float t) {
      return 0.06 * sin(3.0 * a + s * 20.0 + t * 0.31) + 0.04 * sin(5.0 * a + s * 31.0 - t * 0.23) + 0.025 * sin(9.0 * a + s * 7.0 + t * 0.5);
    }
    void main() {
      float t = uTime + vSeed * 50.0;
      float r = length(vUv);
      float a = atan(vUv.y, vUv.x);
      float px = max(fwidth(r), 1e-4);
      float edge = 0.84 + wob(a, vSeed, t);
      float blobs = 0.0;
      float gloss = 0.0;
      for (int i = 0; i < 6; i++) {
        float fi = float(i);
        float ang = vSeed * 6.283 + fi * 1.07 + 0.25 * sin(t * 0.17 + fi);
        float out_ = edge + 0.08 + 0.06 * sin(t * 0.35 + fi * 2.1);
        vec2 c = vec2(cos(ang), sin(ang)) * out_;
        float size = 0.035 + 0.03 * hash(fi + vSeed * 9.0);
        blobs = max(blobs, smoothstep(size + px, size - px, length(vUv - c)));
        gloss = max(gloss, smoothstep(size * 0.45, size * 0.2, length(vUv - c - vec2(-0.3, 0.35) * size)));
      }
      float pool = smoothstep(edge + px, edge - px, r);
      float shape = max(pool, blobs);
      if (shape <= 0.0) discard;
      float inside = edge - r;
      float lip = 1.0 - smoothstep(max(0.012, 1.6 * px), max(0.03, 2.6 * px), inside);
      float meniscus = smoothstep(0.03, 0.045, inside) * (1.0 - smoothstep(0.055, 0.085, inside));
      float depth = smoothstep(0.0, 0.55, inside);
      float wave = sin(vUv.x * 9.0 + t * 0.5 + vSeed * 10.0) * sin(vUv.y * 11.0 - t * 0.4 + vSeed * 4.0);
      float caustic = smoothstep(0.55, 0.95, wave) * depth;
      vec3 col = mix(vec3(1.0, 0.84, 0.4), vec3(0.93, 0.58, 0.08), depth);
      col = mix(col, vec3(1.0, 0.93, 0.62), caustic * 0.45);
      float alpha = mix(0.62, 0.86, depth) * (0.8 + 0.2 * vRich);
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float u = fract(t * 0.23 + fi * 0.37);
        float cyc = floor(t * 0.23 + fi * 0.37);
        vec2 c = (vec2(hash(cyc * 3.1 + fi + vSeed), hash(cyc * 7.7 + fi * 2.0 + vSeed)) - 0.5) * 0.9;
        float ring = smoothstep(0.015 + px, 0.015 - px, abs(length(vUv - c) - u * 0.14)) * (1.0 - u);
        col = mix(col, vec3(1.0, 0.95, 0.72), ring * 0.7);
      }
      float shine = smoothstep(0.32, 0.3, length(vUv - vec2(-0.26, 0.3))) * smoothstep(0.28, 0.3, length(vUv - vec2(-0.2, 0.22)));
      col = mix(col, vec3(1.0, 0.98, 0.86), shine * 0.75 * pool);
      col = mix(col, vec3(1.0, 0.97, 0.78), meniscus * 0.8 * pool);
      col = mix(col, mix(vec3(0.74, 0.42, 0.04), vec3(1.0, 0.72, 0.0), smoothstep(0.008, 0.04, px)), lip * pool);
      alpha = mix(alpha, 0.95, max(lip, meniscus * 0.6) * pool);
      vec3 drop = mix(vec3(0.96, 0.66, 0.1), vec3(1.0, 0.98, 0.85), gloss);
      col = mix(col, drop, blobs * (1.0 - pool));
      alpha = mix(alpha, 0.95, blobs * (1.0 - pool));
      gl_FragColor = vec4(col, alpha * shape);
      ${FOG_FRAGMENT}
    }`,
}

export function seepMaterial() {
  return new THREE.ShaderMaterial({
    ...seep,
    uniforms: { uTime: { value: 0 }, ...fog },
    transparent: true,
    depthTest: false,
    depthWrite: false,
  })
}
