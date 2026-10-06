'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { LANDS } from './registry'

const PUFFS = 4
const KINDS = 3
const THICK = [0.05, 0.3]
const PEAK = 0.62
const ORDER = 49

export const thin = (zoom: number) =>
  Math.min(
    1,
    Math.max(
      0,
      (Math.log(zoom) - Math.log(THICK[0])) /
        (Math.log(THICK[1]) - Math.log(THICK[0])),
    ),
  )

const shader = {
  vertexShader: /* glsl */ `
    attribute float aSeed;
    uniform float uTime;
    varying vec2 vUv;
    varying float vSeed;
    void main() {
      vUv = vec2((uv.x + floor(fract(aSeed * 7.31) * ${KINDS}.0)) / ${KINDS}.0, uv.y);
      vSeed = aSeed;
      vec4 world = instanceMatrix * vec4(position, 1.0);
      float r = length(instanceMatrix[0].xyz);
      world.x += sin(uTime * 0.05 + aSeed * 40.0) * r * 0.08;
      world.y += cos(uTime * 0.04 + aSeed * 23.0) * r * 0.04;
      gl_Position = projectionMatrix * modelViewMatrix * world;
    }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D uMap;
    uniform float uThin;
    varying vec2 vUv;
    varying float vSeed;
    void main() {
      vec4 puff = texture2D(uMap, vUv);
      float shade = texture2D(uMap, vUv + vec2(-0.008, 0.05)).a * 0.22;
      float keep = clamp((1.0 - uThin) * 1.7 - vSeed * 0.7, 0.0, 1.0);
      float a = puff.a + shade * (1.0 - puff.a);
      vec3 rgb = (puff.rgb * puff.a + vec3(0.2, 0.12, 0.3) * shade * (1.0 - puff.a)) / max(a, 1e-3);
      a *= keep * ${PEAK.toFixed(2)};
      if (a < 0.004) discard;
      gl_FragColor = vec4(rgb, a);
    }`,
}

function puffTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size * KINDS
  canvas.height = size
  const g = canvas.getContext('2d')!
  let seed = 7
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
  for (let v = 0; v < KINDS; v++) {
    const base = size * 0.8
    const lobes = 5 + v * 2
    for (let k = 0; k < lobes; k++) {
      const u = (k + 0.5) / lobes
      const r = (18 + rand() * 12) * (1.3 - Math.abs(u - 0.5) * 1.2)
      const x = v * size + size * (0.16 + 0.68 * u) + (rand() - 0.5) * 8
      const y = base - r * (0.45 + rand() * 0.5)
      const fill = g.createRadialGradient(x - r * 0.25, y - r * 0.4, 0, x, y, r)
      fill.addColorStop(0, 'rgba(255,255,255,1)')
      fill.addColorStop(0.72, 'rgba(244,238,252,0.95)')
      fill.addColorStop(1, 'rgba(222,212,238,0)')
      g.fillStyle = fill
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.fill()
    }
    const cut = g.createLinearGradient(0, base - 4, 0, base + 6)
    cut.addColorStop(0, 'rgba(0,0,0,0)')
    cut.addColorStop(1, 'rgba(0,0,0,1)')
    g.globalCompositeOperation = 'destination-out'
    g.fillStyle = cut
    g.fillRect(v * size, base - 4, size, size - base + 4)
    g.globalCompositeOperation = 'source-over'
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function Clouds({ revealed }: { revealed: string[] }) {
  const lands = useMemo(
    () => LANDS.filter((l) => revealed.includes(l.id)),
    [revealed],
  )
  const count = lands.length * PUFFS
  const plane = useMemo(() => {
    const shape = new THREE.PlaneGeometry(1, 1)
    const seeds = new Float32Array(Math.max(1, count))
    for (let k = 0; k < count; k++)
      seeds[k] = ((k * 0.618034) % 1) * 0.9 + (k % PUFFS === 0 ? 0 : 0.1)
    shape.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 1))
    return shape
  }, [count])
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        ...shader,
        uniforms: {
          uMap: { value: puffTexture() },
          uThin: { value: 0 },
          uTime: { value: 0 },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  )
  useEffect(() => () => plane.dispose(), [plane])
  useEffect(
    () => () => {
      material.uniforms.uMap.value.dispose()
      material.dispose()
    },
    [material],
  )
  const mesh = useRef<THREE.InstancedMesh>(null)

  useEffect(() => {
    const puffs = mesh.current
    if (!puffs) return
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    lands.forEach((l, i) => {
      for (let k = 0; k < PUFFS; k++) {
        const a = k * 2.399 + i
        const d = k === 0 ? 0 : l.radius * (0.35 + 0.25 * ((k * 0.37) % 1))
        const r =
          l.radius * (k === 0 ? 1.5 : 0.85 + 0.35 * ((k * 0.53 + i * 0.29) % 1))
        m.compose(
          new THREE.Vector3(
            l.x + Math.cos(a) * d,
            -l.y + Math.sin(a) * d * 0.8,
            0,
          ),
          q,
          new THREE.Vector3(r * 1.4, r, 1),
        )
        puffs.setMatrixAt(i * PUFFS + k, m)
      }
    })
    puffs.count = count
    puffs.instanceMatrix.needsUpdate = true
  }, [lands, count])

  useFrame((state) => {
    const puffs = mesh.current
    if (!puffs) return
    const zoom = (state.camera as THREE.OrthographicCamera).zoom
    const shader = puffs.material as THREE.ShaderMaterial
    shader.uniforms.uThin.value = thin(zoom)
    shader.uniforms.uTime.value = state.clock.elapsedTime
    puffs.visible = thin(zoom) < 1 && count > 0
  })

  return (
    <instancedMesh
      key={count}
      ref={mesh}
      args={[plane, material, Math.max(1, count)]}
      frustumCulled={false}
      renderOrder={ORDER}
    />
  )
}
