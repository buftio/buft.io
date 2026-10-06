import { STATES } from './kinds'
import { skins } from './warrior-shader'

export const sprite = {
  vertexShader: /* glsl */ `
    attribute vec4 aLook;
    uniform float uPx;
    uniform float uDpr;
    uniform float uDawn;
    varying vec4 vLook;
    void main() {
      vLook = aLook;
      float shrink = mod(aLook.x, ${STATES}.0) > 2.5 ? 1.0 - 0.55 * min(1.0, aLook.y / 3.0) : 1.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = position.x > uDawn ? 0.0 : max(4.0, uPx * shrink) * 1.25 * uDpr;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uPx;
    uniform float uFade;
    varying vec4 vLook;
    ${skins(false)}
    float disk(vec2 p, float r) { return smoothstep(r, r - 0.06, length(p)); }
    float bar(vec2 p, vec2 a, vec2 b, float w) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return smoothstep(w, w - 0.04, length(pa - ba * h));
    }
    void main() {
      float kind = floor(vLook.x / ${STATES}.0);
      float state = vLook.x - kind * ${STATES}.0;
      float age = vLook.y;
      float seed = vLook.z;
      float face = vLook.w;
      vec2 q = (gl_PointCoord * 2.0 - 1.0) * 1.25;
      q.y = -q.y;
      float fallen = step(1.5, state) * step(state, 2.5);
      float eaten = step(2.5, state);
      float fight = step(0.5, state) * step(state, 1.5);
      if (fallen > 0.5) {
        float a = min(1.0, age / 0.35) * 1.45 * (seed > 0.5 ? 1.0 : -1.0);
        q = mat2(cos(a), -sin(a), sin(a), cos(a)) * q;
      }
      q.y += eaten * min(1.0, age / 3.0) * 0.3;
      float d = length(q * vec2(1.0, 1.08));
      float body = smoothstep(1.0, 0.93, d);
      if (body <= 0.0) discard;
      vec3 skin = mix(vec3(0.66, 0.93, 1.0), vec3(0.88, 1.0, 0.95), seed);
      skin = mix(skin, SKINS[int(kind + 0.5)], 0.55);
      vec3 color = skin * mix(1.0, 0.55, smoothstep(0.7, 0.86, d));
      color = mix(color, vec3(0.05, 0.22, 0.38), smoothstep(0.86, 0.92, d));
      color += 0.3 * smoothstep(0.38, 0.0, length(q - vec2(-0.32, 0.38)));
      vec3 ink = vec3(0.05, 0.08, 0.16);
      if (uPx > 11.0) {
        vec2 off = vec2(face * 0.14, 0.06);
        vec2 el = vec2(-0.26, 0.12) + off;
        vec2 er = vec2(0.26, 0.12) + off;
        float blink = (1.0 - fight) * step(0.97, fract(age * 0.31 + seed * 7.0));
        float eyes = max(disk(q - el, 0.12), disk(q - er, 0.12)) * (1.0 - blink);
        eyes = max(eyes, blink * max(bar(q, el - vec2(0.1, 0.0), el + vec2(0.1, 0.0), 0.04), bar(q, er - vec2(0.1, 0.0), er + vec2(0.1, 0.0), 0.04)));
        float shine = max(disk(q - el - vec2(0.04, 0.05), 0.045), disk(q - er - vec2(0.04, 0.05), 0.045));
        float xs = max(
          max(bar(q, el - 0.11, el + 0.11, 0.045), bar(q, el + vec2(-0.11, 0.11), el + vec2(0.11, -0.11), 0.045)),
          max(bar(q, er - 0.11, er + 0.11, 0.045), bar(q, er + vec2(-0.11, 0.11), er + vec2(0.11, -0.11), 0.045)));
        float brows = fight * max(
          bar(q, el + vec2(-0.14, 0.24), el + vec2(0.12, 0.14), 0.045),
          bar(q, er + vec2(0.14, 0.24), er + vec2(-0.12, 0.14), 0.045));
        float smile = smoothstep(0.045, 0.0, abs(length(q - off - vec2(0.0, -0.02)) - 0.26)) * step(q.y, off.y - 0.2) * step(abs(q.x - off.x), 0.2);
        float shout = disk(q - off - vec2(0.0, -0.3), 0.12);
        float mouth = mix(smile, shout, fight) * (1.0 - fallen);
        float dead = max(fallen, eaten);
        float mark = max(max(mix(eyes, xs, dead) * (1.0 - shine * (1.0 - dead)), brows), mouth);
        color = mix(color, ink, mark);
        color = mix(color, vec3(1.0, 0.55, 0.45), fight * 0.25 * smoothstep(0.9, 0.5, d) * (1.0 - mark));
      }
      color = mix(color, vec3(0.6), fallen * min(1.0, age / 0.8) * 0.6);
      color = mix(color, vec3(0.3, 0.42, 0.08), eaten * min(1.0, age / 0.6) * 0.85);
      float alpha = body * (1.0 - smoothstep(2.6, 4.0, age) * fallen - smoothstep(0.6, 3.2, age) * eaten);
      gl_FragColor = vec4(color, alpha * uFade);
    }`,
}
