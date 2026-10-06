import * as THREE from 'three'
import { KINDS, STATES } from './kinds'
import {
  BANNER,
  BODY,
  EYE,
  FOOT,
  PUPIL,
  SHADOW,
  SHIELD,
  SPEAR,
} from './warrior-part'

const vec = (c: THREE.Color) =>
  `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`

export const skins = (linear: boolean) =>
  `const vec3 SKINS[${KINDS.length}] = vec3[${KINDS.length}](${KINDS.map(
    (k) => {
      const c = new THREE.Color(k.skin)
      if (!linear) c.convertLinearToSRGB()
      return vec(c)
    },
  ).join(', ')});`

export const warriorVertex = /* glsl */ `
  attribute float aPart;
  attribute vec3 aPivot;
  attribute vec2 aSpot;
  attribute vec4 aLook;
  attribute vec2 aTag;
  uniform float uSize;
  uniform float uLift;
  uniform float uMove;
  uniform float uShadow;
  varying vec3 vColor;
  varying vec3 vPos;
  varying float vAlpha;
  varying float vFlat;
  varying float vFight;
  ${skins(true)}
  const float PITCH = 0.8726646;
  vec2 rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
  void main() {
    float kind = floor(aLook.x / ${STATES}.0);
    float state = aLook.x - kind * ${STATES}.0;
    float age = aLook.y;
    float seed = aLook.z;
    float face = aLook.w;
    int k = int(aPart + 0.5);
    float fight = step(0.5, state) * step(state, 1.5);
    float fallen = step(1.5, state) * step(state, 2.5);
    float eaten = step(2.5, state);
    float live = 1.0 - fallen - eaten;
    float calm = live * (1.0 - fight);
    float t = age * uMove;
    float walk = t * (6.5 + 3.0 * seed) + seed * 40.0;
    float jab = sin(t * 9.0 + seed * 40.0);
    float turn = min(1.0, abs(face) * 1.3);
    float side = face < 0.0 ? -1.0 : 1.0;
    bool bearer = seed < 0.35 && kind < 0.5;
    vec3 p = position;
    vec3 q = p - aPivot;
    if ((k == ${BANNER} && !bearer) || (k == ${SHIELD} && bearer) || (aTag.x > -0.5 && abs(aTag.x - kind) > 0.5)) q = vec3(0.0);
    float blink = calm * uMove * step(0.965, fract(age * 0.31 + seed * 7.0));
    float shut = max(blink, 1.0 - live);
    if (k == ${EYE} || k == ${PUPIL}) q.y *= mix(1.0, 0.14, shut) * (q.y > 0.0 ? 1.0 - 0.4 * fight : 1.0);
    if (k == ${PUPIL}) {
      q.x += (0.03 + 0.045 * turn) * live + 0.03 * sin(t * 11.0 + seed * 9.0) * calm;
      q.y += 0.025 * cos(t * 13.0 + seed * 5.0) * calm - 0.03 * fight;
      q *= mix(1.0, 0.0, shut);
    }
    if (k == ${FOOT}) {
      float ph = walk + (aPivot.x > 0.0 ? 0.0 : 3.14159) + fight * t * 6.0;
      q.y += max(0.0, sin(ph)) * 0.12 * live;
      q.z += cos(ph) * 0.09 * live;
    }
    if (k == ${BANNER}) q.z += sin(t * 7.0 + seed * 20.0 - q.x * 9.0) * 0.12 * q.x * live;
    if (k == ${SPEAR} || k == ${BANNER}) {
      q.yz = rot(q.yz, 0.08 * sin(walk * 0.5) * calm);
      q.xy = rot(q.xy, -fight * (1.25 + 0.2 * jab));
      q.x += fight * 0.3 * max(jab, 0.0);
    }
    if (k == ${SHIELD}) {
      q.xz = rot(q.xz, fight * 0.5);
      q.y += 0.04 * sin(walk) * calm;
    }
    p = aPivot + q;
    if (k == ${SHIELD}) p += fight * vec3(0.1, 0.06, 0.12);
    if (k != ${SHADOW}) {
      if (k != ${FOOT}) {
        float squash = 1.0 + 0.07 * cos(2.0 * walk) * calm;
        p.y = p.y * squash + abs(sin(walk)) * 0.13 * calm + abs(jab) * 0.05 * fight;
        p.xz /= sqrt(squash);
      }
      p.xy = rot(p.xy, -0.2 * fight * (1.0 + 0.5 * max(jab, 0.0)));
      p.xz = rot(p.xz, -turn * 0.5);
      p.x *= side;
      p.xy = rot(p.xy, min(1.0, age / 0.35) * 1.45 * (seed > 0.5 ? 1.0 : -1.0) * fallen);
      p *= 1.0 - 0.55 * min(1.0, age / 3.0) * eaten;
      p.yz = rot(p.yz, PITCH);
    } else {
      p.xy *= 1.0 - 0.4 * (1.0 - live) * min(1.0, age);
      p.z = -0.1;
      p.y += 0.06;
    }
    vPos = p * uSize;
    vec3 skin = SKINS[int(kind + 0.5)];
    vec3 tint = aTag.y > 1.5 ? mix(skin, vec3(1.0), 0.3) : aTag.y > 0.5 ? skin : color;
    if (k == ${BODY} || k == ${FOOT}) tint = mix(tint, vec3(0.3, 0.03, 0.42), fight * 0.35);
    if (k == ${EYE}) tint = mix(tint, vec3(0.03, 0.01, 0.04), shut);
    tint = mix(tint, vec3(0.32), fallen * min(1.0, age / 0.8) * 0.6);
    tint = mix(tint, vec3(0.07, 0.15, 0.01), eaten * min(1.0, age / 0.6) * 0.85);
    vColor = tint;
    vFlat = k == ${SHADOW} ? 1.0 : 0.0;
    vFight = fight - (1.0 - live);
    float fade = 1.0 - smoothstep(2.6, 4.0, age) * fallen - smoothstep(0.6, 3.2, age) * eaten;
    vAlpha = fade * (k == ${SHADOW} ? 0.24 * uShadow : 1.0);
    vec3 world = vec3(aSpot.x, -aSpot.y, uLift) + vPos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }`

export const warriorFragment = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vPos;
  varying float vAlpha;
  varying float vFlat;
  varying float vFight;
  void main() {
    vec3 n = normalize(cross(dFdx(vPos), dFdy(vPos)));
    if (n.z < 0.0) n = -n;
    vec3 light = normalize(vec3(-0.5, 0.8, 1.0));
    float sun = max(dot(n, light), 0.0);
    vec3 sky = mix(vec3(0.26, 0.15, 0.3), vec3(1.0, 0.96, 1.0), 0.5 + 0.5 * n.y);
    vec3 c = vColor * (sky * 0.8 + sun * 0.9);
    c *= mix(0.65, 1.0, smoothstep(0.0, 0.5, n.z));
    float rim = pow(1.0 - n.z, 5.0) * max(vFight + 1.0, 0.0);
    c += rim * mix(vec3(0.2, 0.9, 0.8), vec3(0.9, 0.3, 0.2), max(vFight, 0.0)) * 0.45;
    c = mix(c, vColor, vFlat);
    gl_FragColor = vec4(c, vAlpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`
