'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Point, War } from './sim'

const BURSTS = 16
const SPARKS = 48
const EVERY = 2.2
const SKY_PX = 220
const SPREAD_PX = 320
const RADIUS_PX = 130
const SPARK_PX = 9
const COLORS = ['#7dffe6', '#ffd166', '#ff8fab', '#c3a6ff', '#fff4c2'].map(
  (c) => new THREE.Color(c),
)

const shader = {
  vertexShader: /* glsl */ `
    attribute vec3 aSpark;
    uniform vec4 uBurst[${BURSTS}];
    uniform vec3 uColor[${BURSTS}];
    uniform float uZoom;
    uniform float uDpr;
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      int slot = int(aSpark.x);
      vec4 b = uBurst[slot];
      float age = b.w;
      float px = 1.0 / uZoom;
      vec2 dir = vec2(cos(aSpark.y), sin(aSpark.y)) * aSpark.z;
      float open = 1.0 - exp(-age * 4.0);
      vec2 p = b.xy
        + dir * open * ${RADIUS_PX}.0 * px
        - vec2(0.0, age * age * 30.0 * px);
      vColor = mix(vec3(1.0), uColor[slot], smoothstep(0.0, 0.15, age));
      vAlpha = b.z * (1.0 - smoothstep(0.6, 1.6, age));
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 30.0, 1.0);
      gl_PointSize = ${SPARK_PX}.0 * uDpr * (1.0 - 0.4 * smoothstep(0.0, 1.6, age));
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vColor;
    varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      float a = smoothstep(1.0, 0.5, d) * vAlpha;
      gl_FragColor = vec4(mix(vColor, vec3(1.0), smoothstep(0.5, 0.0, d) * 0.5), a);
    }`,
}

export function Fireworks({ war, reduced }: { war: War; reduced: boolean }) {
  const geometry = useMemo(() => {
    const spark = new Float32Array(BURSTS * SPARKS * 3)
    for (let b = 0; b < BURSTS; b++)
      for (let s = 0; s < SPARKS; s++) {
        const i = (b * SPARKS + s) * 3
        spark[i] = b
        spark[i + 1] = (s / SPARKS) * Math.PI * 2 + b
        spark[i + 2] = 0.55 + 0.45 * (((s * 37 + b * 11) % 17) / 17)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(BURSTS * SPARKS * 3), 3),
    )
    g.setAttribute('aSpark', new THREE.BufferAttribute(spark, 3))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), Infinity)
    return g
  }, [])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: {
          uBurst: {
            value: Array.from({ length: BURSTS }, () => new THREE.Vector4()),
          },
          uColor: {
            value: Array.from({ length: BURSTS }, () => new THREE.Color()),
          },
          uZoom: { value: 1 },
          uDpr: { value: 1 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  )
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )
  const points = useRef<THREE.Points>(null)
  const since = useRef<number | null>(null)

  useFrame((state) => {
    const mesh = points.current
    if (!mesh) return
    const won = war.won !== null && !reduced
    mesh.visible = won
    if (!won) {
      since.current = null
      return
    }
    const now = state.clock.elapsedTime
    since.current ??= now
    const t = now - since.current
    const camera = state.camera
    const halfW = state.size.width / 2 / camera.zoom
    const halfH = state.size.height / 2 / camera.zoom
    const all: Point[] = [...war.castles.filter((c) => c.lit), ...war.squads]
    const shown = all.filter(
      (p) =>
        Math.abs(p.x - camera.position.x) < halfW * 0.9 &&
        Math.abs(-p.y - camera.position.y) < halfH * 0.8,
    )
    const spots = shown.length ? shown : all
    const u = (mesh.material as THREE.ShaderMaterial).uniforms
    u.uZoom.value = state.camera.zoom
    u.uDpr.value = state.gl.getPixelRatio()
    const bursts = u.uBurst.value as THREE.Vector4[]
    const colors = u.uColor.value as THREE.Color[]
    for (let b = 0; b < BURSTS; b++) {
      const phase = t - (b / BURSTS) * EVERY
      const round = Math.floor(phase / EVERY)
      const spot = spots[(b * 7 + round * 5) % Math.max(1, spots.length)]
      const on = phase >= 0 && spot ? 1 : 0
      const px = 1 / camera.zoom
      const dx = Math.sin(b * 12.9 + round * 78.2) * SPREAD_PX * px
      const dy = (SKY_PX + Math.cos(b * 4.1 + round * 9.7) * 80) * px
      bursts[b].set(
        (spot?.x ?? 0) + dx,
        -(spot?.y ?? 0) + dy,
        on,
        phase - round * EVERY,
      )
      colors[b].copy(COLORS[(b + round) % COLORS.length])
    }
    state.invalidate()
  })

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={70}
    />
  )
}
