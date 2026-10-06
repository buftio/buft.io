import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export const BODY = 0
export const WHITE = 1
export const PUPIL = 2
export const MOUTH = 3
export const FOOT = 4
export const HAT = 5
export const POM = 6

function part(
  shape: THREE.BufferGeometry,
  kind: number,
  anchor: THREE.Vector3,
  scale?: THREE.Vector3,
  turn?: THREE.Euler,
) {
  if (turn) shape.rotateX(turn.x)
  if (scale) shape.scale(scale.x, scale.y, scale.z)
  shape.translate(anchor.x, anchor.y, anchor.z)
  shape.deleteAttribute('uv')
  const n = shape.getAttribute('position').count
  const data = new Float32Array(n * 4)
  for (let i = 0; i < n; i++)
    data.set([kind, anchor.x, anchor.y, anchor.z], i * 4)
  shape.setAttribute('aPart', new THREE.BufferAttribute(data, 4))
  return shape
}

export function folkGeometry() {
  const up = new THREE.Euler(Math.PI / 2, 0, 0)
  const parts = [
    part(new THREE.SphereGeometry(1, 12, 9), BODY, new THREE.Vector3()),
  ]
  for (const side of [-1, 1]) {
    const eye = new THREE.Vector3(side * 0.36, 0.3, 0.86)
      .normalize()
      .multiplyScalar(0.9)
    parts.push(
      part(
        new THREE.SphereGeometry(0.31, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2),
        WHITE,
        eye,
        new THREE.Vector3(1, 1, 0.6),
        up,
      ),
    )
    const pupil = new THREE.CircleGeometry(0.15, 10)
    pupil.translate(0, 0, 0.2)
    parts.push(part(pupil, PUPIL, eye))
    parts.push(
      part(
        new THREE.SphereGeometry(0.21, 6, 4),
        FOOT,
        new THREE.Vector3(side * 0.4, -0.86, 0.3),
        new THREE.Vector3(1, 0.55, 1.35),
      ),
    )
  }
  parts.push(
    part(
      new THREE.SphereGeometry(0.17, 8, 4),
      MOUTH,
      new THREE.Vector3(0, -0.26, 0.96),
      new THREE.Vector3(1.5, 0.6, 0.45),
    ),
  )
  const top = new THREE.Vector3(0, 0.66, -0.06)
  parts.push(
    part(
      new THREE.SphereGeometry(0.62, 10, 3, 0, Math.PI * 2, 0, Math.PI / 2),
      HAT,
      top,
      new THREE.Vector3(1, 0.85, 1),
    ),
  )
  const pom = new THREE.SphereGeometry(0.15, 6, 4)
  pom.translate(0, 0.55, 0)
  parts.push(part(pom, POM, top))
  const shape = mergeGeometries(parts)
  parts.forEach((p) => p.dispose())
  const out = new THREE.InstancedBufferGeometry()
  out.setIndex(shape.index)
  for (const name of ['position', 'normal', 'aPart'])
    out.setAttribute(name, shape.getAttribute(name))
  out.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
  return out
}

export const folkShader = {
  vertexShader: /* glsl */ `
    attribute vec4 aPart;
    attribute vec4 iA;
    attribute vec4 iB;
    attribute vec3 iC;
    attribute vec4 iM;
    uniform float uTime;
    uniform float uPop;
    uniform float uDawn;
    uniform sampler2D uField;
    uniform vec2 uWorld;
    varying vec3 vColor;
    varying vec3 vNormal;
    varying float vAlpha;
    varying float vGloss;
    float hash(float n) { return fract(sin(n * 91.345) * 43758.5453); }
    mat3 yaw(float a) { float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
    mat3 roll(float a) { float c = cos(a), s = sin(a); return mat3(c, s, 0.0, -s, c, 0.0, 0.0, 0.0, 1.0); }
    const mat3 PITCH = mat3(1.0, 0.0, 0.0, 0.0, 0.866, 0.5, 0.0, -0.5, 0.866);
    void main() {
      float kind = aPart.x;
      float seed = iA.w;
      float R = iA.z * 0.86;
      float t = uTime + seed * 97.0;
      float fear = iM.x;
      float sick = iM.y;
      float lost = iM.z;
      float threat = iM.w;
      float well = (1.0 - sick) * (1.0 - lost);
      float calm = (1.0 - fear) * well;
      float paired = step(iB.z, 8.0);
      float chat = paired * step(hash(iB.w + 0.37), 0.7) * calm;
      vec2 toward = vec2(cos(iB.z), sin(iB.z));
      vec2 danger = vec2(cos(threat), sin(threat));

      float period = 3.0 + seed * 5.0;
      float beat = t / period;
      float k = floor(beat);
      float f = fract(beat);
      vec2 a0 = vec2(hash(k + seed), hash(k + seed + 7.3)) - 0.5;
      vec2 a1 = vec2(hash(k + 1.0 + seed), hash(k + 1.0 + seed + 7.3)) - 0.5;
      float moving = clamp(f * period / 0.6, 0.0, 1.0);
      vec2 shuffle = mix(a0, a1, smoothstep(0.0, 1.0, moving)) * 0.45 * (1.0 - chat * 0.8);
      float hop = sin(moving * 3.14159) * 0.16 * calm;
      float settle = f * period;
      float jiggle = exp(-settle * 3.0) * sin(settle * 28.0) * calm;

      float flight = 0.55 + 0.15 * sin(t * 7.0);
      vec2 offset = shuffle * calm - danger * fear * flight + vec2(sin(t * 61.0), cos(t * 53.0)) * fear * 0.04;
      float lift = hop + fear * abs(sin(t * 10.0)) * 0.22 - sick * 0.05;

      float speak = chat * step(0.5, fract(uTime / 2.3 + iB.w * 7.0 + step(0.0, toward.x) * 0.5));
      float turn = clamp(calm * sin(t * 0.37) * 0.3 * (1.0 - chat) + chat * toward.x * 0.5 + fear * danger.x * -0.4, -0.5, 0.5);
      float tip = sick * sin(t * 0.8) * 0.18 + lost * (seed - 0.5) * 0.9 + chat * (1.0 - speak) * sin(uTime * 3.0) * 0.03;
      float nod = chat * (1.0 - speak) * max(0.0, sin(uTime * 5.0 + seed)) * 0.05;

      float breathe = 1.0 + sin(t * 1.9) * 0.035 * calm + speak * abs(sin(uTime * 13.0)) * 0.05;
      vec3 squash = vec3(1.0 / sqrt(breathe), breathe, 1.0 / sqrt(breathe));
      squash *= mix(vec3(1.0), vec3(0.95, 0.62, 0.92), sick);
      squash *= mix(vec3(1.0), vec3(0.95, 0.5, 0.92), lost);

      vec3 anchor = aPart.yzw;
      vec3 o = position - anchor;
      float blinkAt = fract(t / (2.8 + seed * 3.5));
      float blink = step(0.955, blinkAt) * calm;
      float open = (1.0 - blink * 0.92) * mix(1.0, 0.42, sick) * mix(1.0, 0.24, lost);
      float wide = 1.0 + fear * 0.28;
      float glanceK = floor(t / (1.7 + seed * 2.0));
      vec2 glance = vec2(hash(glanceK + seed * 3.0), hash(glanceK + 11.0 + seed)) - 0.5;
      glance = hash(glanceK * 1.7 + seed) < 0.3 ? vec2(0.0, -0.05) : glance * 1.3;
      vec2 look = mix(glance, toward * 0.6, chat);
      look = mix(look, danger * 0.75, fear * well);
      look = mix(look, vec2(0.0, -0.7), sick);
      look += vec2(0.0, jiggle * 0.35);
      look = clamp(look, -0.75, 0.75);

      if (kind < 0.5) {
        o = vec3(0.0);
        anchor = position;
      } else if (kind < 1.5) {
        o.xy *= wide;
        o.y *= open;
      } else if (kind < 2.5) {
        o.xy *= (1.0 - fear * 0.35) * (1.0 - lost);
        o.xy += look * 0.17 * wide;
        o.y *= open;
        o.z += 0.02;
      } else if (kind < 3.5) {
        float w = mix(mix(1.0, 0.75, sick), 0.65, fear * well);
        float h = mix(0.62, 0.3, sick + lost) + fear * well * 1.6 + speak * (0.4 + 1.2 * abs(sin(uTime * 14.0 + seed)));
        o.x *= w;
        o.y *= h;
        o.y += (calm * (1.0 - speak) - (sick + lost) * 0.8) * o.x * o.x * 2.5;
      } else if (kind < 4.5) {
        float side = sign(anchor.x);
        float stepUp = hop * 0.9 * max(0.0, sin(moving * 6.283 * 2.0 + side * 1.57));
        o.y *= 1.0 - (sick + lost) * 0.5;
        anchor.y += stepUp + fear * max(0.0, sin(t * 20.0 + side * 1.57)) * 0.15;
      } else {
        float wear = step(hash(seed * 5.7), 0.26) * (1.0 - lost);
        o *= wear;
        o = roll(sick * 0.4 + (seed - 0.5) * 0.4) * o;
      }
      vec3 body = anchor * squash;
      body.y += lift;
      body.y -= nod * (anchor.y + 1.0);
      mat3 spin = roll(tip) * yaw(turn);
      vec3 w1 = PITCH * (spin * body);
      vec3 w2 = PITCH * (spin * o);
      float e = sqrt(iB.x);
      float ca = cos(iB.y);
      float sa = sin(iB.y);
      mat2 rot = mat2(ca, sa, -sa, ca);
      mat2 shape = rot * mat2(e, 0.0, 0.0, 1.0 / e) * mat2(ca, -sa, sa, ca);
      mat2 bend = rot * mat2(1.0 / e, 0.0, 0.0, e) * mat2(ca, -sa, sa, ca);
      w1.xy = shape * w1.xy;
      float seen = smoothstep(0.3, 0.7, texture2D(uField, vec2(iA.x / uWorld.x, -iA.y / uWorld.y)).g);
      float gate = (iA.x > uDawn ? 0.0 : 1.0) * uPop * seen;
      vec3 world = vec3(iA.xy + offset * R, R * 1.15 + 12.0) + (w1 + w2) * R * gate;
      vec3 n = PITCH * (spin * normal);
      if (kind < 0.5) n.xy = bend * n.xy;
      vNormal = normalize(n);

      float dark = clamp(1.0 - dot(iC, vec3(0.33)) * 2.2, 0.0, 1.0);
      vec3 skin = mix(vec3(0.43, 0.33, 0.74), vec3(0.25, 0.17, 0.55), dark);
      skin = mix(skin, clamp(iC * 1.35, 0.0, 1.0), 0.4) + (hash(seed * 2.3) - 0.5) * vec3(0.06, 0.03, 0.08);
      skin = mix(skin, vec3(0.5, 0.62, 0.2), sick * 0.85);
      skin = mix(skin, mix(vec3(0.82, 0.78, 0.9), iC, 0.25), lost);
      vec3 ink = vec3(0.08, 0.04, 0.12);
      vec3 color = skin;
      vGloss = 0.25;
      if (kind > 0.5 && kind < 1.5) { color = mix(vec3(1.0), vec3(0.86, 0.96, 0.6), sick); color = mix(color, skin * 0.45, step(open, 0.3)); vGloss = 0.9; }
      else if (kind > 1.5 && kind < 2.5) { color = ink; vGloss = 1.0; }
      else if (kind > 2.5 && kind < 3.5) color = mix(vec3(0.32, 0.05, 0.14), ink, sick + lost);
      else if (kind > 3.5 && kind < 4.5) color = skin * 0.62;
      else if (kind > 4.5 && kind < 5.5) color = hash(seed * 3.1) < 0.5 ? vec3(0.09, 0.7, 0.63) : vec3(0.95, 0.83, 0.42);
      else if (kind > 5.5) color = vec3(0.49, 1.0, 0.9);
      vColor = color;
      vAlpha = mix(1.0, 0.68, sick) * mix(1.0, 0.22 + 0.08 * hash(seed * 4.1), lost);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying vec3 vNormal;
    varying float vAlpha;
    varying float vGloss;
    const vec3 L = vec3(-0.4, 0.62, 0.68);
    void main() {
      vec3 n = normalize(vNormal);
      float sky = n.y * 0.5 + 0.5;
      float sun = max(dot(n, L), 0.0);
      float rim = smoothstep(-0.05, 0.5, n.z);
      vec3 color = vColor * (0.42 + 0.3 * sky + 0.62 * sun) * mix(0.5, 1.0, rim);
      color += pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0) * vGloss * 0.6;
      gl_FragColor = vec4(color, vAlpha);
    }`,
}
