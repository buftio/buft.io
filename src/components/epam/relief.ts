import * as THREE from 'three'

export const RELIEF = true

const LIGHT = new THREE.Vector3(-0.5, 0.8, 1).normalize()

const FEATHER = 1800

export function makeRelief(width: number, height: number) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: false,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
  })
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: target.texture },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uPx: { value: 1 },
      uTop: { value: 10 },
      uLight: { value: LIGHT },
      uView: { value: new THREE.Vector4() },
      uSlide: { value: new THREE.Vector2(width, height) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform vec2 uTexel;
      uniform float uPx;
      uniform float uTop;
      uniform vec3 uLight;
      uniform vec4 uView;
      uniform vec2 uSlide;
      varying vec2 vUv;

      float lum(vec3 c) {
        return dot(sqrt(c), vec3(0.299, 0.587, 0.114));
      }

      float height(vec2 uv, float lod) {
        vec3 c = textureLod(uMap, uv, lod).rgb;
        vec3 s = sqrt(c);
        float pink = smoothstep(0.18, 0.42, s.r - s.g) * smoothstep(0.55, 0.85, s.r);
        return max(0.0, 0.78 - lum(c)) * 1.3 + 0.4 * pink;
      }

      float lodOf(float size) {
        return log2(size * uPx);
      }

      float fade(float lod) {
        return smoothstep(-0.5, 1.0, lod) * (1.0 - smoothstep(uTop - 1.5, uTop, lod));
      }

      vec2 slope(float size) {
        float lod = max(0.0, lodOf(size) - 1.0);
        vec2 d = uTexel * exp2(lod);
        return vec2(
          height(vUv + vec2(d.x, 0.0), lod) - height(vUv - vec2(d.x, 0.0), lod),
          height(vUv + vec2(0.0, d.y), lod) - height(vUv - vec2(0.0, d.y), lod)
        ) * fade(lodOf(size));
      }

      void main() {
        vec3 base = textureLod(uMap, vUv, 0.0).rgb;
        float fat = smoothstep(0.68, 0.8, lum(textureLod(uMap, vUv, max(0.0, lodOf(900.0))).rgb));
        float flip = mix(1.0, -0.8, fat);
        vec2 fine = 0.35 * slope(8.0) + 0.8 * slope(30.0) + 0.7 * slope(120.0);
        vec2 mid = 0.9 * slope(400.0);
        vec2 wide = 1.1 * slope(1500.0) + 1.3 * slope(5000.0);
        vec2 g = fine * flip + mid + wide;
        vec3 n = normalize(vec3(-g * 1.5, 1.0));
        float lit = dot(n, uLight) / uLight.z - 1.0;
        float white = smoothstep(0.62, 0.78, lum(base));
        float shade = 1.0 + (lit > 0.0 ? (0.35 + 0.3 * lum(base)) * lit : 0.6 * mix(1.0, 0.55, white) * lit);
        float wl = max(0.0, lodOf(260.0));
        vec2 toward = uLight.xy * uTexel * exp2(wl);
        float here = height(vUv, wl);
        float shadow = max(
          max(height(vUv + toward * 1.5, wl), height(vUv + toward * 3.0, wl)),
          height(vUv + toward * 4.5, wl)
        ) - here;
        float pale = smoothstep(0.5, 0.85, lum(base));
        shade *= 1.0 - 0.18 * smoothstep(0.04, 0.4, shadow) * fade(lodOf(700.0)) * pale;
        vec2 p = mix(uView.xy, uView.zw, vUv);
        float edge = min(min(p.x, uSlide.x - p.x), min(p.y, uSlide.y - p.y));
        shade = clamp(shade, mix(0.7, 0.93, white), 1.14);
        shade = mix(1.0, shade, smoothstep(0.0, ${FEATHER}.0, edge));
        vec3 tint = mix(vec3(0.95, 0.93, 1.0), vec3(1.0), smoothstep(0.75, 1.0, shade));
        gl_FragColor = vec4(base * shade * tint, 1.0);
        #include <colorspace_fragment>
      }`,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    toneMapped: false,
  })
  return { target, material }
}

export function fitRelief(
  relief: ReturnType<typeof makeRelief>,
  width: number,
  height: number,
  px: number,
  left: number,
  bottom: number,
  right: number,
  top: number,
) {
  const { target, material } = relief
  if (target.width !== width || target.height !== height) target.setSize(width, height)
  material.uniforms.uTexel.value.set(1 / width, 1 / height)
  material.uniforms.uPx.value = px
  material.uniforms.uTop.value = Math.log2(Math.max(width, height))
  material.uniforms.uView.value.set(left, bottom, right, top)
}
