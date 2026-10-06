'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { tileExists, tileUrl, type SlideMeta } from '../slide-data'
import { nuclei } from './folk'
import { CELL, type War } from './sim'
import { folkGeometry, folkShader } from './villager-body'
import {
  feel,
  folkOf,
  NEAR_CAP,
  pick,
  upload,
  withInstances,
  type Folk,
  type Picks,
} from './villager-near'
import { traits } from './villager-scan'

const NUCLEUS_UM = 6.5
const SHOW_PX = 7
const CAPACITY = 40000
const DETECT_BELOW_MAX = 2
const NEAR_PX = 9
const FULL_PX = 13
const SNAP = 384

const shader = {
  vertexShader: /* glsl */ `
    attribute float aSeed;
    uniform sampler2D uField;
    uniform vec2 uWorld;
    uniform vec2 uRing;
    uniform float uPx;
    uniform float uDpr;
    uniform float uDawn;
    uniform vec3 uHole;
    uniform float uGone;
    varying float vKeep;
    varying float vMood;
    varying float vSeed;
    varying vec2 vLook;
    void main() {
      vec2 uv = vec2(position.x / uWorld.x, -position.y / uWorld.y);
      vec4 f = texture2D(uField, uv);
      float near = 0.0;
      vec2 pull = vec2(0.0);
      for (int k = 0; k < 8; k++) {
        float a = float(k) * 0.7854;
        vec2 o = vec2(cos(a), sin(a));
        float r = texture2D(uField, uv + o * uRing).r;
        near = max(near, r);
        pull += o * r;
      }
      vMood = f.r >= 0.5 ? 2.0 : f.a < 0.8 && f.a > 0.3 ? 3.0 : near >= 0.5 ? 1.0 : 0.0;
      vLook = length(pull) > 0.01 ? normalize(vec2(pull.x, -pull.y)) : vec2(0.0);
      vSeed = aSeed;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vKeep = (distance(position.xy, uHole.xy) < uHole.z ? 1.0 - uGone : 1.0) * smoothstep(0.3, 0.7, f.g);
      gl_PointSize = position.x > uDawn || vKeep < 0.01 ? 0.0 : uPx * 1.25 * uDpr;
    }`,
  fragmentShader: /* glsl */ `
    uniform float uTime;
    uniform float uFade;
    varying float vKeep;
    varying float vMood;
    varying float vSeed;
    varying vec2 vLook;
    float disk(vec2 p, float r) { return smoothstep(r, r - 0.05, length(p)); }
    float bar(vec2 p, vec2 a, vec2 b, float w) {
      vec2 pa = p - a, ba = b - a;
      float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
      return smoothstep(w, w - 0.04, length(pa - ba * h));
    }
    void main() {
      vec2 q = gl_PointCoord * 2.0 - 1.0;
      q.y = -q.y;
      float t = uTime + vSeed * 50.0;
      float calm = step(vMood, 0.5);
      float scared = step(0.5, vMood) * step(vMood, 1.5);
      float sick = step(1.5, vMood) * step(vMood, 2.5);
      float lost = step(2.5, vMood);
      q.x += scared * sin(t * 45.0) * 0.03;
      q.y += calm * sin(t * 1.4) * 0.03;
      float r = mix(0.17, 0.22, scared);
      vec2 el = vec2(-0.24, 0.1);
      vec2 er = vec2(0.24, 0.1);
      vec2 wander = vec2(sin(t * 0.5), cos(t * 0.37)) * 0.05;
      vec2 look = mix(wander, vLook * 0.08, scared + sick);
      float blink = calm * step(0.965, fract(t * 0.23));
      float lid = max(blink, sick * 0.55);
      float white = max(disk(q - el, r), disk(q - er, r));
      float rim = max(disk(q - el, r + 0.045), disk(q - er, r + 0.045));
      float cut = step(r * (1.0 - 2.0 * lid), max(q.y - el.y, -1.0));
      float pupil = max(disk(q - el - look, r * 0.5), disk(q - er - look, r * 0.5));
      float x = max(
        max(bar(q, el - 0.12, el + 0.12, 0.05), bar(q, el + vec2(-0.12, 0.12), el + vec2(0.12, -0.12), 0.05)),
        max(bar(q, er - 0.12, er + 0.12, 0.05), bar(q, er + vec2(-0.12, 0.12), er + vec2(0.12, -0.12), 0.05)));
      float smile = calm * smoothstep(0.04, 0.0, abs(length(q - vec2(0.0, -0.05)) - 0.24)) * step(q.y, -0.17);
      float gasp = scared * smoothstep(0.035, 0.0, abs(length(q - vec2(0.0, -0.3)) - 0.08));
      float wave = sick * smoothstep(0.04, 0.0, abs(q.y + 0.3 - sin(q.x * 18.0 + t * 3.0) * 0.04)) * step(abs(q.x), 0.2);
      float mouth = max(max(smile, gasp), wave);
      vec3 ink = vec3(0.08, 0.04, 0.12);
      vec3 color = ink;
      float alpha = 0.0;
      if (lost > 0.5) {
        color = vec3(0.92);
        alpha = x * 0.3;
      } else {
        float eye = white * (1.0 - cut);
        vec3 sclera = mix(vec3(1.0), vec3(0.78, 0.95, 0.5), sick);
        color = mix(ink, sclera, eye * (1.0 - pupil));
        color = mix(color, mix(ink, vec3(0.3, 0.45, 0.05), sick), white * cut);
        alpha = max(max(rim, white), mouth);
        float goo = sick * disk(q, 0.62) * 0.4 * (1.0 - alpha);
        color = mix(color, vec3(0.45, 0.75, 0.1), goo / max(alpha + goo, 1e-3));
        alpha = max(alpha, goo);
      }
      gl_FragColor = vec4(color, alpha * uFade * vKeep);
    }`,
}

type Tile = { state: 'loading' | 'ready'; points?: Float32Array; folk?: Folk }

export function Villagers({
  meta,
  war,
  texture,
  dawn,
  reduced,
}: {
  meta: SlideMeta
  war: War
  texture: THREE.DataTexture
  dawn: RefObject<number>
  reduced: boolean
}) {
  const z = meta.zmax - DETECT_BELOW_MAX
  const s = 2 ** (meta.zmax - z)
  const span = meta.tile * s
  const geometry = useMemo(() => {
    const shape = new THREE.BufferGeometry()
    shape.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(CAPACITY * 3), 3),
    )
    shape.setAttribute(
      'aSeed',
      new THREE.BufferAttribute(new Float32Array(CAPACITY), 1),
    )
    shape.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
    shape.setDrawRange(0, 0)
    return shape
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: {
          uField: { value: texture },
          uWorld: {
            value: new THREE.Vector2(war.cols * CELL, war.rows * CELL),
          },
          uRing: { value: new THREE.Vector2(1.6 / war.cols, 1.6 / war.rows) },
          uPx: { value: 0 },
          uDpr: { value: 1 },
          uTime: { value: 0 },
          uFade: { value: 0 },
          uDawn: { value: 0 },
          uHole: { value: new THREE.Vector3(0, 0, -1) },
          uGone: { value: 0 },
        },
        transparent: true,
        depthTest: false,
      }),
    [texture, war],
  )
  const body = useMemo(() => withInstances(folkGeometry()), [])
  const skin = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...folkShader,
        uniforms: {
          uTime: { value: 0 },
          uPop: { value: 0 },
          uDawn: { value: 0 },
          uField: { value: texture },
          uWorld: {
            value: new THREE.Vector2(war.cols * CELL, war.rows * CELL),
          },
        },
        transparent: true,
      }),
    [texture, war],
  )
  useEffect(
    () => () => [geometry, material, body, skin].forEach((d) => d.dispose()),
    [geometry, material, body, skin],
  )
  const tiles = useRef(new Map<string, Tile>())
  const decoded = useRef<
    { key: string; x: number; y: number; bitmap: ImageBitmap }[]
  >([])
  const shown = useRef('')
  const near = useRef('')
  const picks = useRef<Picks>({
    folk: [],
    at: new Int32Array(NEAR_CAP * 2),
    count: 0,
    radius: Infinity,
  })
  const points = useRef<THREE.Points>(null)
  const crowd = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const sprites = points.current
    const folk = crowd.current
    if (!sprites || !folk) return
    const { geometry: shape } = sprites
    const u = (sprites.material as THREE.ShaderMaterial).uniforms
    const v = (folk.material as THREE.ShaderMaterial).uniforms
    const camera = state.camera as THREE.OrthographicCamera
    const px = (NUCLEUS_UM / meta.mpp) * camera.zoom
    const pop = Math.min(1, Math.max(0, (px - NEAR_PX) / (FULL_PX - NEAR_PX)))
    u.uPx.value = px
    u.uDpr.value = state.gl.getPixelRatio()
    u.uDawn.value = dawn.current
    u.uFade.value = Math.min(1, Math.max(0, (px - SHOW_PX) / 4))
    v.uDawn.value = dawn.current
    v.uPop.value = pop * pop * (3 - 2 * pop)
    u.uGone.value = pop
    if (!reduced) {
      u.uTime.value = state.clock.elapsedTime
      v.uTime.value = state.clock.elapsedTime
    }
    sprites.visible = px >= SHOW_PX
    folk.visible = pop > 0
    if (px < SHOW_PX) return
    const job = decoded.current.shift()
    if (job) {
      const canvas = new OffscreenCanvas(job.bitmap.width, job.bitmap.height)
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (context) {
        context.drawImage(job.bitmap, 0, 0)
        const data = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data
        const found = nuclei(data, canvas.width, canvas.height, meta.mpp * s)
        const out = new Float32Array(found.length)
        for (let k = 0; k < found.length; k += 2) {
          out[k] = (job.x * meta.tile + found[k] + 0.5) * s
          out[k + 1] = (job.y * meta.tile + found[k + 1] + 0.5) * s
        }
        const more = traits(
          data,
          canvas.width,
          canvas.height,
          found,
          meta.mpp * s,
          s,
          job.x * meta.tile,
          job.y * meta.tile,
        )
        tiles.current.set(job.key, {
          state: 'ready',
          points: out,
          folk: folkOf(more),
        })
        shown.current = ''
        near.current = ''
      }
      job.bitmap.close()
    }
    const halfW = state.size.width / 2 / camera.zoom
    const halfH = state.size.height / 2 / camera.zoom
    const x0 = Math.max(0, Math.floor((camera.position.x - halfW) / span))
    const x1 = Math.min(
      Math.ceil(meta.width / span) - 1,
      Math.floor((camera.position.x + halfW) / span),
    )
    const y0 = Math.max(0, Math.floor((-camera.position.y - halfH) / span))
    const y1 = Math.min(
      Math.ceil(meta.height / span) - 1,
      Math.floor((-camera.position.y + halfH) / span),
    )
    const ready: Tile[] = []
    const keys: string[] = []
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++) {
        if (!tileExists(meta, z, x, y)) continue
        const key = `${z}/${x}_${y}`
        const tile = tiles.current.get(key)
        if (tile?.points) {
          ready.push(tile)
          keys.push(key)
        } else if (!tile) {
          tiles.current.set(key, { state: 'loading' })
          fetch(tileUrl(meta, z, x, y))
            .then((response) => response.blob())
            .then((blob) => createImageBitmap(blob))
            .then((bitmap) => decoded.current.push({ key, x, y, bitmap }))
            .catch(() => tiles.current.delete(key))
        }
      }
    const signature = keys.join(',')
    if (pop > 0) {
      const cx = Math.round(camera.position.x / SNAP) * SNAP
      const cy = Math.round(-camera.position.y / SNAP) * SNAP
      const view = `${signature}|${cx},${cy},${Math.round(halfW / SNAP)}`
      const chosen = picks.current
      if (view !== near.current) {
        near.current = view
        pick(
          ready.flatMap((t) => (t.folk ? [t.folk] : [])),
          cx,
          cy,
          halfW + SNAP,
          halfH + SNAP,
          chosen,
        )
        upload(body, chosen)
        u.uHole.value.set(
          cx,
          -cy,
          chosen.radius === Infinity ? 1e9 : chosen.radius,
        )
      }
      feel(war, body, chosen, Math.min(0.1, delta))
    } else u.uHole.value.z = -1
    if (signature === shown.current) return
    shown.current = signature
    const position = shape.getAttribute('position') as THREE.BufferAttribute
    const seed = shape.getAttribute('aSeed') as THREE.BufferAttribute
    let n = 0
    for (const tile of ready) {
      const list = tile.points as Float32Array
      for (let k = 0; k < list.length && n < CAPACITY; k += 2, n++) {
        position.setXYZ(n, list[k], -list[k + 1], 0)
        seed.setX(n, ((list[k] * 12.9898 + list[k + 1] * 78.233) % 1000) / 1000)
      }
    }
    position.needsUpdate = true
    seed.needsUpdate = true
    shape.setDrawRange(0, n)
  })

  return (
    <group>
      <points
        ref={points}
        geometry={geometry}
        material={material}
        renderOrder={55}
      />
      <mesh
        ref={crowd}
        geometry={body}
        material={skin}
        renderOrder={55}
        frustumCulled={false}
      />
    </group>
  )
}
