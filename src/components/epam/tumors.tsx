'use client'

import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { Line2, LineSegments2 } from 'three-stdlib'
import { field } from './lands/threat'
import type { SlideMeta } from './slide-data'

const COLOR = '#19c3a6'
export const SWEEP = 1.8
const BAND_PX = 520
const FLASH = 0.7

const bandShader = {
  uniforms: {
    uColor: { value: new THREE.Color('#4ff5d6') },
    uFade: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    uniform float uFade;
    varying vec2 vUv;
    void main() {
      float d = 1.0 - vUv.x;
      float core = exp(-d * d * 9000.0);
      float glow = exp(-d * d * 260.0) * 0.55;
      float trail = exp(-d * 3.5) * 0.35;
      float a = (core + glow + trail) * uFade;
      gl_FragColor = vec4(mix(uColor, vec3(1.0), core * 0.7) * a, a);
    }`,
}

type Part = {
  group: THREE.Group | null
  edge: Line2 | LineSegments2 | null
  halo: Line2 | LineSegments2 | null
  at: number
}

export function Tumors({ meta, scan }: { meta: SlideMeta; scan: number }) {
  const shapes = useMemo(
    () =>
      meta.tumors.map((points) => {
        const flat = points.map(([x, y]) => new THREE.Vector2(x, -y))
        const xs = points.map(([x]) => x)
        return {
          line: [...flat, flat[0]].map(
            (p) => [p.x, p.y, 0] as [number, number, number],
          ),
          minX: Math.min(...xs),
        }
      }),
    [meta],
  )
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...bandShader,
        uniforms: THREE.UniformsUtils.clone(bandShader.uniforms),
        transparent: true,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  const parts = useRef<Part[]>([])
  const band = useRef<THREE.Mesh>(null)
  const started = useRef({ scan: 0, at: 0 })
  const part = (index: number) =>
    (parts.current[index] ??= {
      group: null,
      edge: null,
      halo: null,
      at: -1,
    })

  useFrame((state) => {
    if (!scan) return
    const clock = state.clock.elapsedTime
    if (started.current.scan !== scan) {
      started.current = { scan, at: clock }
      parts.current.forEach((p) => (p.at = -1))
    }
    const t = (clock - started.current.at) / SWEEP
    const camera = state.camera as THREE.OrthographicCamera
    const halfW = state.size.width / 2 / camera.zoom
    const halfH = state.size.height / 2 / camera.zoom
    const left = camera.position.x - halfW
    const sweepX = left + 2 * halfW * Math.min(1, t)
    const width = BAND_PX / camera.zoom
    if (band.current) {
      band.current.visible = t < 1.4
      band.current.position.set(sweepX - width / 2, camera.position.y, 0)
      band.current.scale.set(width, halfH * 2, 1)
      const shader = band.current.material as THREE.ShaderMaterial
      shader.uniforms.uFade.value = Math.max(0, Math.min(1, (1.4 - t) * 3))
    }
    let busy = t < 1.4
    shapes.forEach((shape, index) => {
      const p = part(index)
      const reached =
        (t >= 1 || shape.minX <= sweepX) && !!field.war?.spotted[index]
      if (reached && p.at < 0) p.at = clock
      if (p.group) p.group.visible = reached
      if (!reached) return
      const k = Math.min(1, (clock - p.at) / FLASH)
      const ease = 1 - (1 - k) ** 3
      if (p.edge) p.edge.material.linewidth = 7 - 5.5 * ease
      if (p.halo) {
        p.halo.material.linewidth = 22 - 10 * ease
        p.halo.material.opacity = 0.55 * (1 - ease)
      }
      if (k < 1) busy = true
    })
    if (busy) state.invalidate()
  })

  if (!scan) return null
  return (
    <group>
      {shapes.map((shape, index) => (
        <group
          key={index}
          visible={false}
          ref={(group) => {
            part(index).group = group
          }}
        >
          <Line
            ref={(halo) => {
              part(index).halo = halo
            }}
            points={shape.line}
            color="#7dffe6"
            lineWidth={12}
            renderOrder={101}
            depthTest={false}
            transparent
            opacity={0.2}
            blending={THREE.AdditiveBlending}
          />
          <Line
            ref={(edge) => {
              part(index).edge = edge
            }}
            points={shape.line}
            color={COLOR}
            lineWidth={2.5}
            renderOrder={102}
            depthTest={false}
            transparent
          />
        </group>
      ))}
      <mesh ref={band} renderOrder={103} material={material}>
        <planeGeometry />
      </mesh>
    </group>
  )
}
