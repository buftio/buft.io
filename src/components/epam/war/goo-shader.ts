export const gooVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`

const noise = /* glsl */ `
  float hash(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  vec2 hash2(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * vec3(0.1031, 0.103, 0.0973));
    q += dot(q, q.yzx + 33.33);
    return fract((q.xx + q.yz) * q.zy);
  }
  vec3 noised(vec2 x) {
    vec2 i = floor(x);
    vec2 f = fract(x);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    vec2 du = 30.0 * f * f * (f * (f - 2.0) + 1.0);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    float k4 = a - b - c + d;
    return vec3(a + (b - a) * u.x + (c - a) * u.y + k4 * u.x * u.y, du * vec2(b - a + k4 * u.y, c - a + k4 * u.x));
  }
  vec4 cubic(sampler2D t, vec2 uv, vec2 size) {
    vec2 st = uv * size - 0.5;
    vec2 i = floor(st);
    vec2 f = st - i;
    vec2 f2 = f * f;
    vec2 f3 = f2 * f;
    vec2 w0 = (-f3 + 3.0 * f2 - 3.0 * f + 1.0) / 6.0;
    vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
    vec2 w2 = (-3.0 * f3 + 3.0 * f2 + 3.0 * f + 1.0) / 6.0;
    vec2 w3 = f3 / 6.0;
    vec2 g0 = w0 + w1;
    vec2 g1 = w2 + w3;
    vec2 h0 = (i - 0.5 + w1 / g0) / size;
    vec2 h1 = (i + 1.5 + w3 / g1) / size;
    return g0.y * (g0.x * texture2D(t, h0) + g1.x * texture2D(t, vec2(h1.x, h0.y)))
         + g1.y * (g0.x * texture2D(t, vec2(h0.x, h1.y)) + g1.x * texture2D(t, h1));
  }
`

export const gooFragment = /* glsl */ `
  uniform sampler2D uField;
  uniform sampler2D uAux;
  uniform sampler2D uSoft;
  uniform sampler2D uNoise;
  uniform vec2 uWorld;
  uniform vec2 uGrid;
  uniform float uTime;
  uniform float uZoom;
  uniform float uReach;
  uniform float uDawn;
  varying vec2 vUv;
  ${noise}
  vec4 N(vec2 p, float size) { return texture2D(uNoise, p / (size * 32.0)); }
  float lod(float size) { return smoothstep(2.5, 9.0, size * uZoom); }

  vec3 bubble(vec2 p, float size, float rate) {
    vec2 cell = floor(p / size);
    vec2 h = hash2(cell);
    vec2 d = p - (cell + 0.3 + 0.4 * h) * size;
    float phase = fract(uTime * rate * (0.6 + 0.8 * h.x) + h.y);
    float r = size * 0.3 * smoothstep(0.0, 0.85, phase) * (1.0 - smoothstep(0.9, 0.93, phase));
    float z = sqrt(max(r * r - dot(d, d), 0.0));
    return vec3(z, z > 0.5 ? -d / z : vec2(0.0));
  }

  float macro(vec2 q, float slow, float bevel, out vec4 f, out vec4 a, out float body) {
    vec2 uv = q / uWorld;
    f = cubic(uField, uv, uGrid);
    a = cubic(uAux, uv, uGrid);
    f.r = cubic(uSoft, uv, uGrid).r;
    body = smoothstep(0.42, 0.62, f.r + slow);
    float s = clamp(a.r * 1280.0 / bevel, 0.0, 1.0);
    float dome = bevel * 0.75 * (1.0 - (1.0 - s) * (1.0 - s));
    return body * (dome + max(160.0, bevel * 0.35) * smoothstep(0.2, 1.0, a.r));
  }

  vec4 over(vec4 dst, vec4 src) {
    float a = src.a + dst.a * (1.0 - src.a);
    return vec4((src.rgb * src.a + dst.rgb * dst.a * (1.0 - src.a)) / max(a, 1e-4), a);
  }

  void main() {
    if (vUv.x > uDawn) discard;
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uWorld;
    vec2 k = 256.0 / uWorld;
    vec2 at = p / uWorld;
    float around = texture2DLodEXT(uField, at + k, 3.0).r + texture2DLodEXT(uField, at - k, 3.0).r
      + texture2DLodEXT(uField, at + vec2(k.x, -k.y), 3.0).r + texture2DLodEXT(uField, at - vec2(k.x, -k.y), 3.0).r;
    if (around < 0.001) discard;
    vec3 w1 = noised(p / 650.0 + vec2(uTime * 0.011, -uTime * 0.006));
    vec3 w2 = noised(p / 650.0 + vec2(-uTime * 0.008, uTime * 0.01) + 31.0);
    vec3 w3 = noised(p / 170.0 + vec2(uTime * 0.05, uTime * 0.03) + 7.0);
    float hot = texture2D(uAux, p / uWorld).b;
    mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
    vec2 jag = vec2(noised(turn * p / 70.0 + uTime * 0.03 + 5.0).x, noised(turn * turn * p / 70.0 - uTime * 0.03 + 13.0).x) - 0.5;
    vec2 q = p + (vec2(w1.x, w2.x) - 0.5) * 170.0 + (w3.x - 0.5) * vec2(50.0, -50.0) + jag * (30.0 + 40.0 * hot);
    float boil = hot * (noised(turn * p / 90.0 + vec2(uTime * 0.09, -uTime * 0.07) + 3.0).x - 0.5);
    float slow = (w3.x - 0.5) * 0.1 + (w1.x - 0.5) * 0.08 + boil * 0.3;
    float bevel = max(240.0, 11.0 / uZoom) * (1.0 + 0.06 * sin(uTime * 0.6 + w2.x * 9.0));
    vec4 f;
    vec4 a;
    float body;
    float h0 = macro(q, slow, bevel, f, a, body);
    if (f.g <= 0.3 || f.a <= 0.0 || (f.a < 0.01 && f.r < 0.01)) discard;
    float e = max(1.5 / uZoom, 24.0);
    vec4 fx;
    vec4 ax;
    float bx;
    vec2 grad = vec2(macro(q + vec2(e, 0.0), slow, bevel, fx, ax, bx) - h0, macro(q + vec2(0.0, e), slow, bevel, fx, ax, bx) - h0) / e;
    float thick = smoothstep(0.0, 1.0, a.r);
    float rim = 1.0 - smoothstep(0.06, 0.3, a.r);
    float age = a.g;
    float fight = a.b;
    float adv = a.a * (1.0 - fight);
    float edge = body * (1.0 - body) * 4.0;

    vec3 n1 = noised(turn * p / 160.0 + vec2(uTime * 0.02, -uTime * 0.025));
    grad += body * 22.0 * (0.3 + thick) * lod(160.0) * (n1.yz * turn) / 160.0;
    vec3 n2 = noised(turn * turn * p / 46.0 + vec2(-uTime * 0.05, uTime * 0.04) + 17.0);
    grad += body * 5.0 * lod(46.0) * (n2.yz * turn * turn) / 46.0;
    float foam = max(adv, fight * 0.5) * body * rim;
    vec3 b1 = bubble(p, 90.0, 0.35);
    vec3 b2 = bubble(p + 37.0, 300.0, 0.18);
    vec3 b3 = bubble(p + 111.0, 520.0, 0.05);
    vec3 b4 = bubble(turn * p + 53.0, 48.0, 0.09);
    grad += foam * (b1.yz * lod(30.0) + b2.yz * 0.8 * lod(90.0)) + body * thick * (b3.yz * 0.5 * lod(150.0) + b4.yz * 0.6 * lod(16.0));
    float bubbled = foam * (step(0.5, b1.x) * lod(30.0) + step(0.5, b2.x) * lod(90.0)) + body * thick * step(0.5, b3.x) * lod(150.0);

    vec3 n = normalize(vec3(-grad.x, grad.y, 1.0));
    vec3 L = normalize(vec3(-0.5, 0.8, 1.0));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float diff = max(dot(n, L), 0.0);
    float nh = max(dot(n, H), 0.0);
    float gloss = mix(1.0, 0.6, age);
    float near = lod(60.0);
    float spec = (pow(nh, mix(50.0, 220.0, near)) * mix(1.1, 2.2, near) + pow(nh, 26.0) * 0.25) * gloss;
    float fres = pow(1.0 - n.z, 2.0);
    vec3 r = vec3(2.0 * n.z * n.xy, 2.0 * n.z * n.z - 1.0);
    vec3 sky = mix(vec3(0.3, 0.2, 0.36), vec3(0.95, 0.92, 1.0), smoothstep(0.3, 1.0, r.z + r.y * 0.35));

    vec3 fresh = vec3(0.17, 0.21, 0.08);
    vec3 held = vec3(0.14, 0.07, 0.15);
    vec3 base = mix(fresh, held, age);
    base *= mix(1.6, 1.0, near);
    base += vec3(0.13, 0.22, 0.02) * rim * body * (1.0 - age * 0.6) * (1.0 - fight);
    base += vec3(0.05, 0.08, 0.0) * bubbled * (1.0 - age);
    float vein = smoothstep(0.9, 1.0, 1.0 - abs(n1.x * 2.0 - 1.0)) * lod(60.0) * thick;
    base = mix(base, mix(vec3(0.2, 0.26, 0.06), vec3(0.2, 0.08, 0.2), age), vein * 0.6);
    spec = spec / (1.0 + 0.6 * spec);
    vec3 color = base * (0.4 + 0.8 * diff) + spec * vec3(1.0, 0.97, 0.92) + fres * sky * 0.6 * gloss;

    float flicker = 0.7 + 0.3 * sin(uTime * 9.0 + n2.x * 12.0) * sin(uTime * 4.3 + n1.x * 7.0);
    vec3 ember = mix(vec3(1.0, 0.33, 0.06), vec3(1.0, 0.75, 0.28), n2.x);
    float crack = smoothstep(0.86, 0.97, 1.0 - abs(n2.x * 2.0 - 1.0)) * lod(46.0);
    color += ember * fight * (edge * 1.1 + rim * body * (0.25 + fres * 0.9 + crack * 1.6)) * flicker;
    vec4 spark = N(p + vec2(0.0, -uTime * 40.0), 22.0);
    color += vec3(1.0, 0.85, 0.5) * fight * rim * smoothstep(0.8, 0.86, spark.a) * body * lod(22.0) * 1.5;
    float pulse = 0.65 + 0.35 * sin(uTime * 2.4 + a.r * 6.0 + n1.x * 5.0);
    vec3 lime = vec3(0.72, 1.0, 0.16);
    color += lime * adv * (edge * 0.9 + rim * body * (0.12 + 0.5 * fres)) * pulse;

    vec4 goo = vec4(color, body * mix(0.9, 0.97, thick));

    vec2 toward = normalize(vec2(-0.5, -0.8)) * max(60.0, 3.5 / uZoom);
    float shade = smoothstep(0.42, 0.62, texture2D(uSoft, (q + toward) / uWorld).r);
    vec4 ground = vec4(vec3(0.14, 0.05, 0.18), shade * 0.45);

    float hi = 0.0;
    for (int i = 0; i < 6; i++) {
      float ang = float(i) * 1.0472 + 0.3;
      hi = max(hi, texture2D(uSoft, (q + vec2(cos(ang), sin(ang)) * uReach) / uWorld).r);
    }
    float far = smoothstep(80.0, 150.0, uReach);
    float ring = smoothstep(0.44, 0.58, hi) * (1.0 - body);
    float band = smoothstep(0.36, 0.47, f.r + slow) * (1.0 - body);
    float halo = mix(max(ring * far, band), ring, fight);
    float smoulder = smoothstep(0.25, 0.85, n1.x) * (0.6 + 0.4 * flicker);
    float ash = smoothstep(0.06, 0.4, f.r) * (1.0 - body) * fight;
    ground = over(ground, vec4(0.18, 0.07, 0.1, ash * 0.32));
    float speck = smoothstep(0.84, 0.9, N(p + vec2(0.0, -uTime * 12.0), 26.0).b) * ash * lod(26.0) * flicker;
    ground = over(ground, vec4(ember, speck));
    vec3 haloC = mix(lime, mix(vec3(0.55, 0.12, 0.05), ember, smoulder), fight);
    float haloA = halo * mix(0.55 + 0.35 * pulse, 0.3 + 0.6 * smoulder, fight);
    ground = over(ground, vec4(haloC, haloA));

    vec4 seen = over(ground, goo);
    vec4 outC = vec4(seen.rgb, seen.a * smoothstep(0.3, 0.7, f.g));
    outC.a *= smoothstep(0.0, 0.6, f.a);
    gl_FragColor = outC;
  }`
